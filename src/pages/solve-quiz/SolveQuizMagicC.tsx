import { useTranslation } from 'i18nexus';

import React, { useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSolveQuiz } from '#features/solve-quiz';
import { isUnanswered } from '../../features/solve-quiz/lib/isUnanswered';
import { useQuizGenerationStore } from '#features/quiz-generation';
import { cn } from '@/shared/ui/lib/utils';
import MarkdownText from '@/shared/ui/components/markdown-text';
import { motion, AnimatePresence } from 'framer-motion';

/** F안: Immersive Focus — 중앙 집중형 카드, 캡슐 선택지, 수평 슬라이드 전환 */
const SolveQuizMagicC: React.FC = () => {
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

  /** 슬라이드 방향 추적 */
  const [slideDir, setSlideDir] = React.useState<1 | -1>(1);
  const prevQuestion = React.useRef(quiz.currentQuestion);
  useEffect(() => {
    if (quiz.currentQuestion !== prevQuestion.current) {
      setSlideDir(quiz.currentQuestion > prevQuestion.current ? 1 : -1);
      prevQuestion.current = quiz.currentQuestion;
    }
  }, [quiz.currentQuestion]);

  useEffect(() => {
    return () => {
      resetQuizGeneration();
    };
  }, [resetQuizGeneration]);

  /** 선택지 라벨 (A, B, C, D, ...) */
  const optionLabel = (idx: number) => String.fromCharCode(65 + idx);

  /** 문제 번호 버튼 렌더링 */
  const renderQuestionButton = (
    q: (typeof quiz.quizzes)[number],
    keyPrefix = '',
  ): React.ReactElement => {
    const unanswered = isUnanswered(q.userAnswer, q.selections);
    const isCurrent = q.number === quiz.currentQuestion;
    return (
      <button
        key={`${keyPrefix}${q.number}`}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold',
          'cursor-pointer transition-all duration-200',
          'border border-border bg-card text-muted-foreground hover:bg-muted',
          !unanswered && 'border-primary/50 bg-primary/10 text-primary',
          q.check && 'border-amber-400 bg-amber-50 text-amber-600',
          isCurrent && 'border-primary bg-primary text-primary-foreground hover:bg-primary',
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
      className="flex h-8 w-8 animate-pulse items-center justify-center rounded-full border border-dashed border-border bg-muted text-xs text-muted-foreground"
      disabled
    >
      ···
    </button>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* 제출 다이얼로그 */}
      {quiz.showSubmitDialog && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={quizActions.handleOverlayClick}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-[90%] max-w-[600px] overflow-y-auto rounded-2xl bg-card shadow-xl max-md:m-5 max-md:w-[95%]"
            style={{ maxHeight: '80vh' }}
          >
            {/* 다이얼로그 헤더 */}
            <div className="flex items-center justify-between border-b border-border px-6 py-5">
              <h2 className="m-0 text-xl font-semibold text-foreground">{t('제출 확인')}</h2>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full border-none bg-muted text-lg text-muted-foreground transition-colors hover:bg-muted/80"
                onClick={quizActions.handleCancelSubmit}
              >
                ✕
              </button>
            </div>

            {/* 다이얼로그 콘텐츠 */}
            <div className="p-6">
              {/* 상단 통계 — 가로 칩 */}
              <div className="mb-6 flex flex-wrap gap-3">
                <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-2">
                  <span className="text-sm text-muted-foreground">{t('전체 문제:')}</span>
                  <span className="text-sm font-bold text-foreground">
                    {quiz.quizzes.length}
                    {t('개')}
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2">
                  <span className="text-sm text-emerald-600">{t('답변한 문제:')}</span>
                  <span className="text-sm font-bold text-emerald-700">
                    {quiz.answeredCount}
                    {t('개')}
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-red-50 px-4 py-2">
                  <span className="text-sm text-red-600">{t('안푼 문제:')}</span>
                  <span className="text-sm font-bold text-red-700">
                    {quiz.unansweredCount}
                    {t('개')}
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2">
                  <span className="text-sm text-amber-600">{t('검토할 문제:')}</span>
                  <span className="text-sm font-bold text-amber-700">
                    {quiz.reviewCount}
                    {t('개')}
                  </span>
                </div>
              </div>

              {/* 문제별 선택 답안 */}
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
                            unanswered && 'italic text-red-600',
                            quizItem.check && 'text-amber-600',
                          )}
                        >
                          <MarkdownText>{selectedAnswer}</MarkdownText>
                          {quizItem.check && (
                            <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-medium text-white">
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
                className="cursor-pointer rounded-full border-none bg-muted px-6 py-2.5 font-medium text-muted-foreground transition-all duration-200 hover:bg-muted/80 max-md:w-full"
                onClick={quizActions.handleCancelSubmit}
              >
                {t('취소')}
              </button>
              <button
                className="cursor-pointer rounded-full border-none bg-primary px-6 py-2.5 font-medium text-primary-foreground transition-all duration-200 hover:bg-primary/90 max-md:w-full"
                onClick={quizActions.handleConfirmSubmit}
              >
                {t('제출하기')}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── 상단 헤더 ── */}
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground">
        <div className="flex items-center justify-between px-5 py-3">
          <button
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-none bg-primary-foreground/15 text-primary-foreground transition-all duration-200 hover:bg-primary-foreground/25"
            onClick={() => navigate('/')}
          >
            ✕
          </button>

          {/* 중앙: 타이머 + 문제 번호 */}
          <div className="flex flex-col items-center">
            <span className="font-mono text-lg font-semibold tabular-nums">{quiz.currentTime}</span>
            <span className="text-xs text-primary-foreground/70">
              {quiz.currentQuestion} / {quiz.totalQuestions}
            </span>
          </div>

          {/* 검토 토글 */}
          <button
            className={cn(
              'flex h-9 cursor-pointer items-center gap-1.5 rounded-full border-none px-3 text-sm font-medium transition-all duration-200',
              quiz.currentQuiz.check
                ? 'bg-amber-400 text-white'
                : 'bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/25',
            )}
            onClick={quizActions.handleCheckToggle}
          >
            ★ {t('검토')}
          </button>
        </div>

        {/* 프로그레스 바 */}
        <div className="h-1 w-full bg-primary-foreground/20">
          <motion.div
            className="h-full bg-primary-foreground"
            initial={false}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </header>

      {/* ── 메인 콘텐츠 ── */}
      <main className="mx-auto flex w-full max-w-[800px] flex-1 flex-col px-5 py-6 max-md:px-4">
        {quiz.isLoading ? (
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
            <p className="text-muted-foreground">{t('문제 로딩 중…')}</p>
          </div>
        ) : (
          <>
            {/* 스트리밍 안내 */}
            {remainingCount > 0 && (
              <div className="mb-4 flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm text-primary">
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                {remainingCount}
                {t('개 문제 생성 중…')}
              </div>
            )}

            {/* 좌측 문제 번호 패널 (데스크톱) */}
            <div className="relative flex flex-1">
              <aside className="absolute grid -translate-x-[120%] grid-cols-[repeat(5,minmax(2rem,1fr))] gap-2 rounded-2xl bg-card p-4 shadow-md max-[1500px]:hidden">
                {quiz.quizzes.map((q) => renderQuestionButton(q))}
                {Array.from({ length: remainingCount }).map((_, index) =>
                  renderPendingButton(index),
                )}
              </aside>

              {/* 카드 슬라이드 전환 */}
              <div className="flex w-full flex-1 flex-col gap-5 overflow-hidden">
                <AnimatePresence mode="wait" initial={false} custom={slideDir}>
                  <motion.div
                    key={quiz.currentQuestion}
                    custom={slideDir}
                    initial={{ x: slideDir * 80, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: slideDir * -80, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="flex flex-col gap-5"
                  >
                    {/* 질문 카드 */}
                    <div className="rounded-2xl bg-card p-6 shadow-sm max-md:p-4">
                      <div className="break-words text-base leading-relaxed text-foreground">
                        <MarkdownText>{quiz.currentQuiz.title}</MarkdownText>
                      </div>
                    </div>

                    {/* 선택지 */}
                    <div className="flex flex-col gap-3 max-md:gap-2">
                      {quiz.currentQuiz.selections.map((opt, idx) => {
                        const isSelected = quiz.selectedOption === opt.id;
                        return (
                          <motion.button
                            key={opt.id}
                            whileTap={{ scale: 0.98 }}
                            className={cn(
                              'flex w-full cursor-pointer items-start gap-3 rounded-xl border-2 bg-card px-4 py-4 text-left transition-all duration-200',
                              'max-md:gap-2 max-md:px-3 max-md:py-3',
                              isSelected
                                ? 'border-primary bg-primary/5 shadow-sm'
                                : 'border-transparent hover:border-border hover:bg-muted/50',
                            )}
                            onClick={() => quizActions.handleOptionSelect(opt.id)}
                          >
                            <span
                              className={cn(
                                'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold transition-all duration-200',
                                'max-md:h-6 max-md:w-6 max-md:text-xs',
                                isSelected
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-muted-foreground',
                              )}
                            >
                              {optionLabel(idx)}
                            </span>
                            <span className="flex-1 break-words pt-0.5 text-base leading-relaxed text-foreground max-md:text-sm">
                              <MarkdownText>{opt.content}</MarkdownText>
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* 이전/확인/다음 버튼 바 */}
                <div className="mt-auto flex items-center gap-3 pt-4 max-md:pt-2">
                  <button
                    className="cursor-pointer rounded-xl border border-border bg-card px-5 py-3 font-medium text-foreground transition-all duration-200 hover:bg-muted max-md:px-3"
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
                    className="cursor-pointer rounded-xl border border-border bg-card px-5 py-3 font-medium text-foreground transition-all duration-200 hover:bg-muted max-md:px-3"
                    onClick={quizActions.handleNext}
                  >
                    →
                  </button>
                </div>

                {/* 제출하기 */}
                <button
                  className="mt-2 cursor-pointer self-end rounded-xl border-none bg-destructive px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-destructive/90 max-md:w-full max-md:self-stretch"
                  onClick={quizActions.handleFinish}
                >
                  {t('제출하기')}
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      {/* 하단 문제 번호 패널 (모바일/태블릿) */}
      <aside className="mt-auto hidden grid-cols-[repeat(auto-fill,2rem)] justify-center gap-2 border-t border-border bg-card px-5 py-4 max-[1500px]:grid">
        {quiz.quizzes.map((q) => renderQuestionButton(q, 'bottom-'))}
        {Array.from({ length: remainingCount }).map((_, index) =>
          renderPendingButton(index, 'bottom-'),
        )}
      </aside>
    </div>
  );
};

export default SolveQuizMagicC;
