import { useTranslation } from 'i18nexus';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuizResult } from '#features/quiz-result';
import { MOCK_RESULT_QUIZZES, MOCK_TOTAL_TIME, MOCK_UPLOADED_URL } from './mockResultData';
import { cn } from '@/shared/ui/lib/utils';
import { Button } from '@/shared/ui/components/button';
import { Award, TrendingUp, Target, Flame } from 'lucide-react';

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

/** Tileboard Metric — 타일 그리드 + 성과 강조 */
const QuizResultDesignH = () => {
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
  const accuracy = Math.round((correctCount / quizzes.length) * 100);

  const tileVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      transition: { delay: i * 0.1, type: 'spring', stiffness: 120, damping: 20 },
    }),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="mx-auto max-w-6xl px-6 py-10 max-md:px-4">
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* 좌측 패널 — sticky, 타일 메트릭 */}
          <motion.aside
            className="lg:sticky lg:top-8 lg:self-start flex flex-col gap-3"
            initial="hidden"
            animate="visible"
          >
            {/* 큰 점수 타일 */}
            <motion.div
              custom={0}
              variants={tileVariants}
              className="rounded-xl p-6 bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg"
            >
              <div className="text-xs font-bold uppercase tracking-widest opacity-90 mb-2">
                {t('최종 점수')}
              </div>
              <div className="text-6xl font-black">{scorePercent}</div>
              <div className="text-sm font-semibold opacity-75 mt-1">{t('점')}</div>
            </motion.div>

            {/* 정확도 타일 */}
            <motion.div
              custom={1}
              variants={tileVariants}
              className="rounded-xl p-5 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 border border-blue-300 dark:border-blue-700"
            >
              <div className="flex items-center gap-3">
                <Target className="size-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <div className="text-xs font-bold uppercase text-blue-700 dark:text-blue-300">
                    {t('정확도')}
                  </div>
                  <div className="text-2xl font-black text-blue-900 dark:text-blue-100">
                    {accuracy}%
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 정답 타일 */}
            <motion.div
              custom={2}
              variants={tileVariants}
              className="rounded-xl p-5 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/30 border border-emerald-300 dark:border-emerald-700"
            >
              <div className="flex items-center gap-3">
                <Award className="size-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <div className="text-xs font-bold uppercase text-emerald-700 dark:text-emerald-300">
                    {t('정답')}
                  </div>
                  <div className="text-2xl font-black text-emerald-900 dark:text-emerald-100">
                    {correctCount}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 오답 타일 */}
            <motion.div
              custom={3}
              variants={tileVariants}
              className="rounded-xl p-5 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 border border-red-300 dark:border-red-700"
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="size-5 text-red-600 dark:text-red-400" />
                <div>
                  <div className="text-xs font-bold uppercase text-red-700 dark:text-red-300">
                    {t('오답')}
                  </div>
                  <div className="text-2xl font-black text-red-900 dark:text-red-100">
                    {wrongCount}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 걸린 시간 타일 */}
            <motion.div
              custom={4}
              variants={tileVariants}
              className="rounded-xl p-5 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 border border-purple-300 dark:border-purple-700"
            >
              <div className="flex items-center gap-3">
                <Flame className="size-5 text-purple-600 dark:text-purple-400" />
                <div>
                  <div className="text-xs font-bold uppercase text-purple-700 dark:text-purple-300">
                    {t('소요 시간')}
                  </div>
                  <div className="text-lg font-bold text-purple-900 dark:text-purple-100 tabular-nums">
                    {totalTime}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 해설 보기 버튼 */}
            <motion.div custom={5} variants={tileVariants}>
              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 dark:from-slate-700 dark:to-slate-600"
                onClick={getQuizExplanation}
              >
                {t('해설 보기')}
              </Button>
            </motion.div>
          </motion.aside>

          {/* 우측 패널 — 큰 상세 카드 */}
          <div className="flex flex-col gap-4">
            {quizzes.map((q, index) => {
              const userAns = q.userAnswer;
              const selection = q.selections.find((s) => s.id === userAns) || ({} as QuizSelection);
              const isCorrect = selection.correct === true;
              const correctSelection =
                q.selections.find((s) => s.correct === true) || ({} as QuizSelection);

              return (
                <motion.div
                  key={q.number}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.08, type: 'spring', stiffness: 100 }}
                  whileHover={{ x: 8 }}
                  className={cn(
                    'rounded-xl p-6 border-l-4 transition-all duration-200',
                    isCorrect
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 border-l-emerald-500 dark:border-l-emerald-400'
                      : 'bg-red-50 dark:bg-red-950/20 border-l-red-500 dark:border-l-red-400',
                  )}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div
                        className={cn(
                          'text-xs font-bold uppercase tracking-widest mb-2',
                          isCorrect
                            ? 'text-emerald-700 dark:text-emerald-300'
                            : 'text-red-700 dark:text-red-300',
                        )}
                      >
                        {isCorrect ? t('정답') : t('오답')}
                      </div>
                      <div className="text-base font-semibold text-foreground whitespace-pre-wrap break-words">
                        {q.number}. {q.title}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div
                      className={cn(
                        'rounded-lg p-4',
                        isCorrect
                          ? 'bg-emerald-100/50 dark:bg-emerald-900/20'
                          : 'bg-red-100/50 dark:bg-red-900/20',
                      )}
                    >
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
                          <span className="italic opacity-60">{t('입력 X')}</span>
                        ) : (
                          selection.content
                        )}
                      </div>
                    </div>

                    {!isCorrect && (
                      <div className="rounded-lg bg-emerald-100/50 dark:bg-emerald-900/20 p-4 border border-emerald-300/50 dark:border-emerald-700/50">
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

export default QuizResultDesignH;
