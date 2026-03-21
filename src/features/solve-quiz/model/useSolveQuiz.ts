import { useEffect, useMemo } from 'react';
import type { NavigateFunction } from 'react-router';
import { useSolveQuizData } from './useSolveQuizData';
import { useSolveQuizQuestion } from './useSolveQuizQuestion';
import { isUnanswered } from '../lib/isUnanswered';
import { useSolveQuizSubmit } from './useSolveQuizSubmit';
import { useSolveQuizTimer } from './useSolveQuizTimer';
import type { Quiz } from '#features/quiz-generation';

interface UseSolveQuizParams {
  t: (key: string) => string;
  navigate: NavigateFunction;
  problemSetId: string;
  uploadedUrl: string;
  quizzes?: Quiz[];
}

interface UseSolveQuizReturn {
  state: {
    quiz: {
      quizzes: Quiz[];
      isLoading: boolean;
      currentTime: string;
      selectedOption: string | null;
      currentQuestion: number;
      showSubmitDialog: boolean;
      totalQuestions: number;
      unansweredCount: number;
      reviewCount: number;
      answeredCount: number;
      currentQuiz: Quiz;
      title: string;
    };
  };
  actions: {
    quiz: {
      handleOptionSelect: (id: string) => void;
      handlePrev: () => void;
      handleNext: () => void;
      handleSubmit: () => void;
      handleCheckToggle: () => void;
      handleJumpTo: (num: number) => void;
      handleFinish: () => void;
      handleConfirmSubmit: () => void;
      handleCancelSubmit: () => void;
      handleOverlayClick: (e: React.MouseEvent<HTMLDivElement>) => void;
      changeTitle: (newTitle: string) => Promise<void>;
    };
  };
}

/** 퀴즈 풀이 페이지의 전체 상태와 액션을 통합 관리하는 훅 */
export const useSolveQuiz = ({
  t,
  navigate,
  problemSetId,
  uploadedUrl,
  quizzes = [],
}: UseSolveQuizParams): UseSolveQuizReturn => {
  const {
    quizzes: solveQuizzes,
    setQuizzes: setSolveQuizzes,
    isLoading,
    title,
    changeTitle,
  } = useSolveQuizData({
    problemSetId,
    quizzes,
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
    () => solveQuizzes.filter((q) => isUnanswered(q.userAnswer, q.selections)).length,
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
        title,
      },
    },
    actions: {
      quiz: {
        ...question.actions,
        ...submit.actions,
        changeTitle,
      },
    },
  };
};
