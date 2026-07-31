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
}

interface PrepareQuizSettingsActions {
  setPageMode: (mode: PageMode) => void;
  setIsPreviewVisible: (visible: boolean) => void;
  setQuestionType: (type: QuestionType) => void;
  setQuestionCount: (count: number) => void;
  setLanguage: (language: 'KO' | 'EN') => void;
  reset: () => void;
}

const initialState: PrepareQuizSettingsState = {
  pageMode: 'CUSTOM',
  isPreviewVisible: true,
  questionType: defaultType,
  questionCount: 10,
  language: 'KO',
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
      reset: () => set(initialState),
    }),
    {
      name: 'prepare-quiz-settings',
      storage: createExpiringStorage() as never,
      version: 3,
      migrate: (persistedState, fromVersion) => {
        const state = persistedState as Partial<PrepareQuizSettingsState> & {
          blankHideSelections?: boolean;
        };
        // v0 → v1: questionCount 25 → 20 조정
        if (fromVersion < 1 && state.questionCount === 25) {
          state.questionCount = 20;
        }
        // v2 → v3: blankHideSelections 폐지. BLANK+선택지숨김으로 저장돼 있던 설정은 REAL_BLANK 유형으로 이관.
        if (fromVersion < 3) {
          if (state.blankHideSelections === true && state.questionType === 'BLANK') {
            state.questionType = 'REAL_BLANK';
          }
          delete state.blankHideSelections;
        }
        return state;
      },
      partialize: (state) => ({
        pageMode: state.pageMode,
        isPreviewVisible: state.isPreviewVisible,
        questionType: state.questionType,
        questionCount: state.questionCount,
        language: state.language,
      }),
    },
  ),
);
