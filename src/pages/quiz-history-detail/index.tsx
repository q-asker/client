import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'i18nexus';
import axiosInstance from '#shared/api';
import { Button } from '@/shared/ui/components/button';
import { Skeleton } from '@/shared/ui/components/skeleton';
import Header from '#widgets/header';
import QuizScoreBoard from '@/shared/ui/components/quiz-score-board';
import { ArrowLeft, Calendar } from 'lucide-react';

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
  totalTime: string;
  takenAt: string;
  problems: Problem[];
}

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
        <div className="min-h-screen bg-muted/30">
          <Skeleton className="h-40 w-full rounded-none" />
          <div className="mx-auto max-w-3xl px-6 max-md:px-4">
            <Skeleton className="-mt-12 h-28 w-full rounded-xl" />
            <div className="mt-6 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
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

  return (
    <>
      <Header
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen((p) => !p)}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <QuizScoreBoard
        scorePercent={scorePercent}
        totalCount={detail.totalCount}
        correctCount={detail.score}
        totalTime={detail.totalTime}
        heroSubtitle={
          <div className="flex items-center justify-center gap-1.5 text-sm text-primary-foreground/60">
            <Calendar className="size-3.5" />
            {formatDate(detail.takenAt)}
          </div>
        }
        actionButton={
          <Button
            variant="outline"
            size="lg"
            className="w-full text-base"
            onClick={() => navigate('/history')}
          >
            <ArrowLeft className="mr-2 size-4" />
            {t('목록으로')}
          </Button>
        }
        problems={detail.problems}
      />
    </>
  );
};

export default QuizHistoryDetail;
