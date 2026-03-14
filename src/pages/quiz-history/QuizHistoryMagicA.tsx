import { useTranslation } from 'i18nexus';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '#widgets/header';
import { useQuizHistory } from '#features/quiz-history';
import { cn } from '@/shared/ui/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/components/card';
import { Badge } from '@/shared/ui/components/badge';
import { Button } from '@/shared/ui/components/button';
import { Skeleton } from '@/shared/ui/components/skeleton';
import { BlurFade } from '@/shared/ui/components/blur-fade';
import { MOCK_QUIZ_HISTORY, MOCK_QUIZ_STATS } from './mockHistoryData';
import type { MockQuizHistoryRecord } from './mockHistoryData';
import {
  FileText,
  Trophy,
  CheckCircle,
  BarChart3,
  Clock,
  Target,
  Trash2,
  BookOpen,
  Play,
  RotateCcw,
  Plus,
  Info,
} from 'lucide-react';

/** Stagger Cards — DesignA 기반 + BlurFade stagger delay */
const QuizHistoryMagicA = () => {
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
          <div className="mx-auto max-w-5xl space-y-6">
            <div className="grid grid-cols-4 gap-4 max-md:grid-cols-2 max-sm:grid-cols-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
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
        <div className="mx-auto max-w-5xl px-6 py-8 max-md:px-4">
          {/* 헤더 */}
          <BlurFade delay={0.1}>
            <div className="mb-8 flex items-end justify-between max-md:flex-col max-md:items-start max-md:gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">{t('내 퀴즈 기록')}</h1>
                <p className="mt-1 text-muted-foreground">
                  {t('지금까지 만들고 푼 퀴즈들을 확인해보세요')}
                </p>
              </div>
              {quizHistory.length > 0 && (
                <Button variant="destructive" size="sm" onClick={clearAllHistory}>
                  <Trash2 className="mr-1 size-4" />
                  {t('전체 삭제')}
                </Button>
              )}
            </div>
          </BlurFade>

          {/* 통계 카드 */}
          {quizHistory.length > 0 && (
            <div className="mb-8 grid grid-cols-4 gap-4 max-md:grid-cols-2 max-sm:grid-cols-1">
              {[
                {
                  icon: <FileText className="size-5" />,
                  value: stats.totalQuizzes,
                  label: t('총 퀴즈 수'),
                  color: 'text-primary',
                },
                {
                  icon: <CheckCircle className="size-5" />,
                  value: stats.completedQuizzes,
                  label: t('완료한 퀴즈'),
                  color: 'text-success',
                },
                {
                  icon: <BarChart3 className="size-5" />,
                  value: `${stats.completionRate}%`,
                  label: t('완료율'),
                  color: 'text-accent-foreground',
                },
                {
                  icon: <Trophy className="size-5" />,
                  value: `${stats.averageScore}${t('점')}`,
                  label: t('평균 점수'),
                  color: 'text-warning',
                },
              ].map((stat, index) => (
                <BlurFade key={stat.label} delay={0.2 + index * 0.1}>
                  <Card>
                    <CardContent className="flex items-center gap-3 pt-6">
                      <div className={cn('shrink-0', stat.color)}>{stat.icon}</div>
                      <div>
                        <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                        <div className="text-xs text-muted-foreground">{stat.label}</div>
                      </div>
                    </CardContent>
                  </Card>
                </BlurFade>
              ))}
            </div>
          )}

          {/* 보관 정책 안내 */}
          {quizHistory.length > 0 && (
            <BlurFade delay={0.6}>
              <Card className="mb-8 border-amber-200 bg-muted">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Info className="mt-0.5 size-5 shrink-0 text-amber-600" />
                    <div className="text-sm leading-relaxed text-muted-foreground">
                      <span className="font-semibold text-foreground">{t('퀴즈 보관 정책')}</span>
                      <br />
                      {t('• 퀴즈 기록은 최대')}
                      <strong>{t('20개')}</strong>
                      {t('까지 자동으로 저장됩니다')}
                      <br />
                      {t('• 생성된 퀴즈는')} <strong>{t('24시간 후 서버에서 자동 삭제')}</strong>
                      {t('되어 해설을 볼 수\n              없게 됩니다')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </BlurFade>
          )}

          {/* 퀴즈 기록 목록 */}
          {quizHistory.length === 0 ? (
            <BlurFade delay={0.2}>
              <Card className="py-16 text-center">
                <CardContent>
                  <FileText className="mx-auto mb-4 size-12 text-muted-foreground opacity-50" />
                  <h3 className="mb-2 text-xl font-semibold text-foreground">
                    {t('아직 만든 퀴즈가 없습니다')}
                  </h3>
                  <p className="mb-6 text-muted-foreground">
                    {t('퀴즈를 만들어서 문제를 풀어보세요!')}
                  </p>
                  <Button onClick={handleCreateFromEmpty}>
                    <Plus className="mr-1 size-4" />
                    {t('퀴즈 만들기')}
                  </Button>
                </CardContent>
              </Card>
            </BlurFade>
          ) : (
            <div className="flex flex-col gap-4">
              {quizHistory.map((record, index) => {
                const rec = record as unknown as MockQuizHistoryRecord;
                return (
                  <BlurFade key={rec.problemSetId} delay={0.7 + index * 0.1}>
                    <Card
                      className={cn(
                        'border-l-4 border-l-transparent transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
                        rec.status === 'completed' ? 'border-l-success' : 'border-l-warning',
                      )}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between gap-2 max-md:flex-col max-md:items-start max-md:gap-2">
                          <div className="flex items-center gap-3">
                            <FileText className="size-5 shrink-0 text-muted-foreground" />
                            <CardTitle className="break-all text-lg max-md:text-base">
                              {rec.fileName}
                            </CardTitle>
                            <Badge variant={rec.status === 'completed' ? 'default' : 'secondary'}>
                              {rec.status === 'completed' ? t('완료') : t('미완료')}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {/* 상세 정보 */}
                        <div className="mb-3 flex flex-wrap gap-2">
                          <Badge variant="outline">
                            <Target className="mr-1 size-3" />
                            {rec.questionCount}
                            {t('문제')}
                          </Badge>
                          <Badge variant="outline">
                            <BarChart3 className="mr-1 size-3" />
                            {rec.quizLevel}
                          </Badge>
                          {rec.status === 'completed' && (
                            <>
                              <Badge variant="outline" className="text-success">
                                <Trophy className="mr-1 size-3" />
                                {t('{{score}}점 ({{correct}}/{{total}})', {
                                  score: rec.score,
                                  correct: rec.correctCount,
                                  total: rec.totalQuestions,
                                })}
                              </Badge>
                              <Badge variant="outline">
                                <Clock className="mr-1 size-3" />
                                {rec.totalTime}
                              </Badge>
                            </>
                          )}
                        </div>

                        {/* 날짜 */}
                        <div className="mb-4 text-xs text-muted-foreground">
                          <span>
                            {t('생성:')} {safeFormatDate(rec.createdAt)}
                          </span>
                          {rec.completedAt && (
                            <span className="ml-4">
                              {t('완료:')} {safeFormatDate(rec.completedAt)}
                            </span>
                          )}
                        </div>

                        {/* 액션 버튼 */}
                        <div className="flex gap-2 max-sm:flex-col">
                          {rec.status === 'completed' ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => navigateToExplanation(record)}
                                disabled={explanationLoading}
                              >
                                <BookOpen className="mr-1 size-3" />
                                {explanationLoading ? t('로딩...') : t('해설 보기')}
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => navigateToQuiz(record)}
                              >
                                <RotateCcw className="mr-1 size-3" />
                                {t('다시 풀기')}
                              </Button>
                            </>
                          ) : (
                            <Button size="sm" onClick={() => navigateToQuiz(record)}>
                              <Play className="mr-1 size-3" />
                              {t('퀴즈 풀기')}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteQuizRecord(rec.problemSetId)}
                          >
                            <Trash2 className="mr-1 size-3" />
                            {t('삭제')}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </BlurFade>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default QuizHistoryMagicA;
