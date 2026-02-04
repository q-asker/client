import { useCallback, useEffect, useState } from "react";
import { trackMakeQuizEvents } from "#shared/lib/analytics";
import { defaultType, levelMapping } from "./constants";

export const useMakeQuizOptions = () => {
  const [questionType, setQuestionType] = useState(() => {
    const savedType = localStorage.getItem("questionType");
    return savedType || defaultType;
  });
  const [questionCount, setQuestionCount] = useState(10);
  const [quizLevel, setQuizLevel] = useState(() => {
    const savedType = localStorage.getItem("questionType");
    return levelMapping[savedType || defaultType];
  });

  useEffect(() => {
    setQuizLevel(levelMapping[questionType]);
    localStorage.setItem("questionType", questionType);
  }, [questionType]);

  const handleQuestionTypeChange = useCallback((nextType, label) => {
    if (questionType !== nextType) {
      trackMakeQuizEvents.changeQuizOption("question_type", label);
      setQuestionType(nextType);
      setQuizLevel(levelMapping[nextType]);
    }
  }, [questionType]);

  const handleQuestionCountChange = useCallback(
    (nextCount) => {
      if (questionCount !== nextCount) {
        trackMakeQuizEvents.changeQuizOption("question_count", nextCount);
        setQuestionCount(nextCount);
      }
    },
    [questionCount]
  );

  const resetOptions = useCallback(() => {
    setQuestionType(defaultType);
    setQuestionCount(15);
    setQuizLevel(levelMapping[defaultType]);
  }, []);

  return {
    state: {
      questionType,
      questionCount,
      quizLevel
    },
    actions: {
      handleQuestionTypeChange,
      handleQuestionCountChange,
      resetOptions
    }
  };
};
