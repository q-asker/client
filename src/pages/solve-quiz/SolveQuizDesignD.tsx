import { useTranslation } from 'i18nexus';
import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSolveQuiz } from '#features/solve-quiz';
import { isUnanswered } from '../../features/solve-quiz/lib/isUnanswered';
import { useQuizGenerationStore } from '#features/quiz-generation';
import { cn } from '@/shared/ui/lib/utils';
import MarkdownText from '@/shared/ui/components/markdown-text';
import { CheckCircle, Circle } from 'lucide-react';

/** D안: Stepper Wizard — 좌측 세로 스테퍼 + 우측 문제 영역 */
const SolveQuizDesignD: React.FC = () => {
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

  /** 현재 스텝으로 자동 스크롤 */
  const stepperRef = useRef<HTMLDivElement>(null);
  const currentStepRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentStepRef.current) {
      currentStepRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [quiz.currentQuestion]);

  useEffect(() => {
    return () => {
      resetQuizGeneration();
    };
  }, [resetQuizGeneration]);

  /** 스텝 상태 판별 */
  const getStepState = (q: (typeof quiz.quizzes)[number]) => {
    const answered = !isUnanswered(q.userAnswer, q.selections);
    const isCurrent = q.number === quiz.currentQuestion;
    const isReview = q.check;

    if (isCurrent) return 'current';
    if (isReview) return 'review';
    if (answered) return 'done';
    return 'todo';
  };

  /** 세로 스테퍼 아이템 렌더링 */
  const renderStepItem = (
    q: (typeof quiz.quizzes)[number],
    isLast: boolean,
  ): React.ReactElement => {
    const stepState = getStepState(q);
    const isCurrent = stepState === 'current';
    const isDone = stepState === 'done';
    const isReview = stepState === 'review';

    return (
      <div
        key={q.number}
        ref={isCurrent ? currentStepRef : undefined}
        className="flex flex-col items-center"
      >
        {/* 스텝 버튼 */}
        <button
          className={cn(
            'relative z-10 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 transition-all duration-200',
            isCurrent &&
              'border-primary bg-primary text-primary-foreground shadow-md hover:opacity-90',
            isDone && 'border-primary/40 bg-background text-primary hover:border-primary',
            isReview && 'border-amber-400 bg-amber-400 text-white hover:opacity-90',
            stepState === 'todo' &&
              'border-border bg-background text-muted-foreground/40 hover:border-primary/40',
          )}
          onClick={() => quizActions.handleJumpTo(q.number)}
          title={`${q.number}번 문제`}
        >
          {isDone ? (
            <CheckCircle className="h-4 w-4" />
          ) : stepState === 'todo' ? (
            <Circle className="h-4 w-4" />
          ) : (
            <span className="text-xs font-semibold">{q.number}</span>
          )}
        </button>

        {/* 세로 연결선 */}
        {!isLast && (
          <div
            className={cn(
              'w-0.5 flex-1 border-l-2 transition-colors duration-200',
              isDone || isCurrent ? 'border-primary' : 'border-border',
            )}
            style={{ minHeight: '1.5rem' }}
          />
        )}
      </div>
    );
  };

  /** 가로 스크롤 스테퍼 아이템 렌더링 (모바일) */
  const renderHorizontalStepItem = (
    q: (typeof quiz.quizzes)[number],
    isLast: boolean,
  ): React.ReactElement => {
    const stepState = getStepState(q);
    const isCurrent = stepState === 'current';
    const isDone = stepState === 'done';
    const isReview = stepState === 'review';

    return (
      <div key={q.number} className="flex items-center">
        <button
          className={cn(
            'flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 transition-all duration-200',
            isCurrent &&
              'border-primary bg-primary text-primary-foreground shadow-md hover:opacity-90',
            isDone && 'border-primary/40 bg-background text-primary hover:border-primary',
            isReview && 'border-amber-400 bg-amber-400 text-white hover:opacity-90',
            stepState === 'todo' &&
              'border-border bg-background text-muted-foreground/40 hover:border-primary/40',
          )}
          onClick={() => quizActions.handleJumpTo(q.number)}
        >
          {isDone ? (
            <CheckCircle className="h-3.5 w-3.5" />
          ) : stepState === 'todo' ? (
            <Circle className="h-3.5 w-3.5" />
          ) : (
            <span className="text-xs font-semibold">{q.number}</span>
          )}
        </button>
        {/* 가로 연결선 */}
        {!isLast && (
          <div
            className={cn(
              'h-0.5 w-5 shrink-0 border-t-2 transition-colors duration-200',
              isDone || isCurrent ? 'border-primary' : 'border-border',
            )}
          />
        )}
      </div>
    );
  };

  /** 대기 중인 스텝 렌더링 (세로) */
  const renderPendingStep = (index: number, isLast: boolean): React.ReactElement => (
    <div key={`pending-${index}`} className="flex flex-col items-center">
      <div className="relative z-10 flex h-8 w-8 shrink-0 animate-pulse items-center justify-center rounded-full border-2 border-dashed border-border bg-muted text-xs text-muted-foreground">
        ...
      </div>
      {!isLast && (
        <div
          className="w-0.5 flex-1 border-l-2 border-dashed border-border"
          style={{ minHeight: '1.5rem' }}
        />
      )}
    </div>
  );

  /** 대기 중인 스텝 렌더링 (가로) */
  const renderPendingHorizontalStep = (index: number, isLast: boolean): React.ReactElement => (
    <div key={`pending-h-${index}`} className="flex items-center">
      <div className="flex h-7 w-7 shrink-0 animate-pulse items-center justify-center rounded-full border-2 border-dashed border-border bg-muted text-xs text-muted-foreground">
        ...
      </div>
      {!isLast && <div className="h-0.5 w-5 shrink-0 border-t-2 border-dashed border-border" />}
    </div>
  );

  const allSteps = quiz.quizzes;
  const pendingSteps = Array.from({ length: remainingCount });
  const totalStepCount = allSteps.length + pendingSteps.length;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* 제출 다이얼로그 */}
      {quiz.showSubmitDialog && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40"
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
                  <span className="text-sm font-semibold text-emerald-600">
                    {quiz.answeredCount}
                    {t('개')}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                  <span className="text-sm text-muted-foreground">{t('안푼 문제:')}</span>
                  <span className="text-sm font-semibold text-red-600">
                    {quiz.unansweredCount}
                    {t('개')}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                  <span className="text-sm text-muted-foreground">{t('검토할 문제:')}</span>
                  <span className="text-sm font-semibold text-amber-600">
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
                            unanswered && 'italic text-red-500',
                            quizItem.check && 'text-amber-600',
                          )}
                        >
                          <MarkdownText>{selectedAnswer}</MarkdownText>
                          {quizItem.check && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-600">
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

      {/* 모바일: 상단 가로 스크롤 스테퍼 */}
      <div className="overflow-x-auto border-b border-border bg-background px-5 py-4 lg:hidden">
        <div className="flex items-center gap-0">
          {allSteps.map((q, idx) => {
            const isLast = idx === totalStepCount - 1;
            return renderHorizontalStepItem(q, isLast);
          })}
          {pendingSteps.map((_, idx) => {
            const isLast = allSteps.length + idx === totalStepCount - 1;
            return renderPendingHorizontalStep(idx, isLast);
          })}
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <main className="mx-auto flex w-full max-w-[860px] flex-1 gap-0 px-4 py-8 max-md:px-4 max-md:py-6">
        {/* 좌측 세로 스테퍼 (lg 이상) */}
        <aside
          ref={stepperRef}
          className="hidden max-h-[calc(100vh-120px)] w-16 shrink-0 flex-col items-center overflow-y-auto py-2 lg:flex"
        >
          {allSteps.map((q, idx) => {
            const isLast = idx === totalStepCount - 1;
            return renderStepItem(q, isLast);
          })}
          {pendingSteps.map((_, idx) => {
            const isLast = allSteps.length + idx === totalStepCount - 1;
            return renderPendingStep(idx, isLast);
          })}
        </aside>

        {/* 우측 문제 영역 */}
        <section className="flex flex-1 flex-col gap-6">
          {/* 이전/다음 네비게이션 */}
          <nav className="flex items-center justify-between">
            <button
              className="cursor-pointer rounded-xl border border-border bg-background px-5 py-2 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-muted max-md:flex-1"
              onClick={quizActions.handlePrev}
            >
              {t('이전')}
            </button>
            <span className="text-sm text-muted-foreground">
              {quiz.currentQuestion} / {quiz.totalQuestions}
            </span>
            <button
              className="cursor-pointer rounded-xl border border-border bg-background px-5 py-2 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-muted max-md:flex-1"
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
              {/* 질문 + 검토 체크박스 */}
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

              {/* 선택지 카드 리스트 */}
              <div className="flex flex-col gap-3">
                {quiz.currentQuiz.selections.map((opt, idx) => (
                  <div
                    key={opt.id}
                    className={cn(
                      'flex min-h-16 cursor-pointer items-center rounded-xl border border-border bg-background px-5 py-4',
                      'transition-all duration-200',
                      'hover:border-primary/50 hover:shadow-md',
                      'max-md:min-h-14 max-md:px-4 max-md:py-3',
                      quiz.selectedOption === opt.id && 'border-primary bg-primary/5 shadow-md',
                    )}
                    onClick={() => quizActions.handleOptionSelect(opt.id)}
                  >
                    {/* 번호 배지 */}
                    <span
                      className={cn(
                        'mr-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-sm font-medium text-muted-foreground transition-all duration-200',
                        'max-md:mr-3 max-md:h-7 max-md:w-7 max-md:text-xs',
                        quiz.selectedOption === opt.id &&
                          'border-primary bg-primary text-primary-foreground',
                      )}
                    >
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
      </main>
    </div>
  );
};

export default SolveQuizDesignD;
