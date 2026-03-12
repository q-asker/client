import { useTranslation } from 'i18nexus';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuizResult } from '#features/quiz-result';
import { MOCK_RESULT_QUIZZES, MOCK_TOTAL_TIME, MOCK_UPLOADED_URL } from './mockResultData';
import { cn } from '@/shared/ui/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/components/card';
import { Badge } from '@/shared/ui/components/badge';
import { Button } from '@/shared/ui/components/button';

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

/** Editorial Scorecard — 대형 점수 표시, Shadcn Card/Badge/Button */
const QuizResultDesignA = () => {
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

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-12 max-md:px-4 max-md:py-8">
        {/* 대형 점수 표시 */}
        <div className="mb-12 text-center">
          <div className="text-[5rem] font-black leading-none tracking-tight text-foreground max-md:text-[3.5rem]">
            {scorePercent}
          </div>
          <span className="mt-2 block text-lg font-medium text-muted-foreground">{t('점')}</span>
        </div>

        {/* 메타데이터 카드 */}
        <div className="mb-10 grid grid-cols-3 gap-4 max-md:grid-cols-1 max-md:gap-3">
          {[
            { icon: '📋', label: t('문제 수'), value: `${quizzes.length}${t('개')}` },
            { icon: '⏱️', label: t('걸린 시간'), value: totalTime },
            {
              icon: '🏆',
              label: t('정답'),
              value: `${correctCount}/${quizzes.length}`,
            },
          ].map((meta) => (
            <Card key={meta.label} className="text-center">
              <CardContent className="pt-6">
                <span className="mb-2 block text-2xl">{meta.icon}</span>
                <div className="text-sm text-muted-foreground">{meta.label}</div>
                <div className="mt-1 text-xl font-bold text-foreground">{meta.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 문제별 결과 리스트 */}
        <div className="mb-12 flex flex-col gap-4">
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
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="whitespace-pre-wrap break-words text-lg max-md:text-base">
                      {q.number}. {q.title}
                    </CardTitle>
                    <Badge variant={isCorrect ? 'default' : 'destructive'}>
                      {isCorrect ? t('정답') : t('오답')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
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

        {/* 해설 보기 CTA */}
        <div className="text-center">
          <Button size="lg" className="w-full max-w-md text-lg" onClick={getQuizExplanation}>
            {t('해설 보기')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuizResultDesignA;
