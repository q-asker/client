import { useTranslation } from 'i18nexus';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuizResult } from '#features/quiz-result';
import { MOCK_RESULT_QUIZZES, MOCK_TOTAL_TIME, MOCK_UPLOADED_URL } from './mockResultData';
import { cn } from '@/shared/ui/lib/utils';
import { Card, CardContent } from '@/shared/ui/components/card';
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

/** Compact List — 미니 카드로 많은 문항 한 화면 표시 */
const QuizResultDesignF = () => {
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
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* 좌측 패널 — sticky */}
          <aside className="lg:sticky lg:top-8 lg:self-start flex flex-col gap-4">
            {/* 점수 카드 */}
            <Card>
              <CardContent className="pt-6">
                <div className="mb-2 text-sm text-muted-foreground">{t('점수')}</div>
                <div className="text-5xl font-black text-foreground">
                  {scorePercent}
                  <span className="text-lg ml-1">{t('점')}</span>
                </div>
              </CardContent>
            </Card>

            {/* 문제 수 */}
            <Card>
              <CardContent className="pt-6">
                <div className="mb-2 text-sm text-muted-foreground">{t('문제 수')}</div>
                <div className="text-2xl font-bold text-foreground">
                  {quizzes.length}
                  {t('개')}
                </div>
              </CardContent>
            </Card>

            {/* 정답/오답 */}
            <Card>
              <CardContent className="pt-6">
                <div className="mb-3 text-sm text-muted-foreground">{t('정답/오답')}</div>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">{t('정답')}</div>
                    <div className="text-xl font-bold text-success">{correctCount}</div>
                  </div>
                  <div className="h-8 border-l border-border" />
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">{t('오답')}</div>
                    <div className="text-xl font-bold text-destructive">{wrongCount}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 걸린 시간 */}
            <Card>
              <CardContent className="pt-6">
                <div className="mb-2 text-sm text-muted-foreground">{t('걸린 시간')}</div>
                <div className="text-xl font-bold text-foreground">{totalTime}</div>
              </CardContent>
            </Card>

            {/* 해설 보기 버튼 */}
            <Button size="lg" className="w-full mt-2" onClick={getQuizExplanation}>
              {t('해설 보기')}
            </Button>
          </aside>

          {/* 우측 패널 — 미니 컴팩트 리스트 */}
          <div className="space-y-2">
            {quizzes.map((q) => {
              const userAns = q.userAnswer;
              const selection = q.selections.find((s) => s.id === userAns) || ({} as QuizSelection);
              const isCorrect = selection.correct === true;

              return (
                <Card key={q.number} className="transition-all duration-200 hover:shadow-md">
                  <CardContent className="py-3 px-4 flex items-center gap-3">
                    {/* 정오답 인디케이터 */}
                    <span
                      className={cn(
                        'size-2.5 shrink-0 rounded-full',
                        isCorrect ? 'bg-success' : 'bg-destructive',
                      )}
                    />

                    {/* 문항 번호 및 제목 */}
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold tabular-nums text-muted-foreground">
                        Q{String(q.number).padStart(2, '0')}
                      </div>
                      <div className="text-sm font-medium text-foreground truncate">{q.title}</div>
                    </div>

                    {/* 선택한 답 (한줄) */}
                    <div
                      className={cn(
                        'shrink-0 text-xs font-medium max-w-xs truncate text-right',
                        isCorrect ? 'text-success' : 'text-destructive',
                      )}
                    >
                      {userAns === 0 ? t('입력 X') : selection.content}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizResultDesignF;
