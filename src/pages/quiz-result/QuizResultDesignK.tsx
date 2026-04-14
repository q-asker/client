import { useTranslation } from 'i18nexus';
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuizResult } from '#features/quiz-result';
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
  userAnswer: string | number | null;
}

/** localStorage 채점용 데이터 타입 */
interface SavedResult {
  answers: Record<number, string | null>;
  totalTime: string;
  title: string;
  savedAt: number;
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

  const [quizzes, setQuizzes] = useState<QuizItem[]>(isMock ? MOCK_RESULT_QUIZZES : []);
  const [totalTime, setTotalTime] = useState<string>(isMock ? MOCK_TOTAL_TIME : '00:00:00');
  const [title, setTitle] = useState<string>('');
  const [isLoading, setIsLoading] = useState(!isMock);

  useEffect(() => {
    if (isMock || !problemSetId) return;

    const loadResult = async () => {
      try {
        // 서버에서 퀴즈 데이터 조회
        const res = await axiosInstance.get<ProblemSetResponse>(`/problem-set/${problemSetId}`);
        const serverQuizzes = res.data.quiz;
        setTitle(res.data.title);

        // localStorage 채점 데이터에서 답안 + 경과 시간 복원
        const raw = localStorage.getItem(`quizResult:${problemSetId}`);
        if (raw) {
          const saved = JSON.parse(raw) as SavedResult;
          // 24시간 만료 체크
          if (Date.now() - saved.savedAt > 24 * 60 * 60 * 1000) {
            localStorage.removeItem(`quizResult:${problemSetId}`);
          } else {
            const merged = serverQuizzes.map((q) => ({
              ...q,
              userAnswer: saved.answers[q.number] ?? q.userAnswer,
            }));
            setQuizzes(merged);
            setTotalTime(saved.totalTime);
            if (saved.title) setTitle(saved.title);
            setIsLoading(false);
            return;
          }
        }

        // 채점 데이터 없으면 서버 데이터 그대로 사용
        setQuizzes(serverQuizzes);
      } catch {
        navigate('/');
      }
      setIsLoading(false);
    };

    loadResult();
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
    const selected = q.selections.find((s) => s.id === q.userAnswer);
    return {
      number: q.number,
      title: q.title,
      correct: selected?.correct === true,
      userAnswer: q.userAnswer,
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
