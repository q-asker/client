import React, { lazy, Suspense } from 'react';
import { useTranslation } from 'i18nexus';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuizResult } from '#features/quiz-result';
import { cn } from '@/shared/ui/lib/utils';
import { MOCK_RESULT_QUIZZES, MOCK_TOTAL_TIME, MOCK_UPLOADED_URL } from './mockResultData';

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

const QuizResult = () => {
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
            {/* 점수 카드 */}
            <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] px-6 py-6 transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[0_6px_16px_rgba(0,0,0,0.08)]">
              <div className="text-sm text-gray-600 mb-2">{t('점수')}</div>
              <div className="text-5xl font-black text-gray-900">
                {scorePercent}
                <span className="text-lg ml-1">{t('점')}</span>
              </div>
            </div>

            {/* 문제 수 */}
            <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] px-6 py-4 transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[0_6px_16px_rgba(0,0,0,0.08)]">
              <div className="text-sm text-gray-600 mb-1">{t('문제 수')}</div>
              <div className="text-2xl font-bold text-gray-900">
                {quizzes.length}
                {t('개')}
              </div>
            </div>

            {/* 정답/오답 */}
            <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] px-6 py-4 transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[0_6px_16px_rgba(0,0,0,0.08)]">
              <div className="text-sm text-gray-600 mb-2">{t('정답/오답')}</div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500">{t('정답')}</div>
                  <div className="text-xl font-bold text-emerald-600">{correctCount}</div>
                </div>
                <div className="border-l border-gray-200 h-8" />
                <div>
                  <div className="text-xs text-gray-500">{t('오답')}</div>
                  <div className="text-xl font-bold text-destructive">{wrongCount}</div>
                </div>
              </div>
            </div>

            {/* 걸린 시간 */}
            <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] px-6 py-4 transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[0_6px_16px_rgba(0,0,0,0.08)]">
              <div className="text-sm text-gray-600 mb-1">{t('걸린 시간')}</div>
              <div className="text-xl font-bold text-gray-900">{totalTime}</div>
            </div>

            {/* 해설 보기 버튼 */}
            <button
              className="bg-gradient-to-br from-brand-gradient-from to-brand-gradient-to text-white text-base font-semibold px-6 py-3 border-none rounded-xl cursor-pointer transition-all duration-200 shadow-brand-sm hover:bg-gradient-to-br hover:from-brand-gradient-from-hover hover:to-brand-gradient-to-hover hover:-translate-y-0.5 hover:shadow-brand-md active:translate-y-0 active:shadow-brand-sm mt-2"
              onClick={getQuizExplanation}
            >
              {t('해설 보기')}
            </button>
          </aside>

          {/* 우측 패널 — 문항 리스트 */}
          <div className="flex flex-col gap-6 max-md:gap-4">
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
                    'bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] px-8 py-6 transition-[transform,box-shadow] duration-200 border-l-[5px] border-l-transparent hover:-translate-y-1 hover:shadow-[0_6px_16px_rgba(0,0,0,0.08)]',
                    'max-md:px-6 max-md:py-4',
                    isCorrect ? 'border-l-emerald-500' : 'border-l-destructive',
                  )}
                >
                  <div className="text-xl font-semibold mb-3 text-gray-900 whitespace-pre-wrap break-words max-md:text-lg">
                    {q.number}. {q.title}
                  </div>

                  <div className="text-[1.05rem] py-3 relative text-gray-600 mb-2 whitespace-pre-wrap break-words before:content-[''] before:absolute before:top-0 before:left-0 before:w-full before:border-t before:border-gray-200 max-md:text-base">
                    {t('선택한 답:')}
                    {userAns === 0 ? t('입력 X') : selection.content}
                  </div>

                  {!isCorrect && (
                    <div className="text-[1.05rem] my-2 px-3 py-2 bg-emerald-50 rounded-lg text-emerald-700 border border-emerald-200 whitespace-pre-wrap break-words max-md:text-base">
                      {t('정답 답안:')}
                      {correctSelection.content}
                    </div>
                  )}

                  <div
                    className={cn(
                      'inline-block mt-3 px-4 py-2 rounded-lg text-base font-semibold uppercase tracking-tight max-md:text-[0.95rem] max-md:px-3 max-md:py-1.5',
                      isCorrect ? 'bg-emerald-500 text-white' : 'bg-destructive text-white',
                    )}
                  >
                    {isCorrect ? t('정답') : t('오답')}
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

/* 쿼리 파라미터 기반 변형 스위칭 (compare/mix 페이지용) */
const QuizResultMagicA = lazy(() => import('./QuizResultMagicA'));
const QuizResultMagicB = lazy(() => import('./QuizResultMagicB'));
const QuizResultMagicC = lazy(() => import('./QuizResultMagicC'));
const QuizResultMagicD = lazy(() => import('./QuizResultMagicD'));
const QuizResultDesignA = lazy(() => import('./QuizResultDesignA'));
const QuizResultDesignB = lazy(() => import('./QuizResultDesignB'));
const QuizResultDesignC = lazy(() => import('./QuizResultDesignC'));
const QuizResultDesignD = lazy(() => import('./QuizResultDesignD'));
const QuizResultDesignE = lazy(() => import('./QuizResultDesignE'));
const QuizResultDesignF = lazy(() => import('./QuizResultDesignF'));
const QuizResultDesignG = lazy(() => import('./QuizResultDesignG'));
const QuizResultDesignH = lazy(() => import('./QuizResultDesignH'));

const QR_VARIANTS: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  '1': QuizResultMagicA,
  '2': QuizResultMagicB,
  '3': QuizResultDesignA,
  '4': QuizResultDesignB,
  '5': QuizResultDesignC,
  '6': QuizResultDesignD,
  '7': QuizResultDesignE,
  '8': QuizResultDesignF,
  '9': QuizResultDesignG,
  '10': QuizResultDesignH,
  '11': QuizResultMagicC,
  '12': QuizResultMagicD,
};

const QuizResultWithVariant = () => {
  const [searchParams] = useSearchParams();
  const variant = searchParams.get('qr');
  const VariantComponent = variant ? QR_VARIANTS[variant] : null;

  if (VariantComponent) {
    return (
      <Suspense fallback={null}>
        <VariantComponent />
      </Suspense>
    );
  }
  return <QuizResult />;
};

export default QuizResultWithVariant;
