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

/** Clean Accordion — 문제+선택지+해설이 하나의 확장 가능한 단위로 */
const QuizExplanationMagicP: React.FC = () => {
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
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3 max-md:px-4">
          <span className="text-sm font-bold">{t('해설')}</span>
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
      </header>

      <main className="mx-auto max-w-3xl px-6 py-6 max-md:px-4">
        {/* 전체 문제 아코디언 리스트 */}
        <div className="flex flex-col gap-2">
          {quiz.filteredQuizzes.map((q, i) => {
            const qNum = quiz.showWrongOnly ? i + 1 : q.number;
            const isCurrent = qNum === quiz.currentQuestion;
            const correct = isQuizCorrect(q);

            return (
              <div
                key={q.number}
                className={cn(
                  'rounded-2xl border transition-all',
                  isCurrent ? 'border-primary/30 bg-card shadow-sm' : 'border-border bg-card/50',
                )}
              >
                {/* 아코디언 헤더 */}
                <button
                  className="flex w-full items-center gap-3 px-5 py-3.5 text-left"
                  onClick={() => quizActions.handleQuestionClick(qNum)}
                >
                  <span
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold',
                      isCurrent
                        ? 'bg-primary text-primary-foreground'
                        : correct
                          ? 'bg-chart-2/15 text-chart-2'
                          : 'bg-destructive/10 text-destructive',
                    )}
                  >
                    {q.number}
                  </span>
                  <span
                    className={cn(
                      'flex-1 truncate text-sm',
                      isCurrent ? 'font-semibold' : 'text-muted-foreground',
                    )}
                  >
                    {q.title}
                  </span>
                  <span className={cn('text-xs transition-transform', isCurrent && 'rotate-180')}>
                    ▾
                  </span>
                </button>

                {/* 아코디언 본문 — 현재 문제만 펼쳐짐 */}
                {isCurrent && (
                  <BlurFade delay={0.05}>
                    <div className="border-t border-border px-5 pb-5 pt-4">
                      {/* 선택지 */}
                      <div className="mb-5 flex flex-col gap-2">
                        {quiz.currentQuiz.selections.map((opt, idx) => {
                          const optCorrect = (opt as unknown as { correct: boolean }).correct;
                          const wrongSel =
                            quiz.currentQuiz.userAnswer != null &&
                            Number(quiz.currentQuiz.userAnswer) === Number(opt.id) &&
                            !optCorrect;
                          return (
                            <div
                              key={opt.id}
                              className={cn(
                                'flex items-center rounded-xl px-4 py-3 text-sm',
                                optCorrect
                                  ? 'bg-chart-2/8 ring-1 ring-chart-2/25'
                                  : wrongSel
                                    ? 'bg-destructive/5 ring-1 ring-destructive/25'
                                    : 'bg-muted/25',
                              )}
                            >
                              <span
                                className={cn(
                                  'mr-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold',
                                  optCorrect
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
                              {optCorrect && (
                                <span className="text-xs font-bold text-chart-2">{t('정답')}</span>
                              )}
                              {wrongSel && (
                                <span className="text-xs font-bold text-destructive">
                                  {t('오답')}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* 해설 */}
                      <div className="mb-5 rounded-xl bg-muted/20 p-5 max-md:p-4">
                        <h4 className="mb-2 text-sm font-bold">{t('해설')}</h4>
                        <MarkdownText className="text-sm leading-relaxed text-foreground/80">
                          {explanation.thisExplanationText}
                        </MarkdownText>
                      </div>

                      {/* 참조 */}
                      {refPages && refPages.length > 0 && (
                        <div className="mb-4">
                          <div className="mb-2 flex items-center justify-between">
                            <h4 className="text-xs font-semibold text-muted-foreground">
                              {t('참조 자료')}
                            </h4>
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
                          <div className="flex flex-wrap gap-1.5">
                            {refPages.map((page: number, idx: number) => (
                              <button
                                key={idx}
                                className={cn(
                                  'rounded-md px-2.5 py-1 text-xs font-medium',
                                  pdf.currentPdfPage === idx
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted hover:bg-accent',
                                )}
                                onClick={() => pdfActions.setCurrentPdfPage(idx)}
                              >
                                {t('페이지')} {page}
                              </button>
                            ))}
                          </div>
                          {pdf.showPdf && (
                            <div className="mt-3 w-full overflow-x-auto" ref={pdf.pdfContainerRef}>
                              <div className="mb-2 flex items-center justify-center gap-4">
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
                                <p className="text-center text-xs text-muted-foreground">
                                  {t('파일 링크가 만료되었습니다.')}
                                </p>
                              ) : uploadedUrl.toLowerCase().endsWith('.pdf') ? (
                                <Document
                                  file={uploadedUrl}
                                  loading={
                                    <p className="text-center text-xs">{t('PDF 로딩 중...')}</p>
                                  }
                                  onLoadError={
                                    ((err: Error) => (
                                      <p>{t('파일이 존재하지 않습니다.')}</p>
                                    )) as DocumentProps['onLoadError']
                                  }
                                  options={pdf.pdfOptions}
                                  className="flex min-h-[300px] justify-center [&_.react-pdf\_\_Page]:h-auto [&_.react-pdf\_\_Page]:max-w-full [&_.react-pdf\_\_Page\_\_canvas]:!h-auto [&_.react-pdf\_\_Page\_\_canvas]:max-w-full"
                                >
                                  <Page
                                    pageNumber={refPages?.[pdf.currentPdfPage] || 1}
                                    width={pdf.pdfWidth}
                                    renderTextLayer={false}
                                    renderAnnotationLayer={false}
                                  />
                                </Document>
                              ) : (
                                <p className="text-center text-xs text-muted-foreground">
                                  {t('현재는 pdf 파일만 지원합니다.')}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* 네비게이션 */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={quizActions.handlePrev}
                          disabled={quiz.currentQuestion === 1}
                        >
                          &larr; {t('이전')}
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => commonActions.handleExit('/')}
                        >
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
                  </BlurFade>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default QuizExplanationMagicP;
