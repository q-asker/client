import { useTranslation } from 'i18nexus';

import React, { useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSolveQuiz } from '#features/solve-quiz';
import { isUnanswered } from '../../features/solve-quiz/lib/isUnanswered';
import { useQuizGenerationStore } from '#features/quiz-generation';
import { cn } from '@/shared/ui/lib/utils';
import MarkdownText from '@/shared/ui/components/markdown-text';

/** V1: Floating Bottom Bar — 하단 고정 액션 바, 깃발 아이콘 검토 토글 */
const SolveQuizDesignB_v1: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { problemSetId } = useParams<{ problemSetId: string }>();
  const { uploadedUrl } = (location.state as { uploadedUrl?: string }) || {};
  const storeProblemSetId = useQuizGenerationStore((state) => state.problemSetId);
  const streamQuizzes = useQuizGenerationStore((state) => state.quizzes);
  const streamIsStreaming = useQuizGenerationStore((state) => state.isStreaming);
  const streamTotalCount = useQuizGenerationStore((state) => state.totalCount);
  const resetQuizGeneration = useQuizGenerationStore((state) => state.resetStreamingState);

  const isSameProblemSet = String(storeProblemSetId ?? '') === String(problemSetId ?? '');
  const quizzes = isSameProblemSet ? streamQuizzes : [];
  const isStreaming = isSameProblemSet ? streamIsStreaming : false;
  const totalCount = isSameProblemSet ? streamTotalCount : 0;

  const { state, actions } = useSolveQuiz({
    t,
    navigate,
    problemSetId,
    uploadedUrl,
    quizzes,
    isStreaming,
  });
  const { quiz } = state;
  const { quiz: quizActions } = actions;

  const remainingCount =
    isStreaming && totalCount > 0 ? Math.max(0, totalCount - quiz.totalQuestions) : 0;

  useEffect(() => {
    return () => {
      resetQuizGeneration();
    };
  }, [resetQuizGeneration]);

  /** 문제 번호 버튼 렌더링 */
  const renderQuestionButton = (
    q: (typeof quiz.quizzes)[number],
    keyPrefix = '',
  ): React.ReactElement => {
    const unanswered = isUnanswered(q.userAnswer, q.selections);
    return (
      <button
        key={`${keyPrefix}${q.number}`}
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background',
          'cursor-pointer text-sm font-medium text-muted-foreground transition-colors duration-200',
          'hover:border-primary hover:bg-primary/5',
          !unanswered && 'border-primary/40 bg-primary/10 text-primary',
          q.check && 'border-warning bg-warning/10 text-warning',
          q.number === quiz.currentQuestion &&
            'border-primary bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
        )}
        onClick={() => quizActions.handleJumpTo(q.number)}
      >
        {q.number}
      </button>
    );
  };

  /** 대기 중인 문제 번호 버튼 렌더링 */
  const renderPendingButton = (index: number, keyPrefix = ''): React.ReactElement => (
    <button
      key={`${keyPrefix}pending-${index}`}
      className="flex h-9 w-9 animate-pulse items-center justify-center rounded-lg border border-dashed border-border bg-muted text-sm text-muted-foreground"
      disabled
    >
      ...
    </button>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      {/* 제출 다이얼로그 */}
      {quiz.showSubmitDialog && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-foreground/50"
          onClick={quizActions.handleOverlayClick}
        >
          <div
            className="w-[90%] max-w-[600px] animate-[slideIn_0.3s_ease-out] overflow-y-auto rounded-2xl bg-card shadow-card max-md:m-5 max-md:w-[95%]"
            style={{ maxHeight: '80vh' }}
          >
            {/* 다이얼로그 헤더 */}
            <div className="flex items-center justify-between border-b border-border px-6 py-5">
              <h2 className="m-0 text-xl font-semibold text-foreground">{t('제출 확인')}</h2>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-lg border-none bg-transparent text-2xl text-muted-foreground transition-colors duration-200 hover:bg-muted"
                onClick={quizActions.handleCancelSubmit}
              >
                x
              </button>
            </div>

            {/* 다이얼로그 콘텐츠 */}
            <div className="p-6">
              {/* 상단 통계 정보 */}
              <div className="mb-8 grid grid-cols-2 gap-4 rounded-2xl bg-muted p-5 max-md:grid-cols-1 max-md:gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-muted-foreground">{t('전체 문제:')}</span>
                  <span className="rounded-lg px-2 py-1 text-sm font-semibold">
                    {quiz.quizzes.length}
                    {t('개')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-muted-foreground">{t('답변한 문제:')}</span>
                  <span className="rounded-lg bg-primary/8 px-2 py-1 text-sm font-semibold text-primary/70">
                    {quiz.answeredCount}
                    {t('개')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-muted-foreground">{t('안푼 문제:')}</span>
                  <span className="rounded-lg bg-destructive/10 px-2 py-1 text-sm font-semibold text-destructive/80">
                    {quiz.unansweredCount}
                    {t('개')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-muted-foreground">{t('검토할 문제:')}</span>
                  <span className="rounded-lg bg-warning/10 px-2 py-1 text-sm font-semibold text-warning/80">
                    {quiz.reviewCount}
                    {t('개')}
                  </span>
                </div>
              </div>

              {/* 하단 문제별 선택 답안 */}
              <div>
                <h3 className="mb-4 text-lg font-semibold text-foreground">{t('선택한 답안')}</h3>
                <div className="max-h-[300px] overflow-y-auto rounded-2xl border border-border p-3">
                  {quiz.quizzes.map((quizItem) => {
                    const unanswered = isUnanswered(quizItem.userAnswer, quizItem.selections);
                    const selectedAnswer = unanswered
                      ? t('미선택')
                      : quizItem.selections?.find((sel) => sel.id === quizItem.userAnswer)
                          ?.content || `${quizItem.userAnswer}번`;

                    return (
                      <div
                        key={quizItem.number}
                        className="flex items-center border-b border-border py-2 last:border-b-0"
                      >
                        <span className="min-w-[50px] font-semibold text-muted-foreground">
                          {quizItem.number}
                          {t('번:')}
                        </span>
                        <span
                          className={cn(
                            'ml-3 flex items-center gap-2 break-words',
                            unanswered && 'italic text-destructive',
                            quizItem.check && 'text-warning',
                          )}
                        >
                          <MarkdownText>{selectedAnswer}</MarkdownText>
                          {quizItem.check && (
                            <span className="rounded-full bg-warning px-1.5 py-0.5 text-xs font-medium text-warning-foreground">
                              {t('검토')}
                            </span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 다이얼로그 버튼 */}
            <div className="flex justify-end gap-3 border-t border-border px-6 py-5 max-md:flex-col">
              <button
                className="cursor-pointer rounded-xl border-none bg-muted px-6 py-2.5 font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted max-md:w-full"
                onClick={quizActions.handleCancelSubmit}
              >
                {t('취소')}
              </button>
              <button
                className="cursor-pointer rounded-xl border-none bg-primary px-6 py-2.5 font-medium text-primary-foreground transition-colors duration-200 hover:opacity-90 max-md:w-full"
                onClick={quizActions.handleConfirmSubmit}
              >
                {t('제출하기')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 상단 네비게이션 바 */}
      <header className="flex items-center justify-between bg-primary px-6 py-4 text-primary-foreground shadow-card">
        <button
          className="cursor-pointer border-none bg-transparent text-xl text-inherit"
          onClick={() => navigate('/')}
        >
          x
        </button>
        <div className="font-mono text-sm">{quiz.currentTime}</div>
      </header>

      {/* 메인 콘텐츠 — lg 이상 2컬럼 */}
      <main className="mx-auto flex w-[95%] max-w-[1200px] flex-col py-6 lg:grid lg:grid-cols-12 lg:gap-6">
        {/* 좌측 패널: 문제 + 선택지 (col-span-8) */}
        <section className="flex flex-col gap-4 lg:col-span-8">
          {/* 질문 네비게이션 */}
          <nav className="flex items-center justify-between max-md:gap-2">
            <button
              className="cursor-pointer rounded-xl border-none bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors duration-200 hover:opacity-90 max-md:flex-1 max-md:text-sm"
              onClick={quizActions.handlePrev}
            >
              {t('이전')}
            </button>
            <span className="text-sm text-muted-foreground max-md:flex-1 max-md:text-center max-md:text-sm">
              {quiz.currentQuestion} / {quiz.totalQuestions}
            </span>
            <button
              className="cursor-pointer rounded-xl border-none bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors duration-200 hover:opacity-90 max-md:flex-1 max-md:text-sm"
              onClick={quizActions.handleNext}
            >
              {t('다음')}
            </button>
          </nav>

          {/* 문제 영역 */}
          {quiz.isLoading ? (
            <div className="flex h-screen flex-col items-center justify-center">
              <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
              <p className="text-sm text-muted-foreground">{t('문제 로딩 중…')}</p>
            </div>
          ) : (
            <>
              {/* 질문 + 검토 영역 — V1: 깃발 아이콘 토글 */}
              <div className="flex w-full items-center rounded-2xl bg-card p-5 shadow-card max-md:flex-col max-md:items-start max-md:gap-3">
                <div className="flex-1 pr-4 max-md:w-full max-md:pr-0">
                  <div className="m-0 break-words text-base leading-relaxed text-foreground">
                    <MarkdownText>{quiz.currentQuiz.title}</MarkdownText>
                  </div>
                </div>
                {/* 깃발 아이콘 토글 버튼 */}
                <div className="border-l border-border pl-4 max-md:self-end max-md:border-l-0 max-md:pl-0">
                  <button
                    onClick={quizActions.handleCheckToggle}
                    className={cn(
                      'flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border-none transition-all duration-200',
                      quiz.currentQuiz.check
                        ? 'bg-warning/15 text-warning'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground',
                    )}
                    title={t('검토')}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill={quiz.currentQuiz.check ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                      <line x1="4" x2="4" y1="22" y2="15" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* 선택지 리스트 */}
              <div className="flex flex-col gap-3 max-md:mt-2 max-md:gap-2">
                {quiz.currentQuiz.selections.map((opt, idx) => (
                  <div
                    key={opt.id}
                    className={cn(
                      'flex min-h-14 cursor-pointer items-center rounded-2xl bg-card px-4 py-5 shadow-card transition-colors duration-200',
                      'hover:bg-muted',
                      'max-md:min-h-12 max-md:px-3 max-md:py-4',
                      quiz.selectedOption === opt.id && 'ring-2 ring-primary ring-offset-1',
                    )}
                    onClick={() => quizActions.handleOptionSelect(opt.id)}
                  >
                    <span className="mr-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium max-md:mr-3 max-md:h-6 max-md:w-6 max-md:text-xs">
                      {idx + 1}
                    </span>
                    <span className="break-words pr-3 text-base leading-[1.8] text-foreground max-md:pr-2 max-md:text-sm max-md:leading-relaxed">
                      <MarkdownText>{opt.content}</MarkdownText>
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {/* 우측 패널: 네비게이션 + 실시간 통계 (col-span-4) — lg 이상에서만 표시 */}
        <aside className="hidden lg:col-span-4 lg:flex lg:flex-col lg:gap-5">
          {/* 실시간 통계 카드 */}
          <div className="rounded-2xl bg-card p-5 shadow-card">
            <h3 className="mb-4 border-b border-border pb-3 text-sm font-semibold text-foreground">
              {t('진행 현황')}
            </h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('전체 문제:')}</span>
                <span className="rounded-lg bg-muted px-3 py-1 text-sm font-bold text-foreground">
                  {quiz.totalQuestions}
                  {t('개')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('답변한 문제:')}</span>
                <span className="rounded-lg bg-primary/8 px-3 py-1 text-sm font-bold text-primary/70">
                  {quiz.answeredCount}
                  {t('개')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('안푼 문제:')}</span>
                <span className="rounded-lg bg-destructive/10 px-3 py-1 text-sm font-bold text-destructive/80">
                  {quiz.unansweredCount}
                  {t('개')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('검토할 문제:')}</span>
                <span className="rounded-lg bg-warning/10 px-3 py-1 text-sm font-bold text-warning/80">
                  {quiz.reviewCount}
                  {t('개')}
                </span>
              </div>
            </div>
            {/* 진행률 바 */}
            <div className="mt-4 pt-3">
              <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                <span>{t('진행률')}</span>
                <span className="font-semibold text-foreground">
                  {quiz.totalQuestions > 0
                    ? Math.round((quiz.answeredCount / quiz.totalQuestions) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{
                    width: `${quiz.totalQuestions > 0 ? (quiz.answeredCount / quiz.totalQuestions) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            {/* 제출하기 버튼 (데스크톱) */}
            <button
              className="mt-4 w-full cursor-pointer rounded-xl border-none bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors duration-200 hover:opacity-90"
              onClick={quizActions.handleFinish}
            >
              {t('제출하기')}
            </button>
          </div>

          {/* 문제 번호 네비게이션 카드 */}
          <div className="sticky top-6 rounded-2xl bg-card p-5 shadow-card">
            <h3 className="mb-4 border-b border-border pb-3 text-sm font-semibold text-foreground">
              {t('문제 목록')}
            </h3>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(2.25rem,1fr))] gap-2">
              {quiz.quizzes.map((q) => renderQuestionButton(q, 'sidebar-'))}
              {Array.from({ length: remainingCount }).map((_, index) =>
                renderPendingButton(index, 'sidebar-'),
              )}
            </div>
          </div>
        </aside>

        {/* 하단 문제 번호 패널 (모바일/태블릿) — lg 미만에서만 표시 */}
        <aside className="mt-4 grid grid-cols-[repeat(auto-fill,2.25rem)] justify-center gap-2 rounded-2xl bg-card p-4 shadow-card lg:hidden">
          {quiz.quizzes.map((q) => renderQuestionButton(q, 'bottom-'))}
          {Array.from({ length: remainingCount }).map((_, index) =>
            renderPendingButton(index, 'bottom-'),
          )}
        </aside>
      </main>

      {/* V1: 하단 고정 Floating Bottom Bar */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1200px] items-center gap-3 px-6 py-3">
          <button
            className="flex-1 cursor-pointer rounded-xl border-none bg-primary py-3 text-base font-medium text-primary-foreground transition-colors duration-200 hover:opacity-90"
            onClick={quizActions.handleSubmit}
          >
            {t('확인')}
          </button>
          {/* 제출하기 버튼 (모바일) */}
          <button
            className="w-auto cursor-pointer rounded-xl border-none bg-primary/90 px-6 py-3 text-sm font-medium text-primary-foreground transition-colors duration-200 hover:bg-primary lg:hidden"
            onClick={quizActions.handleFinish}
          >
            {t('제출하기')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SolveQuizDesignB_v1;
