import { useTranslation } from 'i18nexus';
import React, { useEffect } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSolveQuiz } from '#features/solve-quiz';
import { isUnanswered } from '../../features/solve-quiz/lib/isUnanswered';
import { useQuizGenerationStore } from '#features/quiz-generation';
import { cn } from '@/shared/ui/lib/utils';
import { motion } from 'framer-motion';
import MarkdownText from '@/shared/ui/components/markdown-text';
import { CheckCircle2, Circle, ChevronDown, ChevronUp } from 'lucide-react';

const SolveQuizDesignC: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { problemSetId } = useParams<{ problemSetId: string }>();
  const [searchParams] = useSearchParams();
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
    return () => resetQuizGeneration();
  }, [resetQuizGeneration]);

  const progressPercent = Math.round((quiz.answeredCount / quiz.totalQuestions) * 100);

  return (
    <div className="flex min-h-screen bg-white dark:bg-slate-950">
      {quiz.showSubmitDialog && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50"
          onClick={quizActions.handleOverlayClick}
        >
          <motion.div
            className="w-[90%] max-w-[600px] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 shadow-2xl max-md:m-5"
            style={{ maxHeight: '80vh' }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-6 py-5">
              <h2 className="m-0 text-lg font-bold text-slate-900 dark:text-white">
                {t('제출 확인')}
              </h2>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-md border-none bg-transparent text-2xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={quizActions.handleCancelSubmit}
              >
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
                ].map((stat) => (
                  <motion.div
                    key={stat.label}
                    className="rounded-xl bg-slate-50 dark:bg-slate-800 p-4 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-2">
                      {stat.label}
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                      {stat.value}
                    </div>
                  </motion.div>
                ))}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
                  {t('선택한 답안')}
                </h3>
                <div className="max-h-[250px] overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 divide-y">
                  {quiz.quizzes.map((item) => {
                    const unanswered = isUnanswered(item.userAnswer, item.selections);
                    const ans = unanswered
                      ? t('미선택')
                      : item.selections?.find((s) => s.id === item.userAnswer)?.content || '';
                    return (
                      <div key={item.number} className="flex items-center gap-3 px-4 py-3">
                        <span className="font-bold text-slate-500 dark:text-slate-400 min-w-[40px]">
                          Q{item.number}
                        </span>
                        <span
                          className={cn('flex-1 text-sm', unanswered && 'italic text-slate-500')}
                        >
                          {ans}
                        </span>
                        {item.check && (
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
            <div className="flex gap-3 border-t border-slate-200 dark:border-slate-700 px-6 py-5">
              <button
                className="flex-1 px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                onClick={quizActions.handleCancelSubmit}
              >
                {t('취소')}
              </button>
              <button
                className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 text-white font-semibold"
                onClick={quizActions.handleConfirmSubmit}
              >
                {t('제출')}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <div className="flex-1 flex">
        {/* 좌측 타임라인 */}
        <div className="hidden lg:flex lg:w-56 flex-col bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 border-r border-slate-200 dark:border-slate-800 p-6 overflow-y-auto sticky top-0 h-screen">
          <div className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-4">
            문제진행
          </div>
          <div className="space-y-2 flex-1">
            {quiz.quizzes.map((q, idx) => {
              const unanswered = isUnanswered(q.userAnswer, q.selections);
              const isCurrent = q.number === quiz.currentQuestion;
              return (
                <motion.button
                  key={q.number}
                  onClick={() => quizActions.handleJumpTo(q.number)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all',
                    isCurrent && 'bg-blue-100 dark:bg-blue-950 border-l-4 border-l-blue-600',
                    !isCurrent && 'hover:bg-slate-200 dark:hover:bg-slate-800',
                  )}
                  whileHover={{ x: 4 }}
                >
                  {!unanswered ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <Circle className={cn('w-4 h-4 flex-shrink-0', q.check && 'text-amber-600')} />
                  )}
                  <span
                    className={cn(
                      'text-sm font-semibold',
                      isCurrent
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-slate-700 dark:text-slate-300',
                    )}
                  >
                    Q{q.number}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* 우측 콘텐츠 */}
        <main className="flex-1 flex flex-col px-6 lg:px-10 py-8">
          <div className="max-w-2xl w-full mx-auto flex-1 flex flex-col">
            {quiz.isLoading ? (
              <div className="flex items-center justify-center flex-1">
                <motion.div
                  className="h-12 w-12 rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-blue-500"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <div className="text-sm font-bold uppercase text-slate-600 dark:text-slate-400 mb-2">
                    진행률 {progressPercent}%
                  </div>
                  <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                </div>

                <motion.div
                  className="mb-8 p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="text-sm uppercase font-bold text-blue-600 dark:text-blue-400 mb-3">
                    Q{quiz.currentQuestion}
                  </div>
                  <h2 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white mb-6 leading-tight">
                    <MarkdownText>{quiz.currentQuiz.title}</MarkdownText>
                  </h2>
                  <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
                    <input
                      type="checkbox"
                      checked={quiz.currentQuiz.check || false}
                      onChange={quizActions.handleCheckToggle}
                      className="h-4 w-4 accent-amber-500"
                    />
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      {t('검토')}
                    </span>
                  </label>
                </motion.div>

                <motion.div
                  className="space-y-3 mb-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ staggerChildren: 0.06, delayChildren: 0.2 }}
                >
                  {quiz.currentQuiz.selections.map((opt, idx) => (
                    <motion.button
                      key={opt.id}
                      onClick={() => quizActions.handleOptionSelect(opt.id)}
                      className={cn(
                        'w-full text-left rounded-xl border-2 p-4 transition-all',
                        quiz.selectedOption === opt.id
                          ? 'border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-950'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-400',
                      )}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-sm font-bold">
                          {idx + 1}
                        </div>
                        <p className="flex-1 text-base font-medium text-slate-900 dark:text-white">
                          <MarkdownText>{opt.content}</MarkdownText>
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </motion.div>

                <div className="flex gap-4 mt-auto">
                  <button
                    onClick={quizActions.handlePrev}
                    className="flex-1 px-6 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold"
                  >
                    {t('이전')}
                  </button>
                  <button
                    onClick={quizActions.handleNext}
                    className="flex-1 px-6 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold"
                  >
                    {t('다음')}
                  </button>
                </div>
                <div className="flex gap-4 mt-4">
                  <button
                    onClick={quizActions.handleSubmit}
                    className="flex-1 px-6 py-3 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold"
                  >
                    {t('확인')}
                  </button>
                  <button
                    onClick={quizActions.handleFinish}
                    className="px-6 py-3 rounded-lg bg-blue-600 text-white font-bold"
                  >
                    {t('제출')}
                  </button>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SolveQuizDesignC;
