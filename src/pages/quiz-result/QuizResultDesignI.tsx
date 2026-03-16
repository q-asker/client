import { useState } from 'react';
import { useTranslation } from 'i18nexus';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuizResult } from '#features/quiz-result';
import { MOCK_RESULT_QUIZZES, MOCK_TOTAL_TIME, MOCK_UPLOADED_URL } from './mockResultData';
import { cn } from '@/shared/ui/lib/utils';
import { Badge } from '@/shared/ui/components/badge';
import { Button } from '@/shared/ui/components/button';
import { ChevronDown, Trophy, Clock, CheckCircle2, XCircle } from 'lucide-react';

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
 * DesignI — "Editorial Strip"
 * 상단 가로 스트립에 점수/문제수/정답/오답/시간을 한 줄로 배치,
 * 하단에 아코디언 문항 리스트.
 * 톤: 에디토리얼 매거진 느낌, 큰 타이포그래피, 절제된 컬러
 */
const QuizResultDesignI = () => {
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
        {/* 상단 히어로 — 점수 강조 */}
        <div className="mb-8 text-center">
          <div className="mb-2 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            {t('퀴즈 결과')}
          </div>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-7xl font-black tabular-nums tracking-tighter text-foreground max-md:text-5xl">
              {scorePercent}
            </span>
            <span className="text-2xl font-bold text-muted-foreground max-md:text-xl">
              {t('점')}
            </span>
          </div>
        </div>

        {/* 스탯 스트립 — 가로 4칸 */}
        <div className="mb-8 grid grid-cols-4 divide-x divide-border rounded-2xl border border-border bg-card max-md:grid-cols-2 max-md:divide-y max-md:divide-x-0">
          <div className="flex flex-col items-center gap-1 px-4 py-5">
            <span className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
              {t('문제 수')}
            </span>
            <span className="text-2xl font-bold tabular-nums text-foreground">
              {quizzes.length}
            </span>
          </div>
          <div className="flex flex-col items-center gap-1 px-4 py-5">
            <span className="text-[0.65rem] font-semibold uppercase tracking-widest text-success">
              {t('정답')}
            </span>
            <span className="text-2xl font-bold tabular-nums text-success">{correctCount}</span>
          </div>
          <div className="flex flex-col items-center gap-1 px-4 py-5">
            <span className="text-[0.65rem] font-semibold uppercase tracking-widest text-destructive">
              {t('오답')}
            </span>
            <span className="text-2xl font-bold tabular-nums text-destructive">{wrongCount}</span>
          </div>
          <div className="flex flex-col items-center gap-1 px-4 py-5">
            <span className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
              {t('걸린 시간')}
            </span>
            <span className="text-2xl font-bold tabular-nums text-foreground">{totalTime}</span>
          </div>
        </div>

        {/* 문항 아코디언 리스트 */}
        <div className="space-y-2">
          {quizzes.map((q) => {
            const userAns = q.userAnswer;
            const selection = q.selections.find((s) => s.id === userAns) || ({} as QuizSelection);
            const isCorrect = selection.correct === true;
            const correctSelection =
              q.selections.find((s) => s.correct === true) || ({} as QuizSelection);
            const isOpen = openIndex === q.number;

            return (
              <div
                key={q.number}
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
            );
          })}
        </div>

        {/* 해설 보기 CTA */}
        <div className="mt-8 flex justify-center">
          <Button size="lg" className="w-full max-w-sm text-base" onClick={getQuizExplanation}>
            {t('해설 보기')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuizResultDesignI;
