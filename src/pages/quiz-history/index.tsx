import { useTranslation } from 'i18nexus';
import Header from '#widgets/header';
import { useNavigate } from 'react-router-dom';
import { useQuizHistory } from '#features/quiz-history';
import { cn } from '@/shared/ui/lib/utils';
import { Badge } from '@/shared/ui/components/badge';
import { Button } from '@/shared/ui/components/button';
import { Skeleton } from '@/shared/ui/components/skeleton';
import { BlurFade } from '@/shared/ui/components/blur-fade';
import {
  FileText,
  Trophy,
  CheckCircle,
  BarChart3,
  Trash2,
  Play,
  RotateCcw,
  Plus,
  Info,
  ChevronRight,
  LogIn,
} from 'lucide-react';

const QUIZ_TYPE_LABEL: Record<'MULTIPLE' | 'BLANK' | 'OX', string> = {
  MULTIPLE: '객관식',
  OX: 'OX',
  BLANK: '빈칸',
};

const QuizHistory = () => {
  const { t, currentLanguage } = useTranslation();
  const navigate = useNavigate();

  const {
    state: { quizHistory, loading, isSidebarOpen, isAuthenticated, stats },
    actions: {
      toggleSidebar,
      setIsSidebarOpen,
      navigateToDetail,
      navigateToQuiz,
      deleteQuizRecord,
      clearAllHistory,
      formatDate,
      handleCreateFromEmpty,
    },
  } = useQuizHistory({ t, navigate, currentLanguage });

  if (loading) {
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
          <BlurFade delay={0.1}>
            <div className="mb-6 flex items-end justify-between max-md:flex-col max-md:items-start max-md:gap-3">
              <div>
                <h1 className="text-2xl font-bold text-foreground">{t('내 퀴즈 기록')}</h1>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {t('지금까지 만들고 푼 퀴즈들을 확인해보세요')}
                </p>
              </div>
              {isAuthenticated && quizHistory.length > 0 && (
                <Button variant="destructive" size="sm" onClick={clearAllHistory}>
                  <Trash2 className="mr-1 size-3.5" />
                  {t('전체 삭제')}
                </Button>
              )}
            </div>
          </BlurFade>

          {/* 비로그인 안내 */}
          {!isAuthenticated && (
            <BlurFade delay={0.2}>
              <div className="flex flex-col items-center py-20 text-center">
                <LogIn className="mb-4 size-10 text-muted-foreground opacity-40" />
                <h3 className="mb-1 text-lg font-semibold text-foreground">
                  {t('로그인이 필요한 서비스입니다')}
                </h3>
                <p className="mb-6 text-sm text-muted-foreground">
                  {t('퀴즈 기록은 로그인 후에 확인할 수 있습니다.')}
                </p>
                <Button size="sm" onClick={() => navigate('/login')}>
                  <LogIn className="mr-1 size-3.5" />
                  {t('로그인하기')}
                </Button>
              </div>
            </BlurFade>
          )}

          {/* 인라인 통계 바 */}
          {isAuthenticated && quizHistory.length > 0 && (
            <BlurFade delay={0.2}>
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
            </BlurFade>
          )}

          {/* 빈 상태 / 목록 */}
          {isAuthenticated && (quizHistory.length === 0 ? (
            <BlurFade delay={0.2}>
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
            </BlurFade>
          ) : (
            /* 테이블형 리스트 */
            <BlurFade delay={0.4}>
              <div className="overflow-hidden rounded-lg border border-border bg-card">
                {/* 테이블 헤더 */}
                <div className="hidden border-b border-border bg-muted/50 px-5 py-2.5 text-xs font-medium text-muted-foreground md:grid md:grid-cols-[1fr_80px_100px_120px_120px]">
                  <span>{t('퀴즈 유형')}</span>
                  <span className="text-center">{t('상태')}</span>
                  <span className="text-center">{t('점수')}</span>
                  <span className="text-center">{t('완료일')}</span>
                  <span className="text-right">{t('액션')}</span>
                </div>

                {/* 행 목록 */}
                {quizHistory.map((record, index) => (
                  <BlurFade key={record.problemSetId} delay={0.5 + index * 0.08}>
                    <div
                      className={cn(
                        'flex flex-col gap-3 border-b border-border px-5 py-3 last:border-b-0',
                        'md:grid md:grid-cols-[1fr_80px_100px_120px_120px] md:items-center md:gap-2',
                        record.completed &&
                          'cursor-pointer transition-colors duration-150 hover:bg-muted/30',
                      )}
                      onClick={() => record.completed && navigateToDetail(record)}
                    >
                      {/* 퀴즈 유형 */}
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="size-4 shrink-0 text-muted-foreground" />
                        <span className="truncate text-sm font-medium text-foreground">
                          {QUIZ_TYPE_LABEL[record.quizType]}
                        </span>
                        <Badge variant="outline" className="shrink-0 text-[0.65rem]">
                          {record.totalCount}
                          {t('문제')}
                        </Badge>
                        {record.completed && (
                          <ChevronRight className="ml-auto size-4 shrink-0 text-muted-foreground md:hidden" />
                        )}
                      </div>

                      {/* 상태 */}
                      <div className="text-center max-md:hidden">
                        <Badge
                          variant={record.completed ? 'default' : 'secondary'}
                          className="text-[0.65rem]"
                        >
                          {record.completed ? t('완료') : t('미완료')}
                        </Badge>
                      </div>

                      {/* 점수 */}
                      <div className="text-center text-sm font-semibold max-md:hidden">
                        {record.completed && record.score !== null ? (
                          <span className="text-foreground">
                            {Math.round((record.score / record.totalCount) * 100)}
                            {t('점')}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>

                      {/* 완료일 */}
                      <div className="text-center text-xs text-muted-foreground max-md:hidden">
                        {record.takenAt ? formatDate(record.takenAt) : '-'}
                      </div>

                      {/* 모바일 메타 정보 */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground md:hidden">
                        <Badge
                          variant={record.completed ? 'default' : 'secondary'}
                          className="text-[0.6rem]"
                        >
                          {record.completed ? t('완료') : t('미완료')}
                        </Badge>
                        {record.completed && record.score !== null && (
                          <span className="flex items-center gap-1 font-medium text-foreground">
                            <Trophy className="size-3" />
                            {Math.round((record.score / record.totalCount) * 100)}
                            {t('점')}
                          </span>
                        )}
                      </div>

                      {/* 액션 */}
                      <div
                        className="flex items-center justify-end gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {record.completed ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            onClick={() => navigateToQuiz(record)}
                            title={String(t('다시 풀기'))}
                          >
                            <RotateCcw className="size-3.5" />
                          </Button>
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
                        {record.completed && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-destructive hover:text-destructive"
                            onClick={() => deleteQuizRecord(record.problemSetId)}
                            title={String(t('삭제'))}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </BlurFade>
                ))}
              </div>
            </BlurFade>
          ))}
        </div>
      </div>
    </>
  );
};

export default QuizHistory;
