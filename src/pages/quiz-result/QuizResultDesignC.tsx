import { useState } from 'react';
import { useTranslation } from 'i18nexus';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuizResult } from '#features/quiz-result';
import { MOCK_RESULT_QUIZZES, MOCK_TOTAL_TIME, MOCK_UPLOADED_URL } from './mockResultData';
import { cn } from '@/shared/ui/lib/utils';
import { Card, CardContent } from '@/shared/ui/components/card';
import { Badge } from '@/shared/ui/components/badge';
import { Button } from '@/shared/ui/components/button';
import { BlurFade } from '@/shared/ui/components/blur-fade';
import { ChevronDown, Clock, Hash, Target } from 'lucide-react';

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

/** 아코디언 문항 아이템 */
const QuestionAccordion = ({
  quiz,
  isOpen,
  onToggle,
  t,
}: {
  quiz: QuizItem;
  isOpen: boolean;
  onToggle: () => void;
  t: (key: string) => string;
}) => {
  const userAns = quiz.userAnswer;
  const selection = quiz.selections.find((s) => s.id === userAns) || ({} as QuizSelection);
  const isCorrect = selection.correct === true;
  const correctSelection = quiz.selections.find((s) => s.correct === true) || ({} as QuizSelection);

  return (
    <div
      className={cn(
        'group rounded-xl border transition-all duration-300',
        isOpen ? 'border-border bg-card shadow-sm' : 'border-transparent bg-card/60 hover:bg-card',
      )}
    >
      {/* 헤더 (클릭 영역) */}
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-5 py-4 text-left max-md:px-4 max-md:py-3"
      >
        {/* 정오답 인디케이터 도트 */}
        <span
          className={cn(
            'size-2.5 shrink-0 rounded-full',
            isCorrect ? 'bg-success' : 'bg-destructive',
          )}
        />
        {/* 문항 번호 */}
        <span className="shrink-0 text-xs font-bold tabular-nums text-muted-foreground">
          {String(quiz.number).padStart(2, '0')}
        </span>
        {/* 문항 제목 (한줄 말줄임) */}
        <span
          className={cn(
            'min-w-0 flex-1 text-sm font-medium text-foreground',
            !isOpen && 'truncate',
          )}
        >
          {quiz.title}
        </span>
        {/* 배지 + 화살표 */}
        <Badge variant={isCorrect ? 'default' : 'destructive'} className="shrink-0 text-[0.65rem]">
          {isCorrect ? t('정답') : t('오답')}
        </Badge>
        <ChevronDown
          className={cn(
            'size-4 shrink-0 text-muted-foreground transition-transform duration-300',
            isOpen && 'rotate-180',
          )}
        />
      </button>

      {/* 펼침 콘텐츠 */}
      <div
        className={cn(
          'grid transition-all duration-300 ease-in-out',
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-3 px-5 pb-5 pt-0 max-md:px-4 max-md:pb-4">
            {/* 선택한 답 */}
            <div className="rounded-lg bg-muted/50 px-4 py-3">
              <div className="mb-1 text-xs font-medium text-muted-foreground">
                {t('선택한 답:')}
              </div>
              <div
                className={cn(
                  'text-sm font-semibold',
                  isCorrect ? 'text-success' : 'text-destructive',
                )}
              >
                {userAns === 0 ? t('입력 X') : selection.content}
              </div>
            </div>

            {/* 정답 (오답인 경우만) */}
            {!isCorrect && (
              <div className="rounded-lg border border-success/20 bg-success/5 px-4 py-3">
                <div className="mb-1 text-xs font-medium text-success">{t('정답 답안:')}</div>
                <div className="text-sm font-semibold text-foreground">
                  {correctSelection.content}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/** Progress Ring — 원형 프로그레스 바 중심, 아코디언 문항 리스트 */
const QuizResultDesignC = () => {
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

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-6 py-10 max-md:px-4">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* 좌측 패널 — sticky */}
          <aside className="lg:sticky lg:top-8 lg:self-start flex flex-col gap-4">
            {/* 프로그레스 링 */}
            <BlurFade delay={0.1}>
              <div className="flex justify-center">
                <ProgressRing percent={scorePercent} size={160} strokeWidth={10} />
              </div>
            </BlurFade>

            {/* 메타데이터 카드들 */}
            <BlurFade delay={0.25}>
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
            </BlurFade>

            <BlurFade delay={0.35}>
              <Card>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-muted/60">
                      <Target className="size-4 text-success" />
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
            </BlurFade>

            <BlurFade delay={0.45}>
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
            </BlurFade>

            {/* 해설 보기 CTA */}
            <BlurFade delay={0.55}>
              <Button size="lg" className="w-full text-base" onClick={getQuizExplanation}>
                {t('해설 보기')}
              </Button>
            </BlurFade>
          </aside>

          {/* 우측 패널 — 문항 아코디언 리스트 */}
          <BlurFade delay={0.4}>
            <div className="space-y-2">
              {quizzes.map((q) => (
                <QuestionAccordion
                  key={q.number}
                  quiz={q}
                  isOpen={openIndex === q.number}
                  onToggle={() => setOpenIndex((prev) => (prev === q.number ? null : q.number))}
                  t={t}
                />
              ))}
            </div>
          </BlurFade>
        </div>
      </div>
    </div>
  );
};

export default QuizResultDesignC;
