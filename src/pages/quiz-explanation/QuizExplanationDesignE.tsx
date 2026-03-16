import { useTranslation } from 'i18nexus';
import React, { useState } from 'react';
import { Document, Page } from 'react-pdf';
import type { DocumentProps } from 'react-pdf';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuizExplanation } from '#features/quiz-explanation';
import { cn } from '@/shared/ui/lib/utils';
import MarkdownText from '@/shared/ui/components/markdown-text';
import { Badge } from '@/shared/ui/components/badge';
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

/** Compact Stack — 단일 컬럼, 최소 간격 스택 레이아웃 */
const QuizExplanationDesignE: React.FC = () => {
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
  const [pdfOpen, setPdfOpen] = useState(false);
  const refPages = explanation.thisExplanationObj?.referencedPages;

  if (ui.isLoading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );

  /* 정답 여부 판별 헬퍼 */
  const isQuizCorrect = (q: Quiz) => {
    const c = q.selections.find((o) => (o as unknown as { correct: boolean }).correct);
    return q.userAnswer != null && c && Number(q.userAnswer) === Number(c.id);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-4">
        <h1 className="text-lg font-semibold text-foreground">{t('해설')}</h1>
        <div className="flex items-center gap-4">
          <label className="flex cursor-pointer items-center gap-2">
            <span className="text-sm text-muted-foreground">{t('오답만')}</span>
            <div className="relative inline-block h-6 w-11">
              <input
                type="checkbox"
                checked={quiz.showWrongOnly}
                onChange={quizActions.handleWrongOnlyToggle}
                className="peer sr-only"
              />
              <span className="absolute inset-0 rounded-full bg-muted transition-colors peer-checked:bg-primary" />
              <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
            </div>
          </label>
          <Button variant="ghost" size="sm" onClick={() => commonActions.handleExit('/')}>
            {t('닫기')}
          </Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-6">
        {/* 번호 스트립 */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {quiz.filteredQuizzes.map((q, i) => {
            const cur = quiz.showWrongOnly
              ? i + 1 === quiz.currentQuestion
              : q.number === quiz.currentQuestion;
            return (
              <button
                key={q.number}
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-medium',
                  cur
                    ? 'bg-primary text-primary-foreground'
                    : isQuizCorrect(q)
                      ? 'bg-success/15 text-success'
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

        {/* 이전/다음 + 번호 */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={quizActions.handlePrev}
            disabled={quiz.currentQuestion === 1}
          >
            &larr;
          </Button>
          <span className="text-sm font-medium text-foreground">
            {quiz.currentQuestion} /{' '}
            {quiz.showWrongOnly ? quiz.filteredTotalQuestions : quiz.totalQuestions}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={quizActions.handleNext}
            disabled={
              quiz.currentQuestion ===
              (quiz.showWrongOnly ? quiz.filteredTotalQuestions : quiz.totalQuestions)
            }
          >
            &rarr;
          </Button>
        </div>

        {/* 문제 + 선택지 */}
        <div className="rounded-xl bg-card p-5 shadow-sm">
          <p className="mb-3 whitespace-pre-wrap text-sm font-semibold leading-relaxed">
            {quiz.currentQuiz.number}. {quiz.currentQuiz.title}
          </p>
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
                  'mb-1.5 flex items-center rounded-lg px-3 py-2.5 text-sm',
                  correct
                    ? 'bg-success/10 ring-2 ring-success/50'
                    : wrongSel
                      ? 'bg-destructive/5 ring-2 ring-destructive/50'
                      : 'bg-muted/40',
                )}
              >
                <span className="mr-2.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                  {idx + 1}
                </span>
                <span className="whitespace-pre-wrap break-words leading-relaxed">
                  {opt.content}
                </span>
                {correct && (
                  <Badge variant="default" className="ml-auto shrink-0 text-xs">
                    {t('정답')}
                  </Badge>
                )}
                {wrongSel && (
                  <Badge variant="destructive" className="ml-auto shrink-0 text-xs">
                    {t('오답')}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>

        {/* 해설 */}
        <div className="rounded-xl bg-muted/30 p-5">
          <h3 className="mb-2 text-sm font-semibold">{t('해설')}</h3>
          <MarkdownText className="text-sm leading-relaxed text-muted-foreground">
            {explanation.thisExplanationText}
          </MarkdownText>
        </div>

        {/* 참조 자료 — 접기/펼치기 */}
        <div className="rounded-xl bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{t('참조 자료')}</h3>
            <Button variant="ghost" size="sm" onClick={() => setPdfOpen(!pdfOpen)}>
              {pdfOpen ? t('접기') : t('펼치기')}
            </Button>
          </div>
          {refPages && refPages.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {refPages.map((page: number, i: number) => (
                <button
                  key={i}
                  className={cn(
                    'rounded-md px-3 py-1 text-xs font-medium',
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
          )}
          {pdfOpen && (
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
                <span className="text-xs text-muted-foreground">
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

        <Button className="w-full" onClick={() => commonActions.handleExit('/')}>
          {t('홈으로')}
        </Button>
      </main>
    </div>
  );
};

export default QuizExplanationDesignE;
