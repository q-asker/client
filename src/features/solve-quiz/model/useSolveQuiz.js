import { useEffect, useMemo } from 'react';
import { useSolveQuizData } from './useSolveQuizData';
import { useSolveQuizQuestion } from './useSolveQuizQuestion';
import { useSolveQuizSubmit } from './useSolveQuizSubmit';
import { useSolveQuizTimer } from './useSolveQuizTimer';

export const useSolveQuiz = ({
  t,
  navigate,
  problemSetId,
  uploadedUrl,
  quizzes = [],
  isStreaming = false,
}) => {
  const {
    quizzes: solveQuizzes,
    setQuizzes: setSolveQuizzes,
    isLoading,
  } = useSolveQuizData({
    problemSetId,
    quizzes,
    isStreaming,
    navigate,
  });
  const currentTime = useSolveQuizTimer();
  const totalQuestions = solveQuizzes.length;
  const question = useSolveQuizQuestion({
    t,
    problemSetId,
    quizzes: solveQuizzes,
    setQuizzes: setSolveQuizzes,
    totalQuestions,
  });
  const submit = useSolveQuizSubmit({
    quizzes: solveQuizzes,
    problemSetId,
    currentTime,
    uploadedUrl,
    navigate,
  });

  useEffect(() => {
    if (!problemSetId) {
      navigate('/');
    }
  }, [problemSetId, navigate]);

  const unansweredCount = useMemo(
    () => solveQuizzes.filter((q) => q.userAnswer === 0).length,
    [solveQuizzes],
  );
  const reviewCount = useMemo(() => solveQuizzes.filter((q) => q.check).length, [solveQuizzes]);
  const answeredCount = solveQuizzes.length - unansweredCount;

  return {
    state: {
      quiz: {
        quizzes: solveQuizzes,
        isLoading,
        currentTime,
        selectedOption: question.state.selectedOption,
        currentQuestion: question.state.currentQuestion,
        showSubmitDialog: submit.state.showSubmitDialog,
        totalQuestions,
        unansweredCount,
        reviewCount,
        answeredCount,
        currentQuiz: question.state.currentQuiz,
      },
    },
    actions: {
      quiz: {
        ...question.actions,
        ...submit.actions,
      },
    },
  };
};
