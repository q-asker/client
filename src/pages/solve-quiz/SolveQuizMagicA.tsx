import { useTranslation } from 'i18nexus';

import React, { useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSolveQuiz } from '#features/solve-quiz';
import { isUnanswered } from '../../features/solve-quiz/lib/isUnanswered';
import { useQuizGenerationStore } from '#features/quiz-generation';
import { cn } from '@/shared/ui/lib/utils';
import MarkdownText from '@/shared/ui/components/markdown-text';
import { CheckCircle2, Circle, Clock } from 'lucide-react';

/** MagicA: Dynamic Progress Tracker — 원형 진행률 + 좌측 sticky 패널 + spring 애니메이션 */
const SolveQuizMagicA: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { problemSetId } = useParams<{ problemSetId: string }>();
  const { uploadedUrl } = (location.state as { uploadedUrl?: string }) || {};
  const storeProblemSetId = useQuizGenerationStore((state) => state.problemSetId);
  const streamQuizzes = useQuizGenerationStore((state) => state.quizzes);
  const streamIsStreaming = useQuizGenerationStore((state) => state.isStreaming);
  const resetQuizGeneration = useQuizGenerationStore((state) => state.resetStreamingState);

  const isSameProblemSet = String(storeProblemSetId ?? '') === String(problemSetId ?? '');
  const quizzes = isSameProblemSet ? streamQuizzes : [];
  const isStreaming = isSameProblemSet ? streamIsStreaming : false;

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

  const progressPercent = Math.round((quiz.answeredCount / quiz.totalQuestions) * 100) || 0;

  useEffect(() => {
    return () => {
      resetQuizGeneration();
    };
  }, [resetQuizGeneration]);

  /** 문제 번호 버튼 (원형) */
  const renderQuestionButton = (q: (typeof quiz.quizzes)[number]): React.ReactElement => {
    const unanswered = isUnanswered(q.userAnswer, q.selections);
    const isActive = q.number === quiz.currentQuestion;

    return (
      <motion.button
        key={`q-${q.number}`}
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-200',
          isActive && 'border-primary bg-primary text-primary-foreground shadow-lg',
          !isActive && !unanswered && 'border-success/40 bg-success/10 text-success',
          !isActive && q.check && 'border-warning/60 bg-warning/10 text-warning',
          unanswered && !isActive && 'border-border/40 bg-background text-muted-foreground',
        )}
        onClick={() => quizActions.handleJumpTo(q.number)}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.95 }}
      >
        {q.number}
      </motion.button>
    );
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 15 } },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900/50 dark:to-slate-950">
      {/* 제출 다이얼로그 */}
      {quiz.showSubmitDialog && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50"
          onClick={quizActions.handleOverlayClick}
        >
          <motion.div
            className="w-[90%] max-w-[600px] overflow-y-auto rounded-2xl bg-card shadow-2xl max-md:m-5 max-md:w-[95%]"
            style={{ maxHeight: '80vh' }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 120 }}
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-5">
              <h2 className="m-0 text-xl font-semibold text-foreground">{t('제출 확인')}</h2>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-md border-none bg-transparent text-2xl text-muted-foreground hover:bg-muted"
                onClick={quizActions.handleCancelSubmit}
              >
                x
              </button>
            </div>

            <div className="p-6">
              <div className="mb-8 grid grid-cols-2 gap-4 rounded-xl bg-muted p-5 max-md:grid-cols-1 max-md:gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-muted-foreground">{t('전체 문제:')}</span>
                  <span className="text-sm font-semibold">{quiz.quizzes.length}개</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-muted-foreground">{t('답변한 문제:')}</span>
                  <span className="text-sm font-semibold text-success">{quiz.answeredCount}개</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-muted-foreground">{t('안푼 문제:')}</span>
                  <span className="text-sm font-semibold text-destructive">
                    {quiz.unansweredCount}개
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-muted-foreground">{t('검토할 문제:')}</span>
                  <span className="text-sm font-semibold text-warning">{quiz.reviewCount}개</span>
                </div>
              </div>

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
                          {quizItem.number}번:
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
          </motion.div>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-4 py-8 max-md:px-3">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* 좌측 sticky 패널 — 진행 정보 */}
          <motion.aside
            className="lg:sticky lg:top-8 lg:self-start flex flex-col gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* 원형 진행률 */}
            <motion.div
              variants={itemVariants}
              className="relative aspect-square w-full max-w-[200px]"
            >
              <svg className="h-full w-full" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-muted/20"
                />

                <motion.circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="url(#progressGradient)"
                  strokeWidth="3"
                  strokeDasharray={`${(progressPercent / 100) * 314} 314`}
                  strokeLinecap="round"
                  className="origin-center -rotate-90 transition-all duration-500"
                />

                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgb(59, 130, 246)" />
                    <stop offset="100%" stopColor="rgb(139, 92, 246)" />
                  </linearGradient>
                </defs>

                <text
                  x="60"
                  y="50"
                  textAnchor="middle"
                  className="fill-foreground text-lg font-bold"
                >
                  {progressPercent}%
                </text>
                <text x="60" y="70" textAnchor="middle" className="fill-muted-foreground text-xs">
                  {quiz.answeredCount}/{quiz.totalQuestions}
                </text>
              </svg>
            </motion.div>

            {/* 상태 배지들 */}
            <motion.div variants={itemVariants} className="space-y-2">
              <div className="flex items-center gap-2 rounded-lg bg-success/10 p-3">
                <CheckCircle2 className="size-4 text-success" />
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground">{t('완료')}</div>
                  <div className="text-sm font-bold text-success">{quiz.answeredCount}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-lg bg-warning/10 p-3">
                <Circle className="size-4 text-warning" />
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground">{t('검토')}</div>
                  <div className="text-sm font-bold text-warning">{quiz.reviewCount}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
                <Clock className="size-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground">{t('소요시간')}</div>
                  <div className="text-sm font-mono font-bold text-foreground">
                    {quiz.currentTime}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 제출 버튼 */}
            <motion.button
              variants={itemVariants}
              className="mt-auto rounded-lg bg-gradient-to-r from-primary to-accent px-4 py-3 text-center font-semibold text-primary-foreground transition-all duration-200 hover:shadow-lg"
              onClick={quizActions.handleFinish}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {t('제출하기')}
            </motion.button>
          </motion.aside>

          {/* 우측 패널 — 문제 영역 */}
          <motion.div
            className="flex flex-col gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* 상단 네비게이션 */}
            <motion.div variants={itemVariants} className="flex items-center gap-3">
              <button
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90"
                onClick={quizActions.handlePrev}
              >
                {t('이전')}
              </button>
              <div className="text-center text-sm font-semibold text-muted-foreground">
                {quiz.currentQuestion} / {quiz.totalQuestions}
              </div>
              <button
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90"
                onClick={quizActions.handleNext}
              >
                {t('다음')}
              </button>
            </motion.div>

            {/* 문제 표시 */}
            <motion.div
              variants={itemVariants}
              className="rounded-xl border border-border/50 bg-card/50 p-6 backdrop-blur"
            >
              <div className="mb-4">
                <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Q{String(quiz.currentQuestion).padStart(2, '0')}
                </div>
                <div className="mt-2 whitespace-pre-wrap text-lg font-semibold text-foreground">
                  <MarkdownText>{quiz.currentQuiz.title}</MarkdownText>
                </div>
              </div>

              <label className="flex cursor-pointer select-none items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                <input
                  type="checkbox"
                  checked={quiz.currentQuiz.check || false}
                  onChange={quizActions.handleCheckToggle}
                  className="h-4 w-4 cursor-pointer accent-primary"
                />
                {t('검토')}
              </label>
            </motion.div>

            {/* 선택지 */}
            <motion.div className="flex flex-col gap-2">
              {quiz.currentQuiz.selections.map((opt, idx) => (
                <motion.button
                  key={opt.id}
                  className={cn(
                    'flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-border/50 bg-card/50 px-4 py-3 text-left transition-all duration-200 backdrop-blur',
                    'hover:border-primary/50 hover:bg-card',
                    quiz.selectedOption === opt.id && 'border-primary bg-primary/10',
                  )}
                  onClick={() => quizActions.handleOptionSelect(opt.id)}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                    {idx + 1}
                  </div>
                  <span className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                    <MarkdownText>{opt.content}</MarkdownText>
                  </span>
                </motion.button>
              ))}
            </motion.div>

            {/* 확인 버튼 */}
            <motion.button
              variants={itemVariants}
              className="rounded-lg bg-gradient-to-r from-primary to-accent px-6 py-3 text-center font-semibold text-primary-foreground transition-all duration-200 hover:shadow-lg max-md:py-2 max-md:text-sm"
              onClick={quizActions.handleSubmit}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {t('확인')}
            </motion.button>

            {/* 문제 네비게이션 그리드 */}
            <motion.div
              variants={itemVariants}
              className="flex flex-wrap gap-2 rounded-lg border border-border/30 bg-card/30 p-4 backdrop-blur"
            >
              {quiz.quizzes.map((q) => renderQuestionButton(q))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SolveQuizMagicA;
