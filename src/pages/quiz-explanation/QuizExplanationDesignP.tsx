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

/** Terminal — 코드/터미널 느낌, diff 스타일 정답/오답, 모노스페이스 강조 */
const QuizExplanationDesignP: React.FC = () => {
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
      <div className="flex min-h-screen items-center justify-center bg-secondary">
        <div className="font-mono text-sm text-secondary-foreground/60">loading...</div>
      </div>
    );

  return (
    <div className="min-h-screen bg-secondary text-secondary-foreground">
      {/* 탭 바 — 터미널 탭 스타일 */}
      <div className="flex items-center border-b border-secondary-foreground/10 bg-secondary">
        <div className="flex flex-1 items-center gap-0 overflow-x-auto px-2 pt-2">
          {quiz.filteredQuizzes.map((q, i) => {
            const cur = quiz.showWrongOnly
              ? i + 1 === quiz.currentQuestion
              : q.number === quiz.currentQuestion;
            return (
              <button
                key={q.number}
                className={cn(
                  'shrink-0 border-x border-t px-4 py-1.5 font-mono text-xs transition-all',
                  cur
                    ? 'border-secondary-foreground/20 bg-secondary-foreground/5 text-secondary-foreground'
                    : 'border-transparent text-secondary-foreground/40 hover:text-secondary-foreground/60',
                )}
                onClick={() =>
                  quizActions.handleQuestionClick(quiz.showWrongOnly ? i + 1 : q.number)
                }
              >
                Q{q.number}
                {isQuizCorrect(q) ? ' ✓' : ' ✗'}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 px-4">
          <label className="flex cursor-pointer items-center gap-1.5">
            <span className="font-mono text-[10px] text-secondary-foreground/40">
              {t('오답만')}
            </span>
            <div className="relative inline-block h-4 w-7">
              <input
                type="checkbox"
                checked={quiz.showWrongOnly}
                onChange={quizActions.handleWrongOnlyToggle}
                className="peer sr-only"
              />
              <span className="absolute inset-0 rounded-full bg-secondary-foreground/10 transition-colors peer-checked:bg-primary" />
              <span className="absolute left-0.5 top-0.5 h-3 w-3 rounded-full bg-secondary transition-transform peer-checked:translate-x-3" />
            </div>
          </label>
          <button
            className="font-mono text-xs text-secondary-foreground/40 hover:text-secondary-foreground"
            onClick={() => commonActions.handleExit('/')}
          >
            [exit]
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-6 py-8 max-md:px-4">
        {/* 프롬프트 — 문제 */}
        <BlurFade delay={0.05}>
          <div className="mb-6">
            <div className="mb-2 font-mono text-xs text-primary">
              $ quiz --question {quiz.currentQuestion}/{total}
            </div>
            <p className="whitespace-pre-wrap break-words pl-4 text-base leading-relaxed">
              {quiz.currentQuiz.title}
            </p>
          </div>
        </BlurFade>

        {/* diff 스타일 선택지 */}
        <div className="mb-8 overflow-hidden rounded-lg border border-secondary-foreground/10">
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
                  'flex items-start border-b border-secondary-foreground/5 px-4 py-2.5 font-mono text-sm last:border-b-0',
                  correct ? 'bg-chart-2/8' : wrongSel ? 'bg-destructive/8' : '',
                )}
              >
                <span
                  className={cn(
                    'mr-3 w-6 shrink-0 select-none text-right text-xs',
                    correct
                      ? 'text-chart-2'
                      : wrongSel
                        ? 'text-destructive'
                        : 'text-secondary-foreground/25',
                  )}
                >
                  {correct ? '+' : wrongSel ? '-' : ' '}
                  {idx + 1}
                </span>
                <span
                  className={cn(
                    'flex-1 whitespace-pre-wrap break-words',
                    wrongSel && 'line-through opacity-50',
                  )}
                >
                  {opt.content}
                </span>
              </div>
            );
          })}
        </div>

        {/* 네비게이션 */}
        <div className="mb-8 flex gap-3">
          <button
            className="flex-1 rounded border border-secondary-foreground/15 py-2 font-mono text-xs transition-colors hover:bg-secondary-foreground/5 disabled:opacity-30"
            onClick={quizActions.handlePrev}
            disabled={quiz.currentQuestion === 1}
          >
            prev
          </button>
          <button
            className="flex-1 rounded bg-primary py-2 font-mono text-xs text-primary-foreground transition-colors hover:bg-primary/90"
            onClick={() => commonActions.handleExit('/')}
          >
            home
          </button>
          <button
            className="flex-1 rounded border border-secondary-foreground/15 py-2 font-mono text-xs transition-colors hover:bg-secondary-foreground/5 disabled:opacity-30"
            onClick={quizActions.handleNext}
            disabled={quiz.currentQuestion === total}
          >
            next
          </button>
        </div>

        {/* 해설 — comment 블록 */}
        <BlurFade delay={0.15}>
          <div className="mb-6 rounded-lg border border-secondary-foreground/10 bg-secondary-foreground/[0.03] p-6 max-md:p-4">
            <div className="mb-3 font-mono text-xs text-chart-2">/** {t('해설')} */</div>
            <MarkdownText className="leading-relaxed text-secondary-foreground/80">
              {explanation.thisExplanationText}
            </MarkdownText>
          </div>
        </BlurFade>

        {/* 참조 */}
        {refPages && refPages.length > 0 && (
          <div className="rounded-lg border border-secondary-foreground/10 p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-xs text-secondary-foreground/40">
                // {t('참조 자료')}
              </span>
              <button
                className="font-mono text-xs text-secondary-foreground/40 hover:text-secondary-foreground"
                onClick={pdfActions.handlePdfToggle}
              >
                [{pdf.showPdf ? 'hide' : 'show'}]
              </button>
            </div>
            <div className="flex gap-2">
              {refPages.map((page: number, i: number) => (
                <button
                  key={i}
                  className={cn(
                    'rounded font-mono text-xs transition-all',
                    pdf.currentPdfPage === i
                      ? 'bg-primary px-2 py-0.5 text-primary-foreground'
                      : 'text-secondary-foreground/50 hover:text-secondary-foreground',
                  )}
                  onClick={() => pdfActions.setCurrentPdfPage(i)}
                >
                  p{page}
                </button>
              ))}
            </div>
            {pdf.showPdf && (
              <div className="mt-4 w-full overflow-x-auto" ref={pdf.pdfContainerRef}>
                <div className="mb-3 flex items-center justify-center gap-4">
                  <button
                    className="font-mono text-xs text-secondary-foreground/40 disabled:opacity-30"
                    onClick={pdfActions.handlePrevPdfPage}
                    disabled={pdf.currentPdfPage === 0}
                  >
                    &lt;
                  </button>
                  <span className="font-mono text-xs text-secondary-foreground/40">
                    page {refPages?.[pdf.currentPdfPage]}
                  </span>
                  <button
                    className="font-mono text-xs text-secondary-foreground/40 disabled:opacity-30"
                    onClick={pdfActions.handleNextPdfPage}
                    disabled={pdf.currentPdfPage === (refPages?.length || 1) - 1}
                  >
                    &gt;
                  </button>
                </div>
                {!uploadedUrl ? (
                  <p className="text-center font-mono text-xs text-secondary-foreground/30">
                    {t('파일 링크가 만료되었습니다.')}
                  </p>
                ) : uploadedUrl.toLowerCase().endsWith('.pdf') ? (
                  <Document
                    file={uploadedUrl}
                    loading={<p className="text-center font-mono text-xs">loading pdf...</p>}
                    onLoadError={((err: Error) => <p>error</p>) as DocumentProps['onLoadError']}
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
                  <p className="text-center font-mono text-xs text-secondary-foreground/30">
                    unsupported format
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default QuizExplanationDesignP;
