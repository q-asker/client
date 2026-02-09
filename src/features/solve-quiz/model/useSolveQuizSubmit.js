import { useCallback, useState } from 'react';
import { trackQuizEvents } from '#shared/lib/analytics';

export const useSolveQuizSubmit = ({
  quizzes,
  problemSetId,
  currentTime,
  uploadedUrl,
  navigate,
}) => {
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  const handleFinish = useCallback(() => {
    setShowSubmitDialog(true);
  }, []);

  const handleConfirmSubmit = useCallback(() => {
    const safeQuizzes = quizzes || [];
    const unansweredCount = safeQuizzes.filter(
      (q) => q.userAnswer === undefined || q.userAnswer === null,
    ).length;
    const reviewCount = safeQuizzes.filter((q) => q.check).length;
    const answeredCount = safeQuizzes.length - unansweredCount;

    trackQuizEvents.submitQuiz(problemSetId, answeredCount, safeQuizzes.length, reviewCount);

    navigate(`/result/${problemSetId}`, {
      state: { quizzes: safeQuizzes, totalTime: currentTime, uploadedUrl },
    });
  }, [quizzes, problemSetId, currentTime, uploadedUrl, navigate]);

  const handleCancelSubmit = useCallback(() => {
    setShowSubmitDialog(false);
  }, []);

  const handleOverlayClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      setShowSubmitDialog(false);
    }
  }, []);

  return {
    state: {
      showSubmitDialog,
    },
    actions: {
      handleFinish,
      handleConfirmSubmit,
      handleCancelSubmit,
      handleOverlayClick,
    },
  };
};
