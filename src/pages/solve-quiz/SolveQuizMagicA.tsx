import { useTranslation } from 'i18nexus';

import React, { useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSolveQuiz } from '#features/solve-quiz';
import { isUnanswered } from '../../features/solve-quiz/lib/isUnanswered';
import { useQuizGenerationStore } from '#features/quiz-generation';
import { cn } from '@/shared/ui/lib/utils';
import { BlurFade } from '@/shared/ui/components/blur-fade';
import MarkdownText from '@/shared/ui/components/markdown-text';

/** B안: Card Transition + Progress — 카드 기반 레이아웃, 프로그레스 바, BlurFade 전환 */
const SolveQuizMagicA: React.FC = () => {
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

  /** 진행률 계산 */
  const progressPercent =
    quiz.totalQuestions > 0 ? (quiz.answeredCount / quiz.totalQuestions) * 100 : 0;

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
          'flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card',
          'cursor-pointer transition-all duration-200',
          'hover:scale-110 hover:bg-accent',
          !unanswered && 'bg-accent',
          q.check && 'bg-warning/25',
          q.number === quiz.currentQuestion &&
            'bg-primary font-bold text-primary-foreground hover:scale-100 hover:bg-primary',
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
      className="flex h-8 w-8 animate-pulse items-center justify-center rounded-lg border border-dashed border-border bg-primary/10 text-primary"
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
                className="flex h-8 w-8 items-center justify-center rounded-md border-none bg-transparent text-2xl text-muted-foreground hover:bg-muted"
                onClick={quizActions.handleCancelSubmit}
              >
                x
              </button>
            </div>

            {/* 다이얼로그 콘텐츠 */}
            <div className="p-6">
              {/* 상단 통계 정보 */}
              <div className="mb-8 grid grid-cols-2 gap-4 rounded-xl bg-muted p-5 max-md:grid-cols-1 max-md:gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-muted-foreground">{t('전체 문제:')}</span>
                  <span className="rounded px-2 py-1 text-sm font-semibold">
                    {quiz.quizzes.length}
                    {t('개')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-muted-foreground">{t('답변한 문제:')}</span>
                  <span className="rounded bg-success/15 px-2 py-1 text-sm font-semibold text-success">
                    {quiz.answeredCount}
                    {t('개')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-muted-foreground">{t('안푼 문제:')}</span>
                  <span className="rounded bg-destructive/15 px-2 py-1 text-sm font-semibold text-destructive">
                    {quiz.unansweredCount}
                    {t('개')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-muted-foreground">{t('검토할 문제:')}</span>
                  <span className="rounded bg-warning/15 px-2 py-1 text-sm font-semibold text-warning">
                    {quiz.reviewCount}
                    {t('개')}
                  </span>
                </div>
              </div>

              {/* 하단 문제별 선택 답안 */}
              <div>
                <h3 className="mb-4 text-lg font-semibold text-foreground">{t('선택한 답안')}</h3>
                <div className="max-h-[300px] overflow-y-auto rounded-xl border border-border p-3">
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
                            <span className="rounded bg-warning px-1.5 py-0.5 text-xs font-medium text-warning-foreground">
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
                className="cursor-pointer rounded-lg border-none bg-muted px-6 py-2.5 font-medium text-muted-foreground transition-all duration-200 hover:bg-accent max-md:w-full"
                onClick={quizActions.handleCancelSubmit}
              >
                {t('취소')}
              </button>
              <button
                className="cursor-pointer rounded-lg border-none bg-primary px-6 py-2.5 font-medium text-primary-foreground transition-all duration-200 hover:bg-primary/90 max-md:w-full"
                onClick={quizActions.handleConfirmSubmit}
              >
                {t('제출하기')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 상단 네비게이션 바 */}
      <header className="flex items-center justify-between bg-primary p-4 text-primary-foreground">
        <button
          className="cursor-pointer border-none bg-transparent text-xl text-inherit"
          onClick={() => navigate('/')}
        >
          x
        </button>
        <div className="font-mono">{quiz.currentTime}</div>
      </header>

      {/* 프로그레스 바 */}
      <div className="h-1 w-full bg-muted">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* 메인 콘텐츠 */}
      <main className="mx-auto flex w-[90%] max-w-[900px] flex-col pb-6 pt-6">
        {/* 중앙 패널 */}
        <section className="flex max-w-[900px] flex-col gap-4">
          {/* 질문 네비게이션 */}
          <nav className="flex items-center justify-between max-md:mb-4 max-md:gap-2">
            <button
              className="cursor-pointer rounded-lg border-none bg-primary px-4 py-2 text-primary-foreground transition-all duration-200 hover:bg-primary/90 max-md:flex-1 max-md:text-sm"
              onClick={quizActions.handlePrev}
            >
              {t('이전')}
            </button>
            <span className="text-sm font-medium text-muted-foreground max-md:flex-1 max-md:text-center max-md:text-sm">
              {quiz.currentQuestion} / {quiz.totalQuestions}
              {quiz.totalQuestions > 0 && (
                <span className="ml-2 text-xs text-primary">
                  ({quiz.answeredCount}/{quiz.totalQuestions} {t('완료')})
                </span>
              )}
            </span>
            <button
              className="cursor-pointer rounded-lg border-none bg-primary px-4 py-2 text-primary-foreground transition-all duration-200 hover:bg-primary/90 max-md:flex-1 max-md:text-sm"
              onClick={quizActions.handleNext}
            >
              {t('다음')}
            </button>
          </nav>

          {/* 문제 영역 */}
          {quiz.isLoading ? (
            <div className="flex h-screen flex-col items-center justify-center">
              <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
              <p>{t('문제 로딩 중…')}</p>
            </div>
          ) : (
            <>
              <div className="relative flex">
                {/* 좌측 문제 번호 패널 (데스크톱) */}
                <aside className="absolute grid -translate-x-[120%] grid-cols-[repeat(5,minmax(2rem,1fr))] gap-2 rounded-2xl bg-card p-4 shadow-card max-[1500px]:hidden">
                  {quiz.quizzes.map((q) => renderQuestionButton(q))}
                  {Array.from({ length: remainingCount }).map((_, index) =>
                    renderPendingButton(index),
                  )}
                </aside>

                {/* 카드 기반 문제 영역 — BlurFade 전환 */}
                <BlurFade key={quiz.currentQuestion} delay={0.05} inView>
                  <div className="flex w-full flex-col rounded-2xl bg-card shadow-card">
                    {/* 질문 + 검토 영역 */}
                    <div className="flex items-center rounded-t-2xl bg-muted p-5 max-md:flex-col max-md:items-start max-md:gap-3">
                      <div className="flex-1 pr-3 max-md:w-full max-md:pr-0">
                        <div className="m-0 break-words text-base leading-relaxed">
                          <MarkdownText>{quiz.currentQuiz.title}</MarkdownText>
                        </div>
                      </div>
                      <div className="border-l border-border pl-3 max-md:self-end max-md:border-l-0 max-md:pl-0">
                        <label className="flex cursor-pointer select-none items-center whitespace-nowrap text-base font-bold text-muted-foreground transition-colors duration-200 hover:text-primary">
                          <input
                            type="checkbox"
                            checked={quiz.currentQuiz.check || false}
                            onChange={quizActions.handleCheckToggle}
                            className="mr-2 h-5 w-5 cursor-pointer accent-primary"
                          />{' '}
                          {t('검토')}
                        </label>
                      </div>
                    </div>

                    {/* 선택지 리스트 */}
                    <div className="flex flex-col gap-3 p-5 max-md:gap-2">
                      {quiz.currentQuiz.selections.map((opt, idx) => (
                        <div
                          key={opt.id}
                          className={cn(
                            'flex min-h-14 cursor-pointer items-center rounded-xl bg-card px-4 py-5 transition-all duration-200',
                            'hover:scale-[1.01] hover:bg-accent hover:shadow-sm',
                            'max-md:min-h-12 max-md:px-3 max-md:py-4',
                            quiz.selectedOption === opt.id && 'bg-accent shadow-sm',
                          )}
                          onClick={() => quizActions.handleOptionSelect(opt.id)}
                        >
                          <span className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted max-md:mr-2 max-md:h-6 max-md:w-6">
                            {idx + 1}
                          </span>
                          <span className="break-words pr-3 text-base leading-[1.8] max-md:pr-2 max-md:text-sm max-md:leading-relaxed">
                            <MarkdownText>{opt.content}</MarkdownText>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </BlurFade>
              </div>
            </>
          )}

          {/* 확인 버튼 */}
          <button
            className="mt-auto cursor-pointer rounded-lg border-none bg-primary p-3 text-base text-primary-foreground transition-all duration-200 hover:bg-primary/90 max-md:mt-4 max-md:w-full"
            onClick={quizActions.handleSubmit}
          >
            {t('확인')}
          </button>

          {/* 제출하기 버튼 */}
          <button
            className="mt-8 w-[100px] cursor-pointer self-end rounded-lg border-none bg-primary p-3 text-base text-primary-foreground transition-all duration-200 hover:bg-primary/90 max-md:mt-4 max-md:w-full max-md:self-stretch"
            onClick={quizActions.handleFinish}
          >
            {t('제출하기')}
          </button>
        </section>

        {/* 하단 문제 번호 패널 (모바일/태블릿) */}
        <aside className="mt-4 hidden grid-cols-[repeat(auto-fill,2rem)] justify-center gap-2 rounded-2xl bg-card p-4 shadow-card max-[1500px]:grid">
          {quiz.quizzes.map((q) => renderQuestionButton(q, 'bottom-'))}
          {Array.from({ length: remainingCount }).map((_, index) =>
            renderPendingButton(index, 'bottom-'),
          )}
        </aside>
      </main>
    </div>
  );
};

export default SolveQuizMagicA;
