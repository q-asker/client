import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import axiosInstance from '#shared/api';
import CustomToast from '#shared/toast';
import Timer from '#shared/lib/timer';
import { trackMakeQuizEvents } from '#shared/lib/analytics';
import { authService } from '#entities/auth';

const baseUrl = import.meta.env.VITE_BASE_URL;
let generationTimer = null;
let waitMessageTimer = null;

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

const finalizeGeneration = (set, { error } = {}) => {
  const nextState = {
    isStreaming: false,
  };
  if (error) {
    nextState.error = error;
  }
  resetWaitingForFirstQuizState(set, nextState);
};

const attachGenerationStreamHandlers = (eventSource, set) => {
  eventSource.addEventListener('created', (event) => {
    const data = JSON.parse(event.data);
    const problemSetId = data.problemSetId;
    set((state) => ({
      problemSetId,
      quizzes: [...state.quizzes, ...data.quiz],
    }));
  });
  eventSource.addEventListener('complete', () => {
    console.info('이벤트 스트림 완료');
    eventSource.close();
    set({ isStreaming: false });
  });
  eventSource.addEventListener('error', (event) => {
    console.error('이벤트 스트림 중 에러 발생, 재연결 시도 중:', event);
  });
};

export const useQuizGenerationStore = create((set) => ({
  quizzes: [],
  totalCount: 0,
  isStreaming: false,
  isWaitingForFirstQuiz: false,
  problemSetId: null,
  showWaitMessage: false,
  generationElapsedTime: 0,
  uploadedUrl: null,
  error: null,
  setProblemSetInfo: ({ problemSetId, totalCount, isStreaming }) => {
    set((state) => ({
      problemSetId: problemSetId,
      totalCount: typeof totalCount === 'number' ? totalCount : state.totalCount,
      isStreaming: typeof isStreaming === 'boolean' ? isStreaming : state.isStreaming,
    }));
  },

  reset: () => {
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
      error: null,
    });
  },

  reconnectStream: async (sessionId) => {
    set({ isStreaming: true, error: null });
    const eventSource = new EventSource(`${baseUrl}/generation/${sessionId}/stream`);
    attachGenerationStreamHandlers(eventSource, set);
  },

  startGeneration: async ({ requestData, onSuccess, onError }) => {
    set({
      quizzes: [],
      totalCount: requestData.quizCount,
      isStreaming: true,
      problemSetId: null,
      uploadedUrl: requestData.uploadedUrl,
      error: null,
    });

    const sessionId = uuidv4();
    const eventSource = new EventSource(`${baseUrl}/generation/${sessionId}/stream`);

    eventSource.onopen = () => {
      axiosInstance
        .post(`/generation`, { ...requestData, sessionId })
        .then(() => {})
        .catch((error) => {
          eventSource.close();
          onError(error);
        });
    };

    attachGenerationStreamHandlers(eventSource, set);
  },

  loadProblemSet: async (problemSetId) => {
    set({ isStreaming: true, error: null, problemSetId });
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

      useQuizGenerationStore.getState().startGeneration({
        requestData: {
          uploadedUrl,
          quizCount: questionCount,
          quizType: questionType,
          difficultyType: quizLevel,
          pageNumbers: selectedPages,
        },
        onSuccess: () => {
          finalizeGeneration(set);
        },
        onError: (error) => {
          finalizeGeneration(set, { error });
        },
      });
    } catch (error) {
      finalizeGeneration(set, { error });
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
    resetWaitingForFirstQuizState(set, { problemSetId: null });
  },

  resetGenerationForRecreate: () => {
    resetWaitingForFirstQuizState(set, { problemSetId: null });
  },
}));
