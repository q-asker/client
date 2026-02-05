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
    const unansweredCount = quizzes.filter((q) => q.userAnswer === 0).length;
    const reviewCount = quizzes.filter((q) => q.check).length;
    const answeredCount = quizzes.length - unansweredCount;

    trackQuizEvents.submitQuiz(problemSetId, answeredCount, quizzes.length, reviewCount);

    navigate(`/result/${problemSetId}`, {
      state: { quizzes, totalTime: currentTime, uploadedUrl },
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
