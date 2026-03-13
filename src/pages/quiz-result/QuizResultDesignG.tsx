import { useTranslation } from 'i18nexus';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuizResult } from '#features/quiz-result';
import { MOCK_RESULT_QUIZZES, MOCK_TOTAL_TIME, MOCK_UPLOADED_URL } from './mockResultData';
import { cn } from '@/shared/ui/lib/utils';
import { Card, CardContent } from '@/shared/ui/components/card';
import { Badge } from '@/shared/ui/components/badge';
import { Button } from '@/shared/ui/components/button';
import { Hash, Trophy, Clock } from 'lucide-react';

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

/** SVG 원형 프로그레스 링 */
const ProgressRing = ({
  percent,
  size = 200,
  strokeWidth = 10,
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  const center = size / 2;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* 배경 트랙 */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/60"
        />
        {/* 프로그레스 아크 */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.6723 0.1606 244.9955)" />
            <stop offset="100%" stopColor="oklch(0.6907 0.1554 160.3454)" />
          </linearGradient>
        </defs>
      </svg>
      {/* 중앙 점수 텍스트 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-black tabular-nums tracking-tighter text-foreground max-md:text-4xl">
          {percent}
        </span>
        <span className="text-sm font-medium tracking-wide text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
};

/** Stats Enhanced — 통계 강화 좌측 패널 */
const QuizResultDesignG = () => {
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
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-6 py-10 max-md:px-4">
        <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
          {/* 좌측 패널 — 통계 강화 */}
          <aside className="lg:sticky lg:top-8 lg:self-start flex flex-col gap-4">
            {/* 프로그레스 링 */}
            <div className="flex justify-center">
              <ProgressRing percent={scorePercent} size={160} strokeWidth={10} />
            </div>

            {/* 메타 카드 1: 문제 수 */}
            <Card>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-muted/60">
                    <Hash className="size-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-[0.65rem] font-medium uppercase tracking-widest text-muted-foreground">
                      {t('문제 수')}
                    </div>
                    <div className="text-base font-bold tabular-nums text-foreground">
                      {quizzes.length}
                      {t('개')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 메타 카드 2: 정답 수 */}
            <Card>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-muted/60">
                    <Trophy className="size-4 text-success" />
                  </div>
                  <div>
                    <div className="text-[0.65rem] font-medium uppercase tracking-widest text-muted-foreground">
                      {t('정답')}
                    </div>
                    <div className="text-base font-bold tabular-nums text-foreground">
                      {correctCount} / {quizzes.length}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 메타 카드 3: 걸린 시간 */}
            <Card>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-muted/60">
                    <Clock className="size-4 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-[0.65rem] font-medium uppercase tracking-widest text-muted-foreground">
                      {t('걸린 시간')}
                    </div>
                    <div className="text-base font-bold tabular-nums text-foreground">
                      {totalTime}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 해설 보기 버튼 */}
            <Button size="lg" className="w-full text-base" onClick={getQuizExplanation}>
              {t('해설 보기')}
            </Button>
          </aside>

          {/* 우측 패널 — 기본 카드 리스트 */}
          <div className="flex flex-col gap-4">
            {quizzes.map((q) => {
              const userAns = q.userAnswer;
              const selection = q.selections.find((s) => s.id === userAns) || ({} as QuizSelection);
              const isCorrect = selection.correct === true;
              const correctSelection =
                q.selections.find((s) => s.correct === true) || ({} as QuizSelection);

              return (
                <Card
                  key={q.number}
                  className={cn(
                    'border-l-4 border-l-transparent transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
                    isCorrect ? 'border-l-success' : 'border-l-destructive',
                  )}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1 whitespace-pre-wrap break-words text-lg font-semibold text-foreground max-md:text-base">
                        {q.number}. {q.title}
                      </div>
                      <Badge variant={isCorrect ? 'default' : 'destructive'}>
                        {isCorrect ? t('정답') : t('오답')}
                      </Badge>
                    </div>

                    <div className="border-t border-border pt-3 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{t('선택한 답:')}</span>{' '}
                      {userAns === 0 ? t('입력 X') : selection.content}
                    </div>
                    {!isCorrect && (
                      <div className="mt-3 rounded-lg bg-muted px-4 py-3 text-sm">
                        <span className="font-medium text-foreground">{t('정답 답안:')}</span>{' '}
                        {correctSelection.content}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizResultDesignG;
