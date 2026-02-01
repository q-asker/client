import { useEffect, useMemo } from "react";
import axiosInstance from "#shared/api";
import { trackQuizEvents, trackResultEvents } from "#shared/lib/analytics";
import { updateQuizHistoryRecord } from "#shared/lib/quizHistoryStorage";

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

  const updateQuizHistoryResult = (
    nextProblemSetId,
    nextCorrectCount,
    totalQuestions,
    nextTotalTime,
    score
  ) => {
    try {
      updateQuizHistoryRecord(nextProblemSetId, {
        status: "completed",
        score,
        correctCount: nextCorrectCount,
        totalQuestions,
        totalTime: nextTotalTime,
        completedAt: new Date().toISOString(),
        quizData: quizzes,
      });
    } catch (error) {
      console.error(t("퀴즈 결과 기록 업데이트 실패:"), error);
    }
  };

  useEffect(() => {
    if (problemSetId && quizzes.length > 0) {
      trackResultEvents.viewResult(
        problemSetId,
        correctCount,
        quizzes.length,
        totalTime
      );
      trackQuizEvents.completeQuiz(
        problemSetId,
        correctCount,
        quizzes.length,
        totalTime
      );

      updateQuizHistoryResult(
        problemSetId,
        correctCount,
        quizzes.length,
        totalTime,
        scorePercent
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
