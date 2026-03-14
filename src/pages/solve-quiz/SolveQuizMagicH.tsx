import { useTranslation } from 'i18nexus';

import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSolveQuiz } from '#features/solve-quiz';
import { isUnanswered } from '../../features/solve-quiz/lib/isUnanswered';
import { useQuizGenerationStore } from '#features/quiz-generation';
import { cn } from '@/shared/ui/lib/utils';
import { BlurFade } from '@/shared/ui/components/blur-fade';
import { TextAnimate } from '@/shared/ui/components/text-animate';
import MarkdownText from '@/shared/ui/components/markdown-text';

/** MagicH: Gamified Dashboard — XP 프로그레스 바, 콤보 카운터, 게임화 UI */
const SolveQuizMagicH: React.FC = () => {
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

  /** XP 계산: 답변한 문제 수 기반 */
  const xpPerQuestion = 100;
  const currentXP = quiz.answeredCount * xpPerQuestion;
  const maxXP = quiz.totalQuestions * xpPerQuestion;
  const xpPercent = maxXP > 0 ? (currentXP / maxXP) * 100 : 0;

  /** 콤보 카운터 — 연속으로 답변한 문제 수 추적 */
  const [combo, setCombo] = useState(0);
  const [showComboAnim, setShowComboAnim] = useState(false);
  const prevAnsweredCount = useRef(quiz.answeredCount);

  useEffect(() => {
    if (quiz.answeredCount > prevAnsweredCount.current) {
      setCombo((c) => c + 1);
      setShowComboAnim(true);
      const timer = setTimeout(() => setShowComboAnim(false), 1200);
      prevAnsweredCount.current = quiz.answeredCount;
      return () => clearTimeout(timer);
    }
  }, [quiz.answeredCount]);

  /** 문제가 바뀌면 콤보 유지 (스킵하면 리셋) */
  const prevQuestion = useRef(quiz.currentQuestion);
  useEffect(() => {
    const diff = quiz.currentQuestion - prevQuestion.current;
    if (Math.abs(diff) > 1) {
      // 문제를 건너뛰면 콤보 리셋
      setCombo(0);
    }
    prevQuestion.current = quiz.currentQuestion;
  }, [quiz.currentQuestion]);

  useEffect(() => {
    return () => {
      resetQuizGeneration();
    };
  }, [resetQuizGeneration]);

  /** 랭크 티어 계산 */
  const getRank = (): { label: string; color: string } => {
    if (xpPercent >= 90) return { label: 'S', color: 'text-warning' };
    if (xpPercent >= 70) return { label: 'A', color: 'text-primary' };
    if (xpPercent >= 50) return { label: 'B', color: 'text-success' };
    if (xpPercent >= 30) return { label: 'C', color: 'text-muted-foreground' };
    return { label: 'D', color: 'text-muted-foreground' };
  };
  const rank = getRank();

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
          'flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold',
          'cursor-pointer transition-all duration-200 hover:scale-110',
          'border border-border bg-card text-muted-foreground',
          !unanswered && 'border-primary/40 bg-primary/10 text-primary',
          q.check && 'border-warning/50 bg-warning/10 text-warning',
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
      className="flex h-8 w-8 animate-pulse items-center justify-center rounded-lg border border-dashed border-border bg-primary/10 text-xs text-primary"
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
                {/* 최종 XP 결과 카드 */}
                <div className="mb-6 flex items-center justify-center gap-6 rounded-2xl bg-muted p-6">
                  <div className="flex flex-col items-center">
                    <span className={cn('text-5xl font-black', rank.color)}>{rank.label}</span>
                    <span className="text-xs text-muted-foreground">{t('랭크')}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-2xl font-bold text-foreground">{currentXP} XP</span>
                    <div className="h-3 w-40 overflow-hidden rounded-full bg-border">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-700"
                        style={{ width: `${xpPercent}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {quiz.answeredCount} / {quiz.quizzes.length} {t('완료')}
                    </span>
                  </div>
                </div>

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
                <div className="max-h-[260px] overflow-y-auto rounded-xl border border-border p-3">
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

      {/* 상단 게임 대시보드 헤더 */}
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-md">
        <div className="mx-auto flex max-w-[1000px] items-center justify-between px-5 py-3">
          {/* 닫기 버튼 */}
          <button
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border-none bg-primary-foreground/15 text-primary-foreground transition-all duration-200 hover:bg-primary-foreground/25"
            onClick={() => navigate('/')}
          >
            ✕
          </button>

          {/* 중앙: 타이머 + 랭크 + XP */}
          <div className="flex items-center gap-4">
            {/* 랭크 뱃지 */}
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-foreground/20">
              <span className="text-lg font-black text-primary-foreground">{rank.label}</span>
            </div>

            {/* XP 바 */}
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-primary-foreground/80">XP</span>
                <span className="font-mono text-xs text-primary-foreground/80">
                  {currentXP} / {maxXP}
                </span>
              </div>
              <div className="h-2 w-36 overflow-hidden rounded-full bg-primary-foreground/20 max-md:w-24">
                <div
                  className="h-full rounded-full bg-primary-foreground transition-all duration-500 ease-out"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
            </div>

            {/* 타이머 */}
            <div className="rounded-lg bg-primary-foreground/15 px-3 py-1.5">
              <span className="font-mono text-sm font-semibold tabular-nums">
                {quiz.currentTime}
              </span>
            </div>
          </div>

          {/* 콤보 카운터 */}
          <div className="relative flex min-w-[56px] items-center justify-end">
            {combo >= 2 && (
              <div
                className={cn(
                  'flex flex-col items-center rounded-lg bg-warning/20 px-2 py-1 transition-all duration-300',
                  showComboAnim && 'scale-125',
                )}
              >
                <span className="text-xs font-bold text-warning">COMBO</span>
                <span className="text-lg font-black leading-none text-warning">x{combo}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="mx-auto flex w-full max-w-[1000px] flex-1 flex-col px-5 py-6 max-md:px-4">
        {quiz.isLoading ? (
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
            <p className="text-muted-foreground">{t('문제 로딩 중…')}</p>
          </div>
        ) : (
          <div className="flex gap-6 max-md:flex-col">
            {/* 좌측 패널 — 문제 번호 + 스코어보드 */}
            <aside className="flex w-[180px] shrink-0 flex-col gap-4 max-md:hidden">
              {/* 스코어보드 */}
              <BlurFade delay={0.05} inView>
                <div className="rounded-2xl bg-card p-4 shadow-sm">
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {t('현황')}
                  </h3>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{t('답변')}</span>
                      <span className="text-sm font-bold text-foreground">
                        {quiz.answeredCount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{t('미답변')}</span>
                      <span className="text-sm font-bold text-destructive">
                        {quiz.unansweredCount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{t('검토')}</span>
                      <span className="text-sm font-bold text-warning">{quiz.reviewCount}</span>
                    </div>
                    <div className="mt-1 border-t border-border pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">
                          {t('콤보')}
                        </span>
                        <span
                          className={cn(
                            'text-sm font-black transition-all duration-300',
                            combo >= 5
                              ? 'text-warning'
                              : combo >= 2
                                ? 'text-primary'
                                : 'text-muted-foreground',
                          )}
                        >
                          x{combo}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </BlurFade>

              {/* 문제 번호 그리드 */}
              <BlurFade delay={0.1} inView>
                <div className="rounded-2xl bg-card p-4 shadow-sm">
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {t('문제')}
                  </h3>
                  <div className="grid grid-cols-[repeat(auto-fill,2rem)] gap-1.5">
                    {quiz.quizzes.map((q) => renderQuestionButton(q))}
                    {Array.from({ length: remainingCount }).map((_, index) =>
                      renderPendingButton(index),
                    )}
                  </div>
                </div>
              </BlurFade>
            </aside>

            {/* 문제 영역 */}
            <div className="flex flex-1 flex-col gap-5">
              {/* 현재 문제 번호 + 문제 제목 */}
              <BlurFade key={quiz.currentQuestion} delay={0.05} inView>
                <div className="rounded-2xl bg-card shadow-sm">
                  {/* 문제 상단 바 — 게임 스타일 */}
                  <div className="flex items-center justify-between rounded-t-2xl bg-muted px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-xs font-black text-primary-foreground">
                        Q{quiz.currentQuestion}
                      </span>
                      <span className="text-xs font-medium text-muted-foreground">
                        {quiz.currentQuestion} / {quiz.totalQuestions}
                      </span>
                    </div>
                    {/* 검토 토글 */}
                    <button
                      className={cn(
                        'flex cursor-pointer items-center gap-1.5 rounded-lg border-none px-3 py-1.5 text-xs font-bold transition-all duration-200',
                        quiz.currentQuiz.check
                          ? 'bg-warning text-warning-foreground'
                          : 'bg-card text-muted-foreground hover:bg-accent',
                      )}
                      onClick={quizActions.handleCheckToggle}
                    >
                      ★ {t('검토')}
                    </button>
                  </div>

                  {/* 문제 본문 */}
                  <div className="px-6 py-5">
                    <TextAnimate
                      animation="blurInUp"
                      by="word"
                      className="text-base leading-relaxed text-foreground"
                    >
                      {quiz.currentQuiz.title}
                    </TextAnimate>
                  </div>

                  {/* 선택지 */}
                  <div className="flex flex-col gap-2 px-5 pb-5">
                    {quiz.currentQuiz.selections.map((opt, idx) => (
                      <BlurFade key={opt.id} delay={0.08 + idx * 0.06} inView>
                        <button
                          className={cn(
                            'flex w-full cursor-pointer items-center gap-3 rounded-xl border-2 bg-background px-4 py-3 text-left transition-all duration-200',
                            quiz.selectedOption === opt.id
                              ? 'border-primary bg-primary/5 shadow-sm'
                              : 'border-transparent hover:border-border hover:bg-muted/50',
                          )}
                          onClick={() => quizActions.handleOptionSelect(opt.id)}
                        >
                          <span
                            className={cn(
                              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-black transition-all duration-200',
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
                          {/* 선택 시 XP 뱃지 */}
                          {quiz.selectedOption === opt.id && (
                            <span className="shrink-0 rounded-full bg-primary/20 px-2 py-0.5 text-xs font-bold text-primary">
                              +{xpPerQuestion} XP
                            </span>
                          )}
                        </button>
                      </BlurFade>
                    ))}
                  </div>
                </div>
              </BlurFade>

              {/* 이전 / 확인 / 다음 버튼 */}
              <div className="flex items-center gap-3">
                <button
                  className="cursor-pointer rounded-xl border border-border bg-card px-5 py-3 font-bold text-foreground transition-all duration-200 hover:bg-muted"
                  onClick={quizActions.handlePrev}
                >
                  ←
                </button>
                <button
                  className="flex-1 cursor-pointer rounded-xl border-none bg-primary py-3 text-base font-bold text-primary-foreground transition-all duration-200 hover:bg-primary/90"
                  onClick={quizActions.handleSubmit}
                >
                  {t('확인')} ✓
                </button>
                <button
                  className="cursor-pointer rounded-xl border border-border bg-card px-5 py-3 font-bold text-foreground transition-all duration-200 hover:bg-muted"
                  onClick={quizActions.handleNext}
                >
                  →
                </button>
              </div>

              {/* 제출하기 버튼 */}
              <button
                className="cursor-pointer self-end rounded-xl border-none bg-destructive px-6 py-2.5 text-sm font-bold text-destructive-foreground transition-all duration-200 hover:bg-destructive/90 max-md:w-full max-md:self-stretch"
                onClick={quizActions.handleFinish}
              >
                {t('제출하기')} 🏁
              </button>
            </div>
          </div>
        )}
      </main>

      {/* 하단 문제 번호 패널 (모바일/태블릿) */}
      <aside className="mt-auto hidden border-t border-border bg-card px-5 py-4 max-md:block">
        {/* 모바일 스코어 요약 */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={cn('text-lg font-black', rank.color)}>{rank.label}</span>
            <span className="text-sm font-semibold text-foreground">{currentXP} XP</span>
          </div>
          {combo >= 2 && (
            <span className="rounded-lg bg-warning/20 px-2 py-1 text-xs font-bold text-warning">
              COMBO x{combo}
            </span>
          )}
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,2rem)] justify-center gap-1.5">
          {quiz.quizzes.map((q) => renderQuestionButton(q, 'bottom-'))}
          {Array.from({ length: remainingCount }).map((_, index) =>
            renderPendingButton(index, 'bottom-'),
          )}
        </div>
      </aside>
    </div>
  );
};

export default SolveQuizMagicH;
