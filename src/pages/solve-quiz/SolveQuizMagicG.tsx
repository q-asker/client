import { useTranslation } from 'i18nexus';

import React, { useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSolveQuiz } from '#features/solve-quiz';
import { isUnanswered } from '../../features/solve-quiz/lib/isUnanswered';
import { useQuizGenerationStore } from '#features/quiz-generation';
import { cn } from '@/shared/ui/lib/utils';
import { BlurFade } from '@/shared/ui/components/blur-fade';
import MarkdownText from '@/shared/ui/components/markdown-text';

/** MagicG: Scroll Reveal — 전체 문제를 스크롤 뷰로 표시, 스크롤에 따라 BlurFade 순차 등장 */
const SolveQuizMagicG: React.FC = () => {
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

  /** 문제 번호 버튼 렌더링 (상단 스티키 내비게이션용) */
  const renderQuestionButton = (
    q: (typeof quiz.quizzes)[number],
    keyPrefix = '',
  ): React.ReactElement => {
    const unanswered = isUnanswered(q.userAnswer, q.selections);
    return (
      <button
        key={`${keyPrefix}${q.number}`}
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded-md text-xs font-medium',
          'cursor-pointer transition-all duration-200 hover:scale-110',
          'border border-border bg-card text-muted-foreground',
          !unanswered && 'border-primary/40 bg-primary/10 text-primary',
          q.check && 'border-warning/50 bg-warning/10 text-warning',
          q.number === quiz.currentQuestion &&
            'border-primary bg-primary text-primary-foreground hover:scale-100 hover:bg-primary',
        )}
        onClick={() => {
          quizActions.handleJumpTo(q.number);
          // 해당 문제 카드로 스크롤
          const el = document.getElementById(`quiz-card-${q.number}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }}
      >
        {q.number}
      </button>
    );
  };

  /** 대기 중인 문제 번호 버튼 렌더링 */
  const renderPendingButton = (index: number, keyPrefix = ''): React.ReactElement => (
    <button
      key={`${keyPrefix}pending-${index}`}
      className="flex h-7 w-7 animate-pulse items-center justify-center rounded-md border border-dashed border-border bg-primary/10 text-xs text-primary"
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

              <div className="p-6">
                {/* 통계 */}
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

      {/* 상단 헤더 (스티키) */}
      <header className="sticky top-0 z-50 bg-card/90 shadow-sm backdrop-blur-sm">
        <div className="mx-auto flex max-w-[860px] items-center justify-between px-5 py-3">
          <button
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-none bg-muted text-muted-foreground transition-all duration-200 hover:bg-accent"
            onClick={() => navigate('/')}
          >
            ✕
          </button>

          {/* 타이머 + 진행률 */}
          <div className="flex flex-col items-center gap-0.5">
            <span className="font-mono text-base font-semibold tabular-nums text-foreground">
              {quiz.currentTime}
            </span>
            <span className="text-xs text-muted-foreground">
              {quiz.answeredCount} / {quiz.totalQuestions} {t('완료')}
            </span>
          </div>

          {/* 제출하기 버튼 */}
          <button
            className="cursor-pointer rounded-lg border-none bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90"
            onClick={quizActions.handleFinish}
          >
            {t('제출하기')}
          </button>
        </div>

        {/* 진행률 바 */}
        <div className="h-0.5 w-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* 문제 번호 가로 스크롤 내비게이션 */}
        <div className="mx-auto max-w-[860px] overflow-x-auto px-5 py-2">
          <div className="flex gap-1.5">
            {quiz.quizzes.map((q) => renderQuestionButton(q))}
            {Array.from({ length: remainingCount }).map((_, index) => renderPendingButton(index))}
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 — 스크롤 뷰 */}
      <main className="mx-auto flex w-full max-w-[860px] flex-col gap-6 px-5 py-8 max-md:px-4">
        {quiz.isLoading ? (
          <div className="flex h-screen flex-col items-center justify-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
            <p className="text-muted-foreground">{t('문제 로딩 중…')}</p>
          </div>
        ) : (
          <>
            {/* 스트리밍 안내 */}
            {remainingCount > 0 && (
              <BlurFade delay={0} inView>
                <div className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm text-primary">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                  {remainingCount}
                  {t('개 문제 생성 중…')}
                </div>
              </BlurFade>
            )}

            {/* 전체 문제 스크롤 뷰 — 각 문제를 BlurFade inView로 감싸 순차 등장 */}
            {quiz.quizzes.map((quizItem, quizIdx) => {
              const unanswered = isUnanswered(quizItem.userAnswer, quizItem.selections);
              const isCurrent = quizItem.number === quiz.currentQuestion;

              return (
                <BlurFade key={quizItem.number} delay={quizIdx * 0.04} inView>
                  <div
                    id={`quiz-card-${quizItem.number}`}
                    className={cn(
                      'rounded-2xl border-2 bg-card shadow-sm transition-all duration-300',
                      isCurrent ? 'border-primary shadow-md' : 'border-transparent',
                    )}
                    onClick={() => quizActions.handleJumpTo(quizItem.number)}
                  >
                    {/* 문제 헤더 */}
                    <div className="flex items-start justify-between rounded-t-2xl bg-muted px-5 py-4">
                      <div className="flex items-start gap-3">
                        {/* 문제 번호 뱃지 */}
                        <span
                          className={cn(
                            'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold',
                            !unanswered
                              ? 'bg-primary/20 text-primary'
                              : 'bg-muted-foreground/20 text-muted-foreground',
                            quizItem.check && 'bg-warning/20 text-warning',
                          )}
                        >
                          {quizItem.number}
                        </span>
                        <div className="flex-1 break-words text-sm leading-relaxed text-foreground">
                          <MarkdownText>{quizItem.title}</MarkdownText>
                        </div>
                      </div>

                      {/* 검토 체크박스 */}
                      <label
                        className="ml-4 flex shrink-0 cursor-pointer items-center gap-1.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isCurrent) {
                            quizActions.handleCheckToggle();
                          } else {
                            quizActions.handleJumpTo(quizItem.number);
                          }
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={quizItem.check || false}
                          readOnly
                          className="h-4 w-4 cursor-pointer accent-warning"
                        />
                        <span className="text-xs text-muted-foreground">{t('검토')}</span>
                      </label>
                    </div>

                    {/* 선택지 — isCurrent일 때만 클릭 활성화, 아니면 답변 상태 표시 */}
                    <div className="flex flex-col gap-2 p-4">
                      {quizItem.selections.map((opt, idx) => {
                        const isSelected = quizItem.userAnswer === opt.id;
                        return (
                          <div
                            key={opt.id}
                            className={cn(
                              'flex cursor-pointer items-center gap-3 rounded-xl border-2 bg-background px-4 py-3 transition-all duration-200',
                              isSelected
                                ? 'border-primary bg-primary/5'
                                : 'border-transparent hover:border-border hover:bg-muted/40',
                              !isCurrent && 'cursor-default',
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              quizActions.handleJumpTo(quizItem.number);
                              if (isCurrent) quizActions.handleOptionSelect(opt.id);
                            }}
                          >
                            <span
                              className={cn(
                                'flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold transition-all duration-200',
                                isSelected
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
                        );
                      })}
                    </div>

                    {/* 현재 문제일 때만 확인 버튼 표시 */}
                    {isCurrent && (
                      <div className="flex justify-end px-4 pb-4">
                        <button
                          className="cursor-pointer rounded-xl border-none bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90"
                          onClick={(e) => {
                            e.stopPropagation();
                            quizActions.handleSubmit();
                          }}
                        >
                          {t('확인')}
                        </button>
                      </div>
                    )}
                  </div>
                </BlurFade>
              );
            })}

            {/* 대기 중인 문제 스켈레톤 */}
            {Array.from({ length: remainingCount }).map((_, index) => (
              <BlurFade key={`pending-card-${index}`} delay={index * 0.04} inView>
                <div className="animate-pulse rounded-2xl border-2 border-dashed border-border bg-card p-5">
                  <div className="mb-3 h-4 w-3/4 rounded bg-muted" />
                  <div className="h-4 w-1/2 rounded bg-muted" />
                  <div className="mt-4 flex flex-col gap-2">
                    {Array.from({ length: 4 }).map((__, i) => (
                      <div key={i} className="h-10 rounded-xl bg-muted" />
                    ))}
                  </div>
                </div>
              </BlurFade>
            ))}

            {/* 최하단 제출하기 버튼 */}
            <BlurFade delay={0.2} inView>
              <div className="flex justify-end pt-4">
                <button
                  className="cursor-pointer rounded-xl border-none bg-destructive px-8 py-3 font-semibold text-destructive-foreground transition-all duration-200 hover:bg-destructive/90 max-md:w-full"
                  onClick={quizActions.handleFinish}
                >
                  {t('제출하기')}
                </button>
              </div>
            </BlurFade>
          </>
        )}
      </main>
    </div>
  );
};

export default SolveQuizMagicG;
