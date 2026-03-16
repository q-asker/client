import { useTranslation } from 'i18nexus';
import React from 'react';
import { Document, Page } from 'react-pdf';
import type { DocumentProps } from 'react-pdf';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuizExplanation } from '#features/quiz-explanation';
import { cn } from '@/shared/ui/lib/utils';
import MarkdownText from '@/shared/ui/components/markdown-text';
import { Button } from '@/shared/ui/components/button';
import type { Quiz } from '#features/quiz-generation';
import { MOCK_QUIZZES, MOCK_EXPLANATION, MOCK_UPLOADED_URL } from './mockExplanationData';

interface LocationState {
  quizzes?: Quiz[];
  explanation?: {
    results?: Array<{ number: number; explanation: string; referencedPages?: number[] }>;
  };
  uploadedUrl?: string;
}

/** Zen Minimal — 극한 미니멀, 여백 중심, 타이포만으로 표현 */
const QuizExplanationDesignL: React.FC = () => {
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground/10 border-t-foreground/60" />
      </div>
    );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="mx-auto w-full max-w-xl flex-1 px-6 pb-24 pt-16 max-md:px-5 max-md:pt-10">
        {/* 카운터 — 최소한의 정보 */}
        <div className="mb-16 flex items-center justify-between max-md:mb-10">
          <span className="text-sm tabular-nums text-foreground/30">
            {quiz.currentQuestion}/{total}
          </span>
          <div className="flex items-center gap-4">
            <label className="flex cursor-pointer items-center gap-2">
              <span className="text-xs text-foreground/30">{t('오답만')}</span>
              <div className="relative inline-block h-4 w-7">
                <input
                  type="checkbox"
                  checked={quiz.showWrongOnly}
                  onChange={quizActions.handleWrongOnlyToggle}
                  className="peer sr-only"
                />
                <span className="absolute inset-0 rounded-full bg-foreground/10 transition-colors peer-checked:bg-foreground/40" />
                <span className="absolute left-0.5 top-0.5 h-3 w-3 rounded-full bg-background transition-transform peer-checked:translate-x-3" />
              </div>
            </label>
            <button
              className="text-xs text-foreground/30 hover:text-foreground"
              onClick={() => commonActions.handleExit('/')}
            >
              &times;
            </button>
          </div>
        </div>

        {/* 문제 — 크고 깔끔한 타이포 */}
        <p className="mb-16 whitespace-pre-wrap break-words text-2xl font-light leading-relaxed tracking-tight text-foreground max-md:mb-10 max-md:text-xl">
          {quiz.currentQuiz.title}
        </p>

        {/* 선택지 — 번호만, 보더 없음 */}
        <div className="mb-16 space-y-6 max-md:mb-10 max-md:space-y-4">
          {quiz.currentQuiz.selections.map((opt, idx) => {
            const correct = (opt as unknown as { correct: boolean }).correct;
            const wrongSel =
              quiz.currentQuiz.userAnswer != null &&
              Number(quiz.currentQuiz.userAnswer) === Number(opt.id) &&
              !correct;
            return (
              <div key={opt.id} className="flex items-start gap-4">
                <span
                  className={cn(
                    'mt-1 text-sm font-light',
                    correct
                      ? 'text-foreground'
                      : wrongSel
                        ? 'text-destructive'
                        : 'text-foreground/25',
                  )}
                >
                  {String.fromCharCode(65 + idx)}.
                </span>
                <span
                  className={cn(
                    'whitespace-pre-wrap break-words text-base leading-relaxed',
                    correct && 'text-foreground',
                    wrongSel && 'text-foreground/30 line-through',
                    !correct && !wrongSel && 'text-foreground/40',
                  )}
                >
                  {opt.content}
                </span>
              </div>
            );
          })}
        </div>

        {/* 얇은 구분선 */}
        <div className="mb-16 h-px bg-foreground/5 max-md:mb-10" />

        {/* 해설 — 부드럽게 */}
        <div className="mb-16 max-md:mb-10">
          <MarkdownText className="text-base leading-[2] text-foreground/60">
            {explanation.thisExplanationText}
          </MarkdownText>
        </div>

        {/* 참조 */}
        {refPages && refPages.length > 0 && (
          <div className="mb-16 max-md:mb-10">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs text-foreground/25">{t('참조')}</span>
              <button
                className="text-xs text-foreground/25 hover:text-foreground/50"
                onClick={pdfActions.handlePdfToggle}
              >
                {pdf.showPdf ? '−' : '+'}
              </button>
            </div>
            <div className="flex gap-3">
              {refPages.map((page: number, i: number) => (
                <button
                  key={i}
                  className={cn(
                    'text-sm transition-colors',
                    pdf.currentPdfPage === i
                      ? 'text-foreground'
                      : 'text-foreground/25 hover:text-foreground/50',
                  )}
                  onClick={() => pdfActions.setCurrentPdfPage(i)}
                >
                  {page}
                </button>
              ))}
            </div>
            {pdf.showPdf && (
              <div className="mt-6 w-full overflow-x-auto" ref={pdf.pdfContainerRef}>
                <div className="mb-3 flex items-center justify-center gap-6">
                  <button
                    className="text-foreground/25 hover:text-foreground disabled:opacity-30"
                    onClick={pdfActions.handlePrevPdfPage}
                    disabled={pdf.currentPdfPage === 0}
                  >
                    &larr;
                  </button>
                  <span className="text-xs text-foreground/25">
                    {refPages?.[pdf.currentPdfPage]}
                  </span>
                  <button
                    className="text-foreground/25 hover:text-foreground disabled:opacity-30"
                    onClick={pdfActions.handleNextPdfPage}
                    disabled={pdf.currentPdfPage === (refPages?.length || 1) - 1}
                  >
                    &rarr;
                  </button>
                </div>
                {!uploadedUrl ? (
                  <p className="text-center text-xs text-foreground/25">
                    {t('파일 링크가 만료되었습니다.')}
                  </p>
                ) : uploadedUrl.toLowerCase().endsWith('.pdf') ? (
                  <Document
                    file={uploadedUrl}
                    loading={<p className="text-center text-xs">{t('PDF 로딩 중...')}</p>}
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
                  <p className="text-center text-xs text-foreground/25">
                    {t('현재는 pdf 파일만 지원합니다.')}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* 네비게이션 — 미니멀 텍스트 */}
        <nav className="flex items-center justify-between">
          <button
            className="text-sm text-foreground/30 hover:text-foreground disabled:opacity-20"
            onClick={quizActions.handlePrev}
            disabled={quiz.currentQuestion === 1}
          >
            &larr;
          </button>
          <button
            className="text-xs text-foreground/30 hover:text-foreground"
            onClick={() => commonActions.handleExit('/')}
          >
            {t('홈으로')}
          </button>
          <button
            className="text-sm text-foreground/30 hover:text-foreground disabled:opacity-20"
            onClick={quizActions.handleNext}
            disabled={quiz.currentQuestion === total}
          >
            &rarr;
          </button>
        </nav>
      </main>
    </div>
  );
};

export default QuizExplanationDesignL;
