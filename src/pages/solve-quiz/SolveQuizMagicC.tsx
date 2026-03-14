import { useTranslation } from 'i18nexus';

import React, { useEffect } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSolveQuiz } from '#features/solve-quiz';
import { isUnanswered } from '../../features/solve-quiz/lib/isUnanswered';
import { useQuizGenerationStore } from '#features/quiz-generation';
import { cn } from '@/shared/ui/lib/utils';
import { motion } from 'framer-motion';
import MarkdownText from '@/shared/ui/components/markdown-text';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

/** Rotating Progress Ring with 3D — 회전 효과 + 3D 원근 */
const SolveQuizMagicC: React.FC = () => {
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

  /** 진행률 퍼센트 */
  const progressPercent = Math.round((quiz.answeredCount / quiz.totalQuestions) * 100);

  /** 회전 각도 (진행도에 따라) */
  const rotationDeg = (progressPercent / 100) * 360;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950 dark:via-slate-900 dark:to-purple-950">
      {/* 제출 다이얼로그 */}
      {quiz.showSubmitDialog && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={quizActions.handleOverlayClick}
        >
          <motion.div
            className="w-[90%] max-w-[600px] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 shadow-2xl max-md:m-5 max-md:w-[95%]"
            style={{ maxHeight: '80vh' }}
            initial={{ opacity: 0, scale: 0.9, rotateY: -20 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ type: 'spring', stiffness: 150 }}
          >
            {/* 헤더 */}
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

            {/* 통계 그리드 */}
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    label: t('전체'),
                    value: quiz.totalQuestions,
                    bg: 'bg-slate-100 dark:bg-slate-800',
                  },
                  {
                    label: t('답변'),
                    value: quiz.answeredCount,
                    bg: 'bg-emerald-100 dark:bg-emerald-950/30',
                  },
                  {
                    label: t('미답변'),
                    value: quiz.unansweredCount,
                    bg: 'bg-red-100 dark:bg-red-950/30',
                  },
                  {
                    label: t('검토'),
                    value: quiz.reviewCount,
                    bg: 'bg-purple-100 dark:bg-purple-950/30',
                  },
                ].map((stat) => (
                  <motion.div
                    key={stat.label}
                    className={cn('rounded-xl p-4 text-center', stat.bg)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
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

              {/* 답안 리스트 */}
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
                            quizItem.check && 'text-purple-600 dark:text-purple-400',
                            !unanswered && !quizItem.check && 'text-slate-700 dark:text-slate-300',
                          )}
                        >
                          {selectedAnswer}
                        </span>
                        {quizItem.check && (
                          <span className="px-2 py-1 bg-purple-500 text-white text-xs font-semibold rounded">
                            {t('검토')}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex gap-3 border-t border-slate-200 dark:border-slate-700 px-6 py-5">
              <button
                className="flex-1 px-4 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                onClick={quizActions.handleCancelSubmit}
              >
                {t('취소')}
              </button>
              <button
                className="flex-1 px-4 py-2.5 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors"
                onClick={quizActions.handleConfirmSubmit}
              >
                {t('제출하기')}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 메인 콘텐츠 */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <motion.div
          className="w-full max-w-3xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.1, delayChildren: 0.1 }}
        >
          {/* 회전 진행률 고리 */}
          <motion.div
            className="flex justify-center mb-12"
            initial={{ scale: 0, rotateZ: -180 }}
            animate={{ scale: 1, rotateZ: 0 }}
            transition={{ type: 'spring', stiffness: 80, damping: 20 }}
          >
            <div
              className="relative w-40 h-40"
              style={{
                perspective: '1000px',
                transformStyle: 'preserve-3d',
              }}
            >
              <motion.svg
                className="w-full h-full"
                viewBox="0 0 160 160"
                animate={{ rotateZ: rotationDeg }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* 배경 원 */}
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-slate-200 dark:text-slate-700"
                />
                {/* 진행 원호 */}
                <motion.circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke="url(#progressGradient)"
                  strokeWidth="8"
                  strokeDasharray={`${(progressPercent / 100) * 440} 440`}
                  strokeLinecap="round"
                  initial={{ strokeDasharray: '0 440' }}
                  animate={{ strokeDasharray: `${(progressPercent / 100) * 440} 440` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
                {/* 그래디언트 정의 */}
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgb(102, 51, 153)" />
                    <stop offset="100%" stopColor="rgb(99, 102, 241)" />
                  </linearGradient>
                </defs>
              </motion.svg>

              {/* 중앙 텍스트 */}
              <motion.div
                className="absolute inset-0 flex flex-col items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="text-4xl font-black text-slate-900 dark:text-white">
                  {progressPercent}%
                </div>
                <div className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mt-1">
                  완료
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* 로딩 표시 */}
          {quiz.isLoading ? (
            <motion.div
              className="flex flex-col items-center justify-center py-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="h-12 w-12 rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-purple-500"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <p className="mt-4 text-slate-600 dark:text-slate-400">{t('문제 로딩 중…')}</p>
            </motion.div>
          ) : (
            <>
              {/* 질문 영역 */}
              <motion.div
                className="mb-8 rounded-2xl bg-white dark:bg-slate-900 p-8 shadow-lg border border-slate-200 dark:border-slate-800"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 100 }}
              >
                <div className="text-sm font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400 mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />Q{quiz.currentQuestion} / {quiz.totalQuestions}
                </div>
                <h2 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white mb-6 leading-tight">
                  <MarkdownText>{quiz.currentQuiz.title}</MarkdownText>
                </h2>
                <label className="flex items-center gap-3 cursor-pointer select-none w-fit group">
                  <input
                    type="checkbox"
                    checked={quiz.currentQuiz.check || false}
                    onChange={quizActions.handleCheckToggle}
                    className="h-5 w-5 cursor-pointer accent-purple-500"
                  />
                  <span className="font-semibold text-purple-600 dark:text-purple-400 group-hover:text-purple-700">
                    {t('검토')}
                  </span>
                </label>
              </motion.div>

              {/* 선택지 */}
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
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ x: 8 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      'w-full text-left rounded-xl border-2 p-5 transition-all duration-200',
                      'hover:shadow-lg',
                      quiz.selectedOption === opt.id
                        ? 'border-purple-600 dark:border-purple-400 bg-purple-50 dark:bg-purple-950/30 shadow-lg'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-600',
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 text-white font-bold">
                          {idx + 1}
                        </div>
                      </div>
                      <p className="flex-1 text-base font-medium text-slate-900 dark:text-white break-words">
                        <MarkdownText>{opt.content}</MarkdownText>
                      </p>
                    </div>
                  </motion.button>
                ))}
              </motion.div>

              {/* 네비게이션 */}
              <motion.div
                className="flex gap-4 mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <button
                  onClick={quizActions.handlePrev}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  {t('이전')}
                </button>
                <button
                  onClick={quizActions.handleNext}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  {t('다음')}
                  <ChevronRight className="w-5 h-5" />
                </button>
              </motion.div>

              {/* 액션 버튼 */}
              <motion.div
                className="flex gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <button
                  onClick={quizActions.handleSubmit}
                  className="flex-1 px-6 py-3 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
                >
                  {t('확인')}
                </button>
                <button
                  onClick={quizActions.handleFinish}
                  className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-500 dark:to-indigo-500 text-white font-bold hover:from-purple-700 hover:to-indigo-700 transition-colors"
                >
                  {t('제출')}
                </button>
              </motion.div>

              {/* 문제 네비게이션 그리드 */}
              <motion.div
                className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <div className="text-sm font-bold uppercase text-slate-600 dark:text-slate-400 mb-4">
                  {t('문제')}
                </div>
                <div className="grid grid-cols-8 gap-2">
                  {quiz.quizzes.map((q) => {
                    const unanswered = isUnanswered(q.userAnswer, q.selections);
                    const isCurrent = q.number === quiz.currentQuestion;

                    let bgColor =
                      'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400';
                    if (!unanswered) bgColor = 'bg-emerald-500 text-white';
                    if (q.check) bgColor = 'bg-purple-500 text-white';
                    if (isCurrent)
                      bgColor =
                        'bg-indigo-600 text-white ring-2 ring-indigo-300 dark:ring-indigo-700';

                    return (
                      <motion.button
                        key={q.number}
                        onClick={() => quizActions.handleJumpTo(q.number)}
                        className={cn(
                          'h-9 rounded-lg font-bold text-sm transition-all hover:scale-110',
                          bgColor,
                        )}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {q.number}
                      </motion.button>
                    );
                  })}
                  {Array.from({ length: remainingCount }).map((_, idx) => (
                    <div
                      key={`pending-${idx}`}
                      className="h-9 rounded-lg bg-slate-200 dark:bg-slate-700 border border-dashed border-slate-400 dark:border-slate-600 animate-pulse"
                    />
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default SolveQuizMagicC;
