import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'i18nexus';
import { saveResult } from '#features/solve-quiz';
import { Button } from '@/shared/ui/components/button';
import QuizScoreBoard from '@/shared/ui/components/quiz-score-board';
import type { ScoreBoardProblem } from '@/shared/ui/components/quiz-score-board';
import { gradeRealBlankQuiz, deserializeRealBlankTokens } from '#shared/lib/blank-scoring';
import { ArrowLeft, Calendar } from 'lucide-react';
import type { HistoryDetailData } from './types';

interface ChoiceHistoryDetailProps {
  detail: HistoryDetailData;
}

const ChoiceHistoryDetail = ({ detail }: ChoiceHistoryDetailProps) => {
  const { t, currentLanguage } = useTranslation('quiz-history-detail');
  const navigate = useNavigate();

  const isRealBlank = detail.quizType === 'REAL_BLANK';

  // REAL_BLANK는 서버 correct(정수 index 비교)가 텍스트답에 부정확하므로,
  // 결과·해설과 동일한 단일 관용 채점 함수로 로컬 재채점한다(FR-006 판정 일치).
  const { problems, correctCount } = useMemo<{
    problems: ScoreBoardProblem[];
    correctCount: number;
  }>(() => {
    if (!isRealBlank) {
      return { problems: detail.problems, correctCount: detail.score };
    }
    let correct = 0;
    const mapped = detail.problems.map((p): ScoreBoardProblem => {
      const isCorrect = gradeRealBlankQuiz({
        userAnswer: p.textAnswer,
        selections: p.selections,
        acceptedAnswers: p.acceptedAnswers,
      });
      if (isCorrect) correct++;
      // 사용자 입력 텍스트를 읽기 좋게(다중 빈칸은 콤마 결합) — 결과 화면과 동일 방식.
      const raw = p.textAnswer && p.textAnswer !== '0' ? p.textAnswer : '';
      const tokens = deserializeRealBlankTokens(raw);
      const userDisplay = raw ? (tokens.length > 1 ? tokens.join(', ') : raw) : '';
      // score-board가 userAnswer ID로 selection을 찾으므로 가상 selection을 prepend.
      const selections =
        userDisplay !== ''
          ? [{ id: '__real_blank_user__', content: userDisplay }, ...p.selections]
          : p.selections;
      return {
        number: p.number,
        title: p.title,
        correct: isCorrect,
        userAnswer: userDisplay !== '' ? '__real_blank_user__' : '',
        inReview: p.inReview ?? false,
        selections,
      };
    });
    return { problems: mapped, correctCount: correct };
  }, [isRealBlank, detail.problems, detail.score]);

  const scorePercent =
    detail.totalCount > 0 ? Math.round((correctCount / detail.totalCount) * 100) : 0;

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

  return (
    <QuizScoreBoard
      scorePercent={scorePercent}
      totalCount={detail.totalCount}
      correctCount={correctCount}
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
                // REAL_BLANK는 직접 입력 텍스트를 답으로 복원(선택 ID가 아님) → 해설 화면 판정 일치.
                answers[p.number] = isRealBlank
                  ? (p.textAnswer ?? null)
                  : p.userAnswer != null
                    ? String(p.userAnswer)
                    : null;
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
      problems={problems}
    />
  );
};

export default ChoiceHistoryDetail;
