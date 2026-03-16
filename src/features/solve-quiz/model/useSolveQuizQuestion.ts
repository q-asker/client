import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import CustomToast from '#shared/toast';
import { trackQuizEvents } from '#shared/lib/analytics';
import type { Quiz, QuizSelection } from '#features/quiz-generation';

interface UseSolveQuizQuestionParams {
  t: (key: string) => string;
  problemSetId: string;
  quizzes: Quiz[];
  setQuizzes: Dispatch<SetStateAction<Quiz[]>>;
  totalQuestions: number;
}

interface UseSolveQuizQuestionReturn {
  state: {
    selectedOption: string | null;
    currentQuestion: number;
    currentQuiz: Quiz;
  };
  actions: {
    handleOptionSelect: (id: string) => void;
    handlePrev: () => void;
    handleNext: () => void;
    handleSubmit: () => void;
    handleCheckToggle: () => void;
    handleJumpTo: (num: number) => void;
  };
}

/** 기본 퀴즈 객체 (현재 문제가 없을 때 사용) */
const DEFAULT_QUIZ: Quiz = {
  number: 0,
  title: '',
  selections: [],
  userAnswer: null,
  check: false,
};

/** 퀴즈 문제 탐색 및 답안 선택을 관리하는 훅 */
export const useSolveQuizQuestion = ({
  t,
  problemSetId,
  quizzes,
  setQuizzes,
  totalQuestions,
}: UseSolveQuizQuestionParams): UseSolveQuizQuestionReturn => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<number>(1);

  useEffect(() => {
    const saved = quizzes[currentQuestion - 1]?.userAnswer;
    setSelectedOption(saved !== undefined && saved !== null ? saved : null);
  }, [currentQuestion, quizzes]);

  const handleOptionSelect = useCallback(
    (id: string): void => {
      const currentQuiz = quizzes[currentQuestion - 1];
      const selected = currentQuiz?.selections?.find((s) => s.id === id);

      if (!selected) return;

      trackQuizEvents.selectAnswer(
        problemSetId,
        currentQuestion,
        id,
        (selected as QuizSelection & { correct?: boolean }).correct || false,
      );

      setQuizzes((prev) =>
        prev.map((q, idx) => (idx === currentQuestion - 1 ? { ...q, userAnswer: id } : q)),
      );
      setSelectedOption(id);
    },
    [currentQuestion, problemSetId, quizzes, setQuizzes],
  );

  const handlePrev = useCallback((): void => {
    if (currentQuestion > 1) {
      const prevQuestion = currentQuestion - 1;
      trackQuizEvents.navigateQuestion(problemSetId, currentQuestion, prevQuestion);
      setCurrentQuestion(prevQuestion);
    }
  }, [currentQuestion, problemSetId]);

  const handleNext = useCallback((): void => {
    if (currentQuestion < totalQuestions) {
      const nextQuestion = currentQuestion + 1;
      trackQuizEvents.navigateQuestion(problemSetId, currentQuestion, nextQuestion);
      setCurrentQuestion(nextQuestion);
    }
  }, [currentQuestion, problemSetId, totalQuestions]);

  const handleSubmit = useCallback((): void => {
    trackQuizEvents.confirmAnswer(problemSetId, currentQuestion);

    if (currentQuestion === totalQuestions) {
      CustomToast.info(t('마지막 문제입니다.'));
      return;
    }

    const nextQuestion = currentQuestion + 1;
    trackQuizEvents.navigateQuestion(problemSetId, currentQuestion, nextQuestion);
    setCurrentQuestion(nextQuestion);
  }, [currentQuestion, problemSetId, t, totalQuestions]);

  const handleCheckToggle = useCallback((): void => {
    const currentQuiz = quizzes[currentQuestion - 1];
    if (!currentQuiz) return;
    const newCheckState = !currentQuiz.check;

    trackQuizEvents.toggleReview(problemSetId, currentQuestion, newCheckState);

    setQuizzes((prev) =>
      prev.map((q, idx) => (idx === currentQuestion - 1 ? { ...q, check: newCheckState } : q)),
    );
  }, [currentQuestion, problemSetId, quizzes, setQuizzes]);

  const handleJumpTo = useCallback(
    (num: number): void => {
      if (num < 1 || num > totalQuestions) {
        return;
      }
      if (num !== currentQuestion) {
        trackQuizEvents.navigateQuestion(problemSetId, currentQuestion, num);
      }
      setCurrentQuestion(num);
    },
    [currentQuestion, problemSetId, totalQuestions],
  );

  const currentQuiz = useMemo<Quiz>(
    () => quizzes[currentQuestion - 1] || DEFAULT_QUIZ,
    [quizzes, currentQuestion],
  );

  return {
    state: {
      selectedOption,
      currentQuestion,
      currentQuiz,
    },
    actions: {
      handleOptionSelect,
      handlePrev,
      handleNext,
      handleSubmit,
      handleCheckToggle,
      handleJumpTo,
    },
  };
};
