import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'i18nexus';
import { saveResult } from '#features/solve-quiz';
import { Button } from '@/shared/ui/components/button';
import QuizScoreBoard from '@/shared/ui/components/quiz-score-board';
import type { ScoreBoardProblem } from '@/shared/ui/components/quiz-score-board';
import { deserializeRealBlankTokens } from '#shared/lib/blank-scoring';
import { toTextAnswer } from '#shared/lib/realBlankGrading';
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
  const isRealBlank = detail.quizType === 'REAL_BLANK';

  // REAL_BLANK는 selections가 없으므로 서버 판정(correct)·정답(answer)·입력(textAnswer)을
  // 가상 selection으로 조립해 공용 스코어보드에 넘긴다. 선택형은 서버 문항을 그대로 사용.
  const scoreBoardProblems: ScoreBoardProblem[] = detail.problems.map((p) => {
    if (!isRealBlank) {
      return {
        number: p.number,
        title: p.title,
        correct: p.correct,
        userAnswer: p.userAnswer,
        inReview: p.inReview,
        selections: p.selections,
      };
    }
    const userRaw = toTextAnswer(p.textAnswer);
    const userDisplay = userRaw ? deserializeRealBlankTokens(userRaw).join(', ') : '';
    const answerText = p.answer ?? '';
    const virtualSelections = [
      ...(userDisplay !== '' ? [{ id: '__real_blank_user__', content: userDisplay }] : []),
      ...(answerText !== ''
        ? [{ id: '__real_blank_correct__', content: answerText, correct: true }]
        : []),
    ];
    return {
      number: p.number,
      title: p.title,
      correct: p.correct,
      userAnswer: userDisplay !== '' ? '__real_blank_user__' : '',
      inReview: p.inReview,
      selections: virtualSelections,
    };
  });

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
                // REAL_BLANK는 입력 텍스트를 복원해야 해설 화면이 서버 재채점(POST /grade)을 부른다.
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
      problems={scoreBoardProblems}
    />
  );
};

export default ChoiceHistoryDetail;
