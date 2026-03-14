import { useTranslation } from 'i18nexus';
import React, { useEffect } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSolveQuiz } from '#features/solve-quiz';
import { isUnanswered } from '../../features/solve-quiz/lib/isUnanswered';
import { useQuizGenerationStore } from '#features/quiz-generation';
import { cn } from '@/shared/ui/lib/utils';
import { motion } from 'framer-motion';
import MarkdownText from '@/shared/ui/components/markdown-text';
const SolveQuizDesignE: React.FC = () => {
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
  useEffect(() => {
    return () => resetQuizGeneration();
  }, [resetQuizGeneration]);
  const progressPercent = Math.round((quiz.answeredCount / quiz.totalQuestions) * 100);
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950 dark:to-slate-950">
      {quiz.showSubmitDialog && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50"
          onClick={quizActions.handleOverlayClick}
        >
          <motion.div
            className="w-[90%] max-w-[600px] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 shadow-2xl"
            style={{ maxHeight: '80vh' }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="flex items-center justify-between border-b px-6 py-5">
              <h2 className="m-0 text-lg font-bold">{t('제출 확인')}</h2>
              <button className="text-2xl" onClick={quizActions.handleCancelSubmit}>
                ×
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: t('전체'), value: quiz.totalQuestions },
                  { label: t('답변'), value: quiz.answeredCount },
                  { label: t('미답변'), value: quiz.unansweredCount },
                  { label: t('검토'), value: quiz.reviewCount },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-lg bg-orange-50 dark:bg-orange-900/30 p-4 text-center"
                  >
                    <div className="text-xs font-bold uppercase">{s.label}</div>
                    <div className="text-2xl font-black mt-2">{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3 border-t px-6 py-5">
              <button
                className="flex-1 px-4 py-2.5 rounded-lg bg-orange-100 dark:bg-orange-900/30 font-semibold"
                onClick={quizActions.handleCancelSubmit}
              >
                {t('취소')}
              </button>
              <button
                className="flex-1 px-4 py-2.5 rounded-lg bg-orange-600 text-white font-semibold"
                onClick={quizActions.handleConfirmSubmit}
              >
                {t('제출')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
      <main className="p-6 max-w-7xl mx-auto">
        <div className="mb-6 rounded-2xl bg-white dark:bg-slate-900 p-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-black">{t('문제')}</h1>
            <span className="text-lg font-bold text-orange-600">{progressPercent}%</span>
          </div>
          <div className="h-2 bg-orange-200 dark:bg-orange-900/30 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-orange-500 to-amber-500"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
        {quiz.isLoading ? (
          <div className="flex items-center justify-center h-96">
            <motion.div
              className="h-12 w-12 rounded-full border-4 border-orange-200 dark:border-orange-900 border-t-orange-600"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {quiz.quizzes.map((q, idx) => {
                const unanswered = isUnanswered(q.userAnswer, q.selections);
                return (
                  <motion.button
                    key={q.number}
                    onClick={() => quizActions.handleJumpTo(q.number)}
                    className={cn(
                      'p-4 rounded-lg text-center transition-all',
                      q.number === quiz.currentQuestion &&
                        'bg-orange-600 text-white border-2 border-orange-600',
                      !unanswered && 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700',
                      q.check && 'bg-amber-100 dark:bg-amber-900/30 text-amber-700',
                      !q.check && unanswered && 'bg-gray-100 dark:bg-gray-800 text-gray-700',
                    )}
                    whileHover={{ scale: 1.05 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                  >
                    <div className="font-bold">Q{q.number}</div>
                    <div className="text-xs mt-1">
                      {!unanswered ? '정답' : q.check ? '검토' : '미답변'}
                    </div>
                  </motion.button>
                );
              })}
            </div>
            <motion.div
              className="bg-white dark:bg-slate-900 rounded-2xl p-8 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <h2 className="text-3xl font-black mb-6">
                <MarkdownText>{quiz.currentQuiz.title}</MarkdownText>
              </h2>
              <label className="flex items-center gap-2 cursor-pointer w-fit">
                <input
                  type="checkbox"
                  checked={quiz.currentQuiz.check || false}
                  onChange={quizActions.handleCheckToggle}
                  className="h-4 w-4"
                />
                <span className="font-semibold text-amber-600">{t('검토')}</span>
              </label>
            </motion.div>
            <motion.div
              className="space-y-4 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.05, delayChildren: 0.1 }}
            >
              {quiz.currentQuiz.selections.map((opt, idx) => (
                <motion.button
                  key={opt.id}
                  onClick={() => quizActions.handleOptionSelect(opt.id)}
                  className={cn(
                    'w-full text-left rounded-xl border-2 p-5 transition-all',
                    quiz.selectedOption === opt.id
                      ? 'border-orange-600 bg-orange-50 dark:bg-orange-950'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 hover:border-orange-400',
                  )}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30 text-sm font-bold">
                      {idx + 1}
                    </div>
                    <p className="flex-1 text-base font-medium">
                      <MarkdownText>{opt.content}</MarkdownText>
                    </p>
                  </div>
                </motion.button>
              ))}
            </motion.div>
            <div className="flex gap-4">
              <button
                onClick={quizActions.handlePrev}
                className="flex-1 px-6 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 font-semibold"
              >
                {t('이전')}
              </button>
              <button
                onClick={quizActions.handleNext}
                className="flex-1 px-6 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 font-semibold"
              >
                {t('다음')}
              </button>
            </div>
            <div className="flex gap-4 mt-4">
              <button
                onClick={quizActions.handleSubmit}
                className="flex-1 px-6 py-3 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold"
              >
                {t('확인')}
              </button>
              <button
                onClick={quizActions.handleFinish}
                className="px-6 py-3 rounded-lg bg-orange-600 text-white font-bold"
              >
                {t('제출')}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};
export default SolveQuizDesignE;
