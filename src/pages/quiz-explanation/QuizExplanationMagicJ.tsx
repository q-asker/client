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

/** Side Drawer — 문제 집중 + 해설 우측 드로어 패널 */
const QuizExplanationMagicJ: React.FC = () => {
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
  const [drawerOpen, setDrawerOpen] = useState(false);

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
    <div className="relative min-h-screen bg-background">
      {/* 오버레이 */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-30 bg-foreground/20 backdrop-blur-sm transition-opacity"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* 드로어 패널 */}
      <div
        className={cn(
          'fixed right-0 top-0 z-40 flex h-full w-full max-w-lg flex-col border-l border-border bg-card shadow-2xl transition-transform duration-300 max-md:max-w-full',
          drawerOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="text-base font-bold">{t('해설')}</h3>
          <button
            className="text-lg text-muted-foreground hover:text-foreground"
            onClick={() => setDrawerOpen(false)}
          >
            &times;
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <MarkdownText className="leading-relaxed text-foreground/80">
            {explanation.thisExplanationText}
          </MarkdownText>

          {refPages && refPages.length > 0 && (
            <div className="mt-8 rounded-xl bg-muted/30 p-4">
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
                      'rounded-md px-3 py-1 text-sm font-medium',
                      pdf.currentPdfPage === i
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-accent',
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
        </div>
      </div>

      {/* 메인 — 문제에 집중 */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-sm tabular-nums text-muted-foreground">
              {quiz.currentQuestion}/{total}
            </span>
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
          </div>
          <div className="flex items-center gap-3">
            <button
              className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              onClick={() => setDrawerOpen(true)}
            >
              {t('해설')} &rarr;
            </button>
            <button
              className="text-sm text-muted-foreground hover:text-foreground"
              onClick={() => commonActions.handleExit('/')}
            >
              &times;
            </button>
          </div>
        </div>
      </header>

      {/* 번호 스트립 */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl flex-wrap gap-1.5 px-6 py-2.5">
          {quiz.filteredQuizzes.map((q, i) => {
            const cur = quiz.showWrongOnly
              ? i + 1 === quiz.currentQuestion
              : q.number === quiz.currentQuestion;
            return (
              <button
                key={q.number}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition-all',
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
      </div>

      <main className="mx-auto max-w-3xl px-6 pb-12 pt-10 max-md:px-4 max-md:pt-6">
        {/* 문제 — 큰 타이포 */}
        <BlurFade delay={0.05}>
          <p className="mb-10 whitespace-pre-wrap break-words text-2xl font-bold leading-relaxed max-md:text-xl">
            {quiz.currentQuiz.number}. {quiz.currentQuiz.title}
          </p>
        </BlurFade>

        {/* 선택지 — 큰 카드 스타일 */}
        <div className="mb-10 flex flex-col gap-3">
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
                    'flex items-center rounded-2xl border-2 px-5 py-4 text-base transition-all max-md:text-sm',
                    correct
                      ? 'border-chart-2 bg-chart-2/5'
                      : wrongSel
                        ? 'border-destructive bg-destructive/5'
                        : 'border-border bg-card',
                  )}
                >
                  <span
                    className={cn(
                      'mr-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold max-md:h-8 max-md:w-8',
                      correct
                        ? 'bg-chart-2 text-white'
                        : wrongSel
                          ? 'bg-destructive text-white'
                          : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {idx + 1}
                  </span>
                  <span className="flex-1 whitespace-pre-wrap break-words leading-relaxed">
                    {opt.content}
                  </span>
                </div>
              </BlurFade>
            );
          })}
        </div>

        {/* 네비게이션 */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={quizActions.handlePrev}
            disabled={quiz.currentQuestion === 1}
          >
            &larr; {t('이전')}
          </Button>
          <Button className="flex-1" onClick={() => commonActions.handleExit('/')}>
            {t('홈으로')}
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
      </main>
    </div>
  );
};

export default QuizExplanationMagicJ;
