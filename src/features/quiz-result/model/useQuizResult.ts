import { useEffect, useMemo } from 'react';
import axiosInstance from '#shared/api';
import { trackQuizEvents, trackResultEvents } from '#shared/lib/analytics';
import type { Quiz } from '#features/quiz-generation';

// ── 타입 정의 ──

interface UseQuizResultParams {
  navigate: (to: string, options?: { state?: unknown; replace?: boolean }) => void;
  problemSetId: string;
  quizzes: Quiz[];
  totalTime: number;
  uploadedUrl: string;
}

interface UseQuizResultReturn {
  state: {
    correctCount: number;
    scorePercent: number;
  };
  actions: {
    getQuizExplanation: () => Promise<void>;
  };
}

// ── 퀴즈 결과 훅 ──

export const useQuizResult = ({
  navigate,
  problemSetId,
  quizzes,
  totalTime,
  uploadedUrl,
}: UseQuizResultParams): UseQuizResultReturn => {
  const correctCount = useMemo(() => {
    return quizzes.reduce((count, q) => {
      const selected = q.selections.find((s) => s.id === q.userAnswer);
      return count + ((selected as Record<string, unknown>)?.correct ? 1 : 0);
    }, 0);
  }, [quizzes]);

  const scorePercent = useMemo(() => {
    return quizzes.length ? Math.round((correctCount / quizzes.length) * 100) : 0;
  }, [quizzes.length, correctCount]);

  useEffect(() => {
    if (problemSetId && quizzes.length > 0) {
      trackResultEvents.viewResult(problemSetId, correctCount, quizzes.length, totalTime);
      trackQuizEvents.completeQuiz(problemSetId, correctCount, quizzes.length, totalTime);
    }
  }, [problemSetId, correctCount, quizzes.length, totalTime, scorePercent]);

  const getQuizExplanation = async (): Promise<void> => {
    trackResultEvents.clickExplanation(problemSetId);

    try {
      const res = await axiosInstance.get(`/explanation/${problemSetId}`);
      const data = res.data;
      navigate(`/explanation/${problemSetId}`, {
        state: { quizzes, explanation: data, uploadedUrl },
      });
    } catch {
      navigate('/');
    }
  };

  return {
    state: { correctCount, scorePercent },
    actions: { getQuizExplanation },
  };
};
