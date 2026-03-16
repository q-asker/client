import { useTranslation } from 'i18nexus';
import React from 'react';
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

/** Bento Asymmetric — 비대칭 벤토 그리드, 문제 카드가 크고 해설/참조는 작은 타일 */
const QuizExplanationDesignO: React.FC = () => {
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

  const isQuizCorrect = (q: Quiz) => {
    const c = q.selections.find((o) => (o as unknown as { correct: boolean }).correct);
    return q.userAnswer != null && c && Number(q.userAnswer) === Number(c.id);
  };

  if (ui.isLoading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );

  return (
    <div className="min-h-screen bg-muted/40">
      {/* 상단 네비 — 글래스 */}
      <nav className="sticky top-0 z-20 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-2.5">
          <div className="flex flex-1 flex-wrap gap-1">
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
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : isQuizCorrect(q)
                        ? 'bg-chart-2/15 text-chart-2'
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
          <span className="text-xs tabular-nums text-muted-foreground">
            {quiz.currentQuestion}/{total}
          </span>
          <label className="flex cursor-pointer items-center gap-1">
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
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => commonActions.handleExit('/')}
          >
            &times;
          </button>
        </div>
      </nav>

      {/* 비대칭 벤토 그리드 */}
      <main className="mx-auto max-w-6xl p-5 max-md:p-3">
        <div className="grid auto-rows-min grid-cols-3 gap-4 max-lg:grid-cols-1">
          {/* 문제 — 2칸 차지 */}
          <BlurFade delay={0.05} className="col-span-2 max-lg:col-span-1">
            <div className="rounded-3xl bg-card p-8 shadow-sm max-md:p-5">
              <span className="mb-4 inline-block text-5xl font-black text-primary/10">
                {quiz.currentQuiz.number}
              </span>
              <p className="whitespace-pre-wrap break-words text-lg font-semibold leading-relaxed">
                {quiz.currentQuiz.title}
              </p>
            </div>
          </BlurFade>

          {/* 네비 + 액션 — 1칸 */}
          <BlurFade delay={0.08} className="max-lg:col-span-1">
            <div className="flex h-full flex-col justify-center gap-3 rounded-3xl bg-card p-6 shadow-sm">
              <Button
                variant="outline"
                className="w-full"
                onClick={quizActions.handlePrev}
                disabled={quiz.currentQuestion === 1}
              >
                &larr; {t('이전')}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={quizActions.handleNext}
                disabled={quiz.currentQuestion === total}
              >
                {t('다음')} &rarr;
              </Button>
              <Button className="w-full" onClick={() => commonActions.handleExit('/')}>
                {t('홈으로')}
              </Button>
            </div>
          </BlurFade>

          {/* 선택지 — 2칸 */}
          <BlurFade delay={0.1} className="col-span-2 max-lg:col-span-1">
            <div className="rounded-3xl bg-card p-6 shadow-sm">
              <div className="flex flex-col gap-2">
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
                        'flex items-center rounded-2xl px-5 py-3.5 text-sm transition-all',
                        correct
                          ? 'bg-chart-2/8 ring-2 ring-chart-2/25'
                          : wrongSel
                            ? 'bg-destructive/5 ring-2 ring-destructive/25'
                            : 'bg-muted/25',
                      )}
                    >
                      <span
                        className={cn(
                          'mr-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold',
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
                        <span className="ml-3 rounded-full bg-chart-2/15 px-2.5 py-1 text-xs font-bold text-chart-2">
                          {t('정답')}
                        </span>
                      )}
                      {wrongSel && (
                        <span className="ml-3 rounded-full bg-destructive/12 px-2.5 py-1 text-xs font-bold text-destructive">
                          {t('오답')}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </BlurFade>

          {/* 참조 — 1칸 */}
          <BlurFade delay={0.12} className="max-lg:col-span-1">
            <div className="rounded-3xl bg-card p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {t('참조')}
                </h4>
                <div className="relative inline-block h-4 w-7">
                  <input
                    type="checkbox"
                    checked={pdf.showPdf}
                    onChange={pdfActions.handlePdfToggle}
                    className="peer sr-only"
                  />
                  <span className="absolute inset-0 rounded-full bg-muted transition-colors peer-checked:bg-primary" />
                  <span className="absolute left-0.5 top-0.5 h-3 w-3 rounded-full bg-white transition-transform peer-checked:translate-x-3" />
                </div>
              </div>
              {refPages && refPages.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {refPages.map((page: number, i: number) => (
                    <button
                      key={i}
                      className={cn(
                        'rounded-lg px-2.5 py-1 text-xs font-medium',
                        pdf.currentPdfPage === i
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-accent',
                      )}
                      onClick={() => pdfActions.setCurrentPdfPage(i)}
                    >
                      p.{page}
                    </button>
                  ))}
                </div>
              )}
              {pdf.showPdf && refPages && (
                <div className="mt-3 w-full overflow-x-auto" ref={pdf.pdfContainerRef}>
                  <div className="mb-2 flex items-center justify-center gap-3">
                    <button
                      className="text-xs text-muted-foreground disabled:opacity-30"
                      onClick={pdfActions.handlePrevPdfPage}
                      disabled={pdf.currentPdfPage === 0}
                    >
                      &larr;
                    </button>
                    <span className="text-[10px] text-muted-foreground">
                      p.{refPages?.[pdf.currentPdfPage]}
                    </span>
                    <button
                      className="text-xs text-muted-foreground disabled:opacity-30"
                      onClick={pdfActions.handleNextPdfPage}
                      disabled={pdf.currentPdfPage === (refPages?.length || 1) - 1}
                    >
                      &rarr;
                    </button>
                  </div>
                  {!uploadedUrl ? (
                    <p className="text-center text-xs text-muted-foreground">{t('만료')}</p>
                  ) : uploadedUrl.toLowerCase().endsWith('.pdf') ? (
                    <Document
                      file={uploadedUrl}
                      loading={<p className="text-center text-xs">{t('로딩...')}</p>}
                      onLoadError={
                        ((err: Error) => <p>{t('오류')}</p>) as DocumentProps['onLoadError']
                      }
                      options={pdf.pdfOptions}
                      className="flex min-h-[200px] justify-center [&_.react-pdf\_\_Page]:h-auto [&_.react-pdf\_\_Page]:max-w-full [&_.react-pdf\_\_Page\_\_canvas]:!h-auto [&_.react-pdf\_\_Page\_\_canvas]:max-w-full"
                    >
                      <Page
                        pageNumber={refPages?.[pdf.currentPdfPage] || 1}
                        width={pdf.pdfWidth}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                      />
                    </Document>
                  ) : (
                    <p className="text-center text-xs text-muted-foreground">{t('미지원')}</p>
                  )}
                </div>
              )}
            </div>
          </BlurFade>

          {/* 해설 — 풀 3칸 */}
          <BlurFade delay={0.15} className="col-span-3 max-lg:col-span-1">
            <div className="rounded-3xl bg-card p-8 shadow-sm max-md:p-5">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-primary">
                {t('해설')}
              </h3>
              <MarkdownText className="leading-relaxed text-foreground/80">
                {explanation.thisExplanationText}
              </MarkdownText>
            </div>
          </BlurFade>
        </div>
      </main>
    </div>
  );
};

export default QuizExplanationDesignO;
