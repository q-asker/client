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

/** Sticky Columns — 좌측 고정 문제 + 우측 스크롤 해설 (독립 스크롤) */
const QuizExplanationMagicK: React.FC = () => {
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
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );

  return (
    <div className="flex h-screen overflow-hidden bg-background max-lg:h-auto max-lg:min-h-screen max-lg:flex-col max-lg:overflow-auto">
      {/* ─── 좌측: 문제 (스크롤 안됨, 화면에 고정) ─── */}
      <div className="flex h-full w-1/2 flex-col overflow-y-auto border-r border-border bg-card max-lg:h-auto max-lg:w-full max-lg:border-b max-lg:border-r-0">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-primary">{quiz.currentQuestion}</span>
            <span className="text-xs text-muted-foreground">/ {total}</span>
          </div>
          <div className="flex items-center gap-3">
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
            <button
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => commonActions.handleExit('/')}
            >
              &times;
            </button>
          </div>
        </div>

        {/* 번호 스트립 */}
        <div className="border-y border-border px-6 py-2">
          <div className="flex flex-wrap gap-1">
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
                      ? 'bg-primary text-primary-foreground'
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
        </div>

        {/* 문제 + 선택지 */}
        <div className="flex-1 px-6 py-6">
          <BlurFade delay={0.05}>
            <p className="mb-6 whitespace-pre-wrap break-words text-lg font-semibold leading-relaxed">
              {quiz.currentQuiz.number}. {quiz.currentQuiz.title}
            </p>
          </BlurFade>

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
                    'flex items-center rounded-xl px-4 py-3 text-sm',
                    correct
                      ? 'bg-chart-2/8 ring-1 ring-chart-2/30'
                      : wrongSel
                        ? 'bg-destructive/5 ring-1 ring-destructive/30'
                        : 'bg-muted/30',
                  )}
                >
                  <span
                    className={cn(
                      'mr-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold',
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
                    <span className="ml-2 text-xs font-bold text-chart-2">{t('정답')}</span>
                  )}
                  {wrongSel && (
                    <span className="ml-2 text-xs font-bold text-destructive">{t('오답')}</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={quizActions.handlePrev}
              disabled={quiz.currentQuestion === 1}
            >
              &larr; {t('이전')}
            </Button>
            <Button size="sm" className="flex-1" onClick={() => commonActions.handleExit('/')}>
              {t('홈')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={quizActions.handleNext}
              disabled={quiz.currentQuestion === total}
            >
              {t('다음')} &rarr;
            </Button>
          </div>
        </div>
      </div>

      {/* ─── 우측: 해설 (독립 스크롤) ─── */}
      <div className="flex h-full w-1/2 flex-col overflow-y-auto max-lg:h-auto max-lg:w-full">
        <div className="flex-1 px-6 py-6">
          <BlurFade delay={0.1}>
            <div className="mb-4 flex items-center gap-2">
              <div className="h-5 w-1 rounded-full bg-primary" />
              <h3 className="text-base font-bold">{t('해설')}</h3>
            </div>
            <MarkdownText className="leading-relaxed text-foreground/80">
              {explanation.thisExplanationText}
            </MarkdownText>
          </BlurFade>

          {/* 참조 자료 */}
          {refPages && refPages.length > 0 && (
            <BlurFade delay={0.15}>
              <div className="mt-8 border-t border-border pt-6">
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
            </BlurFade>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizExplanationMagicK;
