import { useTranslation } from 'i18nexus';

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSolveQuiz } from '#features/solve-quiz';
import { isUnanswered } from '../../features/solve-quiz/lib/isUnanswered';
import { useQuizGenerationStore } from '#features/quiz-generation';
import { cn } from '@/shared/ui/lib/utils';
import MarkdownText from '@/shared/ui/components/markdown-text';

/** F안: Carousel Slider — 좌우 화살표 카드 슬라이더, 문제 카드 넘기기 느낌 */
const SolveQuizDesignF: React.FC = () => {
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

  // 슬라이드 애니메이션 방향 추적 ('left' | 'right' | null)
  const [slideDir, setSlideDir] = useState<'left' | 'right' | null>(null);
  const [prevQuestion, setPrevQuestion] = useState(quiz.currentQuestion);

  useEffect(() => {
    if (quiz.currentQuestion !== prevQuestion) {
      setSlideDir(quiz.currentQuestion > prevQuestion ? 'left' : 'right');
      setPrevQuestion(quiz.currentQuestion);
      // 애니메이션 리셋
      const timer = setTimeout(() => setSlideDir(null), 300);
      return () => clearTimeout(timer);
    }
  }, [quiz.currentQuestion, prevQuestion]);

  useEffect(() => {
    return () => {
      resetQuizGeneration();
    };
  }, [resetQuizGeneration]);

  /** 슬라이더 하단 인디케이터 점 버튼 렌더링 */
  const renderQuestionButton = (
    q: (typeof quiz.quizzes)[number],
    keyPrefix = '',
  ): React.ReactElement => {
    const unanswered = isUnanswered(q.userAnswer, q.selections);
    const isActive = q.number === quiz.currentQuestion;
    return (
      <button
        key={`${keyPrefix}${q.number}`}
        title={`${q.number}번`}
        className={cn(
          'h-2 cursor-pointer rounded-full border-none transition-all duration-300',
          isActive ? 'w-6 bg-primary' : 'w-2 bg-muted hover:bg-muted-foreground/40',
          !unanswered && !isActive && 'bg-primary/30',
          q.check && !isActive && 'bg-warning/50',
        )}
        onClick={() => quizActions.handleJumpTo(q.number)}
      />
    );
  };

  /** 대기 중인 인디케이터 점 렌더링 */
  const renderPendingButton = (index: number, keyPrefix = ''): React.ReactElement => (
    <button
      key={`${keyPrefix}pending-${index}`}
      className="h-2 w-2 animate-pulse rounded-full border-none bg-muted/50"
      disabled
    />
  );

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      {/* 제출 다이얼로그 */}
      {quiz.showSubmitDialog && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-foreground/40"
          onClick={quizActions.handleOverlayClick}
        >
          <div
            className="w-[90%] max-w-[560px] overflow-y-auto rounded-3xl bg-background shadow-card max-md:m-5 max-md:w-[95%]"
            style={{ maxHeight: '80vh' }}
          >
            {/* 다이얼로그 헤더 */}
            <div className="flex items-center justify-between border-b border-border px-6 py-5">
              <h2 className="m-0 text-lg font-semibold text-foreground">{t('제출 확인')}</h2>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full border-none bg-transparent text-xl text-muted-foreground transition-colors duration-200 hover:bg-muted"
                onClick={quizActions.handleCancelSubmit}
              >
                ✕
              </button>
            </div>

            {/* 다이얼로그 콘텐츠 */}
            <div className="px-6 pb-6 pt-5">
              {/* 통계 */}
              <div className="mb-6 grid grid-cols-2 gap-3 max-md:grid-cols-1">
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

              {/* 선택 답안 목록 */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-foreground">{t('선택한 답안')}</h3>
                <div className="max-h-[280px] overflow-y-auto rounded-xl border border-border">
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
            <div className="flex justify-end gap-3 border-t border-border px-6 py-5 max-md:flex-col">
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

      {/* 상단 헤더 */}
      <header className="flex items-center justify-between px-6 py-4">
        <button
          className="cursor-pointer border-none bg-transparent text-lg text-muted-foreground transition-colors duration-200 hover:text-foreground"
          onClick={() => navigate('/')}
        >
          ✕
        </button>
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm text-muted-foreground">{quiz.currentTime}</span>
          <button
            className="cursor-pointer rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors duration-200 hover:bg-muted"
            onClick={quizActions.handleFinish}
          >
            {t('제출하기')}
          </button>
        </div>
      </header>

      {/* 카드 슬라이더 영역 */}
      <main className="mx-auto flex w-full max-w-[760px] flex-1 flex-col items-center justify-center px-6 py-4 max-md:px-4">
        {quiz.isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
            <p className="text-sm text-muted-foreground">{t('문제 로딩 중…')}</p>
          </div>
        ) : (
          <>
            {/* 슬라이더 래퍼 — 좌우 화살표 + 카드 */}
            <div className="flex w-full items-center gap-3">
              {/* 왼쪽 화살표 */}
              <button
                className={cn(
                  'flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-colors duration-200 hover:bg-muted',
                  'max-md:h-9 max-md:w-9',
                )}
                onClick={quizActions.handlePrev}
                aria-label="이전"
              >
                ‹
              </button>

              {/* 카드 */}
              <div
                className={cn(
                  'flex-1 overflow-hidden rounded-3xl border border-border bg-background shadow-card transition-transform duration-300',
                  slideDir === 'left' && 'translate-x-[-4px] opacity-80',
                  slideDir === 'right' && 'translate-x-[4px] opacity-80',
                )}
              >
                {/* 카드 헤더 */}
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                      Q{quiz.currentQuestion}
                    </span>
                    <span className="text-xs text-muted-foreground">/ {quiz.totalQuestions}</span>
                  </div>
                  <label className="flex cursor-pointer select-none items-center gap-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-primary">
                    <input
                      type="checkbox"
                      checked={quiz.currentQuiz.check || false}
                      onChange={quizActions.handleCheckToggle}
                      className="h-4 w-4 cursor-pointer accent-primary"
                    />
                    {t('검토')}
                  </label>
                </div>

                {/* 카드 문제 내용 */}
                <div className="px-6 py-5">
                  <p className="m-0 break-words text-base leading-relaxed text-foreground">
                    <MarkdownText>{quiz.currentQuiz.title}</MarkdownText>
                  </p>
                </div>

                {/* 선택지 */}
                <div className="flex flex-col gap-2 px-6 pb-6">
                  {quiz.currentQuiz.selections.map((opt, idx) => (
                    <div
                      key={opt.id}
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-2xl border border-border bg-muted/30 px-4 py-3.5 transition-all duration-200',
                        'hover:border-primary/30 hover:bg-primary/5',
                        quiz.selectedOption === opt.id &&
                          'border-primary bg-primary/10 shadow-[inset_0_0_0_1.5px_var(--primary)]',
                      )}
                      onClick={() => quizActions.handleOptionSelect(opt.id)}
                    >
                      <span
                        className={cn(
                          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-xs font-semibold text-muted-foreground transition-colors duration-200',
                          quiz.selectedOption === opt.id &&
                            'border-primary bg-primary text-primary-foreground',
                        )}
                      >
                        {idx + 1}
                      </span>
                      <span className="break-words text-sm leading-relaxed text-foreground">
                        <MarkdownText>{opt.content}</MarkdownText>
                      </span>
                    </div>
                  ))}
                </div>

                {/* 카드 푸터 — 확인 버튼 */}
                <div className="border-t border-border px-6 py-4">
                  <button
                    className="w-full cursor-pointer rounded-2xl border-none bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors duration-200 hover:opacity-90"
                    onClick={quizActions.handleSubmit}
                  >
                    {t('확인')}
                  </button>
                </div>
              </div>

              {/* 오른쪽 화살표 */}
              <button
                className={cn(
                  'flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-colors duration-200 hover:bg-muted',
                  'max-md:h-9 max-md:w-9',
                )}
                onClick={quizActions.handleNext}
                aria-label="다음"
              >
                ›
              </button>
            </div>

            {/* 슬라이더 인디케이터 — 문제 번호 점 */}
            <div className="mt-6 flex items-center justify-center gap-1.5 overflow-x-auto px-4 py-2">
              {quiz.quizzes.map((q) => renderQuestionButton(q))}
              {Array.from({ length: remainingCount }).map((_, index) => renderPendingButton(index))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default SolveQuizDesignF;
