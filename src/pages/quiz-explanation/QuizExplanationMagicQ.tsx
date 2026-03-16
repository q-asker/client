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

/**
 * Split Flow — 19번(Bottom Nav) 기반, 문제+선택지 좌측 / 해설+참조 우측 분리.
 * 프로그레스 바 + 하단 고정 dot 네비 유지, 좌우 독립 스크롤.
 */
const QuizExplanationMagicQ: React.FC = () => {
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
    <div className="flex h-screen flex-col bg-background max-lg:h-auto max-lg:min-h-screen">
      {/* ─── 프로그레스 바 — 상단 고정 ─── */}
      <div className="shrink-0">
        <div className="h-1.5 bg-muted">
          <div
            className="h-full rounded-r-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* ─── 상단 메타 바 ─── */}
      <div className="shrink-0 border-b border-border px-6 py-3 max-md:px-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-primary">{quiz.currentQuestion}</span>
            <span className="text-sm text-muted-foreground">/ {total}</span>
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
              className="text-sm text-muted-foreground hover:text-foreground"
              onClick={() => commonActions.handleExit('/')}
            >
              &times;
            </button>
          </div>
        </div>
      </div>

      {/* ─── 메인: 좌우 분할 ─── */}
      <div className="flex flex-1 overflow-hidden max-lg:flex-col max-lg:overflow-auto max-lg:pb-20">
        {/* ── 좌측: 문제 + 선택지 ── */}
        <div className="flex flex-1 flex-col overflow-y-auto border-r border-border max-lg:border-b max-lg:border-r-0">
          <div className="mx-auto w-full max-w-2xl flex-1 px-8 py-8 max-md:px-5 max-md:py-5">
            {/* 문제 — 카드 없이 직접 */}
            <BlurFade delay={0.05}>
              <p className="mb-8 whitespace-pre-wrap break-words text-xl font-bold leading-relaxed max-md:text-lg">
                {quiz.currentQuiz.title}
              </p>
            </BlurFade>

            {/* 선택지 — 밑줄 구분 스타일 (19번 동일) */}
            <div className="divide-y divide-border">
              {quiz.currentQuiz.selections.map((opt, idx) => {
                const correct = (opt as unknown as { correct: boolean }).correct;
                const wrongSel =
                  quiz.currentQuiz.userAnswer != null &&
                  Number(quiz.currentQuiz.userAnswer) === Number(opt.id) &&
                  !correct;
                return (
                  <BlurFade key={opt.id} delay={0.08 + idx * 0.03}>
                    <div
                      className={cn(
                        'flex items-center gap-3 py-4',
                        correct && '-mx-3 rounded-lg bg-chart-2/5 px-3',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                          correct
                            ? 'bg-chart-2 text-white'
                            : wrongSel
                              ? 'bg-destructive text-white'
                              : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {correct ? '✓' : wrongSel ? '✗' : idx + 1}
                      </span>
                      <span
                        className={cn(
                          'flex-1 whitespace-pre-wrap break-words leading-relaxed',
                          wrongSel && 'text-muted-foreground line-through',
                        )}
                      >
                        {opt.content}
                      </span>
                    </div>
                  </BlurFade>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── 우측: 해설 + 참조 ── */}
        <div className="flex flex-1 flex-col overflow-y-auto bg-muted/15">
          <div className="mx-auto w-full max-w-2xl flex-1 px-8 py-8 max-md:px-5 max-md:py-5">
            {/* 해설 */}
            <BlurFade delay={0.15}>
              <div className="mb-8 rounded-2xl bg-card p-6 shadow-sm max-md:p-4">
                <h3 className="mb-4 flex items-center gap-2 text-base font-bold">
                  <span className="inline-block h-5 w-1 rounded-full bg-primary" />
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
                <div className="rounded-2xl bg-card p-6 shadow-sm max-md:p-4">
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
                          'rounded-full px-3 py-1 text-sm font-medium transition-all',
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

      {/* ─── 하단 고정 네비게이션 (19번 동일 스타일) ─── */}
      <div className="shrink-0 border-t border-border bg-background/90 backdrop-blur-xl max-lg:fixed max-lg:bottom-0 max-lg:left-0 max-lg:right-0 max-lg:z-20">
        <div className="mx-auto flex max-w-4xl items-center gap-2 px-4 py-3">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={quizActions.handlePrev}
            disabled={quiz.currentQuestion === 1}
          >
            &larr;
          </Button>
          <div className="flex flex-[3] flex-wrap justify-center gap-1">
            {quiz.filteredQuizzes.map((q, i) => {
              const cur = quiz.showWrongOnly
                ? i + 1 === quiz.currentQuestion
                : q.number === quiz.currentQuestion;
              return (
                <button
                  key={q.number}
                  className={cn(
                    'h-2 w-2 rounded-full transition-all',
                    cur
                      ? 'scale-150 bg-primary'
                      : isQuizCorrect(q)
                        ? 'bg-chart-2/50'
                        : 'bg-destructive/40',
                  )}
                  onClick={() =>
                    quizActions.handleQuestionClick(quiz.showWrongOnly ? i + 1 : q.number)
                  }
                />
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={quizActions.handleNext}
            disabled={quiz.currentQuestion === total}
          >
            &rarr;
          </Button>
          <Button size="sm" onClick={() => commonActions.handleExit('/')}>
            {t('홈')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuizExplanationMagicQ;
