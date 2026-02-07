import { useCallback, useEffect, useMemo, useState } from 'react';
import { trackMakeQuizEvents as trackPrepareQuizEvents } from '#shared/lib/analytics';
import { defaultType, levelMapping } from './constants';

const OPTIONS_STORAGE_KEY = 'makeQuizOptions';
const EXPIRATION_MS = 24 * 60 * 60 * 1000;

const readSavedOptions = () => {
  try {
    const saved = localStorage.getItem(OPTIONS_STORAGE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    const savedAt = Number(parsed?.savedAt);
    if (!savedAt || Date.now() - savedAt > EXPIRATION_MS) {
      localStorage.removeItem(OPTIONS_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch (error) {
    return null;
  }
};

export const usePrepareQuizOptions = () => {
  const savedOptions = useMemo(() => readSavedOptions(), []);
  const [questionType, setQuestionType] = useState(() => {
    return savedOptions?.questionType || defaultType;
  });
  const [questionCount, setQuestionCount] = useState(() => {
    return typeof savedOptions?.questionCount === 'number' ? savedOptions.questionCount : 10;
  });
  const [quizLevel, setQuizLevel] = useState(() => {
    return levelMapping[savedOptions?.questionType || defaultType];
  });

  useEffect(() => {
    setQuizLevel(levelMapping[questionType]);
  }, [questionType]);

  useEffect(() => {
    localStorage.setItem(
      OPTIONS_STORAGE_KEY,
      JSON.stringify({
        questionType,
        questionCount,
        savedAt: Date.now(),
      }),
    );
  }, [questionCount, questionType]);

  const handleQuestionTypeChange = useCallback(
    (nextType, label) => {
      if (questionType !== nextType) {
        trackPrepareQuizEvents.changeQuizOption('question_type', label);
        setQuestionType(nextType);
        setQuizLevel(levelMapping[nextType]);
      }
    },
    [questionType],
  );

  const handleQuestionCountChange = useCallback(
    (nextCount) => {
      if (questionCount !== nextCount) {
        trackPrepareQuizEvents.changeQuizOption('question_count', nextCount);
        setQuestionCount(nextCount);
      }
    },
    [questionCount],
  );

  const resetOptions = useCallback(() => {
    setQuestionType(defaultType);
    setQuestionCount(10);
    setQuizLevel(levelMapping[defaultType]);
  }, []);

  return {
    state: {
      questionType,
      questionCount,
      quizLevel,
    },
    actions: {
      handleQuestionTypeChange,
      handleQuestionCountChange,
      resetOptions,
    },
  };
};
