import React, { lazy, Suspense } from 'react';
import { useTranslation } from 'i18nexus';
import Header from '#widgets/header';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuizHistory } from '#features/quiz-history';
import { cn } from '@/shared/ui/lib/utils';
import { MOCK_QUIZ_HISTORY, MOCK_QUIZ_STATS } from './mockHistoryData';
import type { MockQuizHistoryRecord } from './mockHistoryData';

const QuizHistory = () => {
  const { t, currentLanguage } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMock = searchParams.get('mock') === 'true';

  const {
    state: {
      quizHistory: realHistory,
      loading,
      explanationLoading,
      isSidebarOpen,
      stats: realStats,
    },
    actions: {
      toggleSidebar,
      setIsSidebarOpen,
      navigateToExplanation,
      navigateToQuiz,
      deleteQuizRecord,
      clearAllHistory,
      formatDate,
      handleCreateFromEmpty,
    },
  } = useQuizHistory({ t, navigate, currentLanguage });

  // mock 모드 시 mock 데이터 사용
  const quizHistory = isMock ? (MOCK_QUIZ_HISTORY as unknown as typeof realHistory) : realHistory;
  const stats = isMock ? (MOCK_QUIZ_STATS as unknown as typeof realStats) : realStats;
  const isLoading = isMock ? false : loading;

  // mock 모드에서 formatDate 대체
  const safeFormatDate = (dateString: string) => {
    if (isMock) {
      return new Date(dateString).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return formatDate(dateString);
  };

  if (isLoading) {
    return (
      <>
        <Header
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
          setIsSidebarOpen={setIsSidebarOpen}
        />

        <div className="min-h-screen p-8 max-w-[70%] mx-auto max-md:px-0 max-md:max-w-[90%]">
          <div className="flex flex-col items-center justify-center py-16 px-8 bg-white rounded-2xl shadow-card">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-brand-gradient-from rounded-full animate-spin mb-4" />
            <p className="text-gray-500 text-lg m-0">{t('기록을 불러오는 중...')}</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <div className="w-full bg-gray-50">
        <div className="min-h-screen p-8 max-w-[70%] mx-auto max-md:px-0 max-md:max-w-[90%]">
          {/* 헤더 섹션 */}
          <div className="flex justify-between items-center mb-8 pb-6 border-b-2 border-gray-200 max-md:flex-col max-md:items-start max-md:gap-4">
            <div>
              <h1 className="text-[2.5rem] font-extrabold text-gray-900 mb-2 max-md:text-[2rem]">
                {t('내 퀴즈 기록')}
              </h1>
              <p className="text-lg text-gray-500 m-0">
                {t('지금까지 만들고 푼 퀴즈들을 확인해보세요')}
              </p>
            </div>

            {quizHistory.length > 0 && (
              <div>
                <button
                  className="bg-red-500 text-white border-none py-3 px-6 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 hover:bg-red-600 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(239,68,68,0.3)]"
                  onClick={clearAllHistory}
                >
                  {t('전체 삭제')}
                </button>
              </div>
            )}
          </div>

          {/* 통계 섹션 */}
          {quizHistory.length > 0 && (
            <div className="mb-10">
              <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6 max-md:grid-cols-2 max-md:gap-4 max-sm:grid-cols-1">
                {[
                  { icon: '📝', number: stats.totalQuizzes, label: t('총 퀴즈 수') },
                  { icon: '✅', number: stats.completedQuizzes, label: t('완료한 퀴즈') },
                  { icon: '📊', number: `${stats.completionRate}%`, label: t('완료율') },
                  {
                    icon: '🏆',
                    number: `${stats.averageScore}${t('점')}`,
                    label: t('평균 점수'),
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-gradient-to-br from-brand-gradient-from to-brand-gradient-to rounded-2xl p-6 text-white flex items-center gap-4 shadow-brand-sm transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-brand-md max-md:p-4"
                  >
                    <div className="text-[2rem] opacity-90">{stat.icon}</div>
                    <div className="flex-1">
                      <div className="text-[2rem] font-extrabold leading-none mb-1 max-md:text-2xl">
                        {stat.number}
                      </div>
                      <div className="text-sm opacity-90 font-medium">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 퀴즈 보관 안내 */}
          {quizHistory.length > 0 && (
            <div className="bg-amber-100 border border-amber-200 rounded-xl px-5 py-4 mb-8 shadow-sm">
              <div className="flex items-center mb-2.5">
                <span className="mr-2.5 text-xl">📋</span>
                <h3 className="m-0 text-yellow-800 text-lg font-semibold">{t('퀴즈 보관 정책')}</h3>
              </div>
              <div className="pl-8 text-yellow-800 leading-relaxed text-[0.95rem]">
                {t('• 퀴즈 기록은 최대')}
                <strong>{t('20개')}</strong>
                {t('까지 자동으로 저장됩니다')}
                <br />
                {t('• 생성된 퀴즈는')} <strong>{t('24시간 후 서버에서 자동 삭제')}</strong>
                {t('되어 해설을 볼 수\n              없게 됩니다')}
                <br />
                {t(
                  '• 중요한 퀴즈는 생성 후 24시간 내에 완료하여 기록을\n              남겨두시기 바랍니다',
                )}
              </div>
            </div>
          )}

          {/* 기록 목록 */}
          <div className="bg-white rounded-2xl shadow-card">
            {quizHistory.length === 0 ? (
              <div className="text-center py-16 px-8 text-gray-500">
                <div className="text-[4rem] mb-4 opacity-70">📋</div>
                <h3 className="text-2xl font-semibold mb-2 text-gray-700">
                  {t('아직 만든 퀴즈가 없습니다')}
                </h3>
                <p className="text-lg mb-8">{t('퀴즈를 만들어서 문제를 풀어보세요!')}</p>
                <button
                  className="bg-gradient-to-br from-brand-gradient-from to-brand-gradient-to text-white border-none px-8 py-4 rounded-xl text-lg font-semibold cursor-pointer transition-all duration-200 shadow-brand-sm hover:-translate-y-0.5 hover:shadow-brand-md"
                  onClick={handleCreateFromEmpty}
                >
                  {t('퀴즈 만들기')}
                </button>
              </div>
            ) : (
              <div className="p-6">
                {quizHistory.map((record) => {
                  const rec = record as unknown as MockQuizHistoryRecord;
                  return (
                    <div
                      key={rec.problemSetId}
                      className={cn(
                        'flex justify-between items-stretch p-6 mb-4 border border-gray-200 rounded-2xl bg-white transition-all duration-200 relative last:mb-0 hover:border-gray-300 hover:shadow-[0_8px_25px_rgba(0,0,0,0.08)] hover:-translate-y-0.5',
                        'max-md:flex-col max-md:items-start max-md:gap-4',
                        rec.status === 'completed'
                          ? 'border-l-[5px] border-l-emerald-500'
                          : 'border-l-[5px] border-l-amber-500',
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        {/* 제목 영역 */}
                        <div className="flex items-center mb-4 gap-3 flex-wrap max-md:w-full max-md:gap-2 max-sm:flex-col max-sm:items-start">
                          <span className="text-xl">📄</span>
                          <span className="text-xl font-bold text-gray-900 min-w-0 break-all [overflow-wrap:anywhere] max-w-[900px] block max-md:text-base">
                            {rec.fileName}
                          </span>
                          <span
                            className={cn(
                              'px-3 py-1 rounded-md text-[0.8rem] font-semibold uppercase tracking-wider whitespace-nowrap max-md:text-xs max-md:px-2.5 max-md:py-[0.2rem]',
                              rec.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800',
                            )}
                          >
                            {rec.status === 'completed' ? t('완료') : t('미완료')}
                          </span>
                        </div>

                        {/* 상세 정보 */}
                        <div className="flex flex-wrap gap-3 mb-3 max-md:gap-2">
                          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg font-medium max-md:text-xs max-md:px-2 max-md:py-1">
                            📝 {rec.questionCount}
                            {t('문제')}
                          </span>
                          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg font-medium max-md:text-xs max-md:px-2 max-md:py-1">
                            🎯 {rec.quizLevel}
                          </span>
                          {rec.status === 'completed' && (
                            <>
                              <span className="text-sm bg-green-100 text-green-600 px-3 py-1.5 rounded-lg font-bold max-md:text-xs max-md:px-2 max-md:py-1">
                                🏆{' '}
                                {t('{{score}}점 ({{correct}}/{{total}})', {
                                  score: rec.score,
                                  correct: rec.correctCount,
                                  total: rec.totalQuestions,
                                })}
                              </span>
                              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg font-medium max-md:text-xs max-md:px-2 max-md:py-1">
                                ⏱️ {rec.totalTime}
                              </span>
                            </>
                          )}
                        </div>

                        {/* 날짜 */}
                        <div className="text-[0.85rem] text-gray-400 leading-snug">
                          <div>
                            {t('생성:')}
                            {safeFormatDate(rec.createdAt)}
                          </div>
                          {rec.completedAt && (
                            <div>
                              {t('완료:')}
                              {safeFormatDate(rec.completedAt)}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 액션 버튼 */}
                      <div className="flex flex-col gap-2 items-end ml-auto max-md:flex-row max-md:w-full max-md:justify-end max-sm:flex-col max-sm:items-stretch">
                        {rec.status === 'completed' ? (
                          <>
                            <button
                              className="px-5 py-2 border-none rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 min-w-[100px] text-center bg-blue-500 text-white hover:bg-blue-600 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(59,130,246,0.3)] max-md:min-w-[80px] max-md:text-xs max-md:px-4 max-sm:w-full"
                              onClick={() => navigateToExplanation(record)}
                              disabled={explanationLoading}
                            >
                              {explanationLoading ? t('로딩...') : t('해설 보기')}
                            </button>
                            <button
                              className="px-5 py-2 border-none rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 min-w-[100px] text-center bg-violet-500 text-white hover:bg-violet-600 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(139,92,246,0.3)] max-md:min-w-[80px] max-md:text-xs max-md:px-4 max-sm:w-full"
                              onClick={() => navigateToQuiz(record)}
                            >
                              {t('다시 풀기')}
                            </button>
                          </>
                        ) : (
                          <button
                            className="px-5 py-2 border-none rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 min-w-[100px] text-center bg-emerald-500 text-white hover:bg-emerald-600 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(16,185,129,0.3)] max-md:min-w-[80px] max-md:text-xs max-md:px-4 max-sm:w-full"
                            onClick={() => navigateToQuiz(record)}
                          >
                            {t('퀴즈 풀기')}
                          </button>
                        )}
                        <button
                          className="px-5 py-2 border-none rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 min-w-[100px] text-center bg-red-500 text-white hover:bg-red-600 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(239,68,68,0.3)] max-md:min-w-[80px] max-md:text-xs max-md:px-4 max-sm:w-full"
                          onClick={() => deleteQuizRecord(rec.problemSetId)}
                        >
                          {t('삭제')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

/* 쿼리 파라미터 기반 변형 스위칭 (compare/mix 페이지용) */
const QuizHistoryMagicA = lazy(() => import('./QuizHistoryMagicA'));
const QuizHistoryMagicB = lazy(() => import('./QuizHistoryMagicB'));
const QuizHistoryDesignA = lazy(() => import('./QuizHistoryDesignA'));
const QuizHistoryDesignB = lazy(() => import('./QuizHistoryDesignB'));

const QH_VARIANTS: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  '1': QuizHistoryMagicA,
  '2': QuizHistoryMagicB,
  '3': QuizHistoryDesignA,
  '4': QuizHistoryDesignB,
};

const QuizHistoryWithVariant = () => {
  const [searchParams] = useSearchParams();
  const variant = searchParams.get('qh');
  const VariantComponent = variant ? QH_VARIANTS[variant] : null;

  if (VariantComponent) {
    return (
      <Suspense fallback={null}>
        <VariantComponent />
      </Suspense>
    );
  }
  return <QuizHistory />;
};

export default QuizHistoryWithVariant;
