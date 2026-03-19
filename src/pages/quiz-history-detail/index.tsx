import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'i18nexus';
import axiosInstance from '#shared/api';
import { cn } from '@/shared/ui/lib/utils';
import { Button } from '@/shared/ui/components/button';
import { Badge } from '@/shared/ui/components/badge';
import { Skeleton } from '@/shared/ui/components/skeleton';
import { BlurFade } from '@/shared/ui/components/blur-fade';
import Header from '#widgets/header';
import { ArrowLeft, Trophy, CheckCircle2, XCircle, Hash } from 'lucide-react';

// ── 타입 ──

interface Selection {
  id: number;
  content: string;
  correct: boolean;
}

interface Problem {
  number: number;
  title: string;
  userAnswer: number;
  correct: boolean;
  selections: Selection[];
}

interface HistoryDetail {
  historyId: string;
  quizType: 'MULTIPLE' | 'BLANK' | 'OX';
  totalCount: number;
  score: number;
  takenAt: string;
  problems: Problem[];
}

const QUIZ_TYPE_LABEL: Record<'MULTIPLE' | 'BLANK' | 'OX', string> = {
  MULTIPLE: '객관식',
  OX: 'OX',
  BLANK: '빈칸',
};

// ── 컴포넌트 ──

const QuizHistoryDetail = () => {
  const { t, currentLanguage } = useTranslation();
  const { problemSetId } = useParams<{ problemSetId: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<HistoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!problemSetId) return;
    axiosInstance
      .get<HistoryDetail>(`/history/${problemSetId}`)
      .then((res) => setDetail(res.data))
      .catch((err: { response?: { status?: number } }) => {
        if (err.response?.status === 401) {
          navigate('/login');
        } else {
          setError(true);
        }
      })
      .finally(() => setLoading(false));
  }, [problemSetId]);

  const formatDate = (dateString: string) => {
    const locale = currentLanguage?.startsWith('en') ? 'en-US' : 'ko-KR';
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <>
        <Header
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={() => setIsSidebarOpen((p) => !p)}
          setIsSidebarOpen={setIsSidebarOpen}
        />
        <div className="min-h-screen bg-background p-8 max-md:p-4">
          <div className="mx-auto max-w-3xl space-y-3">
            <Skeleton className="h-10 w-48 rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </>
    );
  }

  if (error || !detail) {
    return (
      <>
        <Header
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={() => setIsSidebarOpen((p) => !p)}
          setIsSidebarOpen={setIsSidebarOpen}
        />
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
          <p className="text-muted-foreground">{t('기록을 불러오는데 실패했습니다.')}</p>
          <Button variant="outline" onClick={() => navigate('/history')}>
            <ArrowLeft className="mr-2 size-4" />
            {t('목록으로')}
          </Button>
        </div>
      </>
    );
  }

  const scorePercent = Math.round((detail.score / detail.totalCount) * 100);
  const wrongCount = detail.totalCount - detail.score;

  return (
    <>
      <Header
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen((p) => !p)}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-3xl px-6 py-8 max-md:px-4">
          {/* 뒤로가기 + 타이틀 */}
          <BlurFade delay={0.05}>
            <div className="mb-6 flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="size-9 shrink-0"
                onClick={() => navigate('/history')}
              >
                <ArrowLeft className="size-4" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  {QUIZ_TYPE_LABEL[detail.quizType]} · {detail.totalCount}
                  {t('문제')}
                </h1>
                <p className="text-xs text-muted-foreground">{formatDate(detail.takenAt)}</p>
              </div>
            </div>
          </BlurFade>

          {/* 요약 카드 */}
          <BlurFade delay={0.1}>
            <div className="mb-6 grid grid-cols-3 divide-x divide-border rounded-lg border border-border bg-card">
              <div className="flex flex-col items-center gap-1 py-4">
                <Trophy className="size-5 text-warning" />
                <span className="text-xs text-muted-foreground">{t('점수')}</span>
                <span className="text-2xl font-black tabular-nums text-foreground">
                  {scorePercent}
                  <span className="text-sm font-normal">{t('점')}</span>
                </span>
              </div>
              <div className="flex flex-col items-center gap-1 py-4">
                <CheckCircle2 className="size-5 text-success" />
                <span className="text-xs text-success">{t('정답')}</span>
                <span className="text-2xl font-black tabular-nums text-success">
                  {detail.score}
                  <span className="text-sm font-normal">/{detail.totalCount}</span>
                </span>
              </div>
              <div className="flex flex-col items-center gap-1 py-4">
                <XCircle className="size-5 text-destructive" />
                <span className="text-xs text-destructive">{t('오답')}</span>
                <span className="text-2xl font-black tabular-nums text-destructive">
                  {wrongCount}
                  <span className="text-sm font-normal">/{detail.totalCount}</span>
                </span>
              </div>
            </div>
          </BlurFade>

          {/* 문제 목록 */}
          <div className="space-y-3">
            {detail.problems.map((problem, index) => (
              <BlurFade key={problem.number} delay={0.15 + index * 0.05}>
                <div className="overflow-hidden rounded-lg border border-border bg-card">
                  {/* 문제 헤더 */}
                  <div
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 border-b border-border',
                      problem.correct ? 'bg-success/5' : 'bg-destructive/5',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white',
                        problem.correct ? 'bg-success' : 'bg-destructive',
                      )}
                    >
                      {problem.correct ? '✓' : '✗'}
                    </span>
                    <span className="flex-1 text-sm font-medium text-foreground">
                      {problem.title}
                    </span>
                    <Badge
                      variant={problem.correct ? 'default' : 'destructive'}
                      className="shrink-0 text-[0.65rem]"
                    >
                      {problem.correct ? t('정답') : t('오답')}
                    </Badge>
                  </div>

                  {/* 선택지 목록 */}
                  <div className="divide-y divide-border/60 px-4">
                    {problem.selections.map((sel) => {
                      const isUserAnswer = sel.id === problem.userAnswer;
                      const isCorrectAnswer = sel.correct;
                      return (
                        <div
                          key={sel.id}
                          className={cn(
                            'flex items-center gap-3 py-2.5',
                            isCorrectAnswer && 'font-medium',
                          )}
                        >
                          <span
                            className={cn(
                              'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                              isCorrectAnswer
                                ? 'bg-success text-white'
                                : isUserAnswer && !problem.correct
                                  ? 'bg-destructive text-white'
                                  : 'bg-muted text-muted-foreground',
                            )}
                          >
                            {sel.id}
                          </span>
                          <span
                            className={cn(
                              'flex-1 text-sm',
                              isCorrectAnswer
                                ? 'text-foreground'
                                : isUserAnswer && !problem.correct
                                  ? 'text-muted-foreground line-through'
                                  : 'text-muted-foreground',
                            )}
                          >
                            {sel.content}
                          </span>
                          {isUserAnswer && (
                            <span className="text-xs text-muted-foreground">{t('내 답')}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </BlurFade>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default QuizHistoryDetail;
