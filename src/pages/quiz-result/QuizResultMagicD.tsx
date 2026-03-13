import { useTranslation } from 'i18nexus';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuizResult } from '#features/quiz-result';
import { MOCK_RESULT_QUIZZES, MOCK_TOTAL_TIME, MOCK_UPLOADED_URL } from './mockResultData';
import { cn } from '@/shared/ui/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/components/card';
import { Badge } from '@/shared/ui/components/badge';
import { Button } from '@/shared/ui/components/button';

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

/** Glassmorphism — 반투명 blur 배경 + 스케일 애니메이션 */
const QuizResultMagicD = () => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="mx-auto max-w-6xl px-6 py-10 max-md:px-4">
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* 좌측 패널 — glassmorphism */}
          <motion.aside
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="lg:sticky lg:top-8 lg:self-start flex flex-col gap-4 backdrop-blur-md bg-white/30 dark:bg-slate-900/30 rounded-2xl border border-white/20 dark:border-slate-700/20 p-4"
          >
            {/* 점수 카드 */}
            <Card className="border-0 bg-white/40 dark:bg-slate-800/40 shadow-lg">
              <CardContent className="pt-6">
                <div className="mb-2 text-sm text-slate-600 dark:text-slate-300">{t('점수')}</div>
                <div className="text-5xl font-black text-slate-900 dark:text-white">
                  {scorePercent}
                  <span className="text-lg ml-1">{t('점')}</span>
                </div>
              </CardContent>
            </Card>

            {/* 문제 수 */}
            <Card className="border-0 bg-white/40 dark:bg-slate-800/40 shadow-lg">
              <CardContent className="pt-6">
                <div className="mb-2 text-sm text-slate-600 dark:text-slate-300">
                  {t('문제 수')}
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {quizzes.length}
                  {t('개')}
                </div>
              </CardContent>
            </Card>

            {/* 정답/오답 */}
            <Card className="border-0 bg-white/40 dark:bg-slate-800/40 shadow-lg">
              <CardContent className="pt-6">
                <div className="mb-3 text-sm text-slate-600 dark:text-slate-300">
                  {t('정답/오답')}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      {t('정답')}
                    </div>
                    <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                      {correctCount}
                    </div>
                  </div>
                  <div className="h-8 border-l border-slate-300 dark:border-slate-600" />
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      {t('오답')}
                    </div>
                    <div className="text-xl font-bold text-red-600 dark:text-red-400">
                      {wrongCount}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 걸린 시간 */}
            <Card className="border-0 bg-white/40 dark:bg-slate-800/40 shadow-lg">
              <CardContent className="pt-6">
                <div className="mb-2 text-sm text-slate-600 dark:text-slate-300">
                  {t('걸린 시간')}
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-white">{totalTime}</div>
              </CardContent>
            </Card>

            {/* 해설 보기 버튼 */}
            <Button
              size="lg"
              className="w-full mt-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg"
              onClick={getQuizExplanation}
            >
              {t('해설 보기')}
            </Button>
          </motion.aside>

          {/* 우측 패널 — glassmorphism 카드 리스트 */}
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
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.05, duration: 0.3 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Card
                    className={cn(
                      'border-l-4 border-l-transparent transition-all duration-200 backdrop-blur-sm bg-white/40 dark:bg-slate-900/40 border border-white/20 dark:border-slate-700/20 shadow-2xl',
                      isCorrect ? 'border-l-emerald-400' : 'border-l-red-400',
                    )}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="whitespace-pre-wrap break-words text-lg max-md:text-base text-slate-900 dark:text-white">
                          {q.number}. {q.title}
                        </CardTitle>
                        <Badge variant={isCorrect ? 'default' : 'destructive'}>
                          {isCorrect ? t('정답') : t('오답')}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="border-t border-white/20 dark:border-slate-700/20 pt-3 text-sm text-slate-700 dark:text-slate-300">
                        <span className="font-medium text-slate-900 dark:text-white">
                          {t('선택한 답:')}
                        </span>{' '}
                        {userAns === 0 ? t('입력 X') : selection.content}
                      </div>
                      {!isCorrect && (
                        <div className="mt-3 rounded-lg bg-emerald-500/20 dark:bg-emerald-500/10 px-4 py-3 text-sm border border-emerald-400/30 dark:border-emerald-500/20">
                          <span className="font-medium text-emerald-700 dark:text-emerald-300">
                            {t('정답 답안:')}
                          </span>{' '}
                          <span className="text-slate-900 dark:text-white">
                            {correctSelection.content}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizResultMagicD;
