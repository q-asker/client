import { useState } from 'react';
import { useTranslation } from 'i18nexus';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuizResult } from '#features/quiz-result';
import { MOCK_RESULT_QUIZZES, MOCK_TOTAL_TIME, MOCK_UPLOADED_URL } from './mockResultData';
import { cn } from '@/shared/ui/lib/utils';
import { Badge } from '@/shared/ui/components/badge';
import { Button } from '@/shared/ui/components/button';
import { Card, CardContent } from '@/shared/ui/components/card';
import { BlurFade } from '@/shared/ui/components/blur-fade';
import { ChevronDown, Sparkles } from 'lucide-react';

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

/** 원형 프로그레스 링 (작은 사이즈) */
const MiniRing = ({
  percent,
  size = 100,
  strokeWidth = 6,
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
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-border"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-primary transition-[stroke-dashoffset] duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black tabular-nums tracking-tighter text-foreground">
          {percent}
        </span>
      </div>
    </div>
  );
};

/**
 * MagicE — "Compact Reveal"
 * 원형 프로그레스 + 인라인 스탯이 한 카드에, BlurFade 애니메이션.
 * 톤: 깔끔하고 밀도 높은 정보 표시, 프로그레스 링 중심
 */
const QuizResultMagicE = () => {
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
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-10 max-md:px-4">
        {/* 요약 카드 — 원형 링 + 인라인 스탯 */}
        <BlurFade delay={0.1}>
          <Card className="mb-8 overflow-hidden">
            <CardContent className="flex items-center gap-6 py-6 max-md:flex-col max-md:gap-4">
              {/* 원형 프로그레스 */}
              <div className="shrink-0">
                <MiniRing percent={scorePercent} size={100} strokeWidth={6} />
              </div>

              {/* 스탯 그리드 */}
              <div className="grid flex-1 grid-cols-2 gap-x-8 gap-y-3 max-md:w-full max-md:gap-x-6">
                <div>
                  <div className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
                    {t('문제 수')}
                  </div>
                  <div className="text-lg font-bold tabular-nums text-foreground">
                    {quizzes.length}
                    {t('개')}
                  </div>
                </div>
                <div>
                  <div className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
                    {t('걸린 시간')}
                  </div>
                  <div className="text-lg font-bold tabular-nums text-foreground">{totalTime}</div>
                </div>
                <div>
                  <div className="text-[0.65rem] font-semibold uppercase tracking-widest text-success">
                    {t('정답')}
                  </div>
                  <div className="text-lg font-bold tabular-nums text-success">{correctCount}</div>
                </div>
                <div>
                  <div className="text-[0.65rem] font-semibold uppercase tracking-widest text-destructive">
                    {t('오답')}
                  </div>
                  <div className="text-lg font-bold tabular-nums text-destructive">
                    {wrongCount}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </BlurFade>

        {/* 문항 리스트 */}
        <BlurFade delay={0.3}>
          <div className="space-y-2">
            {quizzes.map((q, idx) => {
              const userAns = q.userAnswer;
              const selection = q.selections.find((s) => s.id === userAns) || ({} as QuizSelection);
              const isCorrect = selection.correct === true;
              const correctSelection =
                q.selections.find((s) => s.correct === true) || ({} as QuizSelection);
              const isOpen = openIndex === q.number;

              return (
                <BlurFade key={q.number} delay={0.3 + idx * 0.05}>
                  <div
                    className={cn(
                      'rounded-xl border transition-all duration-300',
                      isOpen
                        ? 'border-border bg-card shadow-sm'
                        : 'border-transparent bg-card/60 hover:bg-card',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenIndex((prev) => (prev === q.number ? null : q.number))}
                      className="flex w-full items-center gap-3 px-5 py-4 text-left max-md:px-4 max-md:py-3"
                    >
                      <span
                        className={cn(
                          'size-2.5 shrink-0 rounded-full',
                          isCorrect ? 'bg-success' : 'bg-destructive',
                        )}
                      />
                      <span className="shrink-0 text-xs font-bold tabular-nums text-muted-foreground">
                        {String(q.number).padStart(2, '0')}
                      </span>
                      <span
                        className={cn(
                          'min-w-0 flex-1 text-sm font-medium text-foreground',
                          !isOpen && 'truncate',
                        )}
                      >
                        {q.title}
                      </span>
                      <Badge
                        variant={isCorrect ? 'default' : 'destructive'}
                        className="shrink-0 text-[0.65rem]"
                      >
                        {isCorrect ? t('정답') : t('오답')}
                      </Badge>
                      <ChevronDown
                        className={cn(
                          'size-4 shrink-0 text-muted-foreground transition-transform duration-300',
                          isOpen && 'rotate-180',
                        )}
                      />
                    </button>

                    <div
                      className={cn(
                        'grid transition-all duration-300 ease-in-out',
                        isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                      )}
                    >
                      <div className="overflow-hidden">
                        <div className="space-y-3 px-5 pb-5 pt-0 max-md:px-4 max-md:pb-4">
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
                          {!isCorrect && (
                            <div className="rounded-lg border border-success/20 bg-success/5 px-4 py-3">
                              <div className="mb-1 text-xs font-medium text-success">
                                {t('정답 답안:')}
                              </div>
                              <div className="text-sm font-semibold text-foreground">
                                {correctSelection.content}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </BlurFade>
              );
            })}
          </div>
        </BlurFade>

        {/* 해설 보기 CTA */}
        <BlurFade delay={0.6}>
          <div className="mt-8 flex justify-center">
            <Button size="lg" className="w-full max-w-sm text-base" onClick={getQuizExplanation}>
              <Sparkles className="mr-2 size-4" />
              {t('해설 보기')}
            </Button>
          </div>
        </BlurFade>
      </div>
    </div>
  );
};

export default QuizResultMagicE;
