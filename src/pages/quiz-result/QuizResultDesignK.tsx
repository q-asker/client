import { useTranslation } from 'i18nexus';
import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuizResult } from '#features/quiz-result';
import { loadResult, loadEssayGradeResults } from '#features/solve-quiz';
import { MOCK_RESULT_QUIZZES, MOCK_TOTAL_TIME } from './mockResultData';
import { Button } from '@/shared/ui/components/button';
import QuizScoreBoard from '@/shared/ui/components/quiz-score-board';
import type { ScoreBoardProblem } from '@/shared/ui/components/quiz-score-board';
import { Home } from 'lucide-react';
import type { Quiz } from '#features/quiz-generation';

/** 부모에서 전달받는 서버 데이터 */
interface ServerData {
  quiz: Quiz[];
  title: string;
  quizType?: string;
}

interface QuizResultDesignKProps {
  serverData: ServerData;
}

const QuizResultDesignK = ({ serverData }: QuizResultDesignKProps) => {
  const { t } = useTranslation('quiz-result');
  const navigate = useNavigate();
  const { problemSetId } = useParams<{ problemSetId: string }>();
  const [searchParams] = useSearchParams();
  const isMock = searchParams.get('mock') === 'true';

  const savedResult = useMemo(
    () => (problemSetId ? loadResult(problemSetId) : null),
    [problemSetId],
  );

  const essayGradeResults = useMemo(
    () => (problemSetId ? loadEssayGradeResults(problemSetId) : {}),
    [problemSetId],
  );

  const mergedQuizzes = useMemo(() => {
    if (isMock) return MOCK_RESULT_QUIZZES as Quiz[];
    const serverQuizzes = serverData.quiz;
    if (savedResult) {
      return serverQuizzes.map((q) => ({
        ...q,
        type: (q.type ?? serverData.quizType) as Quiz['type'],
        userAnswer: savedResult.answers[q.number] ?? q.userAnswer,
        inReview: savedResult.inReview?.[q.number] ?? false,
        gradeResult: essayGradeResults[q.number] ?? q.gradeResult ?? null,
      }));
    }
    return serverQuizzes.map((q) => ({
      ...q,
      type: (q.type ?? serverData.quizType) as Quiz['type'],
      gradeResult: essayGradeResults[q.number] ?? q.gradeResult ?? null,
    }));
  }, [isMock, serverData, savedResult, essayGradeResults]);

  const [quizzes] = useState<Quiz[]>(mergedQuizzes);
  const totalTime = isMock ? MOCK_TOTAL_TIME : (savedResult?.totalTime ?? '00:00:00');
  const title = savedResult?.title || serverData.title;

  const {
    state: { correctCount, scorePercent },
    actions: { getQuizExplanation },
  } = useQuizResult({
    navigate,
    problemSetId: problemSetId ?? '',
    quizzes,
    totalTime,
    title,
  });

  const actionButton = (
    <div className="flex flex-col gap-2">
      <Button size="lg" className="w-full text-base" onClick={getQuizExplanation}>
        {t('해설 보기')}
      </Button>
      <button
        type="button"
        className="group mx-auto flex items-center gap-1.5 pt-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        onClick={() => navigate('/')}
      >
        <Home className="size-3.5 transition-transform group-hover:-translate-y-0.5" />
        {t('홈으로')}
      </button>
    </div>
  );

  const problems: ScoreBoardProblem[] = quizzes.map((q) => {
    const selected = q.selections.find((s) => String(s.id) === String(q.userAnswer));
    return {
      number: q.number,
      title: q.title,
      correct: selected?.correct === true,
      userAnswer: q.userAnswer ?? '',
      inReview: savedResult?.inReview?.[q.number] ?? false,
      selections: q.selections,
    };
  });

  return (
    <QuizScoreBoard
      scorePercent={scorePercent}
      totalCount={quizzes.length}
      correctCount={correctCount}
      totalTime={totalTime}
      actionButton={actionButton}
      problems={problems}
    />
  );
};

export default QuizResultDesignK;
