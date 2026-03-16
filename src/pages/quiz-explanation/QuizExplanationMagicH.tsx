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
 * Focus Card — 중앙 대형 카드에 집중, 탭으로 문제/해설 전환.
 * 12번(MagicF) 대비 개선: 탭 전환으로 스크롤 제거, 대형 카드로 가독성 극대화,
 * 번호 strip sticky, 큰 워터마크 번호로 시각적 앵커.
 */
const QuizExplanationMagicH: React.FC = () => {
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
  const [activeTab, setActiveTab] = useState<'quiz' | 'explanation'>('quiz');

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
    <div className="flex min-h-screen flex-col bg-muted/40">
      {/* ─── 상단 헤더 ─── */}
      <header className="border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4 max-md:px-4">
          <div className="flex items-center gap-3">
            <span className="text-lg font-black tabular-nums text-primary">
              {quiz.currentQuestion}
            </span>
            <span className="text-sm text-muted-foreground">/ {total}</span>
          </div>
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
              &times;
            </button>
          </div>
        </div>
      </header>

      {/* ─── 번호 strip ─── */}
      <div className="sticky top-0 z-10 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-6 py-2.5 max-md:px-4">
          <div className="flex flex-1 flex-wrap gap-1">
            {quiz.filteredQuizzes.map((q, i) => {
              const cur = quiz.showWrongOnly
                ? i + 1 === quiz.currentQuestion
                : q.number === quiz.currentQuestion;
              return (
                <button
                  key={q.number}
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-md text-xs font-semibold transition-all',
                    cur
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : isQuizCorrect(q)
                        ? 'bg-chart-2/12 text-chart-2'
                        : 'bg-destructive/10 text-destructive',
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
        </div>
      </div>

      {/* ─── 중앙 대형 카드 ─── */}
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-8 max-md:px-4 max-md:py-5">
        <BlurFade delay={0.05}>
          <div className="relative overflow-hidden rounded-3xl bg-card shadow-[0_8px_40px_-8px] shadow-foreground/8">
            {/* 워터마크 번호 */}
            <span className="pointer-events-none absolute -right-4 -top-6 select-none text-[8rem] font-black leading-none text-primary/[0.04] max-md:text-[5rem]">
              {quiz.currentQuiz.number}
            </span>

            {/* 탭 전환 바 */}
            <div className="relative flex border-b border-border">
              <button
                className={cn(
                  'flex-1 py-3.5 text-sm font-semibold transition-colors',
                  activeTab === 'quiz'
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground/70',
                )}
                onClick={() => setActiveTab('quiz')}
              >
                {t('문제')}
              </button>
              <button
                className={cn(
                  'flex-1 py-3.5 text-sm font-semibold transition-colors',
                  activeTab === 'explanation'
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground/70',
                )}
                onClick={() => setActiveTab('explanation')}
              >
                {t('해설')}
              </button>
              {/* 활성 탭 인디케이터 */}
              <div
                className={cn(
                  'absolute bottom-0 h-0.5 w-1/2 bg-primary transition-transform duration-300',
                  activeTab === 'explanation' && 'translate-x-full',
                )}
              />
            </div>

            {/* 카드 본문 */}
            <div className="relative p-8 max-md:p-5">
              {/* ─── 문제 탭 ─── */}
              {activeTab === 'quiz' && (
                <BlurFade delay={0.05}>
                  <div>
                    {/* 문제 제목 */}
                    <p className="mb-8 whitespace-pre-wrap break-words text-lg font-semibold leading-relaxed max-md:text-base">
                      {quiz.currentQuiz.number}. {quiz.currentQuiz.title}
                    </p>

                    {/* 선택지 */}
                    <div className="flex flex-col gap-2.5">
                      {quiz.currentQuiz.selections.map((opt, idx) => {
                        const correct = (opt as unknown as { correct: boolean }).correct;
                        const wrongSel =
                          quiz.currentQuiz.userAnswer != null &&
                          Number(quiz.currentQuiz.userAnswer) === Number(opt.id) &&
                          !correct;
                        return (
                          <div
                            key={opt.id}
                            className={cn(
                              'flex items-center rounded-xl px-5 py-4 text-sm transition-all',
                              correct
                                ? 'bg-chart-2/10 ring-2 ring-chart-2/30'
                                : wrongSel
                                  ? 'bg-destructive/6 ring-2 ring-destructive/30'
                                  : 'bg-muted/30 hover:bg-muted/50',
                            )}
                          >
                            <span
                              className={cn(
                                'mr-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold',
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
                              <span className="ml-3 shrink-0 rounded-full bg-chart-2/15 px-3 py-1 text-xs font-bold text-chart-2">
                                {t('정답')}
                              </span>
                            )}
                            {wrongSel && (
                              <span className="ml-3 shrink-0 rounded-full bg-destructive/12 px-3 py-1 text-xs font-bold text-destructive">
                                {t('오답')}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* 해설 보기 유도 */}
                    <button
                      className="mt-6 w-full rounded-xl bg-muted/40 py-3 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                      onClick={() => setActiveTab('explanation')}
                    >
                      {t('해설 보기')} &rarr;
                    </button>
                  </div>
                </BlurFade>
              )}

              {/* ─── 해설 탭 ─── */}
              {activeTab === 'explanation' && (
                <BlurFade delay={0.05}>
                  <div>
                    <MarkdownText className="leading-relaxed text-foreground/80">
                      {explanation.thisExplanationText}
                    </MarkdownText>

                    {/* 참조 자료 */}
                    {refPages && refPages.length > 0 && (
                      <div className="mt-8 rounded-xl bg-muted/20 p-5">
                        <div className="mb-3 flex items-center justify-between">
                          <h4 className="text-sm font-semibold">{t('참조 자료')}</h4>
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
                                'rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
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
                    )}

                    {/* 문제로 돌아가기 */}
                    <button
                      className="mt-6 w-full rounded-xl bg-muted/40 py-3 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                      onClick={() => setActiveTab('quiz')}
                    >
                      &larr; {t('문제로 돌아가기')}
                    </button>
                  </div>
                </BlurFade>
              )}
            </div>
          </div>
        </BlurFade>

        {/* 네비게이션 + 홈으로 */}
        <div className="mt-6 flex gap-3">
          <Button
            variant="outline"
            className="flex-1 bg-card"
            onClick={quizActions.handlePrev}
            disabled={quiz.currentQuestion === 1}
          >
            &larr; {t('이전')}
          </Button>
          <Button className="flex-[2]" onClick={() => commonActions.handleExit('/')}>
            {t('홈으로')}
          </Button>
          <Button
            variant="outline"
            className="flex-1 bg-card"
            onClick={quizActions.handleNext}
            disabled={quiz.currentQuestion === total}
          >
            {t('다음')} &rarr;
          </Button>
        </div>
      </main>
    </div>
  );
};

export default QuizExplanationMagicH;
