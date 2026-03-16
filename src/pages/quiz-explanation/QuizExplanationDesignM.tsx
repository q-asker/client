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

/** Compact Dense — 한 화면에 모든 정보, 컴팩트한 정보 밀도 */
const QuizExplanationDesignM: React.FC = () => {
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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );

  return (
    <div className="min-h-screen bg-background">
      {/* 올인원 상단 바: 번호 + 카운터 + 오답만 + 네비 + 닫기 */}
      <div className="sticky top-0 z-20 border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 w-7 p-0 text-xs"
            onClick={quizActions.handlePrev}
            disabled={quiz.currentQuestion === 1}
          >
            &larr;
          </Button>
          <div className="flex flex-1 flex-wrap gap-1">
            {quiz.filteredQuizzes.map((q, i) => {
              const cur = quiz.showWrongOnly
                ? i + 1 === quiz.currentQuestion
                : q.number === quiz.currentQuestion;
              return (
                <button
                  key={q.number}
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold transition-all',
                    cur
                      ? 'bg-primary text-primary-foreground'
                      : isQuizCorrect(q)
                        ? 'text-chart-2'
                        : 'text-destructive',
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
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {quiz.currentQuestion}/{total}
          </span>
          <label className="flex shrink-0 cursor-pointer items-center gap-1">
            <span className="text-[10px] text-muted-foreground">{t('오답만')}</span>
            <div className="relative inline-block h-4 w-7">
              <input
                type="checkbox"
                checked={quiz.showWrongOnly}
                onChange={quizActions.handleWrongOnlyToggle}
                className="peer sr-only"
              />
              <span className="absolute inset-0 rounded-full bg-muted transition-colors peer-checked:bg-primary" />
              <span className="absolute left-0.5 top-0.5 h-3 w-3 rounded-full bg-white transition-transform peer-checked:translate-x-3" />
            </div>
          </label>
          <Button
            variant="outline"
            size="sm"
            className="h-7 w-7 p-0 text-xs"
            onClick={quizActions.handleNext}
            disabled={quiz.currentQuestion === total}
          >
            &rarr;
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => commonActions.handleExit('/')}
          >
            {t('홈')}
          </Button>
        </div>
      </div>

      {/* 3열 레이아웃: 문제 | 선택지 | 해설 */}
      <main className="mx-auto flex max-w-5xl gap-4 px-4 py-4 max-lg:flex-col">
        {/* 문제 */}
        <BlurFade delay={0.05} className="flex-1">
          <div className="rounded-xl bg-card p-4 shadow-sm">
            <span className="mb-2 inline-block text-[10px] font-bold uppercase tracking-widest text-primary">
              Q{quiz.currentQuiz.number}
            </span>
            <p className="whitespace-pre-wrap break-words text-sm font-semibold leading-relaxed">
              {quiz.currentQuiz.title}
            </p>
          </div>
        </BlurFade>

        {/* 선택지 */}
        <BlurFade delay={0.1} className="flex-1">
          <div className="rounded-xl bg-card p-4 shadow-sm">
            <span className="mb-2 inline-block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {t('선택지')}
            </span>
            <div className="flex flex-col gap-1.5">
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
                      'flex items-center gap-2 rounded-lg px-3 py-2 text-xs',
                      correct
                        ? 'bg-chart-2/10 font-semibold text-chart-2'
                        : wrongSel
                          ? 'bg-destructive/5 text-destructive line-through'
                          : 'bg-muted/20 text-foreground/70',
                    )}
                  >
                    <span className="shrink-0 font-bold">{idx + 1}.</span>
                    <span className="flex-1 whitespace-pre-wrap break-words leading-relaxed">
                      {opt.content}
                    </span>
                    {correct && <span className="shrink-0">&#10003;</span>}
                    {wrongSel && <span className="shrink-0">&#10005;</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </BlurFade>

        {/* 해설 + 참조 */}
        <BlurFade delay={0.15} className="flex-1">
          <div className="rounded-xl bg-card p-4 shadow-sm">
            <span className="mb-2 inline-block text-[10px] font-bold uppercase tracking-widest text-primary">
              {t('해설')}
            </span>
            <MarkdownText className="text-xs leading-relaxed text-foreground/75">
              {explanation.thisExplanationText}
            </MarkdownText>

            {refPages && refPages.length > 0 && (
              <div className="mt-4 border-t border-border pt-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {t('참조')}
                  </span>
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
                <div className="flex gap-1">
                  {refPages.map((page: number, i: number) => (
                    <button
                      key={i}
                      className={cn(
                        'rounded px-2 py-0.5 text-[10px] font-medium',
                        pdf.currentPdfPage === i
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground',
                      )}
                      onClick={() => pdfActions.setCurrentPdfPage(i)}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                {pdf.showPdf && (
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
                      <p className="text-center text-[10px] text-muted-foreground">
                        {t('파일 링크가 만료되었습니다.')}
                      </p>
                    ) : uploadedUrl.toLowerCase().endsWith('.pdf') ? (
                      <Document
                        file={uploadedUrl}
                        loading={<p className="text-center text-[10px]">{t('PDF 로딩 중...')}</p>}
                        onLoadError={
                          ((err: Error) => (
                            <p>{t('파일이 존재하지 않습니다.')}</p>
                          )) as DocumentProps['onLoadError']
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
                      <p className="text-center text-[10px] text-muted-foreground">
                        {t('현재는 pdf 파일만 지원합니다.')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </BlurFade>
      </main>
    </div>
  );
};

export default QuizExplanationDesignM;
