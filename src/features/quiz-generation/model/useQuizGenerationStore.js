import { create } from "zustand";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import axiosInstance from "#shared/api";
import { getAccessToken } from "#entities/auth";

const apiBaseURL = import.meta.env.VITE_BASE_URL;

const buildApiUrl = (path) => {
  if (!apiBaseURL) return path;
  const base = apiBaseURL.endsWith("/") ? apiBaseURL : `${apiBaseURL}/`;
  const safePath = path.replace(/^\/+/, "");
  return new URL(safePath, base).toString();
};

let activeController = null;

export const useQuizGenerationStore = create((set, get) => ({
  quizzes: [],
  totalCount: 0,
  isLoading: false,
  problemSetId: null,
  uploadedUrl: null,
  error: null,

  reset: () => {
    if (activeController) {
      activeController.abort();
      activeController = null;
    }
    set({
      quizzes: [],
      totalCount: 0,
      isLoading: false,
      problemSetId: null,
      uploadedUrl: null,
      error: null,
    });
  },

  startGeneration: async ({
    requestData,
    onFirstChunk,
    onComplete,
    onError,
  }) => {
    if (activeController) {
      activeController.abort();
    }

    const controller = new AbortController();
    activeController = controller;

    set({
      quizzes: [],
      totalCount: 0,
      isLoading: true,
      problemSetId: null,
      uploadedUrl: requestData?.uploadedUrl ?? null,
      error: null,
    });

    const accessToken = getAccessToken();
    let firstChunkHandled = false;

    try {
      await fetchEventSource(buildApiUrl("/generation"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(requestData),
        signal: controller.signal,
        openWhenHidden: true,

        async onopen(response) {
          if (response.ok) {
            return;
          }
          throw new Error("문제 생성 요청에 실패했습니다.");
        },

        onmessage(msg) {
          if (msg.event === "error") {
            throw new Error(msg.data);
          }

          if (msg.data === "[DONE]" || !msg.data) {
            return;
          }

          try {
            const data = JSON.parse(msg.data);

            const nextProblemSetId = data?.problemSetId;
            const nextTotalCount = Number(
              data?.totalCount ?? data?.problemCount ?? data?.quizCount ?? 0,
            );

            if (!firstChunkHandled && nextProblemSetId) {
              firstChunkHandled = true;
              set({ problemSetId: nextProblemSetId });
              if (typeof onFirstChunk === "function") {
                onFirstChunk({
                  problemSetId: nextProblemSetId,
                  totalCount: nextTotalCount,
                });
              }
            }

            if (nextTotalCount > 0 && get().totalCount === 0) {
              set({ totalCount: nextTotalCount });
            }

            const quizzesFromChunk = Array.isArray(data?.quiz) ? data.quiz : [];
            const hasSingleQuizPayload =
              data &&
              (data.title || data.content || data.question || data.selections);

            if (quizzesFromChunk.length > 0) {
              set((state) => ({
                quizzes: [...state.quizzes, ...quizzesFromChunk],
              }));
            } else if (hasSingleQuizPayload) {
              set((state) => ({ quizzes: [...state.quizzes, data] }));
            }
          } catch (error) {
            console.error("SSE 데이터 파싱 실패:", error);
          }
        },

        onclose() {
          throw new Error("STREAM_COMPLETE");
        },

        onerror(err) {
          throw err;
        },
      });
    } catch (error) {
      if (error.message === "STREAM_COMPLETE") {
        if (activeController === controller) {
          set({ isLoading: false });
          if (typeof onComplete === "function") {
            onComplete(get().problemSetId);
          }
        }
        return;
      }

      if (error.name === "AbortError") {
        return;
      }

      if (activeController === controller) {
        set({ isLoading: false, error: error?.message || "알 수 없는 오류" });
        if (typeof onError === "function") {
          onError(error);
        }
      }
    }
  },

  loadProblemSet: async (problemSetId) => {
    set({ isLoading: true, error: null, problemSetId });
    try {
      const res = await axiosInstance.get(`/problem-set/${problemSetId}`);
      const data = res.data || {};
      const quizzes = data.quiz || data.quizzes || data.problems || [];
      set({
        quizzes,
        totalCount: Array.isArray(quizzes) ? quizzes.length : 0,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error:
          error?.response?.data?.message ||
          error?.message ||
          "문제집을 불러오지 못했습니다.",
      });
    }
  },
}));
