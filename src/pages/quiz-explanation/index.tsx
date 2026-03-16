import { useTranslation } from 'i18nexus';
import React, { Suspense } from 'react';
import { Document, Page } from 'react-pdf';
import type { DocumentProps } from 'react-pdf';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuizExplanation } from '#features/quiz-explanation';
import { Check, X as XIcon } from 'lucide-react';
import { cn } from '@/shared/ui/lib/utils';
import MarkdownText from '@/shared/ui/components/markdown-text';
import { Button } from '@/shared/ui/components/button';
import { BlurFade } from '@/shared/ui/components/blur-fade';
import type { Quiz } from '#features/quiz-generation';
import { MOCK_QUIZZES, MOCK_EXPLANATION, MOCK_UPLOADED_URL } from './mockExplanationData';

/** location.state 타입 */
interface LocationState {
  quizzes?: Quiz[];
  explanation?: {
    results?: Array<{ number: number; explanation: string; referencedPages?: number[] }>;
  };
  uploadedUrl?: string;
}

/**
 * Navigator Split — 좌측 문제 리스트 사이드바 + 3열 레이아웃.
 * [문제 리스트 | 문제+선택지 | 해설+참조]
 */
const QuizExplanation: React.FC = () => {
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

  const correctCount = quiz.filteredQuizzes.filter((q) => {
    const c = q.selections.find((o) => (o as unknown as { correct: boolean }).correct);
    return q.userAnswer != null && c && Number(q.userAnswer) === Number(c.id);
  }).length;

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
    <div className="flex h-screen bg-background max-lg:h-auto max-lg:min-h-screen max-lg:flex-col">
      {/* ═══ 좌측 사이드바: 문제 리스트 ═══ */}
      <aside className="flex w-80 shrink-0 flex-col border-r border-border bg-card max-lg:w-full max-lg:border-b max-lg:border-r-0">
        {/* 사이드바 헤더 */}
        <div className="shrink-0 border-b border-border p-5">
          <h1 className="mb-2 text-lg font-bold">{t('해설')}</h1>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {correctCount}/{quiz.filteredQuizzes.length} {t('정답')}
            </span>
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
          </div>
          {/* 프로그레스 바 */}
          <div className="h-2 w-full rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-chart-2 transition-all duration-500"
              style={{ width: `${(correctCount / quiz.filteredQuizzes.length) * 100}%` }}
            />
          </div>
        </div>

        {/* 문제 목록 — 스크롤 가능 */}
        <div className="flex-1 overflow-y-auto p-3 max-lg:flex max-lg:gap-2 max-lg:overflow-x-auto max-lg:overflow-y-visible">
          {quiz.filteredQuizzes.map((q, i) => {
            const cur = quiz.showWrongOnly
              ? i + 1 === quiz.currentQuestion
              : q.number === quiz.currentQuestion;
            const correct = isQuizCorrect(q);
            return (
              <button
                key={q.number}
                className={cn(
                  'mb-0.5 flex w-full items-center gap-3 rounded-xl px-4 py-2 text-left transition-all max-lg:mb-0 max-lg:w-auto max-lg:shrink-0 max-lg:px-3 max-lg:py-1.5',
                  cur ? 'bg-primary/10 shadow-sm' : 'hover:bg-muted/50',
                )}
                onClick={() =>
                  quizActions.handleQuestionClick(quiz.showWrongOnly ? i + 1 : q.number)
                }
              >
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                    cur
                      ? 'bg-primary text-primary-foreground'
                      : correct
                        ? 'bg-chart-2/15 text-chart-2'
                        : 'bg-destructive/12 text-destructive',
                  )}
                >
                  {q.number}
                </span>
                <span
                  className={cn(
                    'flex-1 truncate text-sm max-lg:hidden',
                    cur ? 'font-semibold text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {q.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* 사이드바 하단 */}
        <div className="shrink-0 border-t border-border p-3">
          <Button size="sm" className="w-full" onClick={() => commonActions.handleExit('/')}>
            {t('홈으로')}
          </Button>
        </div>
      </aside>

      {/* ═══ 메인: 좌우 분할 ═══ */}
      <div className="flex flex-1 overflow-hidden max-lg:flex-col max-lg:overflow-auto">
        {/* ── 중앙: 문제 + 선택지 ── */}
        <div className="flex flex-1 flex-col overflow-y-auto border-r border-border max-lg:border-b max-lg:border-r-0">
          <div className="flex-1 px-8 py-8 max-md:px-5 max-md:py-5">
            {/* 문제 */}
            <BlurFade delay={0.05}>
              <div className="mb-8 text-xl font-bold leading-relaxed max-md:text-lg">
                <MarkdownText>{quiz.currentQuiz.title}</MarkdownText>
              </div>
            </BlurFade>

            {/* 선택지 — 밑줄 구분 스타일 */}
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
                        {correct ? (
                          <Check className="size-4" strokeWidth={3} />
                        ) : wrongSel ? (
                          <XIcon className="size-4" strokeWidth={3} />
                        ) : (
                          idx + 1
                        )}
                      </span>
                      <span
                        className={cn(
                          'flex-1 leading-relaxed',
                          wrongSel && 'text-muted-foreground line-through',
                        )}
                      >
                        <MarkdownText>{opt.content}</MarkdownText>
                      </span>
                    </div>
                  </BlurFade>
                );
              })}
            </div>

            {/* 이전/다음 네비게이션 */}
            <div className="mt-8 flex gap-3">
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
          </div>
        </div>

        {/* ── 우측: 해설 + 참조 ── */}
        <div className="flex flex-1 flex-col overflow-y-auto bg-muted/15">
          <div className="flex-1 px-8 py-8 max-md:px-5 max-md:py-5">
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
                    <label className="relative inline-block h-5 w-9 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pdf.showPdf}
                        onChange={pdfActions.handlePdfToggle}
                        className="peer sr-only"
                      />
                      <span className="absolute inset-0 rounded-full bg-muted transition-colors peer-checked:bg-primary" />
                      <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-4" />
                    </label>
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
    </div>
  );
};

const QE_VARIANTS: Record<string, React.LazyExoticComponent<React.ComponentType>> = {};

const QuizExplanationWithVariant = () => {
  const [searchParams] = useSearchParams();
  const variant = searchParams.get('qe');
  const VariantComponent = variant ? QE_VARIANTS[variant] : null;

  if (VariantComponent) {
    return (
      <Suspense fallback={null}>
        <VariantComponent />
      </Suspense>
    );
  }
  return <QuizExplanation />;
};

export default QuizExplanationWithVariant;
