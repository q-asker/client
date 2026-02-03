import { create } from "zustand";
import axiosInstance from "#shared/api";

export const useQuizGenerationStore = create((set) => ({
  quizzes: [],
  totalCount: 0,
  isLoading: false,
  problemSetId: null,
  uploadedUrl: null,
  error: null,

  reset: () => {
    set({
      quizzes: [],
      totalCount: 0,
      isLoading: false,
      problemSetId: null,
      uploadedUrl: null,
      error: null,
    });
  },

  startGeneration: async ({ requestData, onSuccess, onError }) => {
    set({
      quizzes: [],
      totalCount: 0,
      isLoading: true,
      problemSetId: null,
      uploadedUrl: requestData?.uploadedUrl ?? null,
      error: null,
    });

    try {
      const res = await axiosInstance.post("/generation", requestData);
      const { problemSetId } = res.data;

      set({
        isLoading: false,
        problemSetId,
      });

      if (onSuccess) {
        onSuccess(problemSetId);
      }
    } catch (error) {
      set({
        isLoading: false,
        error: error?.message || "문제 생성 요청에 실패했습니다.",
      });
      if (typeof onError === "function") {
        onError(error);
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
