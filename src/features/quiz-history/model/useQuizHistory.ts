import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axiosInstance from '#shared/api';
import CustomToast from '#shared/toast';
import { trackQuizHistoryEvents } from '#shared/lib/analytics';
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

/** 페이지네이션 응답 */
interface PaginatedHistoryResponse {
  content: HistoryItem[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  size: number;
}

/** 퀴즈 통계 */
interface QuizStats {
  totalQuizzes: number;
  completedQuizzes: number;
  averageScore: number;
  completionRate: number;
}

/** 페이지네이션 상태 */
interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  size: number;
}

/** 페이지 크기 */
const PAGE_SIZE = 20;

interface UseQuizHistoryParams {
  t: (key: string) => string;
  navigate: (to: string, options?: { state?: unknown; replace?: boolean }) => void;
  currentLanguage: string;
}

interface UseQuizHistoryReturn {
  state: {
    quizHistory: HistoryItem[];
    loading: boolean;
    isAuthenticated: boolean;
    stats: QuizStats;
    pagination: PaginationState;
  };
  actions: {
    navigateToDetail: (record: HistoryItem) => void;
    navigateToQuiz: (record: HistoryItem) => void;
    deleteQuizRecord: (problemSetId: string) => Promise<void>;
    changeTitle: (problemSetId: string, newTitle: string) => Promise<void>;
    clearAllHistory: () => Promise<void>;
    formatDate: (dateString: string) => string;
    handleCreateFromEmpty: () => void;
    goToPage: (page: number) => Promise<void>;
  };
}

// ── 퀴즈 기록 훅 ──

export const useQuizHistory = ({
  t,
  navigate,
  currentLanguage,
}: UseQuizHistoryParams): UseQuizHistoryReturn => {
  const { accessToken, hasHydrated } = useAuthStore();
  const isAuthenticated = !!accessToken;
  const [quizHistory, setQuizHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 0,
    totalPages: 0,
    totalCount: 0,
    size: PAGE_SIZE,
  });
  const startTimeRef = useRef(Date.now());

  const fetchPage = useCallback(
    async (page: number): Promise<void> => {
      setLoading(true);
      try {
        const response = await axiosInstance.get<PaginatedHistoryResponse>('/history', {
          params: { page, size: PAGE_SIZE },
        });
        setQuizHistory(response.data.content);
        setPagination({
          currentPage: response.data.currentPage,
          totalPages: response.data.totalPages,
          totalCount: response.data.totalCount,
          size: response.data.size,
        });
      } catch (error) {
        console.error(t('퀴즈 기록 불러오기 실패:'), error);
      } finally {
        setLoading(false);
      }
    },
    [t],
  );

  const goToPage = useCallback(
    async (page: number): Promise<void> => {
      if (page < 0 || page >= pagination.totalPages) return;
      await fetchPage(page);
    },
    [fetchPage, pagination.totalPages],
  );

  useEffect(() => {
    if (!hasHydrated) return;
    if (isAuthenticated) {
      fetchPage(0);
    } else {
      setLoading(false);
    }
  }, [hasHydrated]);

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
      // 현재 페이지가 비면 이전 페이지로, 아니면 현재 페이지 새로고침
      const pageAfterDelete =
        quizHistory.length <= 1 && pagination.currentPage > 0
          ? pagination.currentPage - 1
          : pagination.currentPage;
      await fetchPage(pageAfterDelete);
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
      setPagination({ currentPage: 0, totalPages: 0, totalCount: 0, size: PAGE_SIZE });
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
    // 전체 퀴즈 수는 서버의 totalCount 사용 (현재 페이지 데이터가 아닌 전체 기준)
    const totalQuizzes = pagination.totalCount || quizHistory.length;
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
      isAuthenticated,
      stats,
      pagination,
    },
    actions: {
      navigateToDetail,
      navigateToQuiz,
      deleteQuizRecord,
      changeTitle,
      clearAllHistory,
      formatDate,
      handleCreateFromEmpty,
      goToPage,
    },
  };
};
