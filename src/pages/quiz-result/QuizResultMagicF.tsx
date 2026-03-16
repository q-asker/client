import { useState } from 'react';
import { useTranslation } from 'i18nexus';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuizResult } from '#features/quiz-result';
import { MOCK_RESULT_QUIZZES, MOCK_TOTAL_TIME, MOCK_UPLOADED_URL } from './mockResultData';
import { cn } from '@/shared/ui/lib/utils';
import { Badge } from '@/shared/ui/components/badge';
import { Button } from '@/shared/ui/components/button';
import { ChevronDown, BarChart3 } from 'lucide-react';

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
 * MagicF — "Progress Bar Dashboard"
 * 수평 프로그레스 바 중심 요약 + 문항 리스트.
 * 톤: 대시보드 느낌, 프로그레스 바로 성적을 직관적 표현
 */
const QuizResultMagicF = () => {
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
        {/* 요약 섹션 */}
        <div className="mb-8 rounded-2xl border border-border bg-card p-6 max-md:p-4">
          {/* 점수 + 프로그레스 바 */}
          <div className="mb-5 flex items-end justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
                <BarChart3 className="size-4" />
                {t('퀴즈 결과')}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black tabular-nums tracking-tighter text-foreground max-md:text-4xl">
                  {scorePercent}
                </span>
                <span className="text-lg font-medium text-muted-foreground">{t('점')}</span>
              </div>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              {correctCount}/{quizzes.length} {t('정답')}
            </div>
          </div>

          {/* 수평 프로그레스 바 — 정답(초록) + 오답(빨강) 스택 */}
          <div className="mb-5 flex h-3 overflow-hidden rounded-full bg-muted/60">
            <div
              className="rounded-l-full bg-success transition-all duration-700 ease-out"
              style={{ width: `${(correctCount / quizzes.length) * 100}%` }}
            />
            <div
              className="bg-destructive transition-all duration-700 ease-out"
              style={{ width: `${(wrongCount / quizzes.length) * 100}%` }}
            />
          </div>

          {/* 하단 스탯 행 */}
          <div className="flex items-center justify-between text-sm max-md:flex-wrap max-md:gap-y-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-success" />
                <span className="text-muted-foreground">{t('정답')}</span>
                <span className="font-bold text-success">{correctCount}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-destructive" />
                <span className="text-muted-foreground">{t('오답')}</span>
                <span className="font-bold text-destructive">{wrongCount}</span>
              </span>
            </div>
            <span className="text-muted-foreground">
              {t('걸린 시간')} <span className="font-bold text-foreground">{totalTime}</span>
            </span>
          </div>
        </div>

        {/* 문항 도트 맵 — 한 줄 미니 인디케이터 */}
        <div className="mb-4 flex items-center gap-1.5 px-1">
          {quizzes.map((q) => {
            const selection = q.selections.find((s) => s.id === q.userAnswer);
            const isCorrect = selection?.correct === true;
            return (
              <button
                key={q.number}
                type="button"
                onClick={() => setOpenIndex((prev) => (prev === q.number ? null : q.number))}
                className={cn(
                  'size-6 shrink-0 rounded-md text-[0.6rem] font-bold transition-all',
                  openIndex === q.number
                    ? isCorrect
                      ? 'bg-success text-success-foreground scale-110'
                      : 'bg-destructive text-destructive-foreground scale-110'
                    : isCorrect
                      ? 'bg-success/15 text-success hover:bg-success/25'
                      : 'bg-destructive/15 text-destructive hover:bg-destructive/25',
                )}
              >
                {q.number}
              </button>
            );
          })}
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

export default QuizResultMagicF;
