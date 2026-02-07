import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import axiosInstance from '#shared/api';
import CustomToast from '#shared/toast';
import Timer from '#shared/lib/timer';
import { trackMakeQuizEvents } from '#shared/lib/analytics';
import { authService } from '#entities/auth';

const baseUrl = import.meta.env.VITE_BASE_URL;
const EXPIRATION_MS = 24 * 60 * 60 * 1000;

const expiringStorage = {
  getItem: (name) => {
    const raw = localStorage.getItem(name);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      const savedAt = Number(parsed?.savedAt);
      if (!savedAt || Date.now() - savedAt > EXPIRATION_MS) {
        localStorage.removeItem(name);
        return null;
      }
      return parsed?.value ?? null;
    } catch (error) {
      return null;
    }
  },
  setItem: (name, value) => {
    localStorage.setItem(
      name,
      JSON.stringify({
        value,
        savedAt: Date.now(),
      }),
    );
  },
  removeItem: (name) => {
    localStorage.removeItem(name);
  },
};
let generationTimer = null;
let waitMessageTimer = null;
let generationEventSource = null;

const closeGenerationStream = (eventSource = generationEventSource) => {
  if (eventSource) {
    eventSource.close();
  }
  if (!eventSource || eventSource === generationEventSource) {
    generationEventSource = null;
  }
};

const resetWaitingForFirstQuizState = (set, extraState = {}) => {
  if (waitMessageTimer) {
    clearTimeout(waitMessageTimer);
    waitMessageTimer = null;
  }
  if (generationTimer) {
    generationTimer.stop();
    generationTimer.reset();
    generationTimer = null;
  }
  set({
    isWaitingForFirstQuiz: false,
    showWaitMessage: false,
    generationElapsedTime: 0,
    ...extraState,
  });
};

const startGenerationTimers = (set) => {
  if (generationTimer) {
    generationTimer.reset();
    generationTimer = null;
  }
  generationTimer = new Timer((elapsed) => {
    set({ generationElapsedTime: elapsed });
  });
  generationTimer.start();

  if (waitMessageTimer) {
    clearTimeout(waitMessageTimer);
    waitMessageTimer = null;
  }
  waitMessageTimer = setTimeout(() => {
    set({ showWaitMessage: true });
  }, 5000);
};

const finalizeGeneration = (set, eventSource) => {
  closeGenerationStream(eventSource);
  resetWaitingForFirstQuizState(set, { isStreaming: false });
};

const attachGenerationStreamHandlers = (eventSource, set, { onError, onSuccess } = {}) => {
  let reconnectAttempts = 0;
  eventSource.addEventListener('created', (event) => {
    reconnectAttempts = 0;
    const data = JSON.parse(event.data);
    const problemSetId = data.problemSetId;
    set((state) => ({
      problemSetId,
      quizzes: [...state.quizzes, ...data.quiz],
    }));
  });
  eventSource.addEventListener('complete', () => {
    console.info('이벤트 스트림 완료');
    onSuccess?.();
    finalizeGeneration(set, eventSource);
  });
  eventSource.addEventListener('error-finish', (event) => {
    console.error('이벤트 스트림 중 에러 발생, 강제 종료:', event);
    onError?.(event.data);
    finalizeGeneration(set, eventSource);
  });
  eventSource.addEventListener('error', (event) => {
    console.error('이벤트 스트림 중 에러 발생, 재연결 시도 중:', event);
    reconnectAttempts += 1;
    if (reconnectAttempts >= 5) {
      console.error('재연결 시도 횟수 초과, 스트림 종료');
      onError('서버와의 통신에 실패했어요');
      finalizeGeneration(set, eventSource);
    }
  });
};

export const useQuizGenerationStore = create(
  persist(
    (set) => ({
      quizzes: [],
      totalCount: 0,
      isStreaming: false,
      isWaitingForFirstQuiz: false,
      problemSetId: null,
      showWaitMessage: false,
      generationElapsedTime: 0,
      uploadedUrl: null,
      fileInfo: null,
      setUploadedUrl: (uploadedUrl) => {
        set({ uploadedUrl });
      },
      setUploadedFileInfo: (fileInfo) => {
        set({ fileInfo });
      },
      setProblemSetInfo: ({ problemSetId, totalCount, isStreaming }) => {
        set((state) => ({
          problemSetId: problemSetId,
          totalCount: typeof totalCount === 'number' ? totalCount : state.totalCount,
          isStreaming: typeof isStreaming === 'boolean' ? isStreaming : state.isStreaming,
        }));
      },

      reset: () => {
        closeGenerationStream();
        if (generationTimer) {
          generationTimer.reset();
          generationTimer = null;
        }
        if (waitMessageTimer) {
          clearTimeout(waitMessageTimer);
          waitMessageTimer = null;
        }
        set({
          quizzes: [],
          totalCount: 0,
          isStreaming: false,
          isWaitingForFirstQuiz: false,
          problemSetId: null,
          showWaitMessage: false,
          generationElapsedTime: 0,
          uploadedUrl: null,
          fileInfo: null,
        });
      },

      resetStreamingState: () => {
        closeGenerationStream();
        resetWaitingForFirstQuizState(set);
        set({
          quizzes: [],
          isStreaming: false,
        });
      },

      reconnectStream: async (sessionId) => {
        closeGenerationStream();
        set({ isStreaming: true });
        generationEventSource = new EventSource(`${baseUrl}/generation/${sessionId}/stream`);
        attachGenerationStreamHandlers(generationEventSource, set);
      },

      startGeneration: async ({ requestData, onSuccess, onError }) => {
        closeGenerationStream();
        set({
          quizzes: [],
          totalCount: requestData.quizCount,
          isStreaming: true,
          problemSetId: null,
          uploadedUrl: requestData.uploadedUrl,
        });

        const sessionId = uuidv4();
        generationEventSource = new EventSource(`${baseUrl}/generation/${sessionId}/stream`);

        generationEventSource.onopen = () => {
          axiosInstance
            .post(`/generation`, { ...requestData, sessionId })
            .then(() => {})
            .catch((error) => {
              closeGenerationStream();
              finalizeGeneration(set);
              onError?.(error);
            });
        };

        attachGenerationStreamHandlers(generationEventSource, set, { onError, onSuccess });
      },

      loadProblemSet: async (problemSetId) => {
        set({ isStreaming: true, problemSetId });
      },

      generateQuestions: async ({
        t,
        uploadedUrl,
        questionType,
        questionCount,
        quizLevel,
        selectedPages,
      }) => {
        if (!uploadedUrl) {
          CustomToast.error(t('파일을 먼저 업로드해주세요.'));
          return;
        }
        if (!selectedPages.length) {
          CustomToast.error(t('페이지를 선택해주세요.'));
          return;
        }

        set({ isWaitingForFirstQuiz: true });
        try {
          try {
            await authService.refresh();
          } catch (ignored) {
            // ignore refresh error
          }

          startGenerationTimers(set);

          await useQuizGenerationStore.getState().startGeneration({
            requestData: {
              uploadedUrl,
              quizCount: questionCount,
              quizType: questionType,
              difficultyType: quizLevel,
              pageNumbers: selectedPages,
            },
            onSuccess: () => {},
            onError: (errorMessage) => {
              const message =
                errorMessage?.message ||
                errorMessage ||
                t('퀴즈 생성에 실패했습니다.');
              CustomToast.error(message);
            },
          });
        } catch (error) {
          const message = error?.message || t('퀴즈 생성에 실패했습니다.');
          CustomToast.error(message);
          finalizeGeneration(set);
        }
      },

      handleNavigateToQuiz: ({ navigate, uploadedUrl }) => {
        const { problemSetId } = useQuizGenerationStore.getState();
        if (!problemSetId) {
          return;
        }
        trackMakeQuizEvents.navigateToQuiz(problemSetId);
        navigate(`/quiz/${problemSetId}`, {
          state: { uploadedUrl },
        });
      },

      resetGenerationState: () => {
        closeGenerationStream();
        resetWaitingForFirstQuizState(set, { problemSetId: null });
      },

      resetGenerationForRecreate: () => {
        closeGenerationStream();
        resetWaitingForFirstQuizState(set, { problemSetId: null });
      },
    }),
    {
      name: 'make-quiz-storage',
      storage: expiringStorage,
      partialize: (state) => ({
        totalCount: state.totalCount,
        problemSetId: state.problemSetId,
        uploadedUrl: state.uploadedUrl,
        fileInfo: state.fileInfo,
      }),
    },
  ),
);
