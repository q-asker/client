import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import axiosInstance from "#shared/api";

const baseUrl = import.meta.env.VITE_BASE_URL;

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
      uploadedUrl: requestData.uploadedUrl,
      error: null,
    });

    const eventSource = new EventSource(
      `${baseUrl}/generation/${uuidv4()}/stream`
    );

    eventSource.addEventListener("created", (event) => {
      const data = JSON.parse(event.data);
      console.log(data);
    });
  },

  loadProblemSet: async (problemSetId) => {
    set({ isLoading: true, error: null, problemSetId });
  },
}));
