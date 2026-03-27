import { useEffect, useMemo, useRef, useState } from 'react';
import axiosInstance from '#shared/api';
import CustomToast from '#shared/toast';
import { trackQuizHistoryEvents } from '#shared/lib/analytics';
import { useClickOutside } from '#shared/lib/useClickOutside';
import { useAuthStore } from '#entities/auth';

// ── 타입 정의 ──

/** 서버 히스토리 응답 항목 */
export interface HistoryItem {
  problemSetId: string;
  title: string;
  createdAt: string;
  historyId: string | null;
  quizType: 'MULTIPLE' | 'BLANK' | 'OX';
  totalCount: number;
  completed: boolean;
  score: number | null;
  takenAt: string | null;
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
    quizHistory: HistoryItem[];
    loading: boolean;
    isSidebarOpen: boolean;
    isAuthenticated: boolean;
    stats: QuizStats;
  };
  actions: {
    toggleSidebar: () => void;
    setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
    navigateToDetail: (record: HistoryItem) => void;
    navigateToQuiz: (record: HistoryItem) => void;
    deleteQuizRecord: (problemSetId: string) => Promise<void>;
    changeTitle: (problemSetId: string, newTitle: string) => Promise<void>;
    clearAllHistory: () => Promise<void>;
    formatDate: (dateString: string) => string;
    handleCreateFromEmpty: () => void;
  };
}

// ── 퀴즈 기록 훅 ──

export const useQuizHistory = ({
  t,
  navigate,
  currentLanguage,
}: UseQuizHistoryParams): UseQuizHistoryReturn => {
  const { accessToken } = useAuthStore();
  const isAuthenticated = !!accessToken;
  const [quizHistory, setQuizHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(isAuthenticated);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const startTimeRef = useRef(Date.now());

  const loadQuizHistory = async (): Promise<void> => {
    try {
      const response = await axiosInstance.get<HistoryItem[]>('/history');
      setQuizHistory(response.data);
    } catch (error) {
      console.error(t('퀴즈 기록 불러오기 실패:'), error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = (): void => setIsSidebarOpen((prev) => !prev);

  useEffect(() => {
    if (isAuthenticated) {
      loadQuizHistory();
    }
  }, []);

  useClickOutside({
    containerId: 'sidebar',
    triggerId: 'menuButton',
    onOutsideClick: () => setIsSidebarOpen(false),
  });

  const navigateToDetail = (record: HistoryItem): void => {
    if (!record.historyId) return;
    navigate(`/history/${record.historyId}`);
  };

  const navigateToQuiz = (record: HistoryItem): void => {
    if (record.completed) {
      trackQuizHistoryEvents.clickRetryQuiz(
        record.problemSetId,
        '',
        record.score !== null ? Math.round((record.score / record.totalCount) * 100) : 0,
      );
    } else {
      trackQuizHistoryEvents.clickResumeQuiz(record.problemSetId, '', record.totalCount);
    }
    navigate(`/quiz/${record.problemSetId}`);
  };

  const changeTitle = async (problemSetId: string, newTitle: string): Promise<void> => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    if (trimmed.length > 100) {
      CustomToast.error(t('제목은 100자 이하여야 합니다.'));
      return;
    }

    const item = quizHistory.find((h) => h.problemSetId === problemSetId);
    if (!item?.historyId) return;

    try {
      await axiosInstance.patch(`/history/${item.historyId}/title`, { title: trimmed });
      setQuizHistory((prev) =>
        prev.map((item) =>
          item.problemSetId === problemSetId ? { ...item, title: trimmed } : item,
        ),
      );
      CustomToast.success(t('제목이 변경되었습니다.'));
    } catch (error) {
      console.error(t('제목 변경 실패:'), error);
    }
  };

  const deleteQuizRecord = async (problemSetId: string): Promise<void> => {
    if (!window.confirm(t('이 기록을 삭제하시겠습니까?'))) return;

    const record = quizHistory.find((item) => item.problemSetId === problemSetId);
    if (!record?.historyId) return;
    trackQuizHistoryEvents.deleteQuizRecord(
      problemSetId,
      record?.completed ? 'completed' : 'in-progress',
      '',
    );

    try {
      await axiosInstance.delete(`/history/${record.historyId}`);
      setQuizHistory((prev) => prev.filter((item) => item.problemSetId !== problemSetId));
      CustomToast.success(t('기록이 삭제되었습니다.'));
    } catch (error) {
      console.error(t('기록 삭제 실패:'), error);
    }
  };

  const clearAllHistory = async (): Promise<void> => {
    if (!window.confirm(t('모든 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.'))) return;

    trackQuizHistoryEvents.clearAllHistory(quizHistory.length, quizHistory.length);

    try {
      await axiosInstance.delete('/history/all');
      setQuizHistory([]);
      CustomToast.success(t('모든 기록이 삭제되었습니다.'));
    } catch (error) {
      console.error(t('전체 기록 삭제 실패:'), error);
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
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const stats = useMemo((): QuizStats => {
    const completed = quizHistory.filter((item) => item.completed);
    const totalQuizzes = quizHistory.length;
    const completedQuizzes = completed.length;
    const scoredQuizzes = completed.filter((item) => item.score !== null);
    const averageScore =
      scoredQuizzes.length > 0
        ? Math.round(
            scoredQuizzes.reduce(
              (sum, item) => sum + Math.round(((item.score ?? 0) / item.totalCount) * 100),
              0,
            ) / scoredQuizzes.length,
          )
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
      isSidebarOpen,
      isAuthenticated,
      stats,
    },
    actions: {
      toggleSidebar,
      setIsSidebarOpen,
      navigateToDetail,
      navigateToQuiz,
      deleteQuizRecord,
      changeTitle,
      clearAllHistory,
      formatDate,
      handleCreateFromEmpty,
    },
  };
};
