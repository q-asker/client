import { useCallback, useEffect, useMemo, useState } from 'react';
import { trackMakeQuizEvents as trackPrepareQuizEvents } from '#shared/lib/analytics';
import type { QuestionType, QuizLevel } from './constants';
import { defaultType, levelMapping } from './constants';

const OPTIONS_STORAGE_KEY = 'makeQuizOptions';
const EXPIRATION_MS = 24 * 60 * 60 * 1000;

/** localStorage에 저장되는 옵션 구조 */
interface SavedOptions {
  questionType?: QuestionType;
  questionCount?: number;
  savedAt?: number;
}

export interface PrepareQuizOptionsState {
  questionType: QuestionType;
  questionCount: number;
  quizLevel: QuizLevel;
}

export interface PrepareQuizOptionsActions {
  handleQuestionTypeChange: (nextType: QuestionType, label: string) => void;
  handleQuestionCountChange: (nextCount: number) => void;
  resetOptions: () => void;
}

export interface PrepareQuizOptionsReturn {
  state: PrepareQuizOptionsState;
  actions: PrepareQuizOptionsActions;
}

const readSavedOptions = (): SavedOptions | null => {
  try {
    const saved = localStorage.getItem(OPTIONS_STORAGE_KEY);
    if (!saved) return null;
    const parsed: SavedOptions = JSON.parse(saved);
    const savedAt = Number(parsed?.savedAt);
    if (!savedAt || Date.now() - savedAt > EXPIRATION_MS) {
      localStorage.removeItem(OPTIONS_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const usePrepareQuizOptions = (): PrepareQuizOptionsReturn => {
  const savedOptions = useMemo(() => readSavedOptions(), []);
  const [questionType, setQuestionType] = useState<QuestionType>(() => {
    return savedOptions?.questionType || defaultType;
  });
  const [questionCount, setQuestionCount] = useState<number>(() => {
    return typeof savedOptions?.questionCount === 'number' ? savedOptions.questionCount : 10;
  });
  const [quizLevel, setQuizLevel] = useState<QuizLevel>(() => {
    return levelMapping[savedOptions?.questionType || defaultType];
  });

  useEffect(() => {
    setQuizLevel(levelMapping[questionType]);
  }, [questionType]);

  useEffect(() => {
    try {
      localStorage.setItem(
        OPTIONS_STORAGE_KEY,
        JSON.stringify({
          questionType,
          questionCount,
          savedAt: Date.now(),
        }),
      );
    } catch {
      // localStorage 에러 무시
    }
  }, [questionCount, questionType]);

  const handleQuestionTypeChange = useCallback(
    (nextType: QuestionType, label: string) => {
      if (questionType !== nextType) {
        trackPrepareQuizEvents.changeQuizOption('question_type', label);
        setQuestionType(nextType);
        setQuizLevel(levelMapping[nextType]);
      }
    },
    [questionType],
  );

  const handleQuestionCountChange = useCallback(
    (nextCount: number) => {
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
