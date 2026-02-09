import { useCallback, useEffect, useMemo, useState } from 'react';
import CustomToast from '#shared/toast';
import { trackQuizEvents } from '#shared/lib/analytics';

export const useSolveQuizQuestion = ({ t, problemSetId, quizzes, setQuizzes, totalQuestions }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(1);

  useEffect(() => {
    const saved = quizzes[currentQuestion - 1]?.userAnswer;
    setSelectedOption(saved !== undefined && saved !== null ? saved : null);
  }, [currentQuestion, quizzes]);

  const handleOptionSelect = useCallback(
    (id) => {
      const currentQuiz = quizzes[currentQuestion - 1];
      const selected = currentQuiz?.selections?.find((s) => s.id === id);

      if (!selected) return;

      trackQuizEvents.selectAnswer(problemSetId, currentQuestion, id, selected.correct || false);

      setQuizzes((prev) =>
        prev.map((q, idx) => (idx === currentQuestion - 1 ? { ...q, userAnswer: id } : q)),
      );
      setSelectedOption(id);
    },
    [currentQuestion, problemSetId, quizzes, setQuizzes],
  );

  const handlePrev = useCallback(() => {
    if (currentQuestion > 1) {
      const prevQuestion = currentQuestion - 1;
      trackQuizEvents.navigateQuestion(problemSetId, currentQuestion, prevQuestion);
      setCurrentQuestion(prevQuestion);
    }
  }, [currentQuestion, problemSetId]);

  const handleNext = useCallback(() => {
    if (currentQuestion < totalQuestions) {
      const nextQuestion = currentQuestion + 1;
      trackQuizEvents.navigateQuestion(problemSetId, currentQuestion, nextQuestion);
      setCurrentQuestion(nextQuestion);
    }
  }, [currentQuestion, problemSetId, totalQuestions]);

  const handleSubmit = useCallback(() => {
    trackQuizEvents.confirmAnswer(problemSetId, currentQuestion);

    if (currentQuestion === totalQuestions) {
      CustomToast.info(t('마지막 문제입니다.'));
      return;
    }

    const nextQuestion = currentQuestion + 1;
    trackQuizEvents.navigateQuestion(problemSetId, currentQuestion, nextQuestion);
    setCurrentQuestion(nextQuestion);
  }, [currentQuestion, problemSetId, t, totalQuestions]);

  const handleCheckToggle = useCallback(() => {
    const currentQuiz = quizzes[currentQuestion - 1];
    if (!currentQuiz) return;
    const newCheckState = !currentQuiz.check;

    trackQuizEvents.toggleReview(problemSetId, currentQuestion, newCheckState);

    setQuizzes((prev) =>
      prev.map((q, idx) => (idx === currentQuestion - 1 ? { ...q, check: newCheckState } : q)),
    );
  }, [currentQuestion, problemSetId, quizzes, setQuizzes]);

  const handleJumpTo = useCallback(
    (num) => {
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

  const currentQuiz = useMemo(
    () =>
      quizzes[currentQuestion - 1] || {
        selections: [],
        userAnswer: 0,
        check: false,
        title: '',
      },
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
