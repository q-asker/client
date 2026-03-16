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
 * Bold Contrast — 좌우 풀하이트 분할, 좌측 dark / 우측 light.
 * 12번(MagicF) 대비 개선: 대담한 색상 대비로 문제-해설 영역 확실히 분리,
 * 큰 타이포로 정보 위계 확립, 번호 바 sticky 처리.
 */
const QuizExplanationDesignH: React.FC = () => {
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
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-secondary-foreground/20 border-t-secondary-foreground" />
      </div>
    );

  return (
    <div className="flex min-h-screen max-lg:flex-col">
      {/* ─── 좌측: 어두운 영역 (문제 + 선택지) ─── */}
      <div className="flex flex-1 flex-col bg-secondary text-secondary-foreground max-lg:min-h-0">
        {/* 상단 바 */}
        <div className="flex items-center justify-between px-8 py-5 max-md:px-5">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black tabular-nums">{quiz.currentQuestion}</span>
            <span className="text-sm text-secondary-foreground/50">/ {total}</span>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex cursor-pointer items-center gap-2">
              <span className="text-xs text-secondary-foreground/60">{t('오답만')}</span>
              <div className="relative inline-block h-5 w-9">
                <input
                  type="checkbox"
                  checked={quiz.showWrongOnly}
                  onChange={quizActions.handleWrongOnlyToggle}
                  className="peer sr-only"
                />
                <span className="absolute inset-0 rounded-full bg-secondary-foreground/20 transition-colors peer-checked:bg-primary" />
                <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-secondary transition-transform peer-checked:translate-x-4" />
              </div>
            </label>
            <button
              className="text-xs text-secondary-foreground/50 transition-colors hover:text-secondary-foreground"
              onClick={() => commonActions.handleExit('/')}
            >
              &times; {t('닫기')}
            </button>
          </div>
        </div>

        {/* 번호 스트립 — sticky */}
        <div className="sticky top-0 z-10 border-b border-secondary-foreground/10 bg-secondary/95 px-8 py-3 backdrop-blur-sm max-md:px-5">
          <div className="flex flex-wrap gap-1.5">
            {quiz.filteredQuizzes.map((q, i) => {
              const cur = quiz.showWrongOnly
                ? i + 1 === quiz.currentQuestion
                : q.number === quiz.currentQuestion;
              return (
                <button
                  key={q.number}
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded text-xs font-medium transition-all',
                    cur
                      ? 'bg-primary-foreground text-secondary scale-110'
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
        </div>

        {/* 문제 영역 */}
        <div className="flex flex-1 flex-col px-8 py-8 max-md:px-5 max-md:py-5">
          <BlurFade delay={0.05}>
            {/* 문제 제목 — 큰 타이포 */}
            <p className="mb-8 whitespace-pre-wrap break-words text-xl font-bold leading-relaxed max-md:text-lg">
              {quiz.currentQuiz.title}
            </p>
          </BlurFade>

          {/* 선택지 */}
          <div className="flex flex-col gap-3">
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
                      'flex items-center rounded-xl px-5 py-4 text-sm transition-all',
                      correct
                        ? 'bg-chart-2/15 ring-2 ring-chart-2/40'
                        : wrongSel
                          ? 'bg-destructive/10 ring-2 ring-destructive/40'
                          : 'bg-secondary-foreground/5',
                    )}
                  >
                    <span
                      className={cn(
                        'mr-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                        correct
                          ? 'bg-chart-2/25 text-chart-2'
                          : wrongSel
                            ? 'bg-destructive/20 text-destructive'
                            : 'bg-secondary-foreground/10 text-secondary-foreground/60',
                      )}
                    >
                      {idx + 1}
                    </span>
                    <span className="flex-1 whitespace-pre-wrap break-words leading-relaxed">
                      {opt.content}
                    </span>
                    {correct && (
                      <span className="ml-3 shrink-0 text-xs font-bold uppercase tracking-wider text-chart-2">
                        {t('정답')}
                      </span>
                    )}
                    {wrongSel && (
                      <span className="ml-3 shrink-0 text-xs font-bold uppercase tracking-wider text-destructive">
                        {t('오답')}
                      </span>
                    )}
                  </div>
                </BlurFade>
              );
            })}
          </div>

          {/* 네비게이션 */}
          <div className="mt-8 flex gap-3">
            <button
              className="flex-1 rounded-xl border border-secondary-foreground/20 py-3 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary-foreground/5 disabled:opacity-30"
              onClick={quizActions.handlePrev}
              disabled={quiz.currentQuestion === 1}
            >
              &larr; {t('이전')}
            </button>
            <button
              className="flex-1 rounded-xl border border-secondary-foreground/20 py-3 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary-foreground/5 disabled:opacity-30"
              onClick={quizActions.handleNext}
              disabled={quiz.currentQuestion === total}
            >
              {t('다음')} &rarr;
            </button>
          </div>
          <button
            className="mt-3 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            onClick={() => commonActions.handleExit('/')}
          >
            {t('홈으로')}
          </button>
        </div>
      </div>

      {/* ─── 우측: 밝은 영역 (해설 + 참조) ─── */}
      <div className="flex flex-1 flex-col bg-background max-lg:min-h-0">
        <div className="flex flex-1 flex-col px-8 py-8 max-md:px-5 max-md:py-5">
          <BlurFade delay={0.15}>
            {/* 해설 헤더 */}
            <div className="mb-6 flex items-center gap-3">
              <div className="h-6 w-1.5 rounded-full bg-primary" />
              <h3 className="text-lg font-bold">{t('해설')}</h3>
            </div>

            {/* 해설 본문 */}
            <MarkdownText className="leading-relaxed text-foreground/80">
              {explanation.thisExplanationText}
            </MarkdownText>
          </BlurFade>

          {/* 참조 자료 */}
          <BlurFade delay={0.25}>
            <div className="mt-10 border-t border-border pt-8">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-muted-foreground">{t('참조 자료')}</h4>
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
              {refPages && refPages.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {refPages.map((page: number, i: number) => (
                    <button
                      key={i}
                      className={cn(
                        'rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
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
        </div>
      </div>
    </div>
  );
};

export default QuizExplanationDesignH;
