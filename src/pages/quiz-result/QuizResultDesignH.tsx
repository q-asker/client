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

/** Dark Theme — 다크 테마 모던 스타일 */
const QuizResultDesignH = () => {
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
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-surface-dark)' }}>
      <div className="mx-auto max-w-6xl px-6 py-10 max-md:px-4">
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* 좌측 패널 — sticky, 다크 테마 */}
          <aside className="lg:sticky lg:top-8 lg:self-start flex flex-col gap-4">
            {/* 점수 카드 */}
            <Card
              className="border-0"
              style={{ backgroundColor: 'var(--color-surface-dark-card)' }}
            >
              <CardContent className="pt-6">
                <div className="mb-2 text-sm text-white/60">{t('점수')}</div>
                <div className="text-5xl font-black text-white">
                  {scorePercent}
                  <span className="text-lg ml-1">{t('점')}</span>
                </div>
              </CardContent>
            </Card>

            {/* 문제 수 */}
            <Card
              className="border-0"
              style={{ backgroundColor: 'var(--color-surface-dark-card)' }}
            >
              <CardContent className="pt-6">
                <div className="mb-2 text-sm text-white/60">{t('문제 수')}</div>
                <div className="text-2xl font-bold text-white">
                  {quizzes.length}
                  {t('개')}
                </div>
              </CardContent>
            </Card>

            {/* 정답/오답 */}
            <Card
              className="border-0"
              style={{ backgroundColor: 'var(--color-surface-dark-card)' }}
            >
              <CardContent className="pt-6">
                <div className="mb-3 text-sm text-white/60">{t('정답/오답')}</div>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-xs text-white/40 mb-1">{t('정답')}</div>
                    <div className="text-xl font-bold text-emerald-400">{correctCount}</div>
                  </div>
                  <div className="h-8 border-l border-white/10" />
                  <div>
                    <div className="text-xs text-white/40 mb-1">{t('오답')}</div>
                    <div className="text-xl font-bold text-red-400">{wrongCount}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 걸린 시간 */}
            <Card
              className="border-0"
              style={{ backgroundColor: 'var(--color-surface-dark-card)' }}
            >
              <CardContent className="pt-6">
                <div className="mb-2 text-sm text-white/60">{t('걸린 시간')}</div>
                <div className="text-xl font-bold text-white">{totalTime}</div>
              </CardContent>
            </Card>

            {/* 해설 보기 버튼 */}
            <Button
              size="lg"
              className="w-full mt-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-0"
              onClick={getQuizExplanation}
            >
              {t('해설 보기')}
            </Button>
          </aside>

          {/* 우측 패널 — 그래디언트 카드 리스트 */}
          <div className="flex flex-col gap-4">
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
                    'border-l-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
                    isCorrect
                      ? 'bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 border-l-emerald-400'
                      : 'bg-gradient-to-r from-red-500/10 to-red-600/10 border-l-red-400',
                  )}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="whitespace-pre-wrap break-words text-lg max-md:text-base text-white">
                        {q.number}. {q.title}
                      </CardTitle>
                      <Badge
                        variant={isCorrect ? 'default' : 'destructive'}
                        className="bg-gradient-to-r"
                      >
                        {isCorrect ? t('정답') : t('오답')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="border-t border-white/10 pt-3 text-sm text-white/70">
                      <span className="font-medium text-white">{t('선택한 답:')}</span>{' '}
                      {userAns === 0 ? t('입력 X') : selection.content}
                    </div>
                    {!isCorrect && (
                      <div className="mt-3 rounded-lg bg-emerald-500/20 px-4 py-3 text-sm border border-emerald-400/30">
                        <span className="font-medium text-emerald-300">{t('정답 답안:')}</span>{' '}
                        <span className="text-white">{correctSelection.content}</span>
                      </div>
                    )}
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

export default QuizResultDesignH;
