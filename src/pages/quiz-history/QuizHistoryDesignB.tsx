import { useTranslation } from 'i18nexus';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '#widgets/header';
import { useQuizHistory } from '#features/quiz-history';
import { cn } from '@/shared/ui/lib/utils';
import { Badge } from '@/shared/ui/components/badge';
import { Button } from '@/shared/ui/components/button';
import { Skeleton } from '@/shared/ui/components/skeleton';
import { MOCK_QUIZ_HISTORY, MOCK_QUIZ_STATS } from './mockHistoryData';
import type { MockQuizHistoryRecord } from './mockHistoryData';
import {
  FileText,
  Trophy,
  CheckCircle,
  BarChart3,
  Clock,
  Trash2,
  BookOpen,
  Play,
  RotateCcw,
  Plus,
  Info,
  Target,
} from 'lucide-react';

/** Table View — 행 기반 밀집 리스트, 정보 밀도 극대화 */
const QuizHistoryDesignB = () => {
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

  const quizHistory = isMock ? (MOCK_QUIZ_HISTORY as unknown as typeof realHistory) : realHistory;
  const stats = isMock ? (MOCK_QUIZ_STATS as unknown as typeof realStats) : realStats;
  const isLoading = isMock ? false : loading;

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
        <div className="min-h-screen bg-background p-8 max-md:p-4">
          <div className="mx-auto max-w-6xl space-y-3">
            <Skeleton className="h-10 w-full rounded-lg" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
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

      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-6xl px-6 py-8 max-md:px-4">
          {/* 헤더 */}
          <div className="mb-6 flex items-end justify-between max-md:flex-col max-md:items-start max-md:gap-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t('내 퀴즈 기록')}</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {t('지금까지 만들고 푼 퀴즈들을 확인해보세요')}
              </p>
            </div>
            {quizHistory.length > 0 && (
              <Button variant="destructive" size="sm" onClick={clearAllHistory}>
                <Trash2 className="mr-1 size-3.5" />
                {t('전체 삭제')}
              </Button>
            )}
          </div>

          {/* 인라인 통계 바 */}
          {quizHistory.length > 0 && (
            <div className="mb-6 flex items-center gap-6 rounded-lg border border-border bg-card px-5 py-3 text-sm max-md:flex-wrap max-md:gap-3">
              <div className="flex items-center gap-1.5">
                <FileText className="size-4 text-primary" />
                <span className="text-muted-foreground">{t('총 퀴즈 수')}</span>
                <span className="font-bold text-foreground">{stats.totalQuizzes}</span>
              </div>
              <div className="hidden h-4 border-l border-border md:block" />
              <div className="flex items-center gap-1.5">
                <CheckCircle className="size-4 text-success" />
                <span className="text-muted-foreground">{t('완료한 퀴즈')}</span>
                <span className="font-bold text-foreground">{stats.completedQuizzes}</span>
              </div>
              <div className="hidden h-4 border-l border-border md:block" />
              <div className="flex items-center gap-1.5">
                <BarChart3 className="size-4 text-accent-foreground" />
                <span className="text-muted-foreground">{t('완료율')}</span>
                <span className="font-bold text-foreground">{stats.completionRate}%</span>
              </div>
              <div className="hidden h-4 border-l border-border md:block" />
              <div className="flex items-center gap-1.5">
                <Trophy className="size-4 text-warning" />
                <span className="text-muted-foreground">{t('평균 점수')}</span>
                <span className="font-bold text-foreground">
                  {stats.averageScore}
                  {t('점')}
                </span>
              </div>
            </div>
          )}

          {/* 보관 정책 */}
          {quizHistory.length > 0 && (
            <div className="mb-6 flex items-start gap-2 rounded-lg bg-muted px-4 py-3 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
              <span>
                {t('퀴즈 기록은 최대')}
                <strong>{t('20개')}</strong>
                {t('까지 자동으로 저장됩니다')} · {t('생성된 퀴즈는')}{' '}
                <strong>{t('24시간 후 서버에서 자동 삭제')}</strong>
                {t('되어 해설을 볼 수\n              없게 됩니다')}
              </span>
            </div>
          )}

          {/* 빈 상태 */}
          {quizHistory.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-center">
              <FileText className="mb-4 size-10 text-muted-foreground opacity-40" />
              <h3 className="mb-1 text-lg font-semibold text-foreground">
                {t('아직 만든 퀴즈가 없습니다')}
              </h3>
              <p className="mb-6 text-sm text-muted-foreground">
                {t('퀴즈를 만들어서 문제를 풀어보세요!')}
              </p>
              <Button size="sm" onClick={handleCreateFromEmpty}>
                <Plus className="mr-1 size-3.5" />
                {t('퀴즈 만들기')}
              </Button>
            </div>
          ) : (
            /* 테이블형 리스트 */
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              {/* 테이블 헤더 */}
              <div className="hidden border-b border-border bg-muted/50 px-5 py-2.5 text-xs font-medium text-muted-foreground md:grid md:grid-cols-[1fr_80px_80px_100px_120px_140px]">
                <span>{t('파일명')}</span>
                <span className="text-center">{t('상태')}</span>
                <span className="text-center">{t('난이도')}</span>
                <span className="text-center">{t('점수')}</span>
                <span className="text-center">{t('생성일')}</span>
                <span className="text-right">{t('액션')}</span>
              </div>

              {/* 행 목록 */}
              {quizHistory.map((record) => {
                const rec = record as unknown as MockQuizHistoryRecord;
                return (
                  <div
                    key={rec.problemSetId}
                    className={cn(
                      'flex flex-col gap-3 border-b border-border px-5 py-3 last:border-b-0 md:grid md:grid-cols-[1fr_80px_80px_100px_120px_140px] md:items-center md:gap-2',
                      'transition-colors duration-150 hover:bg-muted/30',
                    )}
                  >
                    {/* 파일명 */}
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="size-4 shrink-0 text-muted-foreground" />
                      <span className="truncate text-sm font-medium text-foreground">
                        {rec.fileName}
                      </span>
                      <Badge variant="outline" className="shrink-0 text-[0.65rem]">
                        {rec.questionCount}
                        {t('문제')}
                      </Badge>
                    </div>

                    {/* 상태 */}
                    <div className="text-center max-md:hidden">
                      <Badge
                        variant={rec.status === 'completed' ? 'default' : 'secondary'}
                        className="text-[0.65rem]"
                      >
                        {rec.status === 'completed' ? t('완료') : t('미완료')}
                      </Badge>
                    </div>

                    {/* 난이도 */}
                    <div className="text-center text-xs text-muted-foreground max-md:hidden">
                      {rec.quizLevel}
                    </div>

                    {/* 점수 */}
                    <div className="text-center text-sm font-semibold max-md:hidden">
                      {rec.status === 'completed' ? (
                        <span className="text-foreground">
                          {rec.score}
                          {t('점')}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>

                    {/* 생성일 */}
                    <div className="text-center text-xs text-muted-foreground max-md:hidden">
                      {safeFormatDate(rec.createdAt)}
                    </div>

                    {/* 모바일 메타 정보 */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground md:hidden">
                      <Badge
                        variant={rec.status === 'completed' ? 'default' : 'secondary'}
                        className="text-[0.6rem]"
                      >
                        {rec.status === 'completed' ? t('완료') : t('미완료')}
                      </Badge>
                      <span className="flex items-center gap-1">
                        <Target className="size-3" />
                        {rec.quizLevel}
                      </span>
                      {rec.status === 'completed' && (
                        <span className="flex items-center gap-1 font-medium text-foreground">
                          <Trophy className="size-3" />
                          {rec.score}
                          {t('점')}
                        </span>
                      )}
                      {rec.totalTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {rec.totalTime}
                        </span>
                      )}
                    </div>

                    {/* 액션 */}
                    <div className="flex items-center justify-end gap-1">
                      {rec.status === 'completed' ? (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            onClick={() => navigateToExplanation(record)}
                            disabled={explanationLoading}
                            title={String(t('해설 보기'))}
                          >
                            <BookOpen className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            onClick={() => navigateToQuiz(record)}
                            title={String(t('다시 풀기'))}
                          >
                            <RotateCcw className="size-3.5" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() => navigateToQuiz(record)}
                          title={String(t('퀴즈 풀기'))}
                        >
                          <Play className="size-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-destructive hover:text-destructive"
                        onClick={() => deleteQuizRecord(rec.problemSetId)}
                        title={String(t('삭제'))}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default QuizHistoryDesignB;
