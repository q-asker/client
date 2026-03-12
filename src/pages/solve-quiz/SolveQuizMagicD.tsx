import { useTranslation } from 'i18nexus';

import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSolveQuiz } from '#features/solve-quiz';
import { isUnanswered } from '../../features/solve-quiz/lib/isUnanswered';
import { useQuizGenerationStore } from '#features/quiz-generation';
import { cn } from '@/shared/ui/lib/utils';
import MarkdownText from '@/shared/ui/components/markdown-text';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';

/** G안: Swipe Gesture + Bottom Sheet Nav — 좌우 스와이프 문제 전환, 하단 시트 네비게이션 */
const SolveQuizMagicD: React.FC = () => {
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

  /** 바텀 시트 열림 상태 */
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  /** 스와이프 방향 추적 (애니메이션 방향 전환용) */
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right'>('left');

  /** dot indicator 스크롤 컨테이너 ref */
  const dotRowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      resetQuizGeneration();
    };
  }, [resetQuizGeneration]);

  /** 현재 문제 dot이 항상 보이도록 스크롤 */
  useEffect(() => {
    if (!dotRowRef.current) return;
    const container = dotRowRef.current;
    const activeDot = container.querySelector('[data-active="true"]') as HTMLElement | null;
    if (activeDot) {
      activeDot.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [quiz.currentQuestion]);

  /** 좌우 스와이프 종료 핸들러 */
  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    const velocity = 500;
    if (info.offset.x < -threshold || info.velocity.x < -velocity) {
      setSwipeDirection('left');
      quizActions.handleNext();
    } else if (info.offset.x > threshold || info.velocity.x > velocity) {
      setSwipeDirection('right');
      quizActions.handlePrev();
    }
  };

  /** 바텀 시트 드래그 종료 핸들러 */
  const handleSheetDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y < -60 || info.velocity.y < -300) {
      setIsSheetOpen(true);
    } else if (info.offset.y > 60 || info.velocity.y > 300) {
      setIsSheetOpen(false);
    }
  };

  /** 문제 번호 버튼 렌더링 (바텀 시트 안) */
  const renderQuestionButton = (
    q: (typeof quiz.quizzes)[number],
    keyPrefix = '',
  ): React.ReactElement => {
    const unanswered = isUnanswered(q.userAnswer, q.selections);
    return (
      <button
        key={`${keyPrefix}${q.number}`}
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card',
          'cursor-pointer transition-all duration-200',
          'hover:scale-110 hover:bg-accent',
          !unanswered && 'bg-accent',
          q.check && 'bg-warning/25',
          q.number === quiz.currentQuestion &&
            'bg-primary font-bold text-primary-foreground hover:scale-100 hover:bg-primary',
        )}
        onClick={() => {
          quizActions.handleJumpTo(q.number);
          setIsSheetOpen(false);
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
      className="flex h-9 w-9 animate-pulse items-center justify-center rounded-xl border border-dashed border-border bg-primary/10 text-primary text-xs"
      disabled
    >
      ...
    </button>
  );

  /** 카드 애니메이션 variants */
  const cardVariants = {
    enter: (direction: 'left' | 'right') => ({
      x: direction === 'left' ? 120 : -120,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: 'left' | 'right') => ({
      x: direction === 'left' ? -120 : 120,
      opacity: 0,
    }),
  };

  return (
    <div className="flex min-h-screen flex-col bg-background select-none overflow-hidden">
      {/* ──────────────────────────────────────────
          제출 다이얼로그
      ────────────────────────────────────────── */}
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
                ×
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

      {/* ──────────────────────────────────────────
          상단 헤더 (타이머 + 닫기)
      ────────────────────────────────────────── */}
      <header className="flex items-center justify-between bg-primary px-5 py-3 text-primary-foreground shadow-sm">
        <button
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-none bg-primary-foreground/20 text-primary-foreground transition-colors hover:bg-primary-foreground/30"
          onClick={() => navigate('/')}
          aria-label="닫기"
        >
          ×
        </button>

        {/* 스트리밍 뱃지 */}
        {remainingCount > 0 && (
          <span className="flex items-center gap-1.5 rounded-full bg-primary-foreground/20 px-3 py-1 text-xs font-medium text-primary-foreground">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary-foreground" />
            {t('생성 중')} +{remainingCount}
          </span>
        )}

        <div className="font-mono text-sm font-semibold text-primary-foreground">
          {quiz.currentTime}
        </div>
      </header>

      {/* ──────────────────────────────────────────
          Dot Indicator (현재 문제 위치)
      ────────────────────────────────────────── */}
      <div
        ref={dotRowRef}
        className="flex items-center gap-1.5 overflow-x-auto px-5 py-3 scrollbar-none"
        style={{ scrollbarWidth: 'none' }}
      >
        {quiz.quizzes.map((q) => {
          const unanswered = isUnanswered(q.userAnswer, q.selections);
          const isActive = q.number === quiz.currentQuestion;
          return (
            <motion.button
              key={q.number}
              data-active={isActive}
              onClick={() => quizActions.handleJumpTo(q.number)}
              className="shrink-0 cursor-pointer border-none p-0"
              animate={{
                width: isActive ? 24 : 8,
                height: 8,
                borderRadius: isActive ? 4 : 999,
                backgroundColor: isActive
                  ? 'hsl(var(--primary))'
                  : q.check
                    ? '#fbbf24'
                    : !unanswered
                      ? 'hsl(var(--primary) / 0.1)'
                      : 'var(--color-border)',
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          );
        })}
        {/* 스트리밍 중 대기 dot */}
        {Array.from({ length: remainingCount }).map((_, i) => (
          <span
            key={`pending-dot-${i}`}
            className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-border"
          />
        ))}
      </div>

      {/* ──────────────────────────────────────────
          메인 콘텐츠 (스와이프 카드)
      ────────────────────────────────────────── */}
      <main className="flex flex-1 flex-col overflow-hidden pb-[80px]">
        {quiz.isLoading ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
            <p className="text-muted-foreground">{t('문제 로딩 중…')}</p>
          </div>
        ) : (
          <div className="relative flex flex-1 flex-col overflow-hidden">
            {/* 문제 번호 + 이전/다음 버튼 행 */}
            <div className="flex items-center justify-between px-5 pb-2 pt-1">
              <button
                className="cursor-pointer rounded-lg border-none bg-card px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm transition-all hover:bg-accent"
                onClick={() => {
                  setSwipeDirection('right');
                  quizActions.handlePrev();
                }}
              >
                ← {t('이전')}
              </button>

              <span className="text-sm font-semibold text-foreground">
                {quiz.currentQuestion}
                <span className="font-normal text-muted-foreground"> / {quiz.totalQuestions}</span>
              </span>

              <button
                className="cursor-pointer rounded-lg border-none bg-card px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm transition-all hover:bg-accent"
                onClick={() => {
                  setSwipeDirection('left');
                  quizActions.handleNext();
                }}
              >
                {t('다음')} →
              </button>
            </div>

            {/* 스와이프 카드 영역 */}
            <div className="relative flex flex-1 items-start overflow-hidden px-5">
              <AnimatePresence mode="wait" custom={swipeDirection}>
                <motion.div
                  key={quiz.currentQuestion}
                  custom={swipeDirection}
                  variants={cardVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={handleDragEnd}
                  className="w-full cursor-grab active:cursor-grabbing"
                >
                  <div className="flex flex-col rounded-2xl bg-card shadow-card">
                    {/* 질문 + 검토 체크박스 */}
                    <div className="flex items-start rounded-t-2xl bg-muted p-5 max-md:flex-col max-md:gap-3">
                      <div className="flex-1 pr-3 max-md:w-full max-md:pr-0">
                        <div className="m-0 break-words text-base leading-relaxed text-foreground">
                          <MarkdownText>{quiz.currentQuiz.title}</MarkdownText>
                        </div>
                      </div>
                      <div className="shrink-0 border-l border-border pl-3 max-md:self-end max-md:border-l-0 max-md:pl-0">
                        <label className="flex cursor-pointer select-none items-center gap-2 whitespace-nowrap text-sm font-bold text-muted-foreground transition-colors hover:text-primary">
                          <input
                            type="checkbox"
                            checked={quiz.currentQuiz.check || false}
                            onChange={quizActions.handleCheckToggle}
                            className="h-4 w-4 cursor-pointer accent-primary"
                          />
                          {t('검토')}
                        </label>
                      </div>
                    </div>

                    {/* 선택지 리스트 — stagger 등장 */}
                    <div className="flex flex-col gap-3 p-5 max-md:gap-2">
                      {quiz.currentQuiz.selections.map((opt, idx) => (
                        <motion.div
                          key={opt.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            delay: idx * 0.06,
                            type: 'spring',
                            stiffness: 300,
                            damping: 25,
                          }}
                          className={cn(
                            'flex min-h-14 cursor-pointer items-center rounded-xl bg-muted px-4 py-4 transition-all duration-200',
                            'hover:scale-[1.01] hover:bg-accent hover:shadow-sm',
                            'max-md:min-h-12 max-md:px-3',
                            quiz.selectedOption === opt.id &&
                              'bg-primary/10 shadow-sm ring-2 ring-primary',
                          )}
                          onClick={() => quizActions.handleOptionSelect(opt.id)}
                        >
                          <span
                            className={cn(
                              'mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-card text-sm font-semibold',
                              'max-md:mr-2 max-md:h-6 max-md:w-6 max-md:text-xs',
                              quiz.selectedOption === opt.id &&
                                'bg-primary text-primary-foreground',
                            )}
                          >
                            {idx + 1}
                          </span>
                          <span className="break-words pr-3 text-base leading-relaxed max-md:pr-2 max-md:text-sm">
                            <MarkdownText>{opt.content}</MarkdownText>
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* 확인 + 제출 버튼 */}
                  <div className="mt-4 flex gap-3">
                    <button
                      className="flex-1 cursor-pointer rounded-xl border-none bg-primary py-3 text-base font-medium text-primary-foreground transition-all hover:bg-primary/90"
                      onClick={quizActions.handleSubmit}
                    >
                      {t('확인')}
                    </button>
                    <button
                      className="cursor-pointer rounded-xl border-none bg-card px-5 py-3 text-base font-medium text-primary shadow-sm transition-all hover:bg-primary/10"
                      onClick={quizActions.handleFinish}
                    >
                      {t('제출하기')}
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}
      </main>

      {/* ──────────────────────────────────────────
          바텀 시트 (문제 네비게이션)
      ────────────────────────────────────────── */}
      {/* 오버레이 — 시트 열릴 때만 표시 */}
      <AnimatePresence>
        {isSheetOpen && (
          <motion.div
            key="sheet-overlay"
            className="fixed inset-0 z-40 bg-foreground/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSheetOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-card shadow-lg"
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.3, bottom: 0.1 }}
        onDragEnd={handleSheetDragEnd}
        animate={{ y: isSheetOpen ? -300 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* 핸들 pill */}
        <div
          className="flex cursor-pointer flex-col items-center gap-1 px-5 pb-2 pt-3"
          onClick={() => setIsSheetOpen((prev) => !prev)}
        >
          <div className="h-1 w-10 rounded-full bg-border" />
          <div className="flex w-full items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              {quiz.currentQuestion} / {quiz.totalQuestions}
            </span>
            <span className="text-xs text-muted-foreground">
              {isSheetOpen ? '▼ ' : '▲ '}
              {t('문제 목록')}
            </span>
          </div>
        </div>

        {/* 펼쳐지는 문제 번호 그리드 */}
        <div className="max-h-[300px] overflow-y-auto px-5 pb-6 pt-2">
          {/* 범례 */}
          <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded bg-primary" />
              {t('현재')}
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded bg-accent" />
              {t('답변 완료')}
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded bg-warning/25" />
              {t('검토')}
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded border border-border bg-card" />
              {t('미답변')}
            </span>
          </div>

          {/* 번호 그리드 */}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(2.25rem,1fr))] gap-2">
            {quiz.quizzes.map((q) => renderQuestionButton(q, 'sheet-'))}
            {Array.from({ length: remainingCount }).map((_, index) =>
              renderPendingButton(index, 'sheet-'),
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SolveQuizMagicD;
