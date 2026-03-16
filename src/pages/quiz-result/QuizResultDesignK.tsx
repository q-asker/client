import { useState } from 'react';
import { useTranslation } from 'i18nexus';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuizResult } from '#features/quiz-result';
import { MOCK_RESULT_QUIZZES, MOCK_TOTAL_TIME, MOCK_UPLOADED_URL } from './mockResultData';
import { cn } from '@/shared/ui/lib/utils';
import { Card, CardContent } from '@/shared/ui/components/card';
import { Badge } from '@/shared/ui/components/badge';
import { Button } from '@/shared/ui/components/button';
import { ChevronDown, Trophy, Clock, CheckCircle2, XCircle, Hash } from 'lucide-react';

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

/**
 * DesignK — "Split Panel"
 * 14번(DesignJ) 스타일 기반, 2단 그리드 레이아웃.
 * 좌측: primary 히어로 점수 + 스탯 카드 (sticky)
 * 우측: 아코디언 문항 리스트
 */
const QuizResultDesignK = () => {
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
  const [openSet, setOpenSet] = useState<Set<number>>(new Set());

  return (
    <div className="min-h-screen bg-muted/30">
      {/* 전체 너비 점수 히어로 */}
      <div className="bg-primary px-6 pb-20 pt-10 max-md:px-4 max-md:pb-16 max-md:pt-8">
        <div className="mx-auto max-w-5xl text-center">
          <Trophy className="mx-auto mb-3 size-10 text-primary-foreground/70" />
          <div className="text-6xl font-black tabular-nums text-primary-foreground max-md:text-4xl">
            {scorePercent}
            <span className="text-2xl max-md:text-lg">{t('점')}</span>
          </div>
        </div>
      </div>

      {/* 플로팅 스탯 카드 */}
      <div className="mx-auto max-w-3xl px-6 max-md:px-4">
        <Card className="-mt-12 border-0 shadow-lg max-md:-mt-10">
          <CardContent className="grid grid-cols-4 gap-0 divide-x divide-border py-5 max-md:grid-cols-2 max-md:gap-y-4 max-md:divide-x-0">
            <div className="flex flex-col items-center gap-1">
              <Hash className="size-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{t('문제 수')}</span>
              <span className="text-xl font-bold tabular-nums text-foreground">
                {quizzes.length}
                {t('개')}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <CheckCircle2 className="size-4 text-success" />
              <span className="text-xs text-success">{t('정답')}</span>
              <span className="text-xl font-bold tabular-nums text-success">{correctCount}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <XCircle className="size-4 text-destructive" />
              <span className="text-xs text-destructive">{t('오답')}</span>
              <span className="text-xl font-bold tabular-nums text-destructive">{wrongCount}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Clock className="size-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{t('걸린 시간')}</span>
              <span className="text-xl font-bold tabular-nums text-foreground">{totalTime}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 해설 보기 + 문항 리스트 */}
      <div className="mx-auto max-w-3xl px-6 py-6 max-md:px-4">
        <div className="mb-4">
          <Button size="lg" className="w-full text-base" onClick={getQuizExplanation}>
            {t('해설 보기')}
          </Button>
        </div>
        <div className="space-y-1.5">
          {quizzes.map((q) => {
            const userAns = q.userAnswer;
            const selection = q.selections.find((s) => s.id === userAns) || ({} as QuizSelection);
            const isCorrect = selection.correct === true;
            const correctSelection =
              q.selections.find((s) => s.correct === true) || ({} as QuizSelection);
            const isOpen = openSet.has(q.number);

            return (
              <div
                key={q.number}
                className={cn(
                  'overflow-hidden rounded-lg border bg-card transition-all duration-200',
                  isOpen ? 'border-border shadow-sm' : 'border-transparent hover:border-border/50',
                )}
              >
                <button
                  type="button"
                  onClick={() =>
                    setOpenSet((prev) => {
                      const next = new Set(prev);
                      next.has(q.number) ? next.delete(q.number) : next.add(q.number);
                      return next;
                    })
                  }
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/20"
                >
                  <span
                    className={cn(
                      'size-2 shrink-0 rounded-full',
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
                    <div className="space-y-1.5 px-4 pb-3 pt-0.5">
                      <div className="rounded-md bg-muted/40 px-3 py-1.5">
                        <span className="text-[0.65rem] text-muted-foreground">
                          {t('선택한 답:')}
                        </span>
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
                        <div className="rounded-md border border-success/20 bg-success/5 px-3 py-1.5">
                          <span className="text-[0.65rem] text-success">{t('정답 답안:')}</span>
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
          })}
        </div>
      </div>
    </div>
  );
};

export default QuizResultDesignK;
