import { useTranslation } from 'i18nexus';

import React, { useEffect } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSolveQuiz } from '#features/solve-quiz';
import { isUnanswered } from '../../features/solve-quiz/lib/isUnanswered';
import { useQuizGenerationStore } from '#features/quiz-generation';
import { cn } from '@/shared/ui/lib/utils';
import { motion } from 'framer-motion';
import MarkdownText from '@/shared/ui/components/markdown-text';
import { ChevronLeft, ChevronRight, Clock, CheckCircle2, Circle } from 'lucide-react';

/** Stagger Reveal — 상단 진행률 바 + 선택지 연쇄 등장 */
const SolveQuizMagicB: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { problemSetId } = useParams<{ problemSetId: string }>();
  const [searchParams] = useSearchParams();
  const isMock = searchParams.get('mock') === 'true';
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

  /** 진행 상태 퍼센트 계산 */
  const progressPercent = Math.round((quiz.answeredCount / quiz.totalQuestions) * 100);

  /** 진행률 바 세그먼트 생성 */
  const renderProgressBar = () => {
    const segments = quiz.quizzes.map((q) => {
      const unanswered = isUnanswered(q.userAnswer, q.selections);
      if (q.check) return 'review';
      if (unanswered) return 'unanswered';
      return 'answered';
    });

    return segments.map((status, idx) => {
      let bgColor = 'bg-muted';
      if (status === 'answered') bgColor = 'bg-emerald-500';
      if (status === 'review') bgColor = 'bg-amber-500';
      if (status === 'unanswered') bgColor = 'bg-destructive/50';

      return (
        <motion.div
          key={idx}
          className={cn('h-2 flex-1 transition-colors', bgColor)}
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: idx * 0.02, duration: 0.2 }}
        />
      );
    });
  };

  /** 컨테이너 애니메이션 */
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.1 },
    },
  };

  /** 아이템 애니메이션 */
  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 120, damping: 15 },
    },
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* 제출 다이얼로그 */}
      {quiz.showSubmitDialog && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={quizActions.handleOverlayClick}
        >
          <motion.div
            className="w-[90%] max-w-[600px] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 shadow-2xl max-md:m-5 max-md:w-[95%]"
            style={{ maxHeight: '80vh' }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 150 }}
          >
            {/* 다이얼로그 헤더 */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-6 py-5">
              <h2 className="m-0 text-xl font-bold text-slate-900 dark:text-white">
                {t('제출 확인')}
              </h2>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-md border-none bg-transparent text-2xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={quizActions.handleCancelSubmit}
              >
                ×
              </button>
            </div>

            {/* 다이얼로그 콘텐츠 */}
            <div className="p-6 space-y-6">
              {/* 통계 그리드 */}
              <div className="grid grid-cols-2 gap-4">
                <motion.div
                  className="rounded-xl bg-slate-50 dark:bg-slate-800 p-4 border border-slate-200 dark:border-slate-700"
                  variants={itemVariants}
                >
                  <div className="text-xs font-semibold uppercase text-slate-500 mb-2">
                    {t('전체 문제')}
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {quiz.totalQuestions}
                  </div>
                </motion.div>

                <motion.div
                  className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-4 border border-emerald-300 dark:border-emerald-700"
                  variants={itemVariants}
                >
                  <div className="text-xs font-semibold uppercase text-emerald-700 dark:text-emerald-300 mb-2">
                    {t('답변')}
                  </div>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {quiz.answeredCount}
                  </div>
                </motion.div>

                <motion.div
                  className="rounded-xl bg-red-50 dark:bg-red-950/30 p-4 border border-red-300 dark:border-red-700"
                  variants={itemVariants}
                >
                  <div className="text-xs font-semibold uppercase text-red-700 dark:text-red-300 mb-2">
                    {t('미답변')}
                  </div>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {quiz.unansweredCount}
                  </div>
                </motion.div>

                <motion.div
                  className="rounded-xl bg-amber-50 dark:bg-amber-950/30 p-4 border border-amber-300 dark:border-amber-700"
                  variants={itemVariants}
                >
                  <div className="text-xs font-semibold uppercase text-amber-700 dark:text-amber-300 mb-2">
                    {t('검토')}
                  </div>
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {quiz.reviewCount}
                  </div>
                </motion.div>
              </div>

              {/* 선택한 답안 리스트 */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
                  {t('선택한 답안')}
                </h3>
                <div className="max-h-[250px] overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 divide-y divide-slate-200 dark:divide-slate-700">
                  {quiz.quizzes.map((quizItem) => {
                    const unanswered = isUnanswered(quizItem.userAnswer, quizItem.selections);
                    const selectedAnswer = unanswered
                      ? t('미선택')
                      : quizItem.selections?.find((sel) => sel.id === quizItem.userAnswer)
                          ?.content || `${quizItem.userAnswer}번`;

                    return (
                      <div key={quizItem.number} className="flex items-center gap-3 px-4 py-3">
                        <span className="font-bold text-slate-500 dark:text-slate-400 min-w-[40px]">
                          Q{quizItem.number}
                        </span>
                        <span
                          className={cn(
                            'flex-1 text-sm',
                            unanswered && 'text-red-600 dark:text-red-400 italic',
                            quizItem.check && 'text-amber-600 dark:text-amber-400',
                            !unanswered && !quizItem.check && 'text-slate-700 dark:text-slate-300',
                          )}
                        >
                          {selectedAnswer}
                        </span>
                        {quizItem.check && (
                          <span className="px-2 py-1 bg-amber-500 text-white text-xs font-semibold rounded">
                            {t('검토')}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 다이얼로그 버튼 */}
            <div className="flex gap-3 border-t border-slate-200 dark:border-slate-700 px-6 py-5">
              <button
                className="flex-1 px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                onClick={quizActions.handleCancelSubmit}
              >
                {t('취소')}
              </button>
              <button
                className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
                onClick={quizActions.handleConfirmSubmit}
              >
                {t('제출하기')}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 상단 진행률 바 */}
      <div className="sticky top-0 z-40 h-2 w-full flex gap-0.5 bg-slate-200/50 dark:bg-slate-800/50">
        {renderProgressBar()}
      </div>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 flex flex-col">
        <motion.div
          className="mx-auto w-full max-w-2xl px-6 py-8 flex flex-col"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* 진행 상태 패널 */}
          <motion.div
            variants={itemVariants}
            className="mb-8 rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-lg border border-slate-200 dark:border-slate-800"
          >
            <div className="flex items-center justify-between gap-6">
              <div className="flex-1">
                <div className="text-sm font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                  {t('진행 상태')}
                </div>
                <div className="text-3xl font-black text-slate-900 dark:text-white">
                  {progressPercent}%
                </div>
              </div>

              <div className="flex-1 flex items-center gap-4">
                <div className="text-center">
                  <div className="text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold mb-1">
                    {t('답변')}
                  </div>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {quiz.answeredCount}
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold mb-1">
                    {t('검토')}
                  </div>
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {quiz.reviewCount}
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold mb-1">
                    {t('시간')}
                  </div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                    {quiz.currentTime}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 문제 로딩 상태 */}
          {quiz.isLoading ? (
            <motion.div
              className="flex flex-col items-center justify-center py-20"
              variants={itemVariants}
            >
              <motion.div
                className="h-12 w-12 rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-blue-500"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <p className="mt-4 text-slate-600 dark:text-slate-400">{t('문제 로딩 중…')}</p>
            </motion.div>
          ) : (
            <>
              {/* 질문 영역 */}
              <motion.div
                variants={itemVariants}
                className="mb-6 rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-lg border border-slate-200 dark:border-slate-800"
              >
                <div className="text-sm uppercase font-bold text-blue-600 dark:text-blue-400 mb-3">
                  Q{quiz.currentQuestion}
                </div>
                <div className="text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
                  <MarkdownText>{quiz.currentQuiz.title}</MarkdownText>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={quiz.currentQuiz.check || false}
                      onChange={quizActions.handleCheckToggle}
                      className="h-5 w-5 cursor-pointer accent-amber-500"
                    />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {t('검토')}
                    </span>
                  </label>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {quiz.currentQuestion} / {quiz.totalQuestions}
                  </div>
                </div>
              </motion.div>

              {/* 선택지 — 연쇄 등장 */}
              <motion.div className="space-y-3 mb-8" variants={containerVariants}>
                {quiz.currentQuiz.selections.map((opt, idx) => (
                  <motion.button
                    key={opt.id}
                    variants={itemVariants}
                    onClick={() => quizActions.handleOptionSelect(opt.id)}
                    className={cn(
                      'w-full text-left rounded-xl border-2 p-4 transition-all duration-200',
                      'hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-500',
                      quiz.selectedOption === opt.id
                        ? 'border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-950/30 shadow-lg'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800',
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-300">
                          {idx + 1}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-medium text-slate-900 dark:text-white break-words">
                          <MarkdownText>{opt.content}</MarkdownText>
                        </p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </motion.div>

              {/* 네비게이션 버튼 */}
              <motion.div variants={itemVariants} className="flex gap-3">
                <button
                  onClick={quizActions.handlePrev}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  {t('이전')}
                </button>
                <button
                  onClick={quizActions.handleNext}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  {t('다음')}
                  <ChevronRight className="w-5 h-5" />
                </button>
              </motion.div>

              {/* 확인 및 제출 버튼 */}
              <motion.div variants={itemVariants} className="flex gap-3 mt-6">
                <button
                  onClick={quizActions.handleSubmit}
                  className="flex-1 px-6 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-base hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
                >
                  {t('확인')}
                </button>
                <button
                  onClick={quizActions.handleFinish}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white font-bold text-base hover:from-blue-700 hover:to-blue-800 transition-colors"
                >
                  {t('제출')}
                </button>
              </motion.div>
            </>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default SolveQuizMagicB;
