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
 * Inline Reveal — 단일 컬럼 + 문제 아래 해설 인라인 표시.
 * 12번(MagicF) 대비 개선: 스크롤 최소화(해설이 바로 아래), 좌측 세로 번호 바,
 * 가독성 높은 여백 + BlurFade 전환 애니메이션.
 */
const QuizExplanationMagicG: React.FC = () => {
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
  const [showExplanation, setShowExplanation] = useState(true);

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

  return (
    <div className="flex min-h-screen bg-background">
      {/* ─── 좌측 세로 번호 바 (데스크톱만) ─── */}
      <aside className="sticky top-0 flex h-screen w-16 shrink-0 flex-col items-center border-r border-border bg-card py-4 max-lg:hidden">
        <div className="mb-4 flex flex-col items-center gap-1">
          <span className="text-xs font-bold text-muted-foreground">Q</span>
          <div className="h-px w-6 bg-border" />
        </div>
        <div className="flex flex-1 flex-col items-center gap-1.5 overflow-y-auto py-1">
          {quiz.filteredQuizzes.map((q, i) => {
            const cur = quiz.showWrongOnly
              ? i + 1 === quiz.currentQuestion
              : q.number === quiz.currentQuestion;
            return (
              <button
                key={q.number}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition-all duration-200',
                  cur
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : isQuizCorrect(q)
                      ? 'text-chart-2 hover:bg-chart-2/10'
                      : 'text-destructive hover:bg-destructive/10',
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
        <div className="mt-4 flex flex-col items-center gap-2">
          <div className="h-px w-6 bg-border" />
          <button
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => commonActions.handleExit('/')}
            title="홈으로"
          >
            &#8962;
          </button>
        </div>
      </aside>

      {/* ─── 메인 컨텐츠 ─── */}
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-8 pb-16 pt-8 max-md:px-4 max-md:pt-5">
        {/* 모바일 번호 바 */}
        <div className="mb-6 flex flex-wrap items-center gap-2 lg:hidden">
          {quiz.filteredQuizzes.map((q, i) => {
            const cur = quiz.showWrongOnly
              ? i + 1 === quiz.currentQuestion
              : q.number === quiz.currentQuestion;
            return (
              <button
                key={q.number}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-md text-xs font-semibold',
                  cur
                    ? 'bg-primary text-primary-foreground'
                    : isQuizCorrect(q)
                      ? 'bg-chart-2/15 text-chart-2'
                      : 'bg-destructive/12 text-destructive',
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

        {/* 상단 메타 — 카운터 + 오답만 + 닫기 */}
        <div className="mb-8 flex items-center justify-between">
          <span className="text-sm tabular-nums text-muted-foreground">
            {quiz.currentQuestion} / {total}
          </span>
          <div className="flex items-center gap-4">
            <label className="flex cursor-pointer items-center gap-2">
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
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => commonActions.handleExit('/')}
            >
              {t('닫기')} &times;
            </button>
          </div>
        </div>

        {/* ─── 문제 영역 ─── */}
        <BlurFade delay={0.05}>
          <div className="mb-6 border-l-4 border-primary py-1 pl-5">
            <p className="whitespace-pre-wrap break-words text-xl font-bold leading-relaxed tracking-tight max-md:text-lg">
              {quiz.currentQuiz.number}. {quiz.currentQuiz.title}
            </p>
          </div>
        </BlurFade>

        {/* ─── 선택지 ─── */}
        <div className="mb-6 flex flex-col gap-2">
          {quiz.currentQuiz.selections.map((opt, idx) => {
            const correct = (opt as unknown as { correct: boolean }).correct;
            const wrongSel =
              quiz.currentQuiz.userAnswer != null &&
              Number(quiz.currentQuiz.userAnswer) === Number(opt.id) &&
              !correct;
            return (
              <BlurFade key={opt.id} delay={0.08 + idx * 0.04}>
                <div
                  className={cn(
                    'group flex items-start gap-3 rounded-xl px-4 py-3.5 transition-all',
                    correct
                      ? 'bg-chart-2/8 ring-1 ring-chart-2/30'
                      : wrongSel
                        ? 'bg-destructive/5 ring-1 ring-destructive/30'
                        : 'bg-muted/40',
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold',
                      correct
                        ? 'bg-chart-2/20 text-chart-2'
                        : wrongSel
                          ? 'bg-destructive/15 text-destructive'
                          : 'bg-background text-muted-foreground',
                    )}
                  >
                    {idx + 1}
                  </span>
                  <span
                    className={cn(
                      'flex-1 whitespace-pre-wrap break-words text-sm leading-relaxed',
                      correct && 'font-medium text-foreground',
                      wrongSel && 'text-foreground/70 line-through decoration-destructive/30',
                      !correct && !wrongSel && 'text-muted-foreground',
                    )}
                  >
                    {opt.content}
                  </span>
                  {correct && <span className="mt-0.5 shrink-0 text-chart-2">&#10003;</span>}
                  {wrongSel && <span className="mt-0.5 shrink-0 text-destructive">&#10005;</span>}
                </div>
              </BlurFade>
            );
          })}
        </div>

        {/* ─── 이전/다음 ─── */}
        <div className="mb-8 flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={quizActions.handlePrev}
            disabled={quiz.currentQuestion === 1}
          >
            &larr; {t('이전')}
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={quizActions.handleNext}
            disabled={quiz.currentQuestion === total}
          >
            {t('다음')} &rarr;
          </Button>
        </div>

        {/* ─── 구분선 + 해설 토글 ─── */}
        <div className="mb-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <button
            className={cn(
              'rounded-full px-4 py-1.5 text-xs font-semibold transition-all',
              showExplanation
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent',
            )}
            onClick={() => setShowExplanation((v) => !v)}
          >
            {showExplanation ? t('해설') + ' ▾' : t('해설 보기') + ' ▸'}
          </button>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* ─── 해설 (인라인, 접기 가능) ─── */}
        {showExplanation && (
          <BlurFade delay={0.1}>
            <div className="mb-8 rounded-2xl bg-card p-6 shadow-sm max-md:p-4">
              <MarkdownText className="leading-relaxed text-foreground/80">
                {explanation.thisExplanationText}
              </MarkdownText>
            </div>
          </BlurFade>
        )}

        {/* ─── 참조 자료 ─── */}
        {refPages && refPages.length > 0 && showExplanation && (
          <BlurFade delay={0.15}>
            <div className="mb-8 rounded-2xl bg-muted/30 p-5">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground">{t('참조 자료')}</h4>
                <div className="relative inline-block h-5 w-9">
                  <input
                    type="checkbox"
                    checked={pdf.showPdf}
                    onChange={pdfActions.handlePdfToggle}
                    className="peer sr-only"
                  />
                  <span className="absolute inset-0 rounded-full bg-muted transition-colors peer-checked:bg-primary" />
                  <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-4" />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {refPages.map((page: number, i: number) => (
                  <button
                    key={i}
                    className={cn(
                      'rounded-md px-3 py-1.5 text-sm font-medium transition-all',
                      pdf.currentPdfPage === i
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card text-muted-foreground hover:bg-accent',
                    )}
                    onClick={() => pdfActions.setCurrentPdfPage(i)}
                  >
                    {t('페이지')} {page}
                  </button>
                ))}
              </div>
              {pdf.showPdf && (
                <div className="mt-4 w-full overflow-x-auto" ref={pdf.pdfContainerRef}>
                  <div className="mb-3 flex items-center justify-center gap-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={pdfActions.handlePrevPdfPage}
                      disabled={pdf.currentPdfPage === 0}
                    >
                      &larr;
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {t('슬라이드의')} {refPages?.[pdf.currentPdfPage]} {t('페이지')}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={pdfActions.handleNextPdfPage}
                      disabled={pdf.currentPdfPage === (refPages?.length || 1) - 1}
                    >
                      &rarr;
                    </Button>
                  </div>
                  {!uploadedUrl ? (
                    <p className="text-center text-muted-foreground">
                      {t('파일 링크가 만료되었습니다.')}
                    </p>
                  ) : uploadedUrl.toLowerCase().endsWith('.pdf') ? (
                    <Document
                      file={uploadedUrl}
                      loading={<p className="text-center">{t('PDF 로딩 중...')}</p>}
                      onLoadError={
                        ((err: Error) => (
                          <p>{t('파일이 존재하지 않습니다.')}</p>
                        )) as DocumentProps['onLoadError']
                      }
                      options={pdf.pdfOptions}
                      className="flex min-h-[400px] justify-center [&_.react-pdf\_\_Page]:h-auto [&_.react-pdf\_\_Page]:max-w-full [&_.react-pdf\_\_Page\_\_canvas]:!h-auto [&_.react-pdf\_\_Page\_\_canvas]:max-w-full"
                    >
                      <Page
                        pageNumber={refPages?.[pdf.currentPdfPage] || 1}
                        width={pdf.pdfWidth}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                      />
                    </Document>
                  ) : (
                    <p className="text-center text-muted-foreground">
                      {t('현재는 pdf 파일만 지원합니다.')}
                    </p>
                  )}
                </div>
              )}
            </div>
          </BlurFade>
        )}

        {/* 홈으로 */}
        <Button className="w-full" onClick={() => commonActions.handleExit('/')}>
          {t('홈으로')}
        </Button>
      </main>
    </div>
  );
};

export default QuizExplanationMagicG;
