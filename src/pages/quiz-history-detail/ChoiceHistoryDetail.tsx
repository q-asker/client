import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'i18nexus';
import { saveResult } from '#features/solve-quiz';
import { Button } from '@/shared/ui/components/button';
import QuizScoreBoard from '@/shared/ui/components/quiz-score-board';
import { ArrowLeft, Calendar } from 'lucide-react';
import type { HistoryDetailData } from './types';

interface ChoiceHistoryDetailProps {
  detail: HistoryDetailData;
}

const ChoiceHistoryDetail = ({ detail }: ChoiceHistoryDetailProps) => {
  const { t, currentLanguage } = useTranslation('quiz-history-detail');
  const navigate = useNavigate();

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

  const scorePercent = Math.round((detail.score / detail.totalCount) * 100);

  return (
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
        <div className="flex flex-col gap-2">
          <Button
            size="lg"
            className="w-full text-base"
            onClick={() => {
              const answers: Record<number, string | null> = {};
              const inReview: Record<number, boolean> = {};
              detail.problems.forEach((p) => {
                answers[p.number] = p.userAnswer != null ? String(p.userAnswer) : null;
                inReview[p.number] = p.inReview ?? false;
              });
              saveResult(detail.problemSetId, {
                answers,
                inReview,
                totalTime: detail.totalTime,
                title: '',
                savedAt: Date.now(),
              });
              navigate(`/explanation/${detail.problemSetId}`);
            }}
          >
            {t('해설 보기')}
          </Button>
          <button
            type="button"
            className="group mx-auto flex items-center gap-1.5 pt-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => navigate('/history')}
          >
            <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
            {t('목록으로')}
          </button>
        </div>
      }
      problems={detail.problems}
    />
  );
};

export default ChoiceHistoryDetail;
