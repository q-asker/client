import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { NavigateFunction } from 'react-router';
import { useSolveQuizData } from './useSolveQuizData';
import { useSolveQuizQuestion } from './useSolveQuizQuestion';
import { isUnanswered } from '../lib/isUnanswered';
import { useSolveQuizSubmit } from './useSolveQuizSubmit';
import { useSolveQuizTimer } from './useSolveQuizTimer';
import { loadProgress, saveProgress } from './solveQuizProgress';
import type { Quiz } from '#features/quiz-generation';

/** 서버의 userAnswer(0 = 미응답)를 null로 정규화 */
const normalizeAnswer = (answer: string | number | null | undefined): string | null => {
  if (answer === undefined || answer === null || answer === 0 || answer === '') return null;
  return String(answer);
};

interface UseSolveQuizParams {
  t: (key: string) => string;
  navigate: NavigateFunction;
  problemSetId: string;
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
      persistNow: () => void;
    };
  };
}

/** 퀴즈 풀이 페이지의 전체 상태와 액션을 통합 관리하는 훅 */
export const useSolveQuiz = ({
  t,
  navigate,
  problemSetId,
  quizzes = [],
}: UseSolveQuizParams): UseSolveQuizReturn => {
  const savedProgress = useMemo(() => loadProgress(problemSetId), [problemSetId]);
  const initialOffsetMs = savedProgress?.elapsedMs ?? 0;
  const readyRef = useRef(false);

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
    savedProgress,
  });
  const { currentTime, elapsedMs } = useSolveQuizTimer(initialOffsetMs);
  const totalQuestions = solveQuizzes.length;
  const question = useSolveQuizQuestion({
    t,
    problemSetId,
    quizzes: solveQuizzes,
    setQuizzes: setSolveQuizzes,
    totalQuestions,
    initialQuestion: savedProgress?.currentQuestion,
  });
  const submit = useSolveQuizSubmit({
    quizzes: solveQuizzes,
    problemSetId,
    currentTime,
    title,
    navigate,
  });

  useEffect(() => {
    if (!problemSetId) {
      navigate('/');
    }
  }, [problemSetId, navigate]);

  /** 현재 상태를 명시적으로 localStorage에 저장 */
  const persistNow = useCallback(() => {
    if (solveQuizzes.length === 0) return;
    const answers: Record<number, string | null> = {};
    const checks: Record<number, boolean> = {};
    solveQuizzes.forEach((q) => {
      answers[q.number] = normalizeAnswer(q.userAnswer);
      checks[q.number] = q.inReview ?? false;
    });
    saveProgress({
      problemSetId,
      answers,
      checks,
      currentQuestion: question.state.currentQuestion,
      elapsedMs,
      savedAt: Date.now(),
    });
  }, [solveQuizzes, problemSetId, question.state.currentQuestion, elapsedMs]);

  // solveQuizzes 또는 currentQuestion 변경 시 자동 저장
  useEffect(() => {
    if (solveQuizzes.length === 0) return;
    if (!readyRef.current) {
      readyRef.current = true;
      return;
    }
    persistNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solveQuizzes, question.state.currentQuestion]);

  const unansweredCount = useMemo(
    () => solveQuizzes.filter((q) => isUnanswered(q.userAnswer, q.selections)).length,
    [solveQuizzes],
  );
  const reviewCount = useMemo(() => solveQuizzes.filter((q) => q.inReview).length, [solveQuizzes]);
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
        persistNow,
      },
    },
  };
};
