import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { NavigateFunction } from 'react-router';
import axiosInstance from '#shared/api';
import { trackQuizEvents } from '#shared/lib/analytics';
import { useQuizGenerationStore } from '#features/quiz-generation';
import type { Quiz } from '#features/quiz-generation';

/** API 응답 데이터 타입 */
interface ProblemSetResponse {
  generationStatus: 'COMPLETED' | 'GENERATING';
  quiz: Quiz[];
  totalCount: number;
  sessionId: string;
  isStreaming?: boolean;
}

interface UseSolveQuizDataParams {
  problemSetId: string;
  quizzes: Quiz[];
  navigate: NavigateFunction;
}

interface UseSolveQuizDataReturn {
  quizzes: Quiz[];
  setQuizzes: Dispatch<SetStateAction<Quiz[]>>;
  isLoading: boolean;
}

/** 퀴즈 데이터를 서버에서 불러오고 스트리밍 상태를 관리하는 훅 */
export const useSolveQuizData = ({
  problemSetId,
  quizzes,
  navigate,
}: UseSolveQuizDataParams): UseSolveQuizDataReturn => {
  const [localQuizzes, setLocalQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const reconnectStream = useQuizGenerationStore((state) => state.reconnectStream);
  const setProblemSetInfo = useQuizGenerationStore((state) => state.setProblemSetInfo);

  useEffect(() => {
    const fetchQuiz = async (): Promise<void> => {
      try {
        trackQuizEvents.startQuiz(problemSetId);
        const res = await axiosInstance.get<ProblemSetResponse>(`/problem-set/${problemSetId}`);
        const status = res.data.generationStatus;

        if (status === 'COMPLETED') {
          setLocalQuizzes(res.data.quiz);
          setIsLoading(false);
        }
        if (status === 'GENERATING') {
          setProblemSetInfo({
            problemSetId,
            totalCount: res.data.totalCount,
            isStreaming: true,
          });
          if (Array.isArray(res.data.quiz) && res.data.quiz.length > 0) {
            setLocalQuizzes(res.data.quiz);
          }
          const sessionId = res.data.sessionId;
          reconnectStream(sessionId);
          setIsLoading(false);
        }
      } catch {
        setIsLoading(false);
        navigate('/');
      }
    };
    fetchQuiz();
  }, [problemSetId, navigate, reconnectStream, setProblemSetInfo]);

  useEffect(() => {
    if (!Array.isArray(quizzes) || quizzes.length === 0) {
      return;
    }
    setLocalQuizzes((prev) => {
      const existingNumbers = new Set(prev.map((q) => q.number));
      const next = quizzes.filter((q) => !existingNumbers.has(q.number));
      return next.length > 0 ? [...prev, ...next] : prev;
    });
  }, [quizzes]);

  return {
    quizzes: localQuizzes,
    setQuizzes: setLocalQuizzes,
    isLoading,
  };
};
