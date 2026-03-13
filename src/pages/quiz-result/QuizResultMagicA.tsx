import { useTranslation } from 'i18nexus';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuizResult } from '#features/quiz-result';
import { MOCK_RESULT_QUIZZES, MOCK_TOTAL_TIME, MOCK_UPLOADED_URL } from './mockResultData';
import { cn } from '@/shared/ui/lib/utils';
import { Button } from '@/shared/ui/components/button';
import { CheckCircle2, XCircle, BarChart3, Zap } from 'lucide-react';

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

/** Dynamic Pulse — 스프링 애니메이션 + 아이콘 강조 + 대시보드 스타일 */
const QuizResultMagicA = () => {
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: 'spring', stiffness: 100, damping: 15 },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="mx-auto max-w-6xl px-6 py-10 max-md:px-4">
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* 좌측 패널 — sticky, 대시보드 스타일 */}
          <motion.aside
            className="lg:sticky lg:top-8 lg:self-start flex flex-col gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* 점수 — 큰 숫자 + 애니메이션 */}
            <motion.div
              variants={itemVariants}
              className="text-center py-8 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20"
            >
              <div className="text-xs font-bold uppercase tracking-widest text-primary/70 mb-2">
                {t('현재 점수')}
              </div>
              <motion.div
                className="text-7xl font-black bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 150 }}
              >
                {scorePercent}
              </motion.div>
              <div className="text-sm font-medium text-muted-foreground mt-1">{t('점')}</div>
            </motion.div>

            {/* 정확도 바 */}
            <motion.div
              variants={itemVariants}
              className="rounded-xl bg-card/60 backdrop-blur p-4 border border-border/50"
            >
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="size-4 text-accent" />
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {t('정확도')}
                </span>
              </div>
              <div className="space-y-2">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-success to-accent"
                    initial={{ width: 0 }}
                    animate={{ width: `${accuracy}%` }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                  />
                </div>
                <div className="text-right text-sm font-bold text-foreground">{accuracy}%</div>
              </div>
            </motion.div>

            {/* 정답 수 */}
            <motion.div
              variants={itemVariants}
              className="rounded-xl bg-success/5 backdrop-blur p-4 border border-success/30"
            >
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="size-5 text-success" />
                <span className="text-xs font-bold uppercase tracking-widest text-success">
                  {t('정답')}
                </span>
              </div>
              <div className="text-3xl font-black text-success">{correctCount}</div>
            </motion.div>

            {/* 오답 수 */}
            <motion.div
              variants={itemVariants}
              className="rounded-xl bg-destructive/5 backdrop-blur p-4 border border-destructive/30"
            >
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="size-5 text-destructive" />
                <span className="text-xs font-bold uppercase tracking-widest text-destructive">
                  {t('오답')}
                </span>
              </div>
              <div className="text-3xl font-black text-destructive">{wrongCount}</div>
            </motion.div>

            {/* 걸린 시간 */}
            <motion.div
              variants={itemVariants}
              className="rounded-xl bg-card/60 backdrop-blur p-4 border border-border/50"
            >
              <div className="flex items-center gap-2 mb-2">
                <Zap className="size-4 text-accent" />
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {t('소요 시간')}
                </span>
              </div>
              <div className="text-2xl font-bold text-foreground tabular-nums">{totalTime}</div>
            </motion.div>

            {/* 해설 보기 버튼 */}
            <motion.div variants={itemVariants}>
              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                onClick={getQuizExplanation}
              >
                {t('해설 보기')}
              </Button>
            </motion.div>
          </motion.aside>

          {/* 우측 패널 — 동적 카드 리스트 */}
          <motion.div
            className="flex flex-col gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {quizzes.map((q, index) => {
              const userAns = q.userAnswer;
              const selection = q.selections.find((s) => s.id === userAns) || ({} as QuizSelection);
              const isCorrect = selection.correct === true;
              const correctSelection =
                q.selections.find((s) => s.correct === true) || ({} as QuizSelection);

              return (
                <motion.div
                  key={q.number}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02, y: -4 }}
                  className={cn(
                    'rounded-xl p-5 border backdrop-blur-sm transition-colors duration-200',
                    isCorrect
                      ? 'bg-success/8 border-success/40 hover:border-success/60'
                      : 'bg-destructive/8 border-destructive/40 hover:border-destructive/60',
                  )}
                >
                  <div className="flex items-start gap-4 mb-3">
                    {/* 아이콘 */}
                    <motion.div
                      initial={{ rotate: -180, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      transition={{ delay: 0.3 + index * 0.08, type: 'spring', stiffness: 150 }}
                      className="shrink-0 mt-0.5"
                    >
                      {isCorrect ? (
                        <CheckCircle2 className="size-6 text-success" />
                      ) : (
                        <XCircle className="size-6 text-destructive" />
                      )}
                    </motion.div>

                    {/* 컨텐츠 */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-muted-foreground mb-1">
                        Q{String(q.number).padStart(2, '0')}
                      </div>
                      <div className="text-base font-semibold text-foreground whitespace-pre-wrap break-words mb-3">
                        {q.title}
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="text-xs font-semibold uppercase text-muted-foreground">
                            {t('선택한 답')}
                          </span>
                          <div className="text-foreground mt-1 text-sm leading-relaxed">
                            {userAns === 0 ? (
                              <span className="text-destructive/70 italic">{t('입력 X')}</span>
                            ) : (
                              selection.content
                            )}
                          </div>
                        </div>

                        {!isCorrect && (
                          <div className="mt-3 p-3 rounded-lg bg-success/15 border border-success/30">
                            <span className="text-xs font-semibold uppercase text-success">
                              {t('정답 답안')}
                            </span>
                            <div className="text-sm text-foreground mt-1">
                              {correctSelection.content}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default QuizResultMagicA;
