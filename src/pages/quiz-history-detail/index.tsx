import React, { Suspense, lazy, useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'i18nexus';
import axiosInstance from '#shared/api';
import { Button } from '@/shared/ui/components/button';
import { Skeleton } from '@/shared/ui/components/skeleton';
import { ArrowLeft } from 'lucide-react';
import type { HistoryDetailData, EssayHistoryDetailData } from './types';

const ChoiceHistoryDetail = lazy(() => import('./ChoiceHistoryDetail'));
const EssayHistoryDetail = lazy(() => import('./EssayHistoryDetail'));

/** quizType을 감지하여 ESSAY / 선택형 히스토리 상세를 분기 렌더 */
const QuizHistoryDetail: React.FC = () => {
  const { t } = useTranslation('quiz-history-detail');
  const { historyId } = useParams<{ historyId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const routeQuizType = (location.state as { quizType?: string } | null)?.quizType;

  const [choiceDetail, setChoiceDetail] = useState<HistoryDetailData | null>(null);
  const [essayDetail, setEssayDetail] = useState<EssayHistoryDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!historyId) return;

    const handleError = (err: { response?: { status?: number } }) => {
      if (err.response?.status === 401) {
        navigate('/login');
      } else {
        setError(true);
      }
    };

    // route state로 quizType을 알면 바로 분기
    if (routeQuizType === 'ESSAY') {
      axiosInstance
        .get<EssayHistoryDetailData>(`/history/${historyId}/essay`)
        .then((res) => setEssayDetail(res.data))
        .catch(handleError)
        .finally(() => setLoading(false));
    } else if (routeQuizType) {
      // 선택형 확정
      axiosInstance
        .get<HistoryDetailData>(`/history/${historyId}`)
        .then((res) => setChoiceDetail(res.data))
        .catch(handleError)
        .finally(() => setLoading(false));
    } else {
      // 직접 URL 접근 — 선택형 API로 quizType 감지 후 분기
      axiosInstance
        .get<{ quizType: string }>(`/history/${historyId}`)
        .then((res) => {
          if (res.data.quizType === 'ESSAY') {
            return axiosInstance
              .get<EssayHistoryDetailData>(`/history/${historyId}/essay`)
              .then((essayRes) => setEssayDetail(essayRes.data));
          }
          setChoiceDetail(res.data as unknown as HistoryDetailData);
        })
        .catch(handleError)
        .finally(() => setLoading(false));
    }
  }, [historyId]);

  if (loading) {
    return (
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
    );
  }

  if (error || (!choiceDetail && !essayDetail)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <p className="text-muted-foreground">{t('기록을 불러오는데 실패했습니다.')}</p>
        <Button variant="outline" onClick={() => navigate('/history')}>
          <ArrowLeft className="mr-2 size-4" />
          {t('목록으로')}
        </Button>
      </div>
    );
  }

  return (
    <Suspense fallback={null}>
      {essayDetail ? (
        <EssayHistoryDetail detail={essayDetail} />
      ) : choiceDetail ? (
        <ChoiceHistoryDetail detail={choiceDetail} />
      ) : null}
    </Suspense>
  );
};

export default QuizHistoryDetail;
