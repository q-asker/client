import { useCallback, useState } from 'react';
import type { MouseEvent } from 'react';
import type { NavigateFunction } from 'react-router';
import { trackQuizEvents } from '#shared/lib/analytics';
import { isUnanswered } from '../lib/isUnanswered';
import type { Quiz } from '#features/quiz-generation';

interface UseSolveQuizSubmitParams {
  quizzes: Quiz[];
  problemSetId: string;
  currentTime: string;
  uploadedUrl: string;
  title: string;
  navigate: NavigateFunction;
}

interface UseSolveQuizSubmitReturn {
  state: {
    showSubmitDialog: boolean;
  };
  actions: {
    handleFinish: () => void;
    handleConfirmSubmit: () => void;
    handleCancelSubmit: () => void;
    handleOverlayClick: (e: MouseEvent<HTMLDivElement>) => void;
  };
}

/** 퀴즈 제출 관련 상태와 액션을 관리하는 훅 */
export const useSolveQuizSubmit = ({
  quizzes,
  problemSetId,
  currentTime,
  uploadedUrl,
  title,
  navigate,
}: UseSolveQuizSubmitParams): UseSolveQuizSubmitReturn => {
  const [showSubmitDialog, setShowSubmitDialog] = useState<boolean>(false);

  const handleFinish = useCallback((): void => {
    setShowSubmitDialog(true);
  }, []);

  const handleConfirmSubmit = useCallback((): void => {
    const safeQuizzes = quizzes || [];
    const unansweredCount = safeQuizzes.filter((q) =>
      isUnanswered(q.userAnswer, q.selections),
    ).length;
    const reviewCount = safeQuizzes.filter((q) => q.check).length;
    const answeredCount = safeQuizzes.length - unansweredCount;

    trackQuizEvents.submitQuiz(problemSetId, answeredCount, safeQuizzes.length, reviewCount);

    navigate(`/result/${problemSetId}`, {
      state: { quizzes: safeQuizzes, totalTime: currentTime, uploadedUrl, title },
    });
  }, [quizzes, problemSetId, currentTime, uploadedUrl, title, navigate]);

  const handleCancelSubmit = useCallback((): void => {
    setShowSubmitDialog(false);
  }, []);

  const handleOverlayClick = useCallback((e: MouseEvent<HTMLDivElement>): void => {
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
