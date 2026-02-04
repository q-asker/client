import { useEffect, useMemo } from "react";
import axiosInstance from "#shared/api";
import { trackQuizEvents, trackResultEvents } from "#shared/lib/analytics";

export const useQuizResult = ({
  t,
  navigate,
  problemSetId,
  quizzes,
  totalTime,
  uploadedUrl,
}) => {
  const correctCount = useMemo(() => {
    return quizzes.reduce((count, q) => {
      const selected = q.selections.find((s) => s.id === q.userAnswer);
      return count + (selected?.correct ? 1 : 0);
    }, 0);
  }, [quizzes]);

  const scorePercent = useMemo(() => {
    return quizzes.length
      ? Math.round((correctCount / quizzes.length) * 100)
      : 0;
  }, [quizzes.length, correctCount]);

  useEffect(() => {
    if (problemSetId && quizzes.length > 0) {
      trackResultEvents.viewResult(
        problemSetId,
        correctCount,
        quizzes.length,
        totalTime,
      );
      trackQuizEvents.completeQuiz(
        problemSetId,
        correctCount,
        quizzes.length,
        totalTime,
      );
    }
  }, [problemSetId, correctCount, quizzes.length, totalTime, scorePercent]);

  const getQuizExplanation = async () => {
    trackResultEvents.clickExplanation(problemSetId);

    try {
      const res = await axiosInstance.get(`/explanation/${problemSetId}`);
      const data = res.data;
      navigate(`/explanation/${problemSetId}`, {
        state: { quizzes, explanation: data, uploadedUrl },
      });
    } catch (err) {
      navigate("/");
    }
  };

  return {
    state: { correctCount, scorePercent },
    actions: { getQuizExplanation },
  };
};
