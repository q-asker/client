import { useEffect, useState } from 'react';
import axiosInstance from '#shared/api';
import { trackQuizEvents } from '#shared/lib/analytics';
import { useQuizGenerationStore } from '#features/quiz-generation';

export const useSolveQuizData = ({ problemSetId, quizzes, isStreaming, navigate }) => {
  const [localQuizzes, setLocalQuizzes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const reconnectStream = useQuizGenerationStore((state) => state.reconnectStream);
  const setProblemSetInfo = useQuizGenerationStore((state) => state.setProblemSetInfo);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        trackQuizEvents.startQuiz(problemSetId);
        const res = await axiosInstance.get(`/problem-set/${problemSetId}`);
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
      } catch (err) {
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
