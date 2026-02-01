import { create } from "zustand";
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

    try {
      const accessToken = getAccessToken();
      const response = await fetch(buildApiUrl("/generation"), {
        method: "POST",
        headers: {
          Accept: "text/event-stream",
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify(requestData),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error("문제 생성 요청에 실패했습니다.");
      }

      if (!response.body) {
        throw new Error("스트리밍 응답을 읽을 수 없습니다.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let firstChunkHandled = false;

      const handleChunk = (data) => {
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
      };

      const parseEvent = (rawEvent) => {
        const lines = rawEvent.split("\n");
        const dataLines = [];
        let eventType = null;

        for (const line of lines) {
          if (!line.trim()) continue;
          if (line.startsWith("event:")) {
            eventType = line.slice(6).trim();
            continue;
          }
          if (line.startsWith("data:")) {
            dataLines.push(line.slice(5).trimStart());
          }
        }

        const payload = dataLines.join("\n").trim();
        if (!payload || payload === "[DONE]") return;

        if (eventType === "error") {
          set({ isLoading: false, error: payload });
          if (typeof onError === "function") {
            onError(new Error(payload));
          }
          return;
        }

        try {
          const data = JSON.parse(payload);
          handleChunk(data);
        } catch (error) {
          console.error("SSE 데이터 파싱 실패:", error);
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        buffer = buffer.replace(/\r\n/g, "\n");

        while (buffer.includes("\n\n")) {
          const boundaryIndex = buffer.indexOf("\n\n");
          const rawEvent = buffer.slice(0, boundaryIndex);
          buffer = buffer.slice(boundaryIndex + 2);
          if (rawEvent.trim()) {
            parseEvent(rawEvent);
          }
        }
      }

      if (buffer.trim()) {
        buffer = buffer.replace(/\r\n/g, "\n");
        parseEvent(buffer);
      }

      if (activeController === controller) {
        set({ isLoading: false });
        if (typeof onComplete === "function") {
          onComplete(get().problemSetId);
        }
      }
    } catch (error) {
      if (error?.name !== "AbortError" && activeController === controller) {
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
