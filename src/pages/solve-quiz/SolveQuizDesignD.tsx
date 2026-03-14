import { useTranslation } from 'i18nexus';
import React, { useEffect } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSolveQuiz } from '#features/solve-quiz';
import { isUnanswered } from '../../features/solve-quiz/lib/isUnanswered';
import { useQuizGenerationStore } from '#features/quiz-generation';
import { cn } from '@/shared/ui/lib/utils';
import { motion } from 'framer-motion';
import MarkdownText from '@/shared/ui/components/markdown-text';

const SolveQuizDesignD: React.FC = () => {
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

  useEffect(() => {
    return () => resetQuizGeneration();
  }, [resetQuizGeneration]);

  const progressPercent = Math.round((quiz.answeredCount / quiz.totalQuestions) * 100);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
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
                    className="rounded-lg bg-slate-50 dark:bg-slate-800 p-4 text-center"
                  >
                    <div className="text-xs font-bold uppercase text-slate-600">{s.label}</div>
                    <div className="text-2xl font-black mt-2">{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3 border-t px-6 py-5">
              <button
                className="flex-1 px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold"
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

      {/* 상단 진행률 헤더 */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                {t('풀이 진행')}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Q{quiz.currentQuestion} / {quiz.totalQuestions}
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-black text-blue-600 dark:text-blue-400">
                {progressPercent}%
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {quiz.answeredCount} / {quiz.totalQuestions}
              </p>
            </div>
          </div>
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* 좌측 요약 */}
          <motion.aside
            className="lg:col-span-1 rounded-2xl bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 h-fit sticky top-32"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h3 className="text-lg font-bold mb-4">{t('통계')}</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                <span className="text-sm font-semibold text-emerald-700">{t('정답')}</span>
                <span className="text-xl font-black text-emerald-600">{quiz.answeredCount}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                <span className="text-sm font-semibold text-amber-700">{t('검토')}</span>
                <span className="text-xl font-black text-amber-600">{quiz.reviewCount}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-red-50 dark:bg-red-950/30">
                <span className="text-sm font-semibold text-red-700">{t('미답변')}</span>
                <span className="text-xl font-black text-red-600">{quiz.unansweredCount}</span>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 font-semibold">
                {t('문제네비')}
              </p>
              <div className="grid grid-cols-5 gap-2">
                {quiz.quizzes.slice(0, 10).map((q) => {
                  const unanswered = isUnanswered(q.userAnswer, q.selections);
                  return (
                    <motion.button
                      key={q.number}
                      onClick={() => quizActions.handleJumpTo(q.number)}
                      className={cn(
                        'h-8 rounded text-xs font-bold',
                        q.number === quiz.currentQuestion && 'bg-blue-600 text-white',
                        !unanswered && 'bg-emerald-500 text-white',
                        q.check && 'bg-amber-500 text-white',
                      )}
                      whileHover={{ scale: 1.1 }}
                    >
                      {q.number}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.aside>

          {/* 우측 문제 */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {quiz.isLoading ? (
              <div className="flex items-center justify-center h-96">
                <motion.div
                  className="h-12 w-12 rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-blue-500"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              </div>
            ) : (
              <>
                <motion.div
                  className="mb-8 rounded-2xl bg-white dark:bg-slate-900 p-8 border border-slate-200 dark:border-slate-800"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-6 leading-tight">
                    <MarkdownText>{quiz.currentQuiz.title}</MarkdownText>
                  </h2>
                  <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
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
                  transition={{ staggerChildren: 0.06, delayChildren: 0.2 }}
                >
                  {quiz.currentQuiz.selections.map((opt, idx) => (
                    <motion.button
                      key={opt.id}
                      onClick={() => quizActions.handleOptionSelect(opt.id)}
                      className={cn(
                        'w-full text-left rounded-xl border-2 p-5 transition-all',
                        quiz.selectedOption === opt.id
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-400',
                      )}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-sm font-bold">
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
                    className="flex-1 px-6 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
                  >
                    {t('이전')}
                  </button>
                  <button
                    onClick={quizActions.handleNext}
                    className="flex-1 px-6 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
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
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default SolveQuizDesignD;
