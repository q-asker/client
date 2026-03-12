import { useTranslation } from 'i18nexus';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuizResult } from '#features/quiz-result';
import { MOCK_RESULT_QUIZZES, MOCK_TOTAL_TIME, MOCK_UPLOADED_URL } from './mockResultData';
import { cn } from '@/shared/ui/lib/utils';
import { Card, CardContent } from '@/shared/ui/components/card';
import { Badge } from '@/shared/ui/components/badge';
import { Button } from '@/shared/ui/components/button';
import { BlurFade } from '@/shared/ui/components/blur-fade';
import { CheckCircle, XCircle, Clock, Trophy, ClipboardList } from 'lucide-react';

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

/** Slide Stack — DesignB + BlurFade stagger */
const QuizResultMagicB = () => {
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
      <div className="mx-auto max-w-5xl px-6 py-8 max-md:px-4">
        <div className="grid gap-8 lg:grid-cols-[300px_1fr] max-md:grid-cols-1">
          {/* 좌측 Sticky stat 패널 */}
          <aside className="max-md:order-first lg:sticky lg:top-8 lg:self-start">
            <div className="flex flex-col gap-3">
              {/* 점수 카드 */}
              <BlurFade delay={0.1}>
                <Card className="bg-primary text-primary-foreground">
                  <CardContent className="flex items-center gap-4 pt-6">
                    <Trophy className="size-8 shrink-0" />
                    <div>
                      <div className="text-sm opacity-80">{t('점수')}</div>
                      <div className="text-3xl font-black">
                        {scorePercent}
                        {t('점')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </BlurFade>

              {/* stat 카드들 */}
              <BlurFade delay={0.2}>
                <Card>
                  <CardContent className="flex items-center gap-3 pt-6">
                    <ClipboardList className="size-5 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground">{t('문제 수')}</div>
                      <div className="text-lg font-bold text-foreground">
                        {quizzes.length}
                        {t('개')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </BlurFade>

              <BlurFade delay={0.3}>
                <Card>
                  <CardContent className="flex items-center gap-3 pt-6">
                    <CheckCircle className="size-5 text-success" />
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground">{t('정답')}</div>
                      <div className="text-lg font-bold text-foreground">{correctCount}</div>
                    </div>
                    <div className="h-8 border-l border-border" />
                    <XCircle className="size-5 text-destructive" />
                    <div>
                      <div className="text-xs text-muted-foreground">{t('오답')}</div>
                      <div className="text-lg font-bold text-foreground">{wrongCount}</div>
                    </div>
                  </CardContent>
                </Card>
              </BlurFade>

              <BlurFade delay={0.4}>
                <Card>
                  <CardContent className="flex items-center gap-3 pt-6">
                    <Clock className="size-5 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground">{t('걸린 시간')}</div>
                      <div className="text-lg font-bold text-foreground">{totalTime}</div>
                    </div>
                  </CardContent>
                </Card>
              </BlurFade>

              {/* 해설 보기 CTA */}
              <BlurFade delay={0.5}>
                <Button size="lg" className="mt-2 w-full" onClick={getQuizExplanation}>
                  {t('해설 보기')}
                </Button>
              </BlurFade>
            </div>
          </aside>

          {/* 우측 결과 리스트 */}
          <div className="flex flex-col gap-3">
            {quizzes.map((q, index) => {
              const userAns = q.userAnswer;
              const selection = q.selections.find((s) => s.id === userAns) || ({} as QuizSelection);
              const isCorrect = selection.correct === true;
              const correctSelection =
                q.selections.find((s) => s.correct === true) || ({} as QuizSelection);

              return (
                <BlurFade key={q.number} delay={0.2 + index * 0.05}>
                  <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                    <CardContent className="flex items-start gap-4 pt-6 max-md:flex-col max-md:gap-3">
                      {/* 정답/오답 아이콘 */}
                      <div className="shrink-0 pt-0.5">
                        {isCorrect ? (
                          <CheckCircle className="size-6 text-success" />
                        ) : (
                          <XCircle className="size-6 text-destructive" />
                        )}
                      </div>

                      {/* 문제 내용 */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <span className="whitespace-pre-wrap break-words text-sm font-semibold text-foreground">
                            {q.number}. {q.title}
                          </span>
                          <Badge
                            variant={isCorrect ? 'default' : 'destructive'}
                            className="shrink-0"
                          >
                            {isCorrect ? t('정답') : t('오답')}
                          </Badge>
                        </div>

                        <div className="mt-2 text-sm text-muted-foreground">
                          {t('선택한 답:')}{' '}
                          <span
                            className={cn(
                              'font-medium',
                              isCorrect ? 'text-success' : 'text-destructive',
                            )}
                          >
                            {userAns === 0 ? t('입력 X') : selection.content}
                          </span>
                        </div>

                        {!isCorrect && (
                          <div className="mt-2 rounded-md bg-muted px-3 py-2 text-sm">
                            <span className="font-medium text-foreground">{t('정답 답안:')}</span>{' '}
                            {correctSelection.content}
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

export default QuizResultMagicB;
