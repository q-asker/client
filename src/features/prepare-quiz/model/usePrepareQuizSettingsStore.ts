import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createExpiringStorage } from '#shared/lib/expiringStorage';
import type { QuestionType } from './constants';
import { defaultType, levelMapping } from './constants';
import type { PageMode } from './usePrepareQuizPages';

interface PrepareQuizSettingsState {
  /** 페이지 선택 모드 */
  pageMode: PageMode;
  /** PDF 미리보기 패널 표시 여부 */
  isPreviewVisible: boolean;
  /** 퀴즈 유형 */
  questionType: QuestionType;
  /** 퀴즈 문제 수 */
  questionCount: number;
}

interface PrepareQuizSettingsActions {
  setPageMode: (mode: PageMode) => void;
  setIsPreviewVisible: (visible: boolean) => void;
  setQuestionType: (type: QuestionType) => void;
  setQuestionCount: (count: number) => void;
  reset: () => void;
}

const initialState: PrepareQuizSettingsState = {
  pageMode: 'CUSTOM',
  isPreviewVisible: true,
  questionType: defaultType,
  questionCount: 10,
};

export const usePrepareQuizSettingsStore = create<
  PrepareQuizSettingsState & PrepareQuizSettingsActions
>()(
  persist(
    (set) => ({
      ...initialState,
      setPageMode: (mode) => set({ pageMode: mode }),
      setIsPreviewVisible: (visible) => set({ isPreviewVisible: visible }),
      setQuestionType: (type) => set({ questionType: type }),
      setQuestionCount: (count) => set({ questionCount: count }),
      reset: () => set(initialState),
    }),
    {
      name: 'prepare-quiz-settings',
      storage: createExpiringStorage() as never,
      version: 1,
      migrate: (persistedState, fromVersion) => {
        const state = persistedState as Partial<PrepareQuizSettingsState>;
        // v0 → v1: questionCount 25 → 20 조정
        if (fromVersion < 1 && state.questionCount === 25) {
          state.questionCount = 20;
        }
        return state;
      },
      partialize: (state) => ({
        pageMode: state.pageMode,
        isPreviewVisible: state.isPreviewVisible,
        questionType: state.questionType,
        questionCount: state.questionCount,
      }),
    },
  ),
);

/** 퀴즈 유형에 매핑된 난이도를 반환 */
export const getQuizLevel = (questionType: QuestionType) => levelMapping[questionType];
