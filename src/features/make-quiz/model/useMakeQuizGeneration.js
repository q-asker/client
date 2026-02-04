import { useCallback, useEffect, useRef, useState } from "react";
import { authService } from "#entities/auth";
import CustomToast from "#shared/toast";
import { trackMakeQuizEvents } from "#shared/lib/analytics";
import Timer from "#shared/lib/timer";
import { useQuizGenerationStore } from "#features/quiz-generation";

export const useMakeQuizGeneration = ({
  t,
  navigate,
  isProcessing,
  setIsProcessing,
  uploadedUrl,
  questionType,
  questionCount,
  quizLevel,
  selectedPages,
}) => {
  const [problemSetId, setProblemSetId] = useState(null);
  const [version, setVersion] = useState(0);
  const [showWaitMessage, setShowWaitMessage] = useState(false);
  const [generationElapsedTime, setGenerationElapsedTime] = useState(0);
  const generationTimerRef = useRef(null);
  const startGeneration = useQuizGenerationStore(
    (state) => state.startGeneration,
  );

  const generateQuestions = useCallback(async () => {
    if (!uploadedUrl) {
      CustomToast.error(t("파일을 먼저 업로드해주세요."));
      return;
    }
    if (!selectedPages.length) {
      CustomToast.error(t("페이지를 선택해주세요."));
      return;
    }

    const apiQuizType = questionType;

    setIsProcessing(true);
    try {
      try {
        await authService.refresh();
      } catch (refreshError) {
        // ignore refresh error and continue with generation
      }
      generationTimerRef.current = new Timer((elapsed) => {
        setGenerationElapsedTime(elapsed);
      });
      generationTimerRef.current.start();

      startGeneration({
        requestData: {
          uploadedUrl: uploadedUrl,
          quizCount: questionCount,
          quizType: apiQuizType,
          difficultyType: quizLevel,
          pageNumbers: selectedPages,
        },
        onSuccess: (nextProblemSetId) => {
          setProblemSetId(nextProblemSetId);
          setVersion((prev) => prev + 1);
          if (generationTimerRef.current) {
            const generationTime = generationTimerRef.current.stop();
            trackMakeQuizEvents.completeQuizGeneration(
              nextProblemSetId,
              generationTime,
            );
          }
          setIsProcessing(false);
        },
        onError: (error) => {
          if (generationTimerRef.current) {
            generationTimerRef.current.stop();
          }
          const message =
            error?.message || t("문제 생성 중 오류가 발생했습니다.");
          CustomToast.error(message);
          setIsProcessing(false);
          setGenerationElapsedTime(0);
        },
      });
    } catch (error) {
      if (generationTimerRef.current) {
        generationTimerRef.current.stop();
      }
      setIsProcessing(false);
      setGenerationElapsedTime(0);
    }
  }, [
    questionCount,
    questionType,
    quizLevel,
    selectedPages,
    setIsProcessing,
    startGeneration,
    t,
    uploadedUrl,
  ]);

  useEffect(() => {
    let timer;
    if (isProcessing && uploadedUrl && !problemSetId) {
      timer = setTimeout(() => {
        setShowWaitMessage(true);
      }, 5000);
    } else {
      setShowWaitMessage(false);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isProcessing, uploadedUrl, problemSetId]);

  const handleNavigateToQuiz = useCallback(() => {
    trackMakeQuizEvents.navigateToQuiz(problemSetId);
    navigate(`/quiz/${problemSetId}`, {
      state: { uploadedUrl },
    });
  }, [navigate, problemSetId, uploadedUrl]);

  const resetGenerationState = useCallback(() => {
    if (generationTimerRef.current) {
      generationTimerRef.current.reset();
      generationTimerRef.current = null;
    }

    setProblemSetId(null);
    setVersion(0);
    setShowWaitMessage(false);
    setGenerationElapsedTime(0);
  }, []);

  const resetGenerationForRecreate = useCallback(() => {
    setProblemSetId(null);
    setShowWaitMessage(false);
    setGenerationElapsedTime(0);
  }, []);

  return {
    state: {
      problemSetId,
      version,
      showWaitMessage,
      generationElapsedTime,
    },
    actions: {
      generateQuestions,
      handleNavigateToQuiz,
      resetGenerationState,
      resetGenerationForRecreate,
    },
  };
};
