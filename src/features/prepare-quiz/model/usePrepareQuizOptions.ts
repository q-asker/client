import { useCallback } from 'react';
import { trackMakeQuizEvents as trackPrepareQuizEvents } from '#shared/lib/analytics';
import type { QuestionType, QuizLevel } from './constants';
import { defaultType } from './constants';
import { usePrepareQuizSettingsStore, getQuizLevel } from './usePrepareQuizSettingsStore';

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

export const usePrepareQuizOptions = (): PrepareQuizOptionsReturn => {
  const questionType = usePrepareQuizSettingsStore((s) => s.questionType);
  const questionCount = usePrepareQuizSettingsStore((s) => s.questionCount);
  const setQuestionType = usePrepareQuizSettingsStore((s) => s.setQuestionType);
  const setQuestionCount = usePrepareQuizSettingsStore((s) => s.setQuestionCount);
  const quizLevel = getQuizLevel(questionType);

  const handleQuestionTypeChange = useCallback(
    (nextType: QuestionType, label: string) => {
      if (questionType !== nextType) {
        trackPrepareQuizEvents.changeQuizOption('question_type', label);
        setQuestionType(nextType);
      }
    },
    [questionType, setQuestionType],
  );

  const handleQuestionCountChange = useCallback(
    (nextCount: number) => {
      if (questionCount !== nextCount) {
        trackPrepareQuizEvents.changeQuizOption('question_count', nextCount);
        setQuestionCount(nextCount);
      }
    },
    [questionCount, setQuestionCount],
  );

  const resetOptions = useCallback(() => {
    const store = usePrepareQuizSettingsStore.getState();
    store.setQuestionType(defaultType);
    store.setQuestionCount(10);
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
