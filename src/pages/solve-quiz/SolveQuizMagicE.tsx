import { useTranslation } from 'i18nexus';

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSolveQuiz } from '#features/solve-quiz';
import { isUnanswered } from '../../features/solve-quiz/lib/isUnanswered';
import { useQuizGenerationStore } from '#features/quiz-generation';
import { cn } from '@/shared/ui/lib/utils';
import { BlurFade } from '@/shared/ui/components/blur-fade';
import MarkdownText from '@/shared/ui/components/markdown-text';

/** MagicE: 3D Card Flip — perspective + rotateY 카드 뒤집기, 문제 앞면/검토 뒷면 */
const SolveQuizMagicE: React.FC = () => {
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

  /** 카드 뒤집기 상태 — 앞면: 문제, 뒷면: 검토 메모 */
  const [isFlipped, setIsFlipped] = useState(false);

  /** 문제가 바뀌면 앞면으로 리셋 */
  useEffect(() => {
    setIsFlipped(false);
  }, [quiz.currentQuestion]);

  useEffect(() => {
    return () => {
      resetQuizGeneration();
    };
  }, [resetQuizGeneration]);

  /** 진행률 계산 */
  const progressPercent =
    quiz.totalQuestions > 0 ? (quiz.answeredCount / quiz.totalQuestions) * 100 : 0;

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
          'flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-sm font-medium',
          'cursor-pointer transition-all duration-200 hover:scale-110',
          !unanswered && 'border-primary/40 bg-primary/10 text-primary',
          q.check && 'border-warning bg-warning/20 text-warning',
          q.number === quiz.currentQuestion &&
            'scale-110 border-primary bg-primary text-primary-foreground shadow-md hover:scale-110 hover:bg-primary',
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
      className="flex h-9 w-9 animate-pulse items-center justify-center rounded-lg border border-dashed border-border bg-primary/10 text-xs text-primary"
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
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-foreground/50 backdrop-blur-sm"
          onClick={quizActions.handleOverlayClick}
        >
          <BlurFade delay={0.05} inView>
            <div
              className="w-[90%] max-w-[600px] overflow-y-auto rounded-2xl bg-card shadow-xl max-md:m-5 max-md:w-[95%]"
              style={{ maxHeight: '80vh' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 다이얼로그 헤더 */}
              <div className="flex items-center justify-between border-b border-border px-6 py-5">
                <h2 className="m-0 text-xl font-semibold text-foreground">{t('제출 확인')}</h2>
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-full border-none bg-muted text-lg text-muted-foreground transition-colors hover:bg-accent"
                  onClick={quizActions.handleCancelSubmit}
                >
                  ✕
                </button>
              </div>

              {/* 통계 정보 */}
              <div className="p-6">
                <div className="mb-6 grid grid-cols-2 gap-3 max-md:grid-cols-1">
                  <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3">
                    <span className="text-sm text-muted-foreground">{t('전체 문제:')}</span>
                    <span className="text-sm font-bold">
                      {quiz.quizzes.length}
                      {t('개')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-success/10 px-4 py-3">
                    <span className="text-sm text-success">{t('답변한 문제:')}</span>
                    <span className="text-sm font-bold text-success">
                      {quiz.answeredCount}
                      {t('개')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-destructive/10 px-4 py-3">
                    <span className="text-sm text-destructive">{t('안푼 문제:')}</span>
                    <span className="text-sm font-bold text-destructive">
                      {quiz.unansweredCount}
                      {t('개')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-warning/10 px-4 py-3">
                    <span className="text-sm text-warning">{t('검토할 문제:')}</span>
                    <span className="text-sm font-bold text-warning">
                      {quiz.reviewCount}
                      {t('개')}
                    </span>
                  </div>
                </div>

                {/* 선택 답안 목록 */}
                <h3 className="mb-4 text-lg font-semibold text-foreground">{t('선택한 답안')}</h3>
                <div className="max-h-[280px] overflow-y-auto rounded-xl border border-border p-3">
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
                            <span className="rounded-full bg-warning px-2 py-0.5 text-xs font-medium text-warning-foreground">
                              {t('검토')}
                            </span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 다이얼로그 버튼 */}
              <div className="flex justify-end gap-3 border-t border-border px-6 py-5 max-md:flex-col">
                <button
                  className="cursor-pointer rounded-xl border-none bg-muted px-6 py-2.5 font-medium text-muted-foreground transition-all duration-200 hover:bg-accent max-md:w-full"
                  onClick={quizActions.handleCancelSubmit}
                >
                  {t('취소')}
                </button>
                <button
                  className="cursor-pointer rounded-xl border-none bg-primary px-6 py-2.5 font-medium text-primary-foreground transition-all duration-200 hover:bg-primary/90 max-md:w-full"
                  onClick={quizActions.handleConfirmSubmit}
                >
                  {t('제출하기')}
                </button>
              </div>
            </div>
          </BlurFade>
        </div>
      )}

      {/* 상단 헤더 */}
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-md">
        <div className="flex items-center justify-between px-5 py-3">
          <button
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-none bg-primary-foreground/15 text-primary-foreground transition-all duration-200 hover:bg-primary-foreground/25"
            onClick={() => navigate('/')}
          >
            ✕
          </button>
          <div className="flex flex-col items-center">
            <span className="font-mono text-lg font-semibold tabular-nums">{quiz.currentTime}</span>
            <span className="text-xs text-primary-foreground/70">
              {quiz.currentQuestion} / {quiz.totalQuestions}
            </span>
          </div>
          {/* 카드 뒤집기 토글 버튼 */}
          <button
            className={cn(
              'flex h-9 cursor-pointer items-center gap-1.5 rounded-full border-none px-3 text-sm font-medium transition-all duration-300',
              isFlipped
                ? 'bg-primary-foreground text-primary'
                : 'bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/25',
            )}
            onClick={() => setIsFlipped((v) => !v)}
          >
            ↺ {t('뒤집기')}
          </button>
        </div>

        {/* 진행률 바 */}
        <div className="h-1 w-full bg-primary-foreground/20">
          <div
            className="h-full bg-primary-foreground transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="mx-auto flex w-full max-w-[860px] flex-1 flex-col px-5 py-8 max-md:px-4">
        {quiz.isLoading ? (
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
            <p className="text-muted-foreground">{t('문제 로딩 중…')}</p>
          </div>
        ) : (
          <div className="flex gap-6 max-md:flex-col">
            {/* 좌측 문제 번호 패널 (데스크톱) */}
            <aside className="flex w-[60px] shrink-0 flex-col gap-2 max-md:hidden">
              {quiz.quizzes.map((q) => renderQuestionButton(q))}
              {Array.from({ length: remainingCount }).map((_, index) => renderPendingButton(index))}
            </aside>

            {/* 3D 카드 플립 영역 */}
            <div className="flex flex-1 flex-col gap-6">
              {/* perspective 컨테이너 */}
              <div className="relative" style={{ perspective: '1200px' }}>
                <div
                  className="relative min-h-[360px] w-full transition-transform duration-700"
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  }}
                >
                  {/* 앞면 — 문제 + 선택지 */}
                  <div
                    className="absolute inset-0 flex flex-col rounded-2xl bg-card shadow-md"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    {/* 문제 제목 */}
                    <div className="rounded-t-2xl bg-muted px-6 py-5">
                      <div className="break-words text-base leading-relaxed text-foreground">
                        <MarkdownText>{quiz.currentQuiz.title}</MarkdownText>
                      </div>
                    </div>

                    {/* 선택지 */}
                    <div className="flex flex-col gap-2 p-5">
                      {quiz.currentQuiz.selections.map((opt, idx) => (
                        <div
                          key={opt.id}
                          className={cn(
                            'flex cursor-pointer items-center gap-3 rounded-xl border-2 bg-background px-4 py-3 transition-all duration-200',
                            quiz.selectedOption === opt.id
                              ? 'border-primary bg-primary/5 shadow-sm'
                              : 'border-transparent hover:border-border hover:bg-muted/50',
                          )}
                          onClick={() => quizActions.handleOptionSelect(opt.id)}
                        >
                          <span
                            className={cn(
                              'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-all duration-200',
                              quiz.selectedOption === opt.id
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground',
                            )}
                          >
                            {idx + 1}
                          </span>
                          <span className="flex-1 break-words text-sm leading-relaxed text-foreground">
                            <MarkdownText>{opt.content}</MarkdownText>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 뒷면 — 검토 메모 패널 */}
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-warning/10 shadow-md"
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                  >
                    <div className="flex flex-col items-center gap-4 px-8 text-center">
                      <span className="text-5xl">★</span>
                      <h3 className="text-xl font-bold text-foreground">{t('검토 표시')}</h3>
                      <p className="text-sm text-muted-foreground">
                        {quiz.currentQuiz.check
                          ? t('이 문제는 검토 표시되어 있습니다.')
                          : t('이 문제를 나중에 다시 확인하려면 검토 표시를 활성화하세요.')}
                      </p>
                      <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-card px-5 py-3 shadow-sm">
                        <input
                          type="checkbox"
                          checked={quiz.currentQuiz.check || false}
                          onChange={quizActions.handleCheckToggle}
                          className="h-5 w-5 cursor-pointer accent-warning"
                        />
                        <span className="font-semibold text-foreground">{t('검토')}</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* 이전 / 확인 / 다음 버튼 */}
              <div className="flex items-center gap-3">
                <button
                  className="cursor-pointer rounded-xl border border-border bg-card px-5 py-3 font-medium text-foreground transition-all duration-200 hover:bg-muted"
                  onClick={quizActions.handlePrev}
                >
                  ←
                </button>
                <button
                  className="flex-1 cursor-pointer rounded-xl border-none bg-primary py-3 text-base font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90"
                  onClick={quizActions.handleSubmit}
                >
                  {t('확인')}
                </button>
                <button
                  className="cursor-pointer rounded-xl border border-border bg-card px-5 py-3 font-medium text-foreground transition-all duration-200 hover:bg-muted"
                  onClick={quizActions.handleNext}
                >
                  →
                </button>
              </div>

              {/* 제출하기 버튼 */}
              <button
                className="cursor-pointer self-end rounded-xl border-none bg-destructive px-6 py-2.5 text-sm font-semibold text-destructive-foreground transition-all duration-200 hover:bg-destructive/90 max-md:w-full max-md:self-stretch"
                onClick={quizActions.handleFinish}
              >
                {t('제출하기')}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* 하단 문제 번호 패널 (모바일/태블릿) */}
      <aside className="mt-auto hidden grid-cols-[repeat(auto-fill,2.25rem)] justify-center gap-2 border-t border-border bg-card px-5 py-4 max-[900px]:grid">
        {quiz.quizzes.map((q) => renderQuestionButton(q, 'bottom-'))}
        {Array.from({ length: remainingCount }).map((_, index) =>
          renderPendingButton(index, 'bottom-'),
        )}
      </aside>
    </div>
  );
};

export default SolveQuizMagicE;
