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
 * Layered Depth — 진짜 깊이감 있는 카드 레이어링.
 * 큰 그림자 + 단일 컬럼 + 문제번호 워터마크 + 정답/오답 좌측 보더 강조.
 * 12번(MagicF) 대비 개선: 깊이감, 정보 위계, 단일 컬럼으로 해설 접근성 향상.
 */
const QuizExplanationDesignG: React.FC = () => {
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
      <div className="flex min-h-screen items-center justify-center bg-muted/50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );

  return (
    <div className="relative min-h-screen bg-muted/50">
      {/* 배경 장식 — 미묘한 그래디언트 원 */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-48 -left-48 h-[500px] w-[500px] rounded-full bg-chart-2/5 blur-3xl" />
      </div>

      {/* 상단 sticky 번호 바 */}
      <nav className="sticky top-0 z-20 border-b border-border/50 bg-background/80 backdrop-blur-xl">
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
                    'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all duration-200',
                    cur
                      ? 'bg-primary text-primary-foreground shadow-[0_2px_8px] shadow-primary/40 scale-110'
                      : isQuizCorrect(q)
                        ? 'bg-chart-2/15 text-chart-2 hover:bg-chart-2/25'
                        : 'bg-destructive/12 text-destructive hover:bg-destructive/20',
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
          <label className="flex shrink-0 cursor-pointer items-center gap-1.5">
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
            className="shrink-0 text-xs text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => commonActions.handleExit('/')}
          >
            {t('닫기')} &times;
          </button>
        </div>
      </nav>

      {/* 단일 컬럼 메인 */}
      <main className="relative mx-auto max-w-3xl px-6 pb-16 pt-10 max-md:px-4 max-md:pt-6">
        {/* 문제 카드 — 가장 높은 레이어 */}
        <BlurFade delay={0.05}>
          <section className="relative mb-8 rounded-2xl bg-card p-8 shadow-[0_8px_30px_-4px] shadow-foreground/8 max-md:p-5">
            {/* 워터마크 번호 */}
            <span className="pointer-events-none absolute -left-2 -top-4 select-none text-[6rem] font-black leading-none text-primary/[0.06] max-md:text-[4rem]">
              {quiz.currentQuiz.number}
            </span>

            {/* 문제 제목 */}
            <div className="relative">
              <p className="whitespace-pre-wrap break-words text-lg font-semibold leading-relaxed tracking-tight max-md:text-base">
                {quiz.currentQuiz.number}. {quiz.currentQuiz.title}
              </p>
            </div>
          </section>
        </BlurFade>

        {/* 선택지 카드 — 문제 카드보다 살짝 낮은 레이어 (negative margin으로 겹침 효과) */}
        <BlurFade delay={0.1}>
          <section className="-mt-3 rounded-2xl bg-card p-6 shadow-[0_4px_20px_-2px] shadow-foreground/6 max-md:p-4">
            <div className="flex flex-col gap-2.5">
              {quiz.currentQuiz.selections.map((opt, idx) => {
                const correct = (opt as unknown as { correct: boolean }).correct;
                const wrongSel =
                  quiz.currentQuiz.userAnswer != null &&
                  Number(quiz.currentQuiz.userAnswer) === Number(opt.id) &&
                  !correct;
                return (
                  <BlurFade key={opt.id} delay={0.12 + idx * 0.04}>
                    <div
                      className={cn(
                        'flex items-center rounded-xl border-l-4 px-4 py-3.5 text-sm transition-all',
                        correct
                          ? 'border-l-chart-2 bg-chart-2/8'
                          : wrongSel
                            ? 'border-l-destructive bg-destructive/5'
                            : 'border-l-transparent bg-muted/30',
                      )}
                    >
                      <span
                        className={cn(
                          'mr-3.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
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
                        <span className="ml-3 shrink-0 rounded-full bg-chart-2/15 px-2.5 py-1 text-xs font-semibold text-chart-2">
                          {t('정답')}
                        </span>
                      )}
                      {wrongSel && (
                        <span className="ml-3 shrink-0 rounded-full bg-destructive/12 px-2.5 py-1 text-xs font-semibold text-destructive">
                          {t('오답')}
                        </span>
                      )}
                    </div>
                  </BlurFade>
                );
              })}
            </div>

            {/* 네비게이션 */}
            <div className="mt-5 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={quizActions.handlePrev}
                disabled={quiz.currentQuestion === 1}
              >
                &larr; {t('이전')}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={quizActions.handleNext}
                disabled={quiz.currentQuestion === total}
              >
                {t('다음')} &rarr;
              </Button>
            </div>
          </section>
        </BlurFade>

        {/* 해설 카드 — 더 낮은 레이어, 연결 느낌 */}
        <BlurFade delay={0.2}>
          <section className="-mt-2 rounded-2xl bg-card p-8 shadow-[0_2px_12px_-2px] shadow-foreground/4 max-md:p-5">
            {/* 연결 장식 — 상단 중앙의 작은 삼각형 */}
            <div className="mb-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                {t('해설')}
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <MarkdownText className="leading-relaxed text-foreground/80">
              {explanation.thisExplanationText}
            </MarkdownText>

            {/* 참조 자료 */}
            {refPages && refPages.length > 0 && (
              <div className="mt-8 rounded-xl bg-muted/30 p-5">
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
                        'rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
                        pdf.currentPdfPage === i
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-card text-muted-foreground hover:bg-accent',
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
            )}
          </section>
        </BlurFade>

        {/* 홈으로 */}
        <BlurFade delay={0.25}>
          <Button
            className="mt-6 w-full shadow-[0_4px_12px_-2px] shadow-primary/30"
            onClick={() => commonActions.handleExit('/')}
          >
            {t('홈으로')}
          </Button>
        </BlurFade>
      </main>
    </div>
  );
};

export default QuizExplanationDesignG;
