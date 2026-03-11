import { useEffect, useMemo, useRef, useState } from 'react';
import axiosInstance from '#shared/api';
import CustomToast from '#shared/toast';
import { trackQuizHistoryEvents } from '#shared/lib/analytics';
import { useClickOutside } from '#shared/lib/useClickOutside';
import type { Quiz } from '#features/quiz-generation';

// ── 타입 정의 ──

/** 퀴즈 기록 항목 */
interface QuizHistoryRecord {
  problemSetId: string;
  status: 'completed' | 'in-progress';
  quizLevel: string;
  score: number;
  questionCount: number;
  uploadedUrl: string;
  quizData: Quiz[];
  createdAt: string;
}

/** 퀴즈 통계 */
interface QuizStats {
  totalQuizzes: number;
  completedQuizzes: number;
  averageScore: number;
  completionRate: number;
}

interface UseQuizHistoryParams {
  t: (key: string) => string;
  navigate: (to: string, options?: { state?: unknown; replace?: boolean }) => void;
  currentLanguage: string;
}

interface UseQuizHistoryReturn {
  state: {
    quizHistory: QuizHistoryRecord[];
    loading: boolean;
    explanationLoading: boolean;
    isSidebarOpen: boolean;
    stats: QuizStats;
  };
  actions: {
    toggleSidebar: () => void;
    setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
    navigateToExplanation: (record: QuizHistoryRecord) => Promise<void>;
    navigateToQuiz: (record: QuizHistoryRecord) => void;
    deleteQuizRecord: (problemSetId: string) => void;
    clearAllHistory: () => void;
    formatDate: (dateString: string) => string;
    handleCreateFromEmpty: () => void;
  };
}

// ── 상수 ──

const QUIZ_HISTORY_KEY = 'quiz-history-storage';

// ── 유틸리티 함수 ──

/** 로컬 스토리지에서 퀴즈 기록 읽기 */
const readQuizHistory = (): QuizHistoryRecord[] => {
  try {
    const raw = localStorage.getItem(QUIZ_HISTORY_KEY);
    return raw ? (JSON.parse(raw) as QuizHistoryRecord[]) : [];
  } catch (error) {
    console.error('Failed to read quiz history:', error);
    return [];
  }
};

/** 로컬 스토리지에 퀴즈 기록 저장 */
const saveQuizHistory = (history: QuizHistoryRecord[]): void => {
  try {
    localStorage.setItem(QUIZ_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save quiz history:', error);
  }
};

// ── 퀴즈 기록 훅 ──

export const useQuizHistory = ({
  t,
  navigate,
  currentLanguage,
}: UseQuizHistoryParams): UseQuizHistoryReturn => {
  const [quizHistory, setQuizHistory] = useState<QuizHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const startTimeRef = useRef(Date.now());

  const loadQuizHistory = (): QuizHistoryRecord[] => {
    try {
      const history = readQuizHistory();
      setQuizHistory(history);
      setLoading(false);
      return history;
    } catch (error) {
      console.error(t('퀴즈 기록 불러오기 실패:'), error);
      CustomToast.error(t('기록을 불러오는데 실패했습니다.'));
      setLoading(false);
      return [];
    }
  };

  const toggleSidebar = (): void => setIsSidebarOpen((prev) => !prev);

  useEffect(() => {
    loadQuizHistory();
  }, []);

  useClickOutside({
    containerId: 'sidebar',
    triggerId: 'menuButton',
    onOutsideClick: () => setIsSidebarOpen(false),
  });

  const navigateToExplanation = async (record: QuizHistoryRecord): Promise<void> => {
    if (record.status !== 'completed') {
      CustomToast.info(t('완료된 퀴즈만 해설을 볼 수 있습니다.'));
      return;
    }

    trackQuizHistoryEvents.clickViewExplanation(
      record.problemSetId,
      record.quizLevel,
      record.score,
    );

    setExplanationLoading(true);

    try {
      if (record.quizData && record.quizData.length > 0) {
        const explanationResponse = await axiosInstance.get(`/explanation/${record.problemSetId}`);
        const explanationData = explanationResponse.data;

        const stateData = {
          quizzes: record.quizData,
          explanation: explanationData,
          uploadedUrl: record.uploadedUrl,
        };

        navigate(`/explanation/${record.problemSetId}`, {
          state: stateData,
        });
      } else {
        const quizResponse = await axiosInstance.get(`/problem-set/${record.problemSetId}`);
        const quizData = quizResponse.data as { problems?: Quiz[]; quizzes?: Quiz[] };

        const explanationResponse = await axiosInstance.get(`/explanation/${record.problemSetId}`);
        const explanationData = explanationResponse.data;

        const finalQuizzes: Quiz[] = quizData.problems || quizData.quizzes || [];

        const stateData = {
          quizzes: finalQuizzes,
          explanation: explanationData,
          uploadedUrl: record.uploadedUrl,
        };

        navigate(`/explanation/${record.problemSetId}`, {
          state: stateData,
        });
      }
    } catch (error: unknown) {
      const err = error as {
        message?: string;
        response?: { data?: unknown; status?: number };
        config?: { url?: string };
      };
      console.error(t('해설 데이터 로딩 실패:'), error);
      console.error(t('에러 상세 정보:'), {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        url: err.config?.url,
      });
      CustomToast.error(t('해설을 불러오는데 실패했습니다. 문제가 삭제되었을 수 있습니다.'));
    } finally {
      setExplanationLoading(false);
    }
  };

  const navigateToQuiz = (record: QuizHistoryRecord): void => {
    if (record.status === 'completed') {
      trackQuizHistoryEvents.clickRetryQuiz(record.problemSetId, record.quizLevel, record.score);
    } else {
      trackQuizHistoryEvents.clickResumeQuiz(
        record.problemSetId,
        record.quizLevel,
        record.questionCount,
      );
    }

    navigate(`/quiz/${record.problemSetId}`, {
      state: {
        uploadedUrl: record.uploadedUrl,
      },
    });
  };

  const deleteQuizRecord = (problemSetId: string): void => {
    if (window.confirm(t('이 기록을 삭제하시겠습니까?'))) {
      try {
        const record = quizHistory.find((item) => item.problemSetId === problemSetId);

        trackQuizHistoryEvents.deleteQuizRecord(
          problemSetId,
          record?.status || 'unknown',
          record?.quizLevel || 'unknown',
        );

        const newHistory = quizHistory.filter((item) => item.problemSetId !== problemSetId);
        setQuizHistory(newHistory);
        saveQuizHistory(newHistory);
        CustomToast.success(t('기록이 삭제되었습니다.'));
      } catch (error) {
        console.error(t('기록 삭제 실패:'), error);
        CustomToast.error(t('기록 삭제에 실패했습니다.'));
      }
    }
  };

  const clearAllHistory = (): void => {
    if (window.confirm(t('모든 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.'))) {
      try {
        const completed = quizHistory.filter((item) => item.status === 'completed');

        trackQuizHistoryEvents.clearAllHistory(quizHistory.length, completed.length);

        setQuizHistory([]);
        saveQuizHistory([]);
        CustomToast.success(t('모든 기록이 삭제되었습니다.'));
      } catch (error) {
        console.error(t('전체 기록 삭제 실패:'), error);
        CustomToast.error(t('기록 삭제에 실패했습니다.'));
      }
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const locale = currentLanguage?.startsWith('en')
      ? 'en-US'
      : currentLanguage?.startsWith('ko')
        ? 'ko-KR'
        : 'ko-KR';
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const stats = useMemo((): QuizStats => {
    const completed = quizHistory.filter((item) => item.status === 'completed');
    const totalQuizzes = quizHistory.length;
    const completedQuizzes = completed.length;
    const averageScore =
      completed.length > 0
        ? Math.round(completed.reduce((sum, item) => sum + item.score, 0) / completed.length)
        : 0;

    return {
      totalQuizzes,
      completedQuizzes,
      averageScore,
      completionRate: totalQuizzes > 0 ? Math.round((completedQuizzes / totalQuizzes) * 100) : 0,
    };
  }, [quizHistory]);

  useEffect(() => {
    if (!loading && quizHistory.length >= 0) {
      trackQuizHistoryEvents.viewHistory(
        stats.totalQuizzes,
        stats.completedQuizzes,
        stats.averageScore,
      );
    }
  }, [loading, quizHistory.length, stats]);

  useEffect(() => {
    return () => {
      const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
      if (timeSpent > 3) {
        trackQuizHistoryEvents.trackTimeSpent(timeSpent, quizHistory.length);
      }
    };
  }, [quizHistory.length]);

  const handleCreateFromEmpty = (): void => {
    trackQuizHistoryEvents.clickCreateFromEmpty();
    navigate('/');
  };

  return {
    state: {
      quizHistory,
      loading,
      explanationLoading,
      isSidebarOpen,
      stats,
    },
    actions: {
      toggleSidebar,
      setIsSidebarOpen,
      navigateToExplanation,
      navigateToQuiz,
      deleteQuizRecord,
      clearAllHistory,
      formatDate,
      handleCreateFromEmpty,
    },
  };
};
