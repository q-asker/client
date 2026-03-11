import { create } from 'zustand';
import { persist, type StateStorage } from 'zustand/middleware';
import axiosInstance from '#shared/api';
import CustomToast from '#shared/toast';
import Timer from '#shared/lib/timer';
import { trackMakeQuizEvents } from '#shared/lib/analytics';
import { authService } from '#entities/auth';

// ── 타입 정의 ──

export interface QuizSelection {
  id: string;
  content: string;
}

export interface Quiz {
  number: number;
  title: string;
  selections: QuizSelection[];
  userAnswer?: string | null;
  check?: boolean;
}

export interface FileInfo {
  name: string;
  size: number;
  extension: string;
}

interface ProblemSetInfo {
  problemSetId: string;
  totalCount?: number;
  isStreaming?: boolean;
}

interface GenerateQuestionsParams {
  t: (key: string) => string;
  uploadedUrl: string | null;
  questionType: string;
  questionCount: number;
  quizLevel: string;
  selectedPages: number[];
}

interface StartGenerationParams {
  requestData: {
    uploadedUrl: string | null;
    quizCount: number;
    quizType: string;
    difficultyType: string;
    pageNumbers: number[];
  };
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

interface HandleNavigateToQuizParams {
  navigate: (to: string, options?: { state?: Record<string, unknown> }) => void;
  uploadedUrl: string | null;
}

interface QuizGenerationState {
  quizzes: Quiz[];
  totalCount: number;
  isStreaming: boolean;
  isWaitingForFirstQuiz: boolean;
  problemSetId: string | null;
  showWaitMessage: boolean;
  generationElapsedTime: number;
  uploadedUrl: string | null;
  fileInfo: FileInfo | null;
  setUploadedUrl: (uploadedUrl: string | null) => void;
  setUploadedFileInfo: (fileInfo: FileInfo | null) => void;
  setProblemSetInfo: (info: ProblemSetInfo) => void;
  reset: () => void;
  resetStreamingState: () => void;
  reconnectStream: (sessionId: string) => Promise<void>;
  startGeneration: (params: StartGenerationParams) => Promise<void>;
  loadProblemSet: (problemSetId: string) => Promise<void>;
  generateQuestions: (params: GenerateQuestionsParams) => Promise<void>;
  handleNavigateToQuiz: (params: HandleNavigateToQuizParams) => void;
  resetGenerationState: () => void;
  resetGenerationForRecreate: () => void;
}

// ── 만료 스토리지 ──

const baseUrl = import.meta.env.VITE_BASE_URL as string;
const EXPIRATION_MS = 24 * 60 * 60 * 1000;

const expiringStorage: StateStorage = {
  getItem: (name: string): string | null => {
    const raw = localStorage.getItem(name);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as { savedAt?: number; value?: string };
      const savedAt = Number(parsed?.savedAt);
      if (!savedAt || Date.now() - savedAt > EXPIRATION_MS) {
        localStorage.removeItem(name);
        return null;
      }
      return (parsed?.value as string) ?? null;
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    localStorage.setItem(
      name,
      JSON.stringify({
        value,
        savedAt: Date.now(),
      }),
    );
  },
  removeItem: (name: string): void => {
    localStorage.removeItem(name);
  },
};

// ── 모듈 레벨 변수 ──

let generationTimer: Timer | null = null;
let waitMessageTimer: ReturnType<typeof setTimeout> | null = null;
let generationEventSource: EventSource | null = null;

type SetState = (
  partial:
    | Partial<QuizGenerationState>
    | ((state: QuizGenerationState) => Partial<QuizGenerationState>),
) => void;

// ── 유틸 함수 ──

const closeGenerationStream = (eventSource: EventSource | null = generationEventSource): void => {
  if (eventSource) {
    eventSource.close();
  }
  if (!eventSource || eventSource === generationEventSource) {
    generationEventSource = null;
  }
};

const resetWaitingForFirstQuizState = (
  set: SetState,
  extraState: Partial<QuizGenerationState> = {},
): void => {
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

const startGenerationTimers = (set: SetState): void => {
  if (generationTimer) {
    generationTimer.reset();
    generationTimer = null;
  }
  generationTimer = new Timer((elapsed: number) => {
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

const finalizeGeneration = (set: SetState, eventSource?: EventSource | null): void => {
  closeGenerationStream(eventSource ?? null);
  resetWaitingForFirstQuizState(set, { isStreaming: false });
};

interface StreamHandlerCallbacks {
  onError?: (error: unknown) => void;
  onSuccess?: () => void;
}

const attachGenerationStreamHandlers = (
  eventSource: EventSource,
  set: SetState,
  { onError, onSuccess }: StreamHandlerCallbacks = {},
): void => {
  let reconnectAttempts = 0;
  eventSource.addEventListener('created', (event: MessageEvent) => {
    reconnectAttempts = 0;
    const data = JSON.parse(event.data as string) as { problemSetId: string; quiz: Quiz[] };
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
  eventSource.addEventListener('error-finish', (event: MessageEvent) => {
    console.error('이벤트 스트림 중 에러 발생, 강제 종료:', event);
    onError?.(event.data);
    finalizeGeneration(set, eventSource);
  });
  eventSource.addEventListener('error', (event: Event) => {
    console.error('이벤트 스트림 중 에러 발생, 재연결 시도 중:', event);
    reconnectAttempts += 1;
    if (reconnectAttempts >= 5) {
      console.error('재연결 시도 횟수 초과, 스트림 종료');
      onError?.('서버와의 통신에 실패했어요');
      finalizeGeneration(set, eventSource);
    }
  });
};

// ── Store ──

export const useQuizGenerationStore = create<QuizGenerationState>()(
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
      setUploadedUrl: (uploadedUrl: string | null) => {
        set({ uploadedUrl });
      },
      setUploadedFileInfo: (fileInfo: FileInfo | null) => {
        set({ fileInfo });
      },
      setProblemSetInfo: ({ problemSetId, totalCount, isStreaming }: ProblemSetInfo) => {
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

      reconnectStream: async (sessionId: string) => {
        closeGenerationStream();
        set({ isStreaming: true });
        generationEventSource = new EventSource(`${baseUrl}/generation/${sessionId}/stream`, {
          withCredentials: true,
        });
        attachGenerationStreamHandlers(generationEventSource, set);
      },

      startGeneration: async ({ requestData, onSuccess, onError }: StartGenerationParams) => {
        closeGenerationStream();
        set({
          quizzes: [],
          totalCount: requestData.quizCount,
          isStreaming: true,
          problemSetId: null,
          uploadedUrl: requestData.uploadedUrl,
        });

        const sessionId = crypto.randomUUID();
        generationEventSource = new EventSource(`${baseUrl}/generation/${sessionId}/stream`, {
          withCredentials: true,
        });

        generationEventSource.onopen = () => {
          axiosInstance
            .post(`/generation`, { ...requestData, sessionId })
            .then(() => {})
            .catch((error: unknown) => {
              finalizeGeneration(set, generationEventSource);
              onError?.(error);
            });
        };

        attachGenerationStreamHandlers(generationEventSource, set, { onError, onSuccess });
      },

      loadProblemSet: async (problemSetId: string) => {
        set({ isStreaming: true, problemSetId });
      },

      generateQuestions: async ({
        t,
        uploadedUrl,
        questionType,
        questionCount,
        quizLevel,
        selectedPages,
      }: GenerateQuestionsParams) => {
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
          } catch {
            // 리프레시 에러 무시
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
            onError: (errorMessage: unknown) => {
              const err = errorMessage as {
                response?: { data?: { message?: string } };
                message?: string;
              };
              const message =
                err?.response?.data?.message ||
                err?.message ||
                (typeof errorMessage === 'string' ? errorMessage : null) ||
                t('퀴즈 생성에 실패했습니다.');
              CustomToast.error(message as string);
            },
          });
        } catch (error: unknown) {
          const message =
            (error as { message?: string })?.message || t('퀴즈 생성에 실패했습니다.');
          CustomToast.error(message);
          finalizeGeneration(set);
        }
      },

      handleNavigateToQuiz: ({ navigate, uploadedUrl }: HandleNavigateToQuizParams) => {
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
