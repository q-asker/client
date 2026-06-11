import { useTranslation } from 'i18nexus';
import React from 'react';
import { Document, Page } from 'react-pdf';
import type { DocumentProps } from 'react-pdf';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuizExplanation } from '#features/quiz-explanation';
import { usePdfData } from '#shared/lib/usePdfData';
import { cn } from '@/shared/ui/lib/utils';
import MarkdownText from '@/shared/ui/components/markdown-text';
import { Button } from '@/shared/ui/components/button';
import { Skeleton } from '@/shared/ui/components/skeleton';
import { BlurFade } from '@/shared/ui/components/blur-fade';
import type { Quiz } from '#features/quiz-generation';

/** 점수 비율에 따른 색상 */
const getScoreColor = (ratio: number) => {
  if (ratio >= 0.8)
    return { text: 'text-green-600', bg: 'bg-green-500/10', border: 'border-green-500/20' };
  if (ratio > 0)
    return { text: 'text-yellow-600', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' };
  return { text: 'text-red-600', bg: 'bg-red-500/10', border: 'border-red-500/20' };
};

/**
 * ESSAY 전용 퀴즈 해설 페이지.
 * 3열 레이아웃: [문제 리스트 | 문제+답변 | 해설+AI 피드백+참조]
 */
const EssayQuizExplanation: React.FC = () => {
  const { t } = useTranslation('quiz-explanation');
  const { problemSetId } = useParams<{ problemSetId: string }>();
  const navigate = useNavigate();
  const { state, actions } = useQuizExplanation({
    t,
    navigate,
    problemSetId: problemSetId ?? '',
  });
  const { quiz, pdf, explanation, ui } = state;
  const { quiz: quizActions, pdf: pdfActions, common: commonActions } = actions;

  /** ESSAY 현재 문제의 채점 결과 */
  const currentGradeResult = quiz.currentQuiz?.gradeResult ?? null;
  /** 사용자 서술 답변 */
  const currentTextAnswer =
    (quiz.currentQuiz as Quiz & { textAnswer?: string })?.textAnswer ??
    quiz.currentQuiz?.userAnswer;
  /** 모범답안: selections[0].content */
  const modelAnswer = quiz.currentQuiz?.selections?.[0]?.content ?? null;
  const refPages = explanation.thisExplanationObj?.referencedPages;
  const total = quiz.showWrongOnly ? quiz.filteredTotalQuestions : quiz.totalQuestions;
  const pdfDataState = usePdfData(
    ui.uploadedUrl?.toLowerCase().endsWith('.pdf') ? ui.uploadedUrl : null,
  );

  /** 채점된 문제의 원점수 합산 */
  const { totalScore, maxScore } = quiz.filteredQuizzes.reduce(
    (acc, q) => {
      const gr = q.gradeResult;
      if (gr) {
        acc.totalScore += gr.totalScore;
        acc.maxScore += gr.maxScore;
      }
      return acc;
    },
    { totalScore: 0, maxScore: 0 },
  );

  /** 개별 퀴즈 정답 여부 판정 */
  const isQuizCorrect = (q: Quiz) => {
    const gr = q.gradeResult;
    if (!gr) return false;
    return gr.maxScore > 0 && gr.totalScore / gr.maxScore >= 0.8;
  };

  // 로딩 상태
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
              {totalScore}/{maxScore} {t('점')}
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
              style={{
                width: `${maxScore > 0 ? (totalScore / maxScore) * 100 : 0}%`,
              }}
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

            // ESSAY: 점수 비율로 색상 결정
            const essayGr = q.gradeResult ?? null;
            const essayRatio =
              essayGr && essayGr.maxScore > 0 ? essayGr.totalScore / essayGr.maxScore : 0;

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
                {/* 번호 원형 배지 */}
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                    cur
                      ? 'bg-primary text-primary-foreground'
                      : correct
                        ? 'bg-success/15 text-success'
                        : !essayGr
                          ? 'bg-muted text-muted-foreground'
                          : essayRatio > 0
                            ? 'bg-yellow-500/15 text-yellow-600'
                            : 'bg-destructive/12 text-destructive',
                  )}
                >
                  {q.number}
                </span>
                {/* 제목 (lg 이상에서만 표시) */}
                <span
                  className={cn(
                    'min-w-0 flex-1 truncate text-sm max-lg:hidden',
                    cur ? 'font-semibold text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {q.title}
                </span>
                {/* 점수 뱃지 (lg 이상에서만 표시) */}
                {essayGr && (
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium max-lg:hidden',
                      getScoreColor(essayRatio).bg,
                      getScoreColor(essayRatio).text,
                    )}
                  >
                    {essayGr.totalScore}/{essayGr.maxScore}
                  </span>
                )}
                {/* 검토 뱃지 (lg 이상에서만 표시) */}
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
        {/* ── 중앙: 문제 + 답변 ── */}
        <div className="flex flex-1 flex-col overflow-y-auto border-r border-border max-lg:border-b max-lg:border-r-0">
          <div className="flex-1 px-8 py-8 max-md:px-5 max-md:py-5">
            {/* 문제 제목 */}
            <BlurFade delay={0.05}>
              <div className="mb-8 text-xl font-bold leading-relaxed max-md:text-lg">
                <MarkdownText>{quiz.currentQuiz.title}</MarkdownText>
              </div>
            </BlurFade>

            {/* 내 답변 */}
            <div className="space-y-5">
              <BlurFade delay={0.08}>
                <div className="rounded-2xl border border-border bg-muted/30 p-5 max-md:p-4">
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
                    <span className="inline-block h-4 w-1 rounded-full bg-primary/60" />
                    {t('내 답변')}
                  </h4>
                  {currentTextAnswer &&
                  String(currentTextAnswer) !== '0' &&
                  String(currentTextAnswer).trim() ? (
                    <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
                      {String(currentTextAnswer)}
                    </div>
                  ) : (
                    <p className="text-sm italic text-muted-foreground">-</p>
                  )}
                </div>
              </BlurFade>

              {/* 모범답안 */}
              {modelAnswer && (
                <BlurFade delay={0.11}>
                  <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5 max-md:p-4">
                    <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-green-700 dark:text-green-400">
                      <span className="inline-block h-4 w-1 rounded-full bg-green-500" />
                      {t('모범답안')}
                    </h4>
                    <MarkdownText className="text-sm leading-relaxed text-foreground/80">
                      {modelAnswer}
                    </MarkdownText>
                  </div>
                </BlurFade>
              )}
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

        {/* ── 우측: 해설 + AI 피드백 + 참조 자료 ── */}
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

            {/* AI 채점 피드백 */}
            {currentGradeResult && (
              <BlurFade delay={0.18}>
                <div className="mb-8 rounded-2xl bg-card p-6 shadow-sm max-md:p-4">
                  <h3 className="mb-4 flex items-center gap-2 text-base font-bold">
                    <span className="inline-block h-5 w-1 rounded-full bg-blue-500" />
                    {t('AI 피드백')}
                    {/* 점수 뱃지 */}
                    <span
                      className={cn(
                        'ml-auto rounded-lg px-2.5 py-1 text-sm font-bold',
                        getScoreColor(
                          currentGradeResult.maxScore > 0
                            ? currentGradeResult.totalScore / currentGradeResult.maxScore
                            : 0,
                        ).bg,
                        getScoreColor(
                          currentGradeResult.maxScore > 0
                            ? currentGradeResult.totalScore / currentGradeResult.maxScore
                            : 0,
                        ).text,
                      )}
                    >
                      {currentGradeResult.totalScore}/{currentGradeResult.maxScore}
                      {t('점')}
                    </span>
                  </h3>

                  {/* 요소별 점수 */}
                  <div className="mb-5 space-y-2.5">
                    {currentGradeResult.elementScores.map((el, idx) => {
                      const elRatio = el.maxPoints > 0 ? el.earnedPoints / el.maxPoints : 0;
                      const colors = getScoreColor(elRatio);
                      return (
                        <div
                          key={idx}
                          className={cn('rounded-xl border p-3.5', colors.border, colors.bg)}
                        >
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-foreground">
                              {el.element}
                            </span>
                            <div className="flex shrink-0 items-center gap-2">
                              <span className={cn('text-xs font-bold', colors.text)}>
                                {el.level}
                              </span>
                              <span className="text-xs font-bold text-muted-foreground">
                                {el.earnedPoints}/{el.maxPoints}
                              </span>
                            </div>
                          </div>
                          <MarkdownText className="text-xs leading-relaxed text-foreground/70">
                            {el.feedback}
                          </MarkdownText>
                        </div>
                      );
                    })}
                  </div>

                  {/* 종합 피드백 */}
                  <div className="rounded-xl bg-muted/40 p-4">
                    <MarkdownText className="text-sm leading-relaxed text-foreground/80">
                      {currentGradeResult.overallFeedback}
                    </MarkdownText>
                  </div>
                </div>
              </BlurFade>
            )}

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

export default EssayQuizExplanation;
