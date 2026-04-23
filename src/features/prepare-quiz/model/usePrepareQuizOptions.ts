import { useCallback } from 'react';
import { trackMakeQuizEvents as trackPrepareQuizEvents } from '#shared/lib/analytics';
import type { QuestionType, QuizLevel } from './constants';
import { defaultType } from './constants';
import { usePrepareQuizSettingsStore, getQuizLevel } from './usePrepareQuizSettingsStore';

export interface PrepareQuizOptionsState {
  questionType: QuestionType;
  questionCount: number;
  quizLevel: QuizLevel;
  language: 'KO' | 'EN';
}

export interface PrepareQuizOptionsActions {
  handleQuestionTypeChange: (nextType: QuestionType, label: string) => void;
  handleQuestionCountChange: (nextCount: number) => void;
  handleLanguageChange: (nextLanguage: 'KO' | 'EN') => void;
  resetOptions: () => void;
}

export interface PrepareQuizOptionsReturn {
  state: PrepareQuizOptionsState;
  actions: PrepareQuizOptionsActions;
}

export const usePrepareQuizOptions = (): PrepareQuizOptionsReturn => {
  const questionType = usePrepareQuizSettingsStore((s) => s.questionType);
  const questionCount = usePrepareQuizSettingsStore((s) => s.questionCount);
  const language = usePrepareQuizSettingsStore((s) => s.language);
  const setQuestionType = usePrepareQuizSettingsStore((s) => s.setQuestionType);
  const setQuestionCount = usePrepareQuizSettingsStore((s) => s.setQuestionCount);
  const setLanguage = usePrepareQuizSettingsStore((s) => s.setLanguage);
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

  const handleLanguageChange = useCallback(
    (nextLanguage: 'KO' | 'EN') => {
      if (language !== nextLanguage) {
        trackPrepareQuizEvents.changeQuizOption('language', nextLanguage);
        setLanguage(nextLanguage);
      }
    },
    [language, setLanguage],
  );

  const resetOptions = useCallback(() => {
    const store = usePrepareQuizSettingsStore.getState();
    store.setQuestionType(defaultType);
    store.setQuestionCount(10);
    store.setLanguage('KO');
  }, []);

  return {
    state: {
      questionType,
      questionCount,
      quizLevel,
      language,
    },
    actions: {
      handleQuestionTypeChange,
      handleQuestionCountChange,
      handleLanguageChange,
      resetOptions,
    },
  };
};
