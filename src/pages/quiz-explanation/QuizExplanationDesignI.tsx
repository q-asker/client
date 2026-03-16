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

/** Glass Gradient — 메시 그래디언트 배경 + 글래스모피즘 카드 + 프로그레스 바 */
const QuizExplanationDesignI: React.FC = () => {
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
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* 메시 그래디언트 배경 */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-1/4 -top-1/4 h-[60vh] w-[60vh] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-1/4 -right-1/4 h-[50vh] w-[50vh] rounded-full bg-chart-2/10 blur-[100px]" />
        <div className="absolute left-1/2 top-1/2 h-[40vh] w-[40vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-chart-3/8 blur-[80px]" />
      </div>

      {/* 프로그레스 바 */}
      <div className="fixed left-0 right-0 top-0 z-30 h-1 bg-muted/30">
        <div
          className="h-full bg-gradient-to-r from-primary to-chart-2 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 상단 글래스 네비 */}
      <nav className="sticky top-1 z-20 border-b border-border/30 bg-card/60 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-6 py-3">
          <div className="flex flex-1 flex-wrap gap-1.5">
            {quiz.filteredQuizzes.map((q, i) => {
              const cur = quiz.showWrongOnly
                ? i + 1 === quiz.currentQuestion
                : q.number === quiz.currentQuestion;
              return (
                <button
                  key={q.number}
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all',
                    cur
                      ? 'bg-primary text-primary-foreground shadow-[0_0_12px] shadow-primary/40'
                      : isQuizCorrect(q)
                        ? 'bg-chart-2/20 text-chart-2'
                        : 'bg-destructive/15 text-destructive',
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
          <label className="flex shrink-0 cursor-pointer items-center gap-1.5">
            <span className="text-xs text-muted-foreground">{t('오답만')}</span>
            <div className="relative inline-block h-5 w-9">
              <input
                type="checkbox"
                checked={quiz.showWrongOnly}
                onChange={quizActions.handleWrongOnlyToggle}
                className="peer sr-only"
              />
              <span className="absolute inset-0 rounded-full bg-muted/50 transition-colors peer-checked:bg-primary/80" />
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

      <main className="relative mx-auto max-w-3xl px-6 pb-16 pt-8 max-md:px-4">
        {/* 문제 글래스 카드 */}
        <BlurFade delay={0.05}>
          <div className="mb-6 rounded-2xl border border-border/30 bg-card/70 p-7 shadow-[0_8px_32px_-4px] shadow-primary/8 backdrop-blur-xl max-md:p-5">
            <p className="whitespace-pre-wrap break-words text-lg font-semibold leading-relaxed">
              {quiz.currentQuiz.number}. {quiz.currentQuiz.title}
            </p>
          </div>
        </BlurFade>

        {/* 선택지 */}
        <div className="mb-6 flex flex-col gap-2.5">
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
                    'flex items-center rounded-xl border px-4 py-3.5 text-sm backdrop-blur-lg transition-all',
                    correct
                      ? 'border-chart-2/40 bg-chart-2/8 shadow-[0_0_20px_-4px] shadow-chart-2/20'
                      : wrongSel
                        ? 'border-destructive/40 bg-destructive/6 shadow-[0_0_20px_-4px] shadow-destructive/15'
                        : 'border-border/30 bg-card/50',
                  )}
                >
                  <span
                    className={cn(
                      'mr-3.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                      correct
                        ? 'bg-chart-2/25 text-chart-2'
                        : wrongSel
                          ? 'bg-destructive/20 text-destructive'
                          : 'bg-muted/50 text-muted-foreground',
                    )}
                  >
                    {idx + 1}
                  </span>
                  <span className="flex-1 whitespace-pre-wrap break-words leading-relaxed">
                    {opt.content}
                  </span>
                  {correct && (
                    <span className="ml-3 shrink-0 text-xs font-bold text-chart-2">
                      {t('정답')}
                    </span>
                  )}
                  {wrongSel && (
                    <span className="ml-3 shrink-0 text-xs font-bold text-destructive">
                      {t('오답')}
                    </span>
                  )}
                </div>
              </BlurFade>
            );
          })}
        </div>

        {/* 네비게이션 */}
        <div className="mb-8 flex gap-3">
          <Button
            variant="outline"
            className="flex-1 border-border/30 bg-card/50 backdrop-blur-lg"
            onClick={quizActions.handlePrev}
            disabled={quiz.currentQuestion === 1}
          >
            &larr; {t('이전')}
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-border/30 bg-card/50 backdrop-blur-lg"
            onClick={quizActions.handleNext}
            disabled={quiz.currentQuestion === total}
          >
            {t('다음')} &rarr;
          </Button>
        </div>

        {/* 해설 글래스 카드 */}
        <BlurFade delay={0.15}>
          <div className="mb-6 rounded-2xl border border-border/30 bg-card/70 p-7 shadow-[0_4px_24px_-4px] shadow-chart-2/6 backdrop-blur-xl max-md:p-5">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-primary">
              {t('해설')}
            </h3>
            <MarkdownText className="leading-relaxed text-foreground/80">
              {explanation.thisExplanationText}
            </MarkdownText>
          </div>
        </BlurFade>

        {/* 참조 자료 */}
        {refPages && refPages.length > 0 && (
          <BlurFade delay={0.2}>
            <div className="mb-8 rounded-2xl border border-border/30 bg-card/50 p-5 backdrop-blur-lg">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-semibold">{t('참조 자료')}</h4>
                <div className="relative inline-block h-5 w-9">
                  <input
                    type="checkbox"
                    checked={pdf.showPdf}
                    onChange={pdfActions.handlePdfToggle}
                    className="peer sr-only"
                  />
                  <span className="absolute inset-0 rounded-full bg-muted/50 transition-colors peer-checked:bg-primary" />
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
                        : 'bg-muted/40 hover:bg-muted/60',
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

        <Button className="w-full" onClick={() => commonActions.handleExit('/')}>
          {t('홈으로')}
        </Button>
      </main>
    </div>
  );
};

export default QuizExplanationDesignI;
