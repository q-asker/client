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

/** Drop Cap Editorial — 드롭캡 번호 + 순수 타이포그래피 + 구분선 매거진 스타일 */
const QuizExplanationDesignJ: React.FC = () => {
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
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-foreground" />
      </div>
    );

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 — 매거진 스타일 */}
      <header className="border-b-2 border-foreground">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-foreground">
            {t('해설')}
          </span>
          <div className="flex items-center gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
              <span>{t('오답만')}</span>
              <div className="relative inline-block h-4 w-8">
                <input
                  type="checkbox"
                  checked={quiz.showWrongOnly}
                  onChange={quizActions.handleWrongOnlyToggle}
                  className="peer sr-only"
                />
                <span className="absolute inset-0 rounded-full bg-muted transition-colors peer-checked:bg-foreground" />
                <span className="absolute left-0.5 top-0.5 h-3 w-3 rounded-full bg-background transition-transform peer-checked:translate-x-4" />
              </div>
            </label>
            <button
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => commonActions.handleExit('/')}
            >
              {t('닫기')}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 pb-20 pt-12 max-md:px-4 max-md:pt-8">
        {/* 번호 스트립 */}
        <div className="mb-10 flex flex-wrap gap-1">
          {quiz.filteredQuizzes.map((q, i) => {
            const cur = quiz.showWrongOnly
              ? i + 1 === quiz.currentQuestion
              : q.number === quiz.currentQuestion;
            return (
              <button
                key={q.number}
                className={cn(
                  'flex h-7 w-7 items-center justify-center text-xs font-medium transition-colors',
                  cur
                    ? 'bg-foreground text-background'
                    : isQuizCorrect(q)
                      ? 'text-muted-foreground'
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
          <span className="ml-2 flex items-center text-xs text-muted-foreground">
            {quiz.currentQuestion}/{total}
          </span>
        </div>

        {/* 드롭캡 + 문제 제목 */}
        <section className="mb-10">
          <div className="flex items-start gap-4">
            <span className="shrink-0 text-[4rem] font-black leading-[0.8] text-foreground max-md:text-[3rem]">
              {quiz.currentQuiz.number}
            </span>
            <p className="whitespace-pre-wrap break-words pt-2 text-lg leading-relaxed max-md:text-base">
              {quiz.currentQuiz.title}
            </p>
          </div>
        </section>

        <hr className="mb-8 border-t border-foreground/20" />

        {/* 선택지 — 심플 리스트 */}
        <ol className="mb-10 list-none space-y-3 pl-0">
          {quiz.currentQuiz.selections.map((opt, idx) => {
            const correct = (opt as unknown as { correct: boolean }).correct;
            const wrongSel =
              quiz.currentQuiz.userAnswer != null &&
              Number(quiz.currentQuiz.userAnswer) === Number(opt.id) &&
              !correct;
            return (
              <li key={opt.id} className="flex items-start gap-3">
                <span
                  className={cn(
                    'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center text-sm font-semibold',
                    correct
                      ? 'text-foreground'
                      : wrongSel
                        ? 'text-destructive'
                        : 'text-muted-foreground',
                  )}
                >
                  {correct ? '●' : wrongSel ? '×' : String.fromCharCode(65 + idx)}
                </span>
                <span
                  className={cn(
                    'flex-1 whitespace-pre-wrap break-words leading-relaxed',
                    correct && 'font-semibold text-foreground',
                    wrongSel && 'text-muted-foreground line-through',
                    !correct && !wrongSel && 'text-foreground/70',
                  )}
                >
                  {opt.content}
                </span>
              </li>
            );
          })}
        </ol>

        {/* 네비게이션 — 텍스트 링크 스타일 */}
        <nav className="mb-12 flex justify-between border-y border-foreground/10 py-4">
          <button
            className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-30"
            onClick={quizActions.handlePrev}
            disabled={quiz.currentQuestion === 1}
          >
            &larr; {t('이전')}
          </button>
          <button
            className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-30"
            onClick={quizActions.handleNext}
            disabled={quiz.currentQuestion === total}
          >
            {t('다음')} &rarr;
          </button>
        </nav>

        {/* 해설 — 들여쓰기 블록 */}
        <section className="mb-10 border-l-2 border-foreground/15 pl-6">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
            {t('해설')}
          </h2>
          <MarkdownText className="leading-[1.9] text-foreground/75">
            {explanation.thisExplanationText}
          </MarkdownText>
        </section>

        <hr className="mb-8 border-t border-foreground/10" />

        {/* 참조 자료 */}
        {refPages && refPages.length > 0 && (
          <section className="mb-10">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                {t('참조 자료')}
              </h3>
              <button
                className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
                onClick={pdfActions.handlePdfToggle}
              >
                {pdf.showPdf ? t('닫기') : t('보기')}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {refPages.map((page: number, i: number) => (
                <button
                  key={i}
                  className={cn(
                    'text-sm transition-colors',
                    pdf.currentPdfPage === i
                      ? 'font-bold text-foreground underline underline-offset-4'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                  onClick={() => pdfActions.setCurrentPdfPage(i)}
                >
                  p.{page}
                </button>
              ))}
            </div>
            {pdf.showPdf && (
              <div className="mt-4 w-full overflow-x-auto" ref={pdf.pdfContainerRef}>
                <div className="mb-3 flex items-center justify-center gap-4">
                  <button
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                    onClick={pdfActions.handlePrevPdfPage}
                    disabled={pdf.currentPdfPage === 0}
                  >
                    &larr;
                  </button>
                  <span className="text-xs text-muted-foreground">
                    {t('슬라이드의')} {refPages?.[pdf.currentPdfPage]} {t('페이지')}
                  </span>
                  <button
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                    onClick={pdfActions.handleNextPdfPage}
                    disabled={pdf.currentPdfPage === (refPages?.length || 1) - 1}
                  >
                    &rarr;
                  </button>
                </div>
                {!uploadedUrl ? (
                  <p className="text-center text-sm text-muted-foreground">
                    {t('파일 링크가 만료되었습니다.')}
                  </p>
                ) : uploadedUrl.toLowerCase().endsWith('.pdf') ? (
                  <Document
                    file={uploadedUrl}
                    loading={<p className="text-center text-sm">{t('PDF 로딩 중...')}</p>}
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
                  <p className="text-center text-sm text-muted-foreground">
                    {t('현재는 pdf 파일만 지원합니다.')}
                  </p>
                )}
              </div>
            )}
          </section>
        )}

        {/* 하단 */}
        <div className="flex flex-col gap-3">
          <button
            className="w-full border-2 border-foreground bg-foreground py-3 text-sm font-bold tracking-wide text-background transition-colors hover:bg-foreground/90"
            onClick={() => commonActions.handleExit('/')}
          >
            {t('홈으로')}
          </button>
        </div>
      </main>
    </div>
  );
};

export default QuizExplanationDesignJ;
