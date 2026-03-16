import { useTranslation } from 'i18nexus';
import React, { useState } from 'react';
import { Document, Page } from 'react-pdf';
import type { DocumentProps } from 'react-pdf';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuizExplanation } from '#features/quiz-explanation';
import { cn } from '@/shared/ui/lib/utils';
import MarkdownText from '@/shared/ui/components/markdown-text';
import { Button } from '@/shared/ui/components/button';
import { BlurFade } from '@/shared/ui/components/blur-fade';
import type { Quiz } from '#features/quiz-generation';
import { MOCK_QUIZZES, MOCK_EXPLANATION, MOCK_UPLOADED_URL } from './mockExplanationData';

interface LocationState {
  quizzes?: Quiz[];
  explanation?: {
    results?: Array<{ number: number; explanation: string; referencedPages?: number[] }>;
  };
  uploadedUrl?: string;
}

/**
 * Triptych Workspace — 풀 하이트 1×3 그리드 패널.
 * 문제+선택지 | 해설 | 참조자료가 독립 스크롤 패널로 동시 표시.
 * 각 패널 상단에 accent color bar, 모바일에서는 탭 전환.
 */
const QuizExplanationDesignQ: React.FC = () => {
  const { t } = useTranslation();
  const { problemSetId } = useParams<{ problemSetId: string }>();
  const navigate = useNavigate();
  const { state: locationState } = useLocation();
  const [searchParams] = useSearchParams();
  const isMock = searchParams.get('mock') === 'true';
  const {
    quizzes: initialQuizzes = [],
    explanation: rawExplanation = [],
    uploadedUrl,
  } = isMock
    ? { quizzes: MOCK_QUIZZES, explanation: MOCK_EXPLANATION, uploadedUrl: MOCK_UPLOADED_URL }
    : (locationState as LocationState) || {};
  const { state, actions } = useQuizExplanation({
    t,
    navigate,
    problemSetId,
    initialQuizzes,
    rawExplanation,
    uploadedUrl,
  });
  const { quiz, pdf, explanation, ui } = state;
  const { quiz: quizActions, pdf: pdfActions, common: commonActions } = actions;
  const refPages = explanation.thisExplanationObj?.referencedPages;
  const total = quiz.showWrongOnly ? quiz.filteredTotalQuestions : quiz.totalQuestions;
  const progress = (quiz.currentQuestion / total) * 100;
  const [mobileTab, setMobileTab] = useState<'quiz' | 'explanation' | 'reference'>('quiz');

  const correctCount = quiz.filteredQuizzes.filter((q) => {
    const c = q.selections.find((o) => (o as unknown as { correct: boolean }).correct);
    return q.userAnswer != null && c && Number(q.userAnswer) === Number(c.id);
  }).length;

  const isQuizCorrect = (q: Quiz) => {
    const c = q.selections.find((o) => (o as unknown as { correct: boolean }).correct);
    return q.userAnswer != null && c && Number(q.userAnswer) === Number(c.id);
  };

  if (ui.isLoading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );

  /* ─── 패널 콘텐츠 렌더러 ─── */

  const renderQuizPanel = () => (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* 패널 accent bar + 헤더 */}
      <div className="shrink-0">
        <div className="h-1 bg-primary" />
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              {t('문제')}
            </span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-primary">
              {quiz.currentQuestion}/{total}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">
              {correctCount}/{quiz.filteredQuizzes.length}
            </span>
            {/* 미니 프로그레스 */}
            <div className="h-1 w-12 rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-chart-2 transition-all"
                style={{
                  width: `${(correctCount / quiz.filteredQuizzes.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 패널 본문 — 독립 스크롤 */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {/* 번호 strip */}
        <div className="mb-5 flex flex-wrap gap-1.5">
          {quiz.filteredQuizzes.map((q, i) => {
            const cur = quiz.showWrongOnly
              ? i + 1 === quiz.currentQuestion
              : q.number === quiz.currentQuestion;
            return (
              <button
                key={q.number}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-lg text-xs font-semibold transition-all',
                  cur
                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30 scale-110'
                    : isQuizCorrect(q)
                      ? 'bg-chart-2/15 text-chart-2 hover:bg-chart-2/25'
                      : 'bg-destructive/10 text-destructive hover:bg-destructive/20',
                )}
                onClick={() =>
                  quizActions.handleQuestionClick(quiz.showWrongOnly ? i + 1 : q.number)
                }
              >
                {q.number}
              </button>
            );
          })}
        </div>

        {/* 문제 제목 */}
        <BlurFade delay={0.05}>
          <div className="mb-6 border-l-3 border-primary pl-4">
            <p className="whitespace-pre-wrap break-words text-base font-bold leading-relaxed">
              {quiz.currentQuiz.number}. {quiz.currentQuiz.title}
            </p>
          </div>
        </BlurFade>

        {/* 선택지 */}
        <div className="mb-6 flex flex-col gap-2">
          {quiz.currentQuiz.selections.map((opt, idx) => {
            const correct = (opt as unknown as { correct: boolean }).correct;
            const wrongSel =
              quiz.currentQuiz.userAnswer != null &&
              Number(quiz.currentQuiz.userAnswer) === Number(opt.id) &&
              !correct;
            return (
              <BlurFade key={opt.id} delay={0.08 + idx * 0.03}>
                <div
                  className={cn(
                    'flex items-center rounded-xl px-4 py-3 text-sm transition-all',
                    correct
                      ? 'bg-chart-2/8 ring-2 ring-chart-2/30'
                      : wrongSel
                        ? 'bg-destructive/5 ring-2 ring-destructive/25'
                        : 'bg-muted/25 hover:bg-muted/40',
                  )}
                >
                  <span
                    className={cn(
                      'mr-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold',
                      correct
                        ? 'bg-chart-2/20 text-chart-2'
                        : wrongSel
                          ? 'bg-destructive/15 text-destructive'
                          : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {idx + 1}
                  </span>
                  <span className="flex-1 whitespace-pre-wrap break-words leading-relaxed">
                    {opt.content}
                  </span>
                  {correct && (
                    <span className="ml-2 shrink-0 rounded-full bg-chart-2/15 px-2 py-0.5 text-[10px] font-bold text-chart-2">
                      {t('정답')}
                    </span>
                  )}
                  {wrongSel && (
                    <span className="ml-2 shrink-0 rounded-full bg-destructive/12 px-2 py-0.5 text-[10px] font-bold text-destructive">
                      {t('오답')}
                    </span>
                  )}
                </div>
              </BlurFade>
            );
          })}
        </div>

        {/* 네비게이션 */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={quizActions.handlePrev}
            disabled={quiz.currentQuestion === 1}
          >
            &larr; {t('이전')}
          </Button>
          <Button size="sm" className="flex-1" onClick={() => commonActions.handleExit('/')}>
            {t('홈으로')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={quizActions.handleNext}
            disabled={quiz.currentQuestion === total}
          >
            {t('다음')} &rarr;
          </Button>
        </div>
      </div>
    </div>
  );

  const renderExplanationPanel = () => (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* 패널 accent bar + 헤더 */}
      <div className="shrink-0">
        <div className="h-1 bg-chart-2" />
        <div className="flex items-center border-b border-border px-5 py-3">
          <span className="text-xs font-bold uppercase tracking-widest text-chart-2">
            {t('해설')}
          </span>
        </div>
      </div>

      {/* 패널 본문 — 독립 스크롤 */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        <BlurFade delay={0.1}>
          <MarkdownText className="leading-[1.8] text-foreground/80">
            {explanation.thisExplanationText}
          </MarkdownText>
        </BlurFade>
      </div>
    </div>
  );

  const renderReferencePanel = () => (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* 패널 accent bar + 헤더 */}
      <div className="shrink-0">
        <div className="h-1 bg-chart-3" />
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <span className="text-xs font-bold uppercase tracking-widest text-chart-3">
            {t('참조 자료')}
          </span>
          <div className="relative inline-block h-5 w-9">
            <input
              type="checkbox"
              checked={pdf.showPdf}
              onChange={pdfActions.handlePdfToggle}
              className="peer sr-only"
            />
            <span className="absolute inset-0 rounded-full bg-muted transition-colors peer-checked:bg-chart-3" />
            <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-4" />
          </div>
        </div>
      </div>

      {/* 패널 본문 — 독립 스크롤 */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {refPages && refPages.length > 0 ? (
          <>
            {/* 페이지 선택 */}
            <div className="mb-4 flex flex-wrap gap-2">
              {refPages.map((page: number, i: number) => (
                <button
                  key={i}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
                    pdf.currentPdfPage === i
                      ? 'bg-chart-3 text-white shadow-sm shadow-chart-3/30'
                      : 'bg-muted/40 text-muted-foreground hover:bg-muted/60',
                  )}
                  onClick={() => pdfActions.setCurrentPdfPage(i)}
                >
                  {t('페이지')} {page}
                </button>
              ))}
            </div>

            {/* PDF 뷰어 */}
            {pdf.showPdf ? (
              <div className="w-full overflow-x-auto" ref={pdf.pdfContainerRef}>
                {/* 페이지 네비게이션 */}
                <div className="mb-3 flex items-center justify-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={pdfActions.handlePrevPdfPage}
                    disabled={pdf.currentPdfPage === 0}
                  >
                    &larr;
                  </Button>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {t('슬라이드의')} {refPages?.[pdf.currentPdfPage]} {t('페이지')}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={pdfActions.handleNextPdfPage}
                    disabled={pdf.currentPdfPage === (refPages?.length || 1) - 1}
                  >
                    &rarr;
                  </Button>
                </div>

                {/* PDF 콘텐츠 */}
                {!uploadedUrl ? (
                  <div className="flex h-48 items-center justify-center rounded-xl bg-muted/20">
                    <p className="text-sm text-muted-foreground">
                      {t('파일 링크가 만료되었습니다.')}
                    </p>
                  </div>
                ) : uploadedUrl.toLowerCase().endsWith('.pdf') ? (
                  <Document
                    file={uploadedUrl}
                    loading={
                      <div className="flex h-48 items-center justify-center">
                        <p className="text-sm text-muted-foreground">{t('PDF 로딩 중...')}</p>
                      </div>
                    }
                    onLoadError={
                      ((err: Error) => (
                        <p className="text-sm text-muted-foreground">
                          {t('파일이 존재하지 않습니다.')}
                        </p>
                      )) as DocumentProps['onLoadError']
                    }
                    options={pdf.pdfOptions}
                    className="flex min-h-[300px] justify-center [&_.react-pdf\_\_Page]:h-auto [&_.react-pdf\_\_Page]:max-w-full [&_.react-pdf\_\_Page\_\_canvas]:!h-auto [&_.react-pdf\_\_Page\_\_canvas]:max-w-full"
                  >
                    <Page
                      pageNumber={refPages?.[pdf.currentPdfPage] || 1}
                      width={pdf.pdfWidth}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />
                  </Document>
                ) : (
                  <div className="flex h-48 items-center justify-center rounded-xl bg-muted/20">
                    <p className="text-sm text-muted-foreground">
                      {t('현재는 pdf 파일만 지원합니다.')}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center rounded-xl border-2 border-dashed border-border">
                <div className="text-center">
                  <p className="mb-1 text-sm text-muted-foreground">{t('PDF 미리보기 꺼짐')}</p>
                  <button
                    className="text-xs text-chart-3 underline underline-offset-4 hover:text-chart-3/80"
                    onClick={pdfActions.handlePdfToggle}
                  >
                    {t('켜기')}
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex h-48 items-center justify-center rounded-xl bg-muted/10">
            <p className="text-sm text-muted-foreground">{t('참조 자료 없음')}</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen flex-col bg-background max-lg:h-auto max-lg:min-h-screen">
      {/* ─── 상단 네비게이션 바 ─── */}
      <header className="shrink-0 border-b border-border bg-card">
        <div className="flex items-center justify-between px-5 py-2.5">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-bold">{t('해설')}</h1>
            <span className="text-xs tabular-nums text-muted-foreground">
              {quiz.currentQuestion}/{total}
            </span>
            {/* 프로그레스 바 */}
            <div className="h-1.5 w-24 rounded-full bg-muted max-md:hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex cursor-pointer items-center gap-1.5">
              <span className="text-xs text-muted-foreground">{t('오답만')}</span>
              <div className="relative inline-block h-5 w-9">
                <input
                  type="checkbox"
                  checked={quiz.showWrongOnly}
                  onChange={quizActions.handleWrongOnlyToggle}
                  className="peer sr-only"
                />
                <span className="absolute inset-0 rounded-full bg-muted transition-colors peer-checked:bg-primary" />
                <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-4" />
              </div>
            </label>
            <button
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => commonActions.handleExit('/')}
            >
              &times; {t('닫기')}
            </button>
          </div>
        </div>
      </header>

      {/* ─── 모바일 탭 바 (lg 이하에서만 표시) ─── */}
      <div className="shrink-0 border-b border-border bg-card lg:hidden">
        <div className="flex">
          {(
            [
              { key: 'quiz', label: t('문제'), color: 'bg-primary' },
              { key: 'explanation', label: t('해설'), color: 'bg-chart-2' },
              { key: 'reference', label: t('참조'), color: 'bg-chart-3' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              className={cn(
                'relative flex-1 py-2.5 text-center text-xs font-semibold transition-colors',
                mobileTab === tab.key ? 'text-foreground' : 'text-muted-foreground',
              )}
              onClick={() => setMobileTab(tab.key)}
            >
              {tab.label}
              {mobileTab === tab.key && (
                <div className={cn('absolute bottom-0 left-0 right-0 h-0.5', tab.color)} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ─── 데스크톱: 1×3 그리드 패널 ─── */}
      <div className="flex flex-1 overflow-hidden max-lg:hidden">
        {/* 좌측 패널: 문제 + 선택지 */}
        <div className="flex flex-[1.15] flex-col overflow-hidden border-r border-border">
          {renderQuizPanel()}
        </div>

        {/* 중앙 패널: 해설 */}
        <div className="flex flex-1 flex-col overflow-hidden border-r border-border">
          {renderExplanationPanel()}
        </div>

        {/* 우측 패널: 참조 자료 */}
        <div className="flex flex-1 flex-col overflow-hidden">{renderReferencePanel()}</div>
      </div>

      {/* ─── 모바일: 탭 전환 콘텐츠 ─── */}
      <div className="flex flex-1 flex-col overflow-hidden lg:hidden">
        {mobileTab === 'quiz' && renderQuizPanel()}
        {mobileTab === 'explanation' && renderExplanationPanel()}
        {mobileTab === 'reference' && renderReferencePanel()}
      </div>
    </div>
  );
};

export default QuizExplanationDesignQ;
