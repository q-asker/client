import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axiosInstance from '#shared/api';
import CustomToast from '#shared/toast';
import { trackQuizEvents } from '#shared/lib/analytics';
import { useQuizGenerationStore } from '#features/quiz-generation';

const buildTimerLabel = (hours, minutes, seconds) =>
  `${String(hours).padStart(2, '0')}:` +
  `${String(minutes).padStart(2, '0')}:` +
  `${String(seconds).padStart(2, '0')}`;

export const useSolveQuiz = ({
  t,
  navigate,
  problemSetId,
  uploadedUrl,
  streamedQuizzes = [],
  isStreaming = false,
}) => {
  const [quizzes, setQuizzes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState('00:00:00');
  const [selectedOption, setSelectedOption] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const hasStartedRef = useRef(false);
  const totalQuestions = quizzes.length;

  useEffect(() => {
    if (!problemSetId) {
      navigate('/');
    }
  }, [problemSetId, navigate]);

  const resumeGeneration = useQuizGenerationStore((state) => state.resumeGeneration);

  // ... (기타 상태들)

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await axiosInstance.get(`/problem-set/${problemSetId}`);
        const data = res.data;

        if (data.generationStatus === 'GENERATING') {
          // 생성 중인 경우 sessionId를 사용하여 스트림 재연결 (이어받기)
          const sessionId = data.sessionId || problemSetId; // sessionId가 없다면 problemSetId 사용 시도

          resumeGeneration({
            sessionId,
            onComplete: () => {
              // 완료 시 추가 동작이 필요하다면 여기에 작성
              // 예: 완료 토스트 메시지 등
            },
            onError: (err) => {
              console.error('재연결 스트림 에러:', err);
            },
          });
        }

        setQuizzes(data.quiz || []);
        if (!hasStartedRef.current) {
          trackQuizEvents.startQuiz(problemSetId);
          hasStartedRef.current = true;
        }
      } catch (err) {
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    if (problemSetId && !isStreaming && streamedQuizzes.length === 0) {
      fetchQuiz();
    } else if (!problemSetId) {
      setIsLoading(false);
    }
  }, [problemSetId, navigate, isStreaming, streamedQuizzes.length]);

  useEffect(() => {
    if (!isStreaming) return;

    if (streamedQuizzes.length === 0) {
      setIsLoading(true);
      return;
    }

    setQuizzes((prev) => {
      const prevByNumber = new Map(prev.map((quiz) => [quiz.number, quiz]));
      const merged = streamedQuizzes.map((quiz) => {
        const prevQuiz = prevByNumber.get(quiz.number);
        if (!prevQuiz) return quiz;
        return {
          ...quiz,
          userAnswer: prevQuiz.userAnswer,
          check: prevQuiz.check,
        };
      });
      return merged;
    });

    setIsLoading(false);
    if (!hasStartedRef.current && problemSetId) {
      trackQuizEvents.startQuiz(problemSetId);
      hasStartedRef.current = true;
    }
  }, [streamedQuizzes, isStreaming, problemSetId]);

  useEffect(() => {
    let seconds = 0;
    let minutes = 0;
    let hours = 0;
    const timer = setInterval(() => {
      seconds++;
      if (seconds === 60) {
        seconds = 0;
        minutes++;
      }
      if (minutes === 60) {
        minutes = 0;
        hours++;
      }
      setCurrentTime(buildTimerLabel(hours, minutes, seconds));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const saved = quizzes[currentQuestion - 1]?.userAnswer;
    setSelectedOption(saved && saved !== 0 ? saved : null);
  }, [currentQuestion, quizzes]);

  const handleOptionSelect = (id) => {
    const currentQuiz = quizzes[currentQuestion - 1];
    const selected = currentQuiz?.selections?.find((s) => s.id === id);

    if (selected) {
      trackQuizEvents.selectAnswer(problemSetId, currentQuestion, id, selected.correct || false);
    }

    setQuizzes((prev) =>
      prev.map((q, idx) => (idx === currentQuestion - 1 ? { ...q, userAnswer: id } : q)),
    );
    setSelectedOption(id);
  };

  const handlePrev = () => {
    if (currentQuestion > 1) {
      const prevQuestion = currentQuestion - 1;
      trackQuizEvents.navigateQuestion(problemSetId, currentQuestion, prevQuestion);
      setCurrentQuestion(prevQuestion);
    }
  };

  const handleNext = () => {
    if (currentQuestion < totalQuestions) {
      const nextQuestion = currentQuestion + 1;
      trackQuizEvents.navigateQuestion(problemSetId, currentQuestion, nextQuestion);
      setCurrentQuestion(nextQuestion);
    }
  };

  const handleSubmit = () => {
    trackQuizEvents.confirmAnswer(problemSetId, currentQuestion);

    if (currentQuestion === totalQuestions) {
      CustomToast.info(t('마지막 문제입니다.'));
      return;
    }

    const nextQuestion = currentQuestion + 1;
    trackQuizEvents.navigateQuestion(problemSetId, currentQuestion, nextQuestion);
    setCurrentQuestion(nextQuestion);
  };

  const handleCheckToggle = () => {
    const currentQuiz = quizzes[currentQuestion - 1];
    const newCheckState = !currentQuiz.check;

    trackQuizEvents.toggleReview(problemSetId, currentQuestion, newCheckState);

    setQuizzes((prev) =>
      prev.map((q, idx) => (idx === currentQuestion - 1 ? { ...q, check: newCheckState } : q)),
    );
  };

  const handleFinish = () => {
    setShowSubmitDialog(true);
  };

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

  const handleJumpTo = (num) => {
    if (num !== currentQuestion) {
      trackQuizEvents.navigateQuestion(problemSetId, currentQuestion, num);
    }
    setCurrentQuestion(num);
  };

  const unansweredCount = useMemo(
    () => quizzes.filter((q) => q.userAnswer === 0).length,
    [quizzes],
  );
  const reviewCount = useMemo(() => quizzes.filter((q) => q.check).length, [quizzes]);
  const answeredCount = quizzes.length - unansweredCount;

  const handleOverlayClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      setShowSubmitDialog(false);
    }
  }, []);

  const currentQuiz = quizzes[currentQuestion - 1] || {};

  return {
    state: {
      quiz: {
        quizzes,
        isLoading,
        currentTime,
        selectedOption,
        currentQuestion,
        showSubmitDialog,
        totalQuestions,
        unansweredCount,
        reviewCount,
        answeredCount,
        currentQuiz,
      },
    },
    actions: {
      quiz: {
        handleOptionSelect,
        handlePrev,
        handleNext,
        handleSubmit,
        handleCheckToggle,
        handleFinish,
        handleConfirmSubmit,
        handleCancelSubmit,
        handleJumpTo,
        handleOverlayClick,
      },
    },
  };
};
