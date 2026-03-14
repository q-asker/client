import { useTranslation } from 'i18nexus';

import React, { useEffect } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSolveQuiz } from '#features/solve-quiz';
import { isUnanswered } from '../../features/solve-quiz/lib/isUnanswered';
import { useQuizGenerationStore } from '#features/quiz-generation';
import { cn } from '@/shared/ui/lib/utils';
import { motion } from 'framer-motion';
import MarkdownText from '@/shared/ui/components/markdown-text';
import { CheckCircle2, Circle, Clock } from 'lucide-react';

/** Minimalist Progress Sidebar — 좌측 고정 진행률 패널 + 중앙 큰 텍스트 강조 */
const SolveQuizDesignA: React.FC = () => {
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

  /** 진행 상태 퍼센트 */
  const progressPercent = Math.round((quiz.answeredCount / quiz.totalQuestions) * 100);

  /** 아이템 애니메이션 */
  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 120, damping: 15 },
    },
  };

  return (
    <div className="flex min-h-screen bg-white dark:bg-slate-950">
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
          >
            {/* 다이얼로그 헤더 */}
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

            {/* 다이얼로그 콘텐츠 */}
            <div className="p-6 space-y-6">
              {/* 통계 그리드 */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: t('전체'), value: quiz.totalQuestions, color: 'slate' },
                  { label: t('답변'), value: quiz.answeredCount, color: 'emerald' },
                  { label: t('미답변'), value: quiz.unansweredCount, color: 'red' },
                  { label: t('검토'), value: quiz.reviewCount, color: 'amber' },
                ].map((stat) => (
                  <motion.div
                    key={stat.label}
                    variants={itemVariants}
                    className={cn(
                      'rounded-xl p-4 text-center',
                      stat.color === 'slate' &&
                        'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700',
                      stat.color === 'emerald' &&
                        'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-700',
                      stat.color === 'red' &&
                        'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-700',
                      stat.color === 'amber' &&
                        'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700',
                    )}
                  >
                    <div className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-400 mb-1">
                      {stat.label}
                    </div>
                    <div
                      className={cn(
                        'text-2xl font-bold',
                        stat.color === 'slate' && 'text-slate-900 dark:text-white',
                        stat.color === 'emerald' && 'text-emerald-700 dark:text-emerald-300',
                        stat.color === 'red' && 'text-red-700 dark:text-red-300',
                        stat.color === 'amber' && 'text-amber-700 dark:text-amber-300',
                      )}
                    >
                      {stat.value}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* 선택한 답안 */}
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

      {/* 좌측 고정 사이드바 */}
      <motion.aside
        className="hidden lg:flex lg:flex-col w-80 bg-gradient-to-b from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-950 border-r border-slate-200 dark:border-slate-800 p-8 sticky top-0 h-screen overflow-y-auto"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', stiffness: 100 }}
      >
        {/* 진행률 시각화 */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="mb-4">
            <div className="text-sm font-semibold uppercase text-slate-600 dark:text-slate-400 mb-2">
              {t('진행률')}
            </div>
            <div className="text-4xl font-black text-slate-900 dark:text-white">
              {progressPercent}%
            </div>
          </div>

          {/* 원형 진행률 바 */}
          <div className="relative w-32 h-32 mx-auto mb-6">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              {/* 배경 원 */}
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="text-slate-300 dark:text-slate-700"
              />
              {/* 진행 원 */}
              <motion.circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray={`${Math.PI * 100 * (progressPercent / 100)} ${Math.PI * 100}`}
                className="text-blue-600 dark:text-blue-400"
                initial={{ strokeDasharray: '0 314' }}
                animate={{
                  strokeDasharray: `${Math.PI * 100 * (progressPercent / 100)} ${Math.PI * 100}`,
                }}
                transition={{ duration: 0.8, delay: 0.2 }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {quiz.answeredCount}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
                  /{quiz.totalQuestions}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 상태 배지 */}
        <motion.div variants={itemVariants} className="space-y-3 mb-8">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-700">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold uppercase text-emerald-700 dark:text-emerald-300">
                {t('답변')}
              </div>
              <div className="text-lg font-bold text-emerald-900 dark:text-emerald-200">
                {quiz.answeredCount}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700">
            <Circle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold uppercase text-amber-700 dark:text-amber-300">
                {t('검토')}
              </div>
              <div className="text-lg font-bold text-amber-900 dark:text-amber-200">
                {quiz.reviewCount}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-700">
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold uppercase text-blue-700 dark:text-blue-300">
                {t('경과')}
              </div>
              <div className="text-lg font-bold text-blue-900 dark:text-blue-200 tabular-nums">
                {quiz.currentTime}
              </div>
            </div>
          </div>
        </motion.div>

        {/* 구분선 */}
        <div className="h-px bg-slate-300 dark:bg-slate-700 mb-8" />

        {/* 문제 네비게이션 그리드 */}
        <motion.div variants={itemVariants} className="flex-1 min-w-0">
          <div className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-400 mb-4">
            {t('문제')}
          </div>
          <div className="grid grid-cols-5 gap-2">
            {quiz.quizzes.map((q) => {
              const unanswered = isUnanswered(q.userAnswer, q.selections);
              const isCurrent = q.number === quiz.currentQuestion;

              let bgColor = 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300';
              if (!unanswered) bgColor = 'bg-emerald-500 dark:bg-emerald-600 text-white';
              if (q.check) bgColor = 'bg-amber-500 dark:bg-amber-600 text-white';
              if (isCurrent)
                bgColor =
                  'bg-blue-600 dark:bg-blue-500 text-white ring-2 ring-blue-300 dark:ring-blue-700';

              return (
                <motion.button
                  key={q.number}
                  onClick={() => quizActions.handleJumpTo(q.number)}
                  className={cn(
                    'h-10 rounded-lg font-bold text-sm transition-all hover:scale-105',
                    bgColor,
                  )}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {q.number}
                </motion.button>
              );
            })}
            {Array.from({ length: remainingCount }).map((_, idx) => (
              <div
                key={`pending-${idx}`}
                className="h-10 rounded-lg bg-slate-200 dark:bg-slate-800 border-2 border-dashed border-slate-400 dark:border-slate-600 animate-pulse"
              />
            ))}
          </div>
        </motion.div>
      </motion.aside>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 flex flex-col">
        {/* 모바일 헤더 */}
        <div className="lg:hidden flex items-center justify-between bg-blue-600 dark:bg-blue-700 text-white px-6 py-4">
          <button
            onClick={() => navigate('/')}
            className="text-2xl font-bold hover:opacity-80 transition-opacity"
          >
            ×
          </button>
          <div className="font-mono text-sm">{quiz.currentTime}</div>
        </div>

        {/* 모바일 진행 표시 */}
        <div className="lg:hidden bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-slate-900 px-6 py-4 border-b border-blue-200 dark:border-blue-900">
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <div className="text-xs uppercase font-semibold text-slate-600 dark:text-slate-400">
                진행률
              </div>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                {progressPercent}%
              </div>
            </div>
            <div className="w-px h-12 bg-blue-200 dark:bg-blue-900" />
            <div className="text-center flex-1">
              <div className="text-xs uppercase font-semibold text-slate-600 dark:text-slate-400">
                답변/검토
              </div>
              <div className="text-lg font-black text-slate-900 dark:text-white">
                {quiz.answeredCount}/{quiz.reviewCount}
              </div>
            </div>
          </div>
        </div>

        {/* 콘텐츠 영역 */}
        <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-8 lg:py-12 max-w-5xl w-full mx-auto">
          {quiz.isLoading ? (
            <motion.div
              className="flex flex-col items-center justify-center py-20"
              variants={itemVariants}
            >
              <motion.div
                className="h-12 w-12 rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-blue-500"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <p className="mt-4 text-slate-600 dark:text-slate-400">{t('문제 로딩 중…')}</p>
            </motion.div>
          ) : (
            <>
              {/* 큰 질문 텍스트 강조 */}
              <motion.div variants={itemVariants} className="mb-12">
                <div className="text-sm font-bold uppercase text-blue-600 dark:text-blue-400 mb-4 tracking-widest">
                  Q{quiz.currentQuestion} / {quiz.totalQuestions}
                </div>
                <h1 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white leading-tight mb-6">
                  <MarkdownText>{quiz.currentQuiz.title}</MarkdownText>
                </h1>
                <label className="flex items-center gap-3 cursor-pointer select-none w-fit">
                  <input
                    type="checkbox"
                    checked={quiz.currentQuiz.check || false}
                    onChange={quizActions.handleCheckToggle}
                    className="h-5 w-5 cursor-pointer accent-amber-500"
                  />
                  <span className="font-semibold text-amber-600 dark:text-amber-400 text-base">
                    {t('검토')}
                  </span>
                </label>
              </motion.div>

              {/* 선택지 */}
              <motion.div
                className="space-y-4 mb-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.08, delayChildren: 0.2 }}
              >
                {quiz.currentQuiz.selections.map((opt, idx) => (
                  <motion.button
                    key={opt.id}
                    onClick={() => quizActions.handleOptionSelect(opt.id)}
                    variants={itemVariants}
                    className={cn(
                      'w-full text-left rounded-xl border-2 p-5 lg:p-6 transition-all duration-200',
                      'hover:shadow-lg',
                      quiz.selectedOption === opt.id
                        ? 'border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-950/30 shadow-lg'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-600',
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-base font-bold text-slate-700 dark:text-slate-300">
                          {idx + 1}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-lg font-medium text-slate-900 dark:text-white break-words leading-relaxed">
                          <MarkdownText>{opt.content}</MarkdownText>
                        </p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </motion.div>

              {/* 버튼 */}
              <motion.div variants={itemVariants} className="flex gap-4">
                <button
                  onClick={quizActions.handlePrev}
                  className="flex-1 px-6 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  {t('이전')}
                </button>
                <button
                  onClick={quizActions.handleNext}
                  className="flex-1 px-6 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  {t('다음')}
                </button>
              </motion.div>

              <motion.div variants={itemVariants} className="flex gap-4 mt-4">
                <button
                  onClick={quizActions.handleSubmit}
                  className="flex-1 px-6 py-3 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
                >
                  {t('확인')}
                </button>
                <button
                  onClick={quizActions.handleFinish}
                  className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white font-bold hover:from-blue-700 hover:to-blue-800 transition-colors"
                >
                  {t('제출')}
                </button>
              </motion.div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default SolveQuizDesignA;
