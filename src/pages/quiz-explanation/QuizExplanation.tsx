import { useTranslation } from 'i18nexus';
import React from 'react';
import { Document, Page } from 'react-pdf';
import type { DocumentProps } from 'react-pdf';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuizExplanation } from '#features/quiz-explanation';
import { usePdfData } from '#shared/lib/usePdfData';
import { Check, X as XIcon } from 'lucide-react';
import { cn } from '@/shared/ui/lib/utils';
import MarkdownText from '@/shared/ui/components/markdown-text';
import { Button } from '@/shared/ui/components/button';
import { Skeleton } from '@/shared/ui/components/skeleton';
import { BlurFade } from '@/shared/ui/components/blur-fade';
import type { Quiz } from '#features/quiz-generation';
import {
  gradeRealBlank,
  gradeRealBlankMulti,
  deserializeRealBlankTokens,
} from '#shared/lib/blank-scoring';

/**
 * Navigator Split — 좌측 문제 리스트 사이드바 + 3열 레이아웃.
 * [문제 리스트 | 문제+선택지 | 해설+참조]
 */
const QuizExplanation: React.FC = () => {
  const { t } = useTranslation('quiz-explanation');
  const { problemSetId } = useParams<{ problemSetId: string }>();
  const navigate = useNavigate();
  const { state, actions } = useQuizExplanation({
    t,
    navigate,
    problemSetId: problemSetId ?? '',
  });
  const { quiz, pdf, explanation, ui } = state;
  const pdfDataState = usePdfData(
    ui.uploadedUrl?.toLowerCase().endsWith('.pdf') ? ui.uploadedUrl : null,
  );
  const { quiz: quizActions, pdf: pdfActions, common: commonActions } = actions;
  const refPages = explanation.thisExplanationObj?.referencedPages;
  const total = quiz.showWrongOnly ? quiz.filteredTotalQuestions : quiz.totalQuestions;

  /** REAL_BLANK 정답 여부 (공백 제거 + 소문자 정규화 후 일치) */
  const isRealBlankCorrect = (q: Quiz): boolean => {
    const correctSel = q.selections.find((o) => (o as unknown as { correct: boolean }).correct);
    if (!correctSel) return false;
    const correctTokens = correctSel.content.split(',').map((s) => s.trim());
    const userRaw = q.userAnswer != null ? String(q.userAnswer) : '';
    if (correctTokens.length <= 1) {
      return gradeRealBlank(userRaw, correctSel.content);
    }
    return gradeRealBlankMulti(deserializeRealBlankTokens(userRaw), correctTokens);
  };

  const isQuizCorrect = (q: Quiz) => {
    if (q.type === 'REAL_BLANK') return isRealBlankCorrect(q);
    const c = q.selections.find((o) => (o as unknown as { correct: boolean }).correct);
    return q.userAnswer != null && c && Number(q.userAnswer) === Number(c.id);
  };

  const correctCount = quiz.filteredQuizzes.filter((q) => isQuizCorrect(q)).length;

  if (ui.isLoading)
    return (
      <div className="flex h-screen bg-background max-lg:h-auto max-lg:min-h-screen max-lg:flex-col">
        <aside className="flex w-80 shrink-0 flex-col border-r border-border bg-card p-5 max-lg:w-full max-lg:border-b max-lg:border-r-0">
          <Skeleton className="mb-2 h-6 w-16 rounded" />
          <Skeleton className="mb-4 h-4 w-24 rounded" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        </aside>
        <div className="flex-1 p-8">
          <Skeleton className="mb-4 h-6 w-48 rounded" />
          <Skeleton className="mb-2 h-4 w-full rounded" />
          <Skeleton className="mb-2 h-4 w-3/4 rounded" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
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
              className="h-full rounded-full bg-success transition-all duration-500"
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
                  cur
                    ? 'bg-primary/10 shadow-sm'
                    : correct
                      ? 'bg-success/5 hover:bg-success/10'
                      : 'hover:bg-muted/50',
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
                        ? 'bg-success/15 text-success'
                        : 'bg-destructive/12 text-destructive',
                  )}
                >
                  {q.number}
                </span>
                <span
                  className={cn(
                    'min-w-0 flex-1 truncate text-sm max-lg:hidden',
                    cur ? 'font-semibold text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {q.title}
                </span>
                {q.inReview && (
                  <span className="shrink-0 rounded-full bg-warning/15 px-1.5 py-0.5 text-[10px] font-medium text-warning max-lg:hidden">
                    {t('검토함')}
                  </span>
                )}
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

            {/* REAL_BLANK 사용자 답안 박스 (선택지 위에 표시) */}
            {quiz.currentQuiz.type === 'REAL_BLANK' &&
              (() => {
                const correct = isRealBlankCorrect(quiz.currentQuiz);
                const userRaw =
                  quiz.currentQuiz.userAnswer != null ? String(quiz.currentQuiz.userAnswer) : '';
                const correctSel = quiz.currentQuiz.selections.find(
                  (o) => (o as unknown as { correct: boolean }).correct,
                );
                const correctTokens = correctSel
                  ? correctSel.content.split(',').map((s) => s.trim())
                  : [];
                const userDisplay = userRaw
                  ? correctTokens.length > 1
                    ? deserializeRealBlankTokens(userRaw).join(', ')
                    : userRaw
                  : '';
                return (
                  <BlurFade delay={0.08}>
                    <div className="mb-4 flex flex-col gap-2">
                      <div
                        className={cn(
                          'rounded-lg border px-4 py-3',
                          correct
                            ? 'border-success/30 bg-success/5'
                            : 'border-destructive/30 bg-destructive/5',
                        )}
                      >
                        <div
                          className={cn(
                            'mb-1 text-xs font-semibold',
                            correct ? 'text-success' : 'text-destructive',
                          )}
                        >
                          {t('내 답안')}
                        </div>
                        <div
                          className={cn(
                            'text-base font-medium',
                            correct ? 'text-foreground' : 'text-destructive',
                          )}
                        >
                          {userDisplay || (
                            <span className="italic text-muted-foreground">{t('미답안')}</span>
                          )}
                        </div>
                      </div>
                      {!correct && correctSel && (
                        <div className="rounded-lg border border-success/30 bg-success/5 px-4 py-3">
                          <div className="mb-1 text-xs font-semibold text-success">{t('정답')}</div>
                          <div className="text-base font-medium text-foreground">
                            {correctSel.content}
                          </div>
                        </div>
                      )}
                    </div>
                  </BlurFade>
                );
              })()}

            {/* 선택지 — 밑줄 구분 스타일 (REAL_BLANK는 선택지 미렌더링) */}
            <div
              className={cn(
                'divide-y divide-border',
                quiz.currentQuiz.type === 'REAL_BLANK' && 'hidden',
              )}
            >
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
                        correct && '-mx-3 rounded-lg bg-success/5 px-3',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                          correct
                            ? 'bg-success text-white'
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
                      {!ui.uploadedUrl ? (
                        <p className="text-center text-muted-foreground">
                          {t('파일 링크가 만료되었습니다.')}
                        </p>
                      ) : ui.uploadedUrl.toLowerCase().endsWith('.pdf') ? (
                        pdfDataState.isLoading || !pdfDataState.data ? (
                          <p className="text-center">{t('PDF 로딩 중...')}</p>
                        ) : (
                          <button
                            type="button"
                            className="w-full cursor-pointer border-none bg-transparent p-0 transition-opacity hover:opacity-80"
                            onClick={() => {
                              const pageNum = refPages?.[pdf.currentPdfPage] || 1;
                              window.open(`${ui.uploadedUrl}#page=${pageNum}`, '_blank');
                            }}
                            title={t('원본 PDF 열기')}
                          >
                            <Document
                              file={pdfDataState.data}
                              loading={<p className="text-center">{t('PDF 로딩 중...')}</p>}
                              onLoadError={
                                ((err: Error) => (
                                  <p>{t('파일이 존재하지 않습니다.')}</p>
                                )) as DocumentProps['onLoadError']
                              }
                              options={pdf.pdfOptions}
                              className="pointer-events-none flex min-h-[400px] justify-center [&_.react-pdf\_\_Page]:h-auto [&_.react-pdf\_\_Page]:max-w-full [&_.react-pdf\_\_Page\_\_canvas]:!h-auto [&_.react-pdf\_\_Page\_\_canvas]:max-w-full"
                            >
                              <Page
                                pageNumber={refPages?.[pdf.currentPdfPage] || 1}
                                width={pdf.pdfWidth}
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                              />
                            </Document>
                          </button>
                        )
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

export default QuizExplanation;
