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
 * DesignJ — "Floating Summary + List"
 * 상단에 떠 있는 요약 카드(점수+스탯 인라인), 하단 문항 리스트.
 * 톤: 부드러운 라운드, 그라데이션 히어로, 깔끔한 카드
 */
const QuizResultDesignJ = () => {
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
    <div className="min-h-screen bg-muted/30">
      {/* 히어로 배경 */}
      <div className="bg-primary px-6 pb-20 pt-10 max-md:px-4 max-md:pb-16 max-md:pt-8">
        <div className="mx-auto max-w-3xl text-center">
          <Trophy className="mx-auto mb-3 size-10 text-primary-foreground/70" />
          <div className="text-6xl font-black tabular-nums text-primary-foreground max-md:text-4xl">
            {scorePercent}
            <span className="text-2xl max-md:text-lg">{t('점')}</span>
          </div>
        </div>
      </div>

      {/* 플로팅 스탯 카드 */}
      <div className="mx-auto max-w-3xl px-6 max-md:px-4">
        <Card className="-mt-12 shadow-lg max-md:-mt-10">
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

        {/* 문항 리스트 */}
        <div className="mt-6 space-y-2 pb-10">
          {quizzes.map((q) => {
            const userAns = q.userAnswer;
            const selection = q.selections.find((s) => s.id === userAns) || ({} as QuizSelection);
            const isCorrect = selection.correct === true;
            const correctSelection =
              q.selections.find((s) => s.correct === true) || ({} as QuizSelection);
            const isOpen = openIndex === q.number;

            return (
              <Card
                key={q.number}
                className={cn(
                  'transition-all duration-300',
                  isOpen ? 'shadow-md' : 'hover:shadow-sm',
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
              </Card>
            );
          })}

          {/* 해설 보기 CTA */}
          <div className="pt-4">
            <Button size="lg" className="w-full text-base" onClick={getQuizExplanation}>
              {t('해설 보기')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizResultDesignJ;
