import { useTranslation } from 'i18nexus';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuizResult } from '#features/quiz-result';
import { loadResult } from '#features/solve-quiz';
import { MOCK_RESULT_QUIZZES, MOCK_TOTAL_TIME } from './mockResultData';
import { Button } from '@/shared/ui/components/button';
import QuizScoreBoard from '@/shared/ui/components/quiz-score-board';
import type { ScoreBoardProblem } from '@/shared/ui/components/quiz-score-board';
import { Home } from 'lucide-react';
import axiosInstance from '#shared/api';

/** 선택지 타입 */
interface QuizSelection {
  id: string;
  content: string;
  correct?: boolean;
}

/** 퀴즈 문항 타입 */
interface QuizItem {
  number: number;
  title: string;
  selections: QuizSelection[];
  userAnswer?: string | null;
  inReview?: boolean;
}

/** API 응답 타입 */
interface ProblemSetResponse {
  quiz: QuizItem[];
  title: string;
}

const QuizResultDesignK = () => {
  const { t } = useTranslation('quiz-result');
  const navigate = useNavigate();
  const { problemSetId } = useParams<{ problemSetId: string }>();
  const [searchParams] = useSearchParams();
  const isMock = searchParams.get('mock') === 'true';

  const savedResult = useMemo(
    () => (problemSetId ? loadResult(problemSetId) : null),
    [problemSetId],
  );

  const [quizzes, setQuizzes] = useState<QuizItem[]>(isMock ? MOCK_RESULT_QUIZZES : []);
  const [totalTime, setTotalTime] = useState<string>(
    isMock ? MOCK_TOTAL_TIME : (savedResult?.totalTime ?? '00:00:00'),
  );
  const [title, setTitle] = useState<string>(savedResult?.title ?? '');
  const [isLoading, setIsLoading] = useState(!isMock);

  useEffect(() => {
    if (isMock || !problemSetId) return;

    const fetchResult = async () => {
      try {
        // 서버에서 퀴즈 데이터 조회
        const res = await axiosInstance.get<ProblemSetResponse>(`/problem-set/${problemSetId}`);
        const serverQuizzes = res.data.quiz;
        setTitle((prev) => prev || res.data.title);

        // localStorage 채점 데이터가 있으면 답안 병합
        if (savedResult) {
          const merged = serverQuizzes.map((q) => ({
            ...q,
            userAnswer: savedResult.answers[q.number] ?? q.userAnswer,
            inReview: savedResult.inReview?.[q.number] ?? false,
          }));
          setQuizzes(merged);
        } else {
          setQuizzes(serverQuizzes);
        }
      } catch {
        navigate('/');
      }
      setIsLoading(false);
    };

    fetchResult();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problemSetId, isMock, navigate]);

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

  if (isLoading) return null;

  // 공통 컴포넌트용 데이터 변환
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
      actionButton={
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
      }
      problems={problems}
    />
  );
};

export default QuizResultDesignK;
