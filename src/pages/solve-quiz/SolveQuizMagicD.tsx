import { useTranslation } from 'i18nexus';

import React, { useEffect } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSolveQuiz } from '#features/solve-quiz';
import { isUnanswered } from '../../features/solve-quiz/lib/isUnanswered';
import { useQuizGenerationStore } from '#features/quiz-generation';
import { cn } from '@/shared/ui/lib/utils';
import { motion } from 'framer-motion';
import MarkdownText from '@/shared/ui/components/markdown-text';
import { Zap, CheckCircle2, Circle as CircleIcon, Clock } from 'lucide-react';

/** Glassmorphism with backdrop-blur — 프로스트글라스 효과 + 배경블러 */
const SolveQuizMagicD: React.FC = () => {
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
    hidden: { opacity: 0, y: 10, backdropFilter: 'blur(0px)' },
    visible: {
      opacity: 1,
      y: 0,
      backdropFilter: 'blur(10px)',
      transition: { type: 'spring', stiffness: 120, damping: 15 },
    },
  };

  return (
    <div
      className="flex min-h-screen bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 dark:from-cyan-950 dark:via-slate-900 dark:to-purple-950 relative overflow-hidden"
      style={{
        backgroundImage: `
          radial-gradient(circle at 20% 50%, rgba(34, 197, 94, 0.2) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.2) 0%, transparent 50%),
          linear-gradient(135deg, #06b6d4 0%, #0ea5e9 25%, #6366f1 75%, #a855f7 100%)
        `,
      }}
    >
      {/* 동적 배경 요소 */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute w-96 h-96 rounded-full bg-gradient-to-br from-cyan-400/20 to-transparent blur-3xl"
          animate={{ x: [0, 100, 0], y: [0, -50, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          style={{ top: '10%', left: '-10%' }}
        />
        <motion.div
          className="absolute w-80 h-80 rounded-full bg-gradient-to-br from-purple-400/20 to-transparent blur-3xl"
          animate={{ x: [0, -100, 0], y: [0, 100, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          style={{ bottom: '10%', right: '-10%' }}
        />
      </div>

      {/* 제출 다이얼로그 */}
      {quiz.showSubmitDialog && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={quizActions.handleOverlayClick}
        >
          <motion.div
            className="w-[90%] max-w-[600px] overflow-y-auto rounded-2xl backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 shadow-2xl border border-white/20 max-md:m-5 max-md:w-[95%]"
            style={{ maxHeight: '80vh' }}
            initial={{ opacity: 0, scale: 0.9, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 150 }}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <h2 className="m-0 text-lg font-bold text-slate-900 dark:text-white">
                {t('제출 확인')}
              </h2>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-md border-none bg-transparent text-2xl text-slate-500 hover:bg-white/20 dark:hover:bg-white/10"
                onClick={quizActions.handleCancelSubmit}
              >
                ×
              </button>
            </div>

            {/* 통계 */}
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
                    className="rounded-xl backdrop-blur-lg bg-white/10 border border-white/20 p-4 text-center hover:bg-white/20 transition-colors"
                    variants={itemVariants}
                  >
                    <div className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mb-2">
                      {stat.label}
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                      {stat.value}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* 답안 */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
                  {t('선택한 답안')}
                </h3>
                <div className="max-h-[250px] overflow-y-auto rounded-lg backdrop-blur-lg bg-white/5 border border-white/20 divide-y divide-white/10">
                  {quiz.quizzes.map((quizItem) => {
                    const unanswered = isUnanswered(quizItem.userAnswer, quizItem.selections);
                    const selectedAnswer = unanswered
                      ? t('미선택')
                      : quizItem.selections?.find((sel) => sel.id === quizItem.userAnswer)
                          ?.content || `${quizItem.userAnswer}번`;

                    return (
                      <div key={quizItem.number} className="flex items-center gap-3 px-4 py-3">
                        <span className="font-bold text-slate-700 dark:text-slate-300 min-w-[40px]">
                          Q{quizItem.number}
                        </span>
                        <span
                          className={cn(
                            'flex-1 text-sm',
                            unanswered && 'text-slate-600 dark:text-slate-400 italic',
                            quizItem.check && 'text-cyan-600 dark:text-cyan-300 font-semibold',
                            !unanswered && !quizItem.check && 'text-slate-800 dark:text-slate-200',
                          )}
                        >
                          {selectedAnswer}
                        </span>
                        {quizItem.check && (
                          <span className="px-2 py-1 bg-cyan-500/80 backdrop-blur text-white text-xs font-semibold rounded">
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
            <div className="flex gap-3 border-t border-white/10 px-6 py-5">
              <button
                className="flex-1 px-4 py-2.5 rounded-lg backdrop-blur bg-white/10 hover:bg-white/20 border border-white/20 text-slate-900 dark:text-white font-semibold transition-colors"
                onClick={quizActions.handleCancelSubmit}
              >
                {t('취소')}
              </button>
              <button
                className="flex-1 px-4 py-2.5 rounded-lg backdrop-blur bg-cyan-500/80 hover:bg-cyan-600/90 text-white font-semibold border border-cyan-300/30 transition-colors"
                onClick={quizActions.handleConfirmSubmit}
              >
                {t('제출하기')}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 메인 콘텐츠 */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-8">
        <motion.div
          className="w-full max-w-3xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.08, delayChildren: 0.1 }}
        >
          {/* 진행률 카드 */}
          <motion.div
            variants={itemVariants}
            className="mb-8 rounded-2xl backdrop-blur-xl bg-white/10 dark:bg-white/5 border border-white/20 p-8 shadow-2xl"
          >
            <div className="flex items-center justify-between gap-8">
              <div>
                <div className="text-sm font-bold uppercase text-cyan-200 mb-2 tracking-widest">
                  {t('진행 상태')}
                </div>
                <div className="text-5xl font-black text-white">{progressPercent}%</div>
              </div>

              <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xs font-semibold text-cyan-200 uppercase mb-1">답변</div>
                  <div className="text-2xl font-black text-white">{quiz.answeredCount}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-cyan-200 uppercase mb-1">검토</div>
                  <div className="text-2xl font-black text-white">{quiz.reviewCount}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-cyan-200 uppercase mb-1">전체</div>
                  <div className="text-2xl font-black text-white">{quiz.totalQuestions}</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 로딩 */}
          {quiz.isLoading ? (
            <motion.div
              className="flex flex-col items-center justify-center py-20"
              variants={itemVariants}
            >
              <motion.div
                className="h-12 w-12 rounded-full border-4 border-white/30 border-t-white"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <p className="mt-4 text-white/70">{t('문제 로딩 중…')}</p>
            </motion.div>
          ) : (
            <>
              {/* 질문 카드 */}
              <motion.div
                variants={itemVariants}
                className="mb-8 rounded-2xl backdrop-blur-xl bg-white/10 dark:bg-white/5 border border-white/20 p-8 shadow-2xl"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-yellow-300" />
                  <span className="text-sm font-bold uppercase text-cyan-200 tracking-widest">
                    Q{quiz.currentQuestion} / {quiz.totalQuestions}
                  </span>
                </div>
                <h2 className="text-3xl font-black text-white mb-6 leading-tight">
                  <MarkdownText>{quiz.currentQuiz.title}</MarkdownText>
                </h2>
                <label className="flex items-center gap-3 cursor-pointer select-none w-fit group">
                  <input
                    type="checkbox"
                    checked={quiz.currentQuiz.check || false}
                    onChange={quizActions.handleCheckToggle}
                    className="h-5 w-5 cursor-pointer"
                  />
                  <span className="font-semibold text-cyan-300 group-hover:text-cyan-200">
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
                    variants={itemVariants}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      'w-full text-left rounded-xl backdrop-blur-lg p-5 border transition-all duration-200',
                      quiz.selectedOption === opt.id
                        ? 'bg-white/30 dark:bg-white/15 border-white/40 shadow-lg'
                        : 'bg-white/10 dark:bg-white/5 border-white/20 hover:bg-white/15 dark:hover:bg-white/10',
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-white font-bold shadow-lg">
                          {idx + 1}
                        </div>
                      </div>
                      <p className="flex-1 text-base font-medium text-white break-words">
                        <MarkdownText>{opt.content}</MarkdownText>
                      </p>
                    </div>
                  </motion.button>
                ))}
              </motion.div>

              {/* 네비게이션 */}
              <motion.div className="flex gap-4 mb-6" variants={itemVariants}>
                <button
                  onClick={quizActions.handlePrev}
                  className="flex-1 px-6 py-3 rounded-lg backdrop-blur-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold transition-colors"
                >
                  {t('이전')}
                </button>
                <button
                  onClick={quizActions.handleNext}
                  className="flex-1 px-6 py-3 rounded-lg backdrop-blur-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold transition-colors"
                >
                  {t('다음')}
                </button>
              </motion.div>

              {/* 액션 */}
              <motion.div className="flex gap-4" variants={itemVariants}>
                <button
                  onClick={quizActions.handleSubmit}
                  className="flex-1 px-6 py-3 rounded-lg backdrop-blur-lg bg-white/20 hover:bg-white/30 border border-white/30 text-white font-bold transition-colors"
                >
                  {t('확인')}
                </button>
                <button
                  onClick={quizActions.handleFinish}
                  className="px-6 py-3 rounded-lg backdrop-blur-lg bg-gradient-to-r from-cyan-400/80 to-blue-500/80 hover:from-cyan-400/90 hover:to-blue-500/90 border border-cyan-300/30 text-white font-bold transition-colors shadow-lg"
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

export default SolveQuizMagicD;
