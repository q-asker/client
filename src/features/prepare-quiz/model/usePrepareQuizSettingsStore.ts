import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createExpiringStorage } from '#shared/lib/expiringStorage';
import type { QuestionType } from './constants';
import { defaultType } from './constants';
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
  /** 퀴즈 언어 */
  language: 'KO' | 'EN';
  /** 빈칸(BLANK) 유형일 때 선택지를 숨기고 REAL_BLANK로 생성할지 여부 */
  blankHideSelections: boolean;
}

interface PrepareQuizSettingsActions {
  setPageMode: (mode: PageMode) => void;
  setIsPreviewVisible: (visible: boolean) => void;
  setQuestionType: (type: QuestionType) => void;
  setQuestionCount: (count: number) => void;
  setLanguage: (language: 'KO' | 'EN') => void;
  setBlankHideSelections: (value: boolean) => void;
  reset: () => void;
}

const initialState: PrepareQuizSettingsState = {
  pageMode: 'CUSTOM',
  isPreviewVisible: true,
  questionType: defaultType,
  questionCount: 10,
  language: 'KO',
  blankHideSelections: false,
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
      setLanguage: (language) => set({ language }),
      setBlankHideSelections: (value) => set({ blankHideSelections: value }),
      reset: () => set(initialState),
    }),
    {
      name: 'prepare-quiz-settings',
      storage: createExpiringStorage() as never,
      version: 2,
      migrate: (persistedState, fromVersion) => {
        const state = persistedState as Partial<PrepareQuizSettingsState>;
        // v0 → v1: questionCount 25 → 20 조정
        if (fromVersion < 1 && state.questionCount === 25) {
          state.questionCount = 20;
        }
        // v1 → v2: blankHideSelections 기본값 주입
        if (fromVersion < 2 && state.blankHideSelections === undefined) {
          state.blankHideSelections = false;
        }
        return state;
      },
      partialize: (state) => ({
        pageMode: state.pageMode,
        isPreviewVisible: state.isPreviewVisible,
        questionType: state.questionType,
        questionCount: state.questionCount,
        language: state.language,
        blankHideSelections: state.blankHideSelections,
      }),
    },
  ),
);
