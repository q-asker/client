import { useTranslation } from 'i18nexus';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuizResult } from '#features/quiz-result';
import { MOCK_RESULT_QUIZZES, MOCK_TOTAL_TIME, MOCK_UPLOADED_URL } from './mockResultData';
import { cn } from '@/shared/ui/lib/utils';
import { Button } from '@/shared/ui/components/button';
import { BarChart3, Zap, Flag, Clock } from 'lucide-react';

/** 선택지 타입 */
interface QuizSelection {
  id: string;
  content: string;
  correct?: boolean;
}

/** 퀴즈 문항 타입 */
interface QuizItem {
  number: number;
  title: string;
  selections: QuizSelection[];
  userAnswer: string | number;
}

/** location.state 타입 */
interface QuizResultLocationState {
  quizzes?: QuizItem[];
  totalTime?: string;
  uploadedUrl?: string;
}

/** Rotating Cards — 회전 + 스케일 애니메이션 + 동적 배경 */
const QuizResultMagicC = () => {
  const { t } = useTranslation();
  const { state } = useLocation() as { state: QuizResultLocationState | null };
  const navigate = useNavigate();
  const { problemSetId } = useParams<{ problemSetId: string }>();
  const [searchParams] = useSearchParams();
  const isMock = searchParams.get('mock') === 'true';
  const {
    quizzes = [],
    totalTime = '00:00:00',
    uploadedUrl,
  } = isMock
    ? { quizzes: MOCK_RESULT_QUIZZES, totalTime: MOCK_TOTAL_TIME, uploadedUrl: MOCK_UPLOADED_URL }
    : state || {};
  const {
    state: { correctCount, scorePercent },
    actions: { getQuizExplanation },
  } = useQuizResult({
    navigate,
    problemSetId: problemSetId ?? '',
    quizzes,
    totalTime,
    uploadedUrl: uploadedUrl ?? '',
  });

  const wrongCount = quizzes.length - correctCount;

  const sidePanelVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.08, type: 'spring', stiffness: 100, damping: 15 },
    }),
  };

  const cardVariants = {
    hidden: { opacity: 0, rotateY: -90, scale: 0.8 },
    visible: (i: number) => ({
      opacity: 1,
      rotateY: 0,
      scale: 1,
      transition: { delay: 0.3 + i * 0.12, type: 'spring', stiffness: 80, damping: 20 },
    }),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-950 dark:via-slate-900 dark:to-purple-950">
      <div className="mx-auto max-w-6xl px-6 py-10 max-md:px-4">
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* 좌측 패널 — sticky, 간결한 구성 */}
          <motion.aside
            className="lg:sticky lg:top-8 lg:self-start flex flex-col gap-4"
            initial="hidden"
            animate="visible"
          >
            {/* 점수 히어로 */}
            <motion.div
              custom={0}
              variants={sidePanelVariants}
              className="rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-8 shadow-xl"
            >
              <div className="text-xs font-bold uppercase tracking-widest opacity-90 mb-3">
                {t('최종 성적')}
              </div>
              <motion.div
                className="text-7xl font-black"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 120 }}
              >
                {scorePercent}
              </motion.div>
              <div className="text-sm font-semibold opacity-90 mt-2">{t('점')}</div>
            </motion.div>

            {/* 통계 바 */}
            <motion.div
              custom={1}
              variants={sidePanelVariants}
              className="rounded-xl bg-white dark:bg-slate-800 p-5 shadow-md border border-indigo-100 dark:border-indigo-900/30"
            >
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="size-5 text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                  {t('문제 수')}
                </span>
              </div>
              <div className="text-3xl font-black text-foreground">
                {quizzes.length}
                <span className="text-sm font-medium text-muted-foreground ml-2">{t('개')}</span>
              </div>
            </motion.div>

            {/* 정답/오답 비교 바 */}
            <motion.div
              custom={2}
              variants={sidePanelVariants}
              className="rounded-xl bg-white dark:bg-slate-800 p-5 shadow-md border border-indigo-100 dark:border-indigo-900/30"
            >
              <div className="flex items-center gap-2 mb-4">
                <Flag className="size-5 text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                  {t('성과')}
                </span>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                      {t('정답')}
                    </span>
                    <span className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                      {correctCount}
                    </span>
                  </div>
                  <div className="h-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-emerald-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${(correctCount / quizzes.length) * 100}%` }}
                      transition={{ delay: 0.5, duration: 1 }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-red-700 dark:text-red-300">
                      {t('오답')}
                    </span>
                    <span className="text-sm font-black text-red-700 dark:text-red-300">
                      {wrongCount}
                    </span>
                  </div>
                  <div className="h-2 bg-red-100 dark:bg-red-900/30 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-red-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${(wrongCount / quizzes.length) * 100}%` }}
                      transition={{ delay: 0.5, duration: 1 }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 걸린 시간 */}
            <motion.div
              custom={3}
              variants={sidePanelVariants}
              className="rounded-xl bg-white dark:bg-slate-800 p-5 shadow-md border border-indigo-100 dark:border-indigo-900/30"
            >
              <div className="flex items-center gap-2 mb-2">
                <Clock className="size-5 text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                  {t('소요 시간')}
                </span>
              </div>
              <div className="text-2xl font-black text-foreground tabular-nums">{totalTime}</div>
            </motion.div>

            {/* 해설 보기 버튼 */}
            <motion.div custom={4} variants={sidePanelVariants}>
              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                onClick={getQuizExplanation}
              >
                {t('해설 보기')}
              </Button>
            </motion.div>
          </motion.aside>

          {/* 우측 패널 — 회전 애니메이션 카드 */}
          <div className="flex flex-col gap-4" style={{ perspective: '1200px' }}>
            {quizzes.map((q, index) => {
              const userAns = q.userAnswer;
              const selection = q.selections.find((s) => s.id === userAns) || ({} as QuizSelection);
              const isCorrect = selection.correct === true;
              const correctSelection =
                q.selections.find((s) => s.correct === true) || ({} as QuizSelection);

              return (
                <motion.div
                  key={q.number}
                  custom={index}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover={{ scale: 1.05, rotateZ: 1 }}
                  className={cn(
                    'rounded-2xl p-6 border-l-4 shadow-lg transition-all duration-200',
                    isCorrect
                      ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/20 border-l-emerald-500'
                      : 'bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20 border-l-red-500',
                  )}
                >
                  <div className="mb-4">
                    <div
                      className={cn(
                        'text-xs font-bold uppercase tracking-widest mb-2',
                        isCorrect
                          ? 'text-emerald-700 dark:text-emerald-300'
                          : 'text-red-700 dark:text-red-300',
                      )}
                    >
                      Q{String(q.number).padStart(2, '0')} — {isCorrect ? t('정답') : t('오답')}
                    </div>
                    <div className="text-base font-semibold text-foreground whitespace-pre-wrap break-words">
                      {q.title}
                    </div>
                  </div>

                  <div
                    className="space-y-3 pt-4 border-t"
                    style={{
                      borderColor: isCorrect ? 'rgb(16 185 129 / 0.2)' : 'rgb(239 68 68 / 0.2)',
                    }}
                  >
                    <div>
                      <div
                        className={cn(
                          'text-xs font-bold uppercase mb-1',
                          isCorrect
                            ? 'text-emerald-700 dark:text-emerald-300'
                            : 'text-red-700 dark:text-red-300',
                        )}
                      >
                        {t('선택한 답')}
                      </div>
                      <div className="text-sm font-medium text-foreground">
                        {userAns === 0 ? (
                          <span className="italic opacity-50">{t('입력 X')}</span>
                        ) : (
                          selection.content
                        )}
                      </div>
                    </div>

                    {!isCorrect && (
                      <div className="rounded-lg bg-emerald-100/60 dark:bg-emerald-900/20 p-3 border border-emerald-300/50 dark:border-emerald-700/50">
                        <div className="text-xs font-bold uppercase text-emerald-700 dark:text-emerald-300 mb-1">
                          {t('정답 답안')}
                        </div>
                        <div className="text-sm font-medium text-foreground">
                          {correctSelection.content}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizResultMagicC;
