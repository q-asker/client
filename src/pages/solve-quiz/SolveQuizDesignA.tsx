import { useTranslation } from 'i18nexus';

import React, { useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSolveQuiz } from '#features/solve-quiz';
import { isUnanswered } from '../../features/solve-quiz/lib/isUnanswered';
import { useQuizGenerationStore } from '#features/quiz-generation';
import { cn } from '@/shared/ui/lib/utils';
import MarkdownText from '@/shared/ui/components/markdown-text';

/** D안: Minimal Clean — 넉넉한 여백, 얇은 보더 카드, 부드러운 트랜지션 */
const SolveQuizDesignA: React.FC = () => {
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

  /** 문제 번호 pill 버튼 렌더링 */
  const renderQuestionButton = (
    q: (typeof quiz.quizzes)[number],
    keyPrefix = '',
  ): React.ReactElement => {
    const unanswered = isUnanswered(q.userAnswer, q.selections);
    return (
      <button
        key={`${keyPrefix}${q.number}`}
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background',
          'cursor-pointer text-xs font-medium text-muted-foreground transition-colors duration-200',
          'hover:border-primary hover:text-primary',
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

  /** 대기 중인 문제 번호 pill 렌더링 */
  const renderPendingButton = (index: number, keyPrefix = ''): React.ReactElement => (
    <button
      key={`${keyPrefix}pending-${index}`}
      className="flex h-7 w-7 animate-pulse items-center justify-center rounded-full border border-dashed border-border bg-muted text-xs text-muted-foreground"
      disabled
    >
      ...
    </button>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* 제출 다이얼로그 */}
      {quiz.showSubmitDialog && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-foreground/40"
          onClick={quizActions.handleOverlayClick}
        >
          <div
            className="w-[90%] max-w-[560px] animate-[slideIn_0.3s_ease-out] overflow-y-auto rounded-2xl border border-border bg-background shadow-card max-md:m-5 max-md:w-[95%]"
            style={{ maxHeight: '80vh' }}
          >
            {/* 다이얼로그 헤더 */}
            <div className="flex items-center justify-between px-8 py-6">
              <h2 className="m-0 text-lg font-semibold text-foreground">{t('제출 확인')}</h2>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full border-none bg-transparent text-xl text-muted-foreground transition-colors duration-200 hover:bg-muted"
                onClick={quizActions.handleCancelSubmit}
              >
                x
              </button>
            </div>

            {/* 다이얼로그 콘텐츠 */}
            <div className="px-8 pb-6">
              {/* 상단 통계 정보 */}
              <div className="mb-8 grid grid-cols-2 gap-3 max-md:grid-cols-1">
                <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                  <span className="text-sm text-muted-foreground">{t('전체 문제:')}</span>
                  <span className="text-sm font-semibold text-foreground">
                    {quiz.quizzes.length}
                    {t('개')}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                  <span className="text-sm text-muted-foreground">{t('답변한 문제:')}</span>
                  <span className="text-sm font-semibold text-success">
                    {quiz.answeredCount}
                    {t('개')}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                  <span className="text-sm text-muted-foreground">{t('안푼 문제:')}</span>
                  <span className="text-sm font-semibold text-destructive">
                    {quiz.unansweredCount}
                    {t('개')}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                  <span className="text-sm text-muted-foreground">{t('검토할 문제:')}</span>
                  <span className="text-sm font-semibold text-warning">
                    {quiz.reviewCount}
                    {t('개')}
                  </span>
                </div>
              </div>

              {/* 하단 문제별 선택 답안 */}
              <div>
                <h3 className="mb-4 text-base font-semibold text-foreground">{t('선택한 답안')}</h3>
                <div className="max-h-[300px] overflow-y-auto rounded-xl border border-border">
                  {quiz.quizzes.map((quizItem) => {
                    const unanswered = isUnanswered(quizItem.userAnswer, quizItem.selections);
                    const selectedAnswer = unanswered
                      ? t('미선택')
                      : quizItem.selections?.find((sel) => sel.id === quizItem.userAnswer)
                          ?.content || `${quizItem.userAnswer}번`;

                    return (
                      <div
                        key={quizItem.number}
                        className="flex items-center border-b border-border px-4 py-3 last:border-b-0"
                      >
                        <span className="min-w-[48px] text-sm font-medium text-muted-foreground">
                          {quizItem.number}
                          {t('번:')}
                        </span>
                        <span
                          className={cn(
                            'ml-3 flex items-center gap-2 break-words text-sm',
                            unanswered && 'italic text-destructive',
                            quizItem.check && 'text-warning',
                          )}
                        >
                          <MarkdownText>{selectedAnswer}</MarkdownText>
                          {quizItem.check && (
                            <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
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
            <div className="flex justify-end gap-3 border-t border-border px-8 py-5 max-md:flex-col">
              <button
                className="cursor-pointer rounded-xl border border-border bg-background px-6 py-2.5 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted max-md:w-full"
                onClick={quizActions.handleCancelSubmit}
              >
                {t('취소')}
              </button>
              <button
                className="cursor-pointer rounded-xl border-none bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors duration-200 hover:opacity-90 max-md:w-full"
                onClick={quizActions.handleConfirmSubmit}
              >
                {t('제출하기')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 상단 네비게이션 바 */}
      <header className="flex items-center justify-between bg-primary px-6 py-4 text-primary-foreground">
        <button
          className="cursor-pointer border-none bg-transparent text-lg text-primary-foreground transition-colors duration-200 hover:text-primary-foreground/80"
          onClick={() => navigate('/')}
        >
          x
        </button>
        <div className="font-mono text-sm text-primary-foreground">{quiz.currentTime}</div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="mx-auto flex w-full max-w-[800px] flex-col px-8 py-8 max-md:px-5 max-md:py-6">
        {/* 중앙 패널 */}
        <section className="flex flex-col gap-6">
          {/* 질문 네비게이션 */}
          <nav className="flex items-center justify-between">
            <button
              className="cursor-pointer rounded-xl border border-border bg-background px-5 py-2 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-muted max-md:flex-1 max-md:text-sm"
              onClick={quizActions.handlePrev}
            >
              {t('이전')}
            </button>
            <span className="text-sm text-muted-foreground max-md:text-center max-md:text-sm">
              {quiz.currentQuestion} / {quiz.totalQuestions}
            </span>
            <button
              className="cursor-pointer rounded-xl border border-border bg-background px-5 py-2 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-muted max-md:flex-1 max-md:text-sm"
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
              <div className="relative flex">
                {/* 좌측 문제 번호 패널 (데스크톱) — pill 형태 */}
                <aside className="absolute flex -translate-x-[120%] flex-wrap gap-1.5 rounded-xl border border-border bg-background p-3 max-[1500px]:hidden">
                  {quiz.quizzes.map((q) => renderQuestionButton(q))}
                  {Array.from({ length: remainingCount }).map((_, index) =>
                    renderPendingButton(index),
                  )}
                </aside>

                {/* 질문 + 검토 영역 */}
                <div className="flex w-full items-center rounded-xl border border-border bg-background p-6 max-md:flex-col max-md:items-start max-md:gap-4 max-md:p-5">
                  <div className="flex-1 pr-4 max-md:w-full max-md:pr-0">
                    <div className="m-0 break-words text-base leading-relaxed text-foreground">
                      <MarkdownText>{quiz.currentQuiz.title}</MarkdownText>
                    </div>
                  </div>
                  <div className="border-l border-border pl-4 max-md:self-end max-md:border-l-0 max-md:pl-0">
                    <label className="flex cursor-pointer select-none items-center whitespace-nowrap text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-primary">
                      <input
                        type="checkbox"
                        checked={quiz.currentQuiz.check || false}
                        onChange={quizActions.handleCheckToggle}
                        className="mr-2 h-4 w-4 cursor-pointer accent-primary"
                      />{' '}
                      {t('검토')}
                    </label>
                  </div>
                </div>
              </div>

              {/* 선택지 리스트 — 넓은 간격, 큰 터치 타겟 */}
              <div className="flex flex-col gap-3">
                {quiz.currentQuiz.selections.map((opt, idx) => (
                  <div
                    key={opt.id}
                    className={cn(
                      'flex min-h-16 cursor-pointer items-center rounded-xl border border-border bg-background px-5 py-4 transition-colors duration-200',
                      'hover:border-primary/40 hover:bg-muted',
                      'max-md:min-h-14 max-md:px-4 max-md:py-3',
                      quiz.selectedOption === opt.id && 'border-primary bg-primary/5',
                    )}
                    onClick={() => quizActions.handleOptionSelect(opt.id)}
                  >
                    <span className="mr-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-sm font-medium text-muted-foreground max-md:mr-3 max-md:h-7 max-md:w-7 max-md:text-xs">
                      {idx + 1}
                    </span>
                    <span className="break-words text-base leading-[1.8] text-foreground max-md:text-sm max-md:leading-relaxed">
                      <MarkdownText>{opt.content}</MarkdownText>
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* 확인 버튼 */}
          <button
            className="mt-auto cursor-pointer rounded-xl border-none bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors duration-200 hover:opacity-90 max-md:mt-4 max-md:w-full"
            onClick={quizActions.handleSubmit}
          >
            {t('확인')}
          </button>

          {/* 제출하기 버튼 */}
          <button
            className="mt-6 w-[120px] cursor-pointer self-end rounded-xl border border-border bg-background py-2.5 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-muted max-md:mt-4 max-md:w-full max-md:self-stretch"
            onClick={quizActions.handleFinish}
          >
            {t('제출하기')}
          </button>
        </section>

        {/* 하단 문제 번호 패널 (모바일/태블릿) — pill 형태 */}
        <aside className="mt-6 hidden flex-wrap justify-center gap-1.5 rounded-xl border border-border bg-background p-4 max-[1500px]:flex">
          {quiz.quizzes.map((q) => renderQuestionButton(q, 'bottom-'))}
          {Array.from({ length: remainingCount }).map((_, index) =>
            renderPendingButton(index, 'bottom-'),
          )}
        </aside>
      </main>
    </div>
  );
};

export default SolveQuizDesignA;
