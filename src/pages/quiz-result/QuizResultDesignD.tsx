import { useTranslation } from 'i18nexus';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuizResult } from '#features/quiz-result';
import { MOCK_RESULT_QUIZZES, MOCK_TOTAL_TIME, MOCK_UPLOADED_URL } from './mockResultData';
import { cn } from '@/shared/ui/lib/utils';
import { Card, CardContent } from '@/shared/ui/components/card';
import { Badge } from '@/shared/ui/components/badge';
import { Button } from '@/shared/ui/components/button';
import { BlurFade } from '@/shared/ui/components/blur-fade';
import { CheckCircle, XCircle, Clock, Hash, Trophy } from 'lucide-react';

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

/** Timeline — 세로 타임라인, 좌우 교차 배치, 정오답 노드 컬러 */
const QuizResultDesignD = () => {
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
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* 좌측 패널 — sticky */}
          <aside className="lg:sticky lg:top-8 lg:self-start flex flex-col gap-4">
            {/* 점수 */}
            <BlurFade delay={0.1}>
              <Card>
                <CardContent className="pt-6">
                  <div className="inline-flex items-baseline gap-1">
                    <span className="text-5xl font-black tabular-nums tracking-tighter text-foreground">
                      {scorePercent}
                    </span>
                    <span className="text-lg font-bold text-muted-foreground">{t('점')}</span>
                  </div>
                </CardContent>
              </Card>
            </BlurFade>

            {/* 메타 칩들 */}
            <BlurFade delay={0.2}>
              <Card>
                <CardContent className="flex items-center gap-2 pt-6">
                  <Hash className="size-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">
                    {quizzes.length}
                    {t('개')}
                  </span>
                </CardContent>
              </Card>
            </BlurFade>

            <BlurFade delay={0.3}>
              <Card>
                <CardContent className="flex items-center justify-between gap-2 pt-6">
                  <div className="flex items-center gap-2">
                    <Trophy className="size-4 text-success" />
                    <span className="font-medium text-foreground">{correctCount}</span>
                  </div>
                  <div className="border-l border-border h-6" />
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <span className="font-medium text-foreground">{wrongCount}</span>
                  </div>
                </CardContent>
              </Card>
            </BlurFade>

            <BlurFade delay={0.4}>
              <Card>
                <CardContent className="flex items-center gap-2 pt-6">
                  <Clock className="size-4 text-muted-foreground" />
                  <span className="tabular-nums font-medium text-foreground">{totalTime}</span>
                </CardContent>
              </Card>
            </BlurFade>

            {/* 해설 보기 CTA */}
            <BlurFade delay={0.5}>
              <Button size="lg" className="w-full" onClick={getQuizExplanation}>
                {t('해설 보기')}
              </Button>
            </BlurFade>
          </aside>

          {/* 우측 패널 — 카드 리스트 */}
          <div className="flex flex-col gap-4">
            {quizzes.map((q, index) => {
              const userAns = q.userAnswer;
              const selection = q.selections.find((s) => s.id === userAns) || ({} as QuizSelection);
              const isCorrect = selection.correct === true;
              const correctSelection =
                q.selections.find((s) => s.correct === true) || ({} as QuizSelection);

              return (
                <BlurFade key={q.number} delay={0.5 + index * 0.08}>
                  <Card className="transition-all duration-200 hover:shadow-md">
                    <CardContent className="pt-6">
                      {/* 문항 헤더 */}
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {isCorrect ? (
                            <CheckCircle className="size-5 text-success shrink-0" />
                          ) : (
                            <XCircle className="size-5 text-destructive shrink-0" />
                          )}
                          <span className="text-xs font-bold tabular-nums text-muted-foreground">
                            Q{String(q.number).padStart(2, '0')}
                          </span>
                          <Badge
                            variant={isCorrect ? 'default' : 'destructive'}
                            className="text-[0.6rem]"
                          >
                            {isCorrect ? t('정답') : t('오답')}
                          </Badge>
                        </div>
                      </div>

                      {/* 문항 제목 */}
                      <p className="mb-4 whitespace-pre-wrap break-words text-sm font-semibold leading-relaxed text-foreground">
                        {q.title}
                      </p>

                      {/* 선택한 답 */}
                      <div className="space-y-2">
                        <div className="rounded-lg bg-muted/40 px-3.5 py-2.5">
                          <span className="text-xs text-muted-foreground">{t('선택한 답:')}</span>
                          <div
                            className={cn(
                              'mt-0.5 text-sm font-medium',
                              isCorrect ? 'text-success' : 'text-destructive',
                            )}
                          >
                            {userAns === 0 ? t('입력 X') : selection.content}
                          </div>
                        </div>

                        {/* 정답 (오답 시) */}
                        {!isCorrect && (
                          <div className="rounded-lg border border-success/20 bg-success/5 px-3.5 py-2.5">
                            <span className="text-xs text-success">{t('정답 답안:')}</span>
                            <div className="mt-0.5 text-sm font-medium text-foreground">
                              {correctSelection.content}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </BlurFade>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizResultDesignD;
