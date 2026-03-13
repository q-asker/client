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

/** Minimalist Scorecard — 모던 그래디언트 + 세련된 레이아웃 */
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

  const wrongCount = quizzes.length - correctCount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="mx-auto max-w-6xl px-6 py-10 max-md:px-4">
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* 좌측 패널 — sticky */}
          <aside className="lg:sticky lg:top-8 lg:self-start flex flex-col gap-4">
            {/* 점수 히어로 카드 */}
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-6 border border-primary/20 backdrop-blur-sm">
              <div className="text-xs font-semibold uppercase tracking-widest text-primary/60 mb-3">
                {t('점수')}
              </div>
              <div className="text-6xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-1">
                {scorePercent}
              </div>
              <div className="text-xs text-muted-foreground">{t('점')}</div>
            </div>

            {/* 문제 수 */}
            <div className="rounded-xl p-5 bg-card/50 backdrop-blur border border-border/50 hover:border-border transition-colors duration-200">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                {t('문제 수')}
              </div>
              <div className="text-3xl font-bold text-foreground">
                {quizzes.length}
                <span className="text-sm font-medium ml-2 text-muted-foreground">{t('개')}</span>
              </div>
            </div>

            {/* 정답/오답 */}
            <div className="rounded-xl p-5 bg-card/50 backdrop-blur border border-border/50">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
                {t('정답/오답')}
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-success/5 rounded-lg border border-success/20">
                  <span className="text-xs text-success font-semibold uppercase">{t('정답')}</span>
                  <span className="text-2xl font-bold text-success">{correctCount}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-destructive/5 rounded-lg border border-destructive/20">
                  <span className="text-xs text-destructive font-semibold uppercase">
                    {t('오답')}
                  </span>
                  <span className="text-2xl font-bold text-destructive">{wrongCount}</span>
                </div>
              </div>
            </div>

            {/* 걸린 시간 */}
            <div className="rounded-xl p-5 bg-card/50 backdrop-blur border border-border/50">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                {t('걸린 시간')}
              </div>
              <div className="text-2xl font-bold text-foreground tabular-nums">{totalTime}</div>
            </div>

            {/* 해설 보기 버튼 */}
            <Button
              size="lg"
              className="w-full mt-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
              onClick={getQuizExplanation}
            >
              {t('해설 보기')}
            </Button>
          </aside>

          {/* 우측 패널 — 문항 리스트 */}
          <div className="flex flex-col gap-4">
            {quizzes.map((q) => {
              const userAns = q.userAnswer;
              const selection = q.selections.find((s) => s.id === userAns) || ({} as QuizSelection);
              const isCorrect = selection.correct === true;
              const correctSelection =
                q.selections.find((s) => s.correct === true) || ({} as QuizSelection);

              return (
                <div
                  key={q.number}
                  className={cn(
                    'rounded-xl p-5 border transition-all duration-200 backdrop-blur-sm',
                    isCorrect
                      ? 'bg-success/5 border-success/30 hover:border-success/50'
                      : 'bg-destructive/5 border-destructive/30 hover:border-destructive/50',
                    'hover:shadow-md hover:-translate-y-0.5',
                  )}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <div className="text-base font-semibold text-foreground whitespace-pre-wrap break-words">
                        {q.number}. {q.title}
                      </div>
                    </div>
                    <div
                      className={cn(
                        'text-xs font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-full shrink-0',
                        isCorrect
                          ? 'bg-success/20 text-success'
                          : 'bg-destructive/20 text-destructive',
                      )}
                    >
                      {isCorrect ? t('정답') : t('오답')}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-semibold text-muted-foreground">{t('선택한 답:')}</span>
                      <div className="mt-1 text-foreground">
                        {userAns === 0 ? t('입력 X') : selection.content}
                      </div>
                    </div>

                    {!isCorrect && (
                      <div className="mt-3 p-3 rounded-lg bg-success/10 border border-success/20">
                        <span className="text-xs font-semibold text-success uppercase">
                          {t('정답 답안:')}
                        </span>
                        <div className="mt-1 text-sm text-foreground">
                          {correctSelection.content}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizResultDesignA;
