import { useEffect, useMemo, useRef } from 'react';
import axiosInstance from '#shared/api';
import { trackQuizEvents, trackResultEvents } from '#shared/lib/analytics';
import type { Quiz } from '#features/quiz-generation';

// ── 타입 정의 ──

interface UseQuizResultParams {
  navigate: (to: string, options?: { state?: unknown; replace?: boolean }) => void;
  problemSetId: string;
  quizzes: Quiz[];
  totalTime: string;
  title: string;
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
  title,
}: UseQuizResultParams): UseQuizResultReturn => {
  const correctCount = useMemo(() => {
    return quizzes.reduce((count, q) => {
      const selected = q.selections.find((s) => s.id === q.userAnswer);
      return count + (selected?.correct ? 1 : 0);
    }, 0);
  }, [quizzes]);

  const scorePercent = useMemo(() => {
    return quizzes.length ? Math.round((correctCount / quizzes.length) * 100) : 0;
  }, [quizzes.length, correctCount]);

  const historySavedRef = useRef(false);
  useEffect(() => {
    if (!problemSetId || quizzes.length === 0 || historySavedRef.current) return;
    historySavedRef.current = true;

    trackResultEvents.viewResult(problemSetId, correctCount, quizzes.length, totalTime);
    trackQuizEvents.completeQuiz(problemSetId, correctCount, quizzes.length, totalTime);

    const userAnswers = quizzes.map((q) => ({
      number: q.number,
      userAnswer: q.userAnswer != null ? Number(q.userAnswer) : 0,
    }));

    axiosInstance
      .post('/history', { problemSetId, title, userAnswers, score: correctCount, totalTime })
      .catch((err) => console.error('Failed to save quiz history:', err));
  }, [problemSetId, quizzes, correctCount, totalTime, title]);

  const getQuizExplanation = async (): Promise<void> => {
    trackResultEvents.clickExplanation(problemSetId);

    navigate(`/explanation/${problemSetId}`);
  };

  return {
    state: { correctCount, scorePercent },
    actions: { getQuizExplanation },
  };
};
