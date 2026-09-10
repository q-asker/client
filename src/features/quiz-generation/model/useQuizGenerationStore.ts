import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axiosInstance from '#shared/api';
import CustomToast from '#shared/toast';
import Timer from '#shared/lib/timer';
import { trackMakeQuizEvents } from '#shared/lib/analytics';
import { createExpiringStorage } from '#shared/lib/expiringStorage';
import { authService } from '#entities/auth';

/** Safari 15.4 미만은 crypto.randomUUID 미지원 */
export function generateUUID(): string {
  if (crypto.randomUUID) return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 1
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0'));
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10).join('')}`;
}

// ── 타입 정의 ──

export interface QuizSelection {
  id: string;
  content: string;
  correct?: boolean;
}

export type QuizType = 'BLANK' | 'MULTIPLE' | 'OX' | 'ESSAY' | 'REAL_BLANK';

/** 서술형 채점 요소별 점수 */
export interface ElementScore {
  element: string;
  maxPoints: number;
  earnedPoints: number;
  level: string;
  feedback: string;
}

/** 서술형 AI 채점 결과 */
export interface GradeResult {
  elementScores: ElementScore[];
  totalScore: number;
  maxScore: number;
  overallFeedback: string;
}

export interface Quiz {
  number: number;
  title: string;
  type?: QuizType;
  selections: QuizSelection[];
  userAnswer?: string | null;
  inReview?: boolean;
  appliedInstruction?: string | null;
  modelAnswer?: string | null;
  gradeResult?: GradeResult | null;
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
  currentLanguage: string;
  uploadedUrl: string | null;
  fileName: string;
  questionType: string;
  questionCount: number;
  selectedPages: number[];
  language?: 'KO' | 'EN';
  customInstruction?: string;
  /** 생성 완료 콜백(선택). 이어풀기는 여기서 새 세트 풀이로 자동 진입한다. 미전달 시 기존 동작 유지. */
  onSuccess?: () => void;
}

interface StartGenerationParams {
  requestData: {
    uploadedUrl: string | null;
    title: string;
    quizCount: number;
    quizType: string;
    pageNumbers: number[];
    language?: string;
    customInstruction?: string;
  };
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

interface HandleNavigateToQuizParams {
  navigate: (to: string) => void;
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
  connectStream: (sessionId: string, callbacks?: StreamHandlerCallbacks) => Promise<void>;
  startGeneration: (params: StartGenerationParams) => Promise<void>;
  loadProblemSet: (problemSetId: string) => Promise<void>;
  generateQuestions: (params: GenerateQuestionsParams) => Promise<void>;
  handleNavigateToQuiz: (params: HandleNavigateToQuizParams) => void;
  resetGenerationState: () => void;
  resetGenerationForRecreate: () => void;
}

const baseUrl = import.meta.env.VITE_BASE_URL as string;

// ── 모듈 레벨 변수 ──

let generationTimer: Timer | null = null;
let waitMessageTimer: ReturnType<typeof setTimeout> | null = null;
let generationEventSource: EventSource | null = null;

type SetState = (
  partial:
    Partial<QuizGenerationState> | ((state: QuizGenerationState) => Partial<QuizGenerationState>),
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
    // CLOSED는 브라우저가 재시도를 포기한 상태(429·5xx·CORS). error가 한 번만 발화하므로
    // 카운터로는 잡히지 않는다 — 즉시 종료 처리해야 화면이 멈춘 채 남지 않는다.
    if (eventSource.readyState === EventSource.CLOSED) {
      console.error('스트림 연결 실패, 재시도 없이 종료:', event);
      onError?.('서버와의 통신에 실패했어요');
      finalizeGeneration(set, eventSource);
      return;
    }
    console.error('이벤트 스트림 중 에러 발생, 재연결 시도 중:', event);
    reconnectAttempts += 1;
    if (reconnectAttempts >= 5) {
      console.error('재연결 시도 횟수 초과, 스트림 종료');
      onError?.('서버와의 통신에 실패했어요');
      finalizeGeneration(set, eventSource);
    }
  });
};

/** 기존 스트림을 닫고 sessionId로 새 SSE 스트림을 연다. 최초 생성과 재진입이 같은 경로를 쓴다. */
const openGenerationStream = (
  sessionId: string,
  set: SetState,
  callbacks?: StreamHandlerCallbacks,
): void => {
  closeGenerationStream();
  set({ isStreaming: true });
  generationEventSource = new EventSource(`${baseUrl}/generation/${sessionId}/stream`, {
    withCredentials: true,
  });
  attachGenerationStreamHandlers(generationEventSource, set, callbacks);
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

      connectStream: async (sessionId: string, callbacks?: StreamHandlerCallbacks) => {
        openGenerationStream(sessionId, set, callbacks);
      },

      startGeneration: async ({ requestData, onSuccess, onError }: StartGenerationParams) => {
        set({
          quizzes: [],
          totalCount: requestData.quizCount,
          problemSetId: null,
          uploadedUrl: requestData.uploadedUrl,
        });

        const sessionId = generateUUID();
        openGenerationStream(sessionId, set, { onError, onSuccess });

        // 트리거가 스트림보다 먼저 처리돼도 유실은 없다 — 서버는 문항을 저장한 뒤 통지하고,
        // 구독 시점에 emitter를 먼저 등록한 다음 그때까지의 생성분을 리플레이한다.
        // 같은 sessionId 재-POST도 서버가 멱등 no-op으로 흡수한다.
        axiosInstance
          .post(`/generation`, { ...requestData, sessionId }, { skipErrorToast: true } as Record<
            string,
            unknown
          >)
          .catch((error: unknown) => {
            finalizeGeneration(set, generationEventSource);
            onError?.(error);
          });
      },

      loadProblemSet: async (problemSetId: string) => {
        set({ isStreaming: true, problemSetId });
      },

      generateQuestions: async ({
        t,
        currentLanguage,
        uploadedUrl,
        fileName,
        questionType,
        questionCount,
        selectedPages,
        language,
        customInstruction,
        onSuccess,
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
              title: fileName,
              quizCount: questionCount,
              quizType: questionType,
              pageNumbers: selectedPages,
              language: language || (currentLanguage === 'en' ? 'EN' : 'KO'),
              ...(customInstruction?.trim() ? { customInstruction: customInstruction.trim() } : {}),
            },
            onSuccess: onSuccess ?? (() => {}),
            onError: (errorMessage: unknown) => {
              // EventSource 에러는 인터셉터를 거치지 않으므로 직접 토스트 처리
              const err = errorMessage as {
                response?: { data?: { message?: string } };
                message?: string;
              };
              const message =
                err?.response?.data?.message ||
                err?.message ||
                (typeof errorMessage === 'string' ? errorMessage : null) ||
                t('알 수 없는 오류가 발생했습니다.');
              CustomToast.error(message as string);
            },
          });
        } catch {
          finalizeGeneration(set);
        }
      },

      handleNavigateToQuiz: ({ navigate }: HandleNavigateToQuizParams) => {
        const { problemSetId } = useQuizGenerationStore.getState();
        if (!problemSetId) {
          return;
        }
        trackMakeQuizEvents.navigateToQuiz(problemSetId);
        navigate(`/quiz/${problemSetId}`);
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
      storage: createExpiringStorage() as never,
      partialize: (state) => ({
        totalCount: state.totalCount,
        problemSetId: state.problemSetId,
        uploadedUrl: state.uploadedUrl,
        fileInfo: state.fileInfo,
      }),
    },
  ),
);
