import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AxiosError } from 'axios';
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
  quizType: 'MULTIPLE' | 'BLANK' | 'OX' | 'ESSAY' | 'REAL_BLANK';
  totalCount: number;
  completed: boolean;
  score: number | null;
  takenAt: string | null;
  /** 소속 폴더 식별자(hashid). 미분류면 null */
  folderId: string | null;
  /** 소속 폴더 이름. 미분류면 null */
  folderName: string | null;
}

/** 폴더 목록 항목 */
export interface FolderItem {
  folderId: string;
  name: string;
  count: number;
}

/** 폴더 목록 응답 */
interface FolderListResponse {
  folders: FolderItem[];
  unclassifiedCount: number;
}

/** 목록 필터 범위: 전체 / 미분류 / 특정 폴더(folderId) */
export type HistoryScope = 'all' | 'unclassified' | (string & {});

/** 폴더 이름 최대 길이 (spec FR-014) */
export const FOLDER_NAME_MAX = 50;
/** 사용자당 폴더 개수 상한 (spec FR-015) */
export const FOLDER_LIMIT = 100;

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
    listLoading: boolean;
    isAuthenticated: boolean;
    stats: QuizStats;
    pagination: PaginationState;
    folders: FolderItem[];
    unclassifiedCount: number;
    selectedScope: HistoryScope;
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
    selectScope: (scope: HistoryScope) => Promise<void>;
    createFolder: (name: string) => Promise<boolean>;
    renameFolder: (folderId: string, name: string) => Promise<boolean>;
    deleteFolder: (folderId: string) => Promise<void>;
    assignFolder: (historyId: string, folderId: string | null) => Promise<void>;
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
  // loading: 최초 진입 전체 스켈레톤 / listLoading: 이후 필터·페이지 전환 시 목록만 갱신
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const initialLoadedRef = useRef(false);
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 0,
    totalPages: 0,
    totalCount: 0,
    size: PAGE_SIZE,
  });
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [unclassifiedCount, setUnclassifiedCount] = useState(0);
  const [selectedScope, setSelectedScope] = useState<HistoryScope>('all');
  const scopeRef = useRef<HistoryScope>('all');
  const startTimeRef = useRef(Date.now());

  /** selectedScope → 목록 요청 파라미터(scope enum + folderId) */
  const scopeToParams = (scope: HistoryScope): { scope: string; folderId?: string } => {
    if (scope === 'all') return { scope: 'ALL' };
    if (scope === 'unclassified') return { scope: 'UNCLASSIFIED' };
    return { scope: 'FOLDER', folderId: scope };
  };

  const fetchPage = useCallback(
    async (page: number, scope: HistoryScope = scopeRef.current): Promise<void> => {
      const initial = !initialLoadedRef.current;
      if (initial) setLoading(true);
      else setListLoading(true);
      try {
        const response = await axiosInstance.get<PaginatedHistoryResponse | HistoryItem[]>(
          '/history',
          { params: { page, size: PAGE_SIZE, ...scopeToParams(scope) } },
        );
        // 하위 호환: 배열 응답(기존 API)이면 클라이언트에서 페이지네이션 처리
        if (Array.isArray(response.data)) {
          const all = response.data;
          const start = page * PAGE_SIZE;
          const sliced = all.slice(start, start + PAGE_SIZE);
          setQuizHistory(sliced);
          setPagination({
            currentPage: page,
            totalPages: Math.ceil(all.length / PAGE_SIZE),
            totalCount: all.length,
            size: PAGE_SIZE,
          });
        } else {
          setQuizHistory(response.data.content);
          setPagination({
            currentPage: response.data.currentPage,
            totalPages: response.data.totalPages,
            totalCount: response.data.totalCount,
            size: response.data.size,
          });
        }
      } catch (error) {
        console.error(t('퀴즈 기록 불러오기 실패:'), error);
      } finally {
        if (initial) {
          setLoading(false);
          initialLoadedRef.current = true;
        } else {
          setListLoading(false);
        }
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

  const fetchFolders = useCallback(async (): Promise<void> => {
    try {
      const { data } = await axiosInstance.get<FolderListResponse>('/folders');
      setFolders(data.folders);
      setUnclassifiedCount(data.unclassifiedCount);
    } catch (error) {
      console.error(t('폴더 목록 불러오기 실패:'), error);
    }
  }, [t]);

  useEffect(() => {
    if (!hasHydrated) return;
    if (isAuthenticated) {
      fetchPage(0);
      fetchFolders();
    } else {
      setLoading(false);
    }
  }, [hasHydrated]);

  const navigateToDetail = (record: HistoryItem): void => {
    if (!record.historyId) return;
    navigate(`/history/${record.historyId}`, { state: { quizType: record.quizType } });
  };

  const navigateToQuiz = (record: HistoryItem): void => {
    if (record.completed) {
      trackQuizHistoryEvents.clickRetryQuiz(
        record.problemSetId,
        '',
        record.score !== null
          ? record.quizType === 'ESSAY'
            ? record.score
            : Math.round((record.score / record.totalCount) * 100)
          : 0,
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
              (sum, item) =>
                sum +
                (item.quizType === 'ESSAY'
                  ? (item.score ?? 0)
                  : Math.round(((item.score ?? 0) / item.totalCount) * 100)),
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

  // ── 폴더 오류 코드 → 사용자 메시지 ──
  const folderErrorMessage = (error: unknown): string => {
    const code = (error as AxiosError<{ code?: string }>)?.response?.data?.code;
    switch (code) {
      case 'FOLDER_LIMIT_EXCEEDED':
        return t('폴더는 최대 100개까지 만들 수 있습니다.');
      case 'FOLDER_NAME_INVALID':
        return t('폴더 이름은 50자 이하여야 합니다.');
      case 'FOLDER_NOT_FOUND':
        return t('폴더를 찾을 수 없습니다.');
      case 'QUIZ_HISTORY_NOT_FOUND':
        return t('기록을 찾을 수 없습니다.');
      default:
        return t('요청을 처리하지 못했습니다.');
    }
  };

  const selectScope = async (scope: HistoryScope): Promise<void> => {
    scopeRef.current = scope;
    setSelectedScope(scope);
    await fetchPage(0, scope);
  };

  const createFolder = async (name: string): Promise<boolean> => {
    const trimmed = name.trim();
    if (!trimmed) {
      CustomToast.error(t('폴더 이름을 입력해주세요.'));
      return false;
    }
    if (trimmed.length > FOLDER_NAME_MAX) {
      CustomToast.error(t('폴더 이름은 50자 이하여야 합니다.'));
      return false;
    }
    if (folders.length >= FOLDER_LIMIT) {
      CustomToast.error(t('폴더는 최대 100개까지 만들 수 있습니다.'));
      return false;
    }
    try {
      const { data } = await axiosInstance.post<{ folderId: string; name: string }>('/folders', {
        name: trimmed,
      });
      setFolders((prev) => [...prev, { folderId: data.folderId, name: data.name, count: 0 }]);
      CustomToast.success(t('폴더가 생성되었습니다.'));
      return true;
    } catch (error) {
      CustomToast.error(folderErrorMessage(error));
      return false;
    }
  };

  const renameFolder = async (folderId: string, name: string): Promise<boolean> => {
    const trimmed = name.trim();
    if (!trimmed) {
      CustomToast.error(t('폴더 이름을 입력해주세요.'));
      return false;
    }
    if (trimmed.length > FOLDER_NAME_MAX) {
      CustomToast.error(t('폴더 이름은 50자 이하여야 합니다.'));
      return false;
    }
    const prevFolders = folders;
    const prevHistory = quizHistory;
    // 낙관적: 폴더명 + 소속 기록 배지 갱신
    setFolders((prev) => prev.map((f) => (f.folderId === folderId ? { ...f, name: trimmed } : f)));
    setQuizHistory((prev) =>
      prev.map((h) => (h.folderId === folderId ? { ...h, folderName: trimmed } : h)),
    );
    try {
      await axiosInstance.patch(`/folders/${folderId}`, { name: trimmed });
      CustomToast.success(t('폴더 이름이 변경되었습니다.'));
      return true;
    } catch (error) {
      setFolders(prevFolders);
      setQuizHistory(prevHistory);
      CustomToast.error(folderErrorMessage(error));
      return false;
    }
  };

  const deleteFolder = async (folderId: string): Promise<void> => {
    if (!window.confirm(t('이 폴더를 삭제할까요? 안의 기록은 미분류로 이동합니다.'))) return;
    const prevFolders = folders;
    const prevHistory = quizHistory;
    const prevUnclassified = unclassifiedCount;
    const removed = folders.find((f) => f.folderId === folderId);
    const wasFiltered = scopeRef.current === folderId;
    // 낙관적: 폴더 제거 + 소속 기록 미분류화 + 미분류 카운트 증가
    setFolders((prev) => prev.filter((f) => f.folderId !== folderId));
    setQuizHistory((prev) =>
      prev.map((h) => (h.folderId === folderId ? { ...h, folderId: null, folderName: null } : h)),
    );
    if (removed) setUnclassifiedCount((c) => c + removed.count);
    // 현재 그 폴더로 필터 중이면 전체로 전환
    if (wasFiltered) {
      scopeRef.current = 'all';
      setSelectedScope('all');
    }
    try {
      await axiosInstance.delete(`/folders/${folderId}`);
      CustomToast.success(t('폴더가 삭제되었습니다.'));
      if (wasFiltered) await fetchPage(0, 'all');
    } catch (error) {
      setFolders(prevFolders);
      setQuizHistory(prevHistory);
      setUnclassifiedCount(prevUnclassified);
      if (wasFiltered) {
        scopeRef.current = folderId;
        setSelectedScope(folderId);
      }
      CustomToast.error(folderErrorMessage(error));
    }
  };

  const assignFolder = async (historyId: string, folderId: string | null): Promise<void> => {
    const record = quizHistory.find((h) => h.historyId === historyId);
    if (!record) return;
    const from = record.folderId; // 이전 소속
    if (from === folderId) return; // 멱등: 변화 없음
    const target = folderId ? folders.find((f) => f.folderId === folderId) : null;
    const prevHistory = quizHistory;
    const prevFolders = folders;
    const prevUnclassified = unclassifiedCount;

    // 낙관적 목록 갱신: 현재 필터 범위를 벗어나면 행 제거, 아니면 소속 갱신
    const scope = scopeRef.current;
    const leavesScope =
      (scope === 'unclassified' && folderId !== null) ||
      (scope !== 'all' && scope !== 'unclassified' && scope !== folderId);
    setQuizHistory((prev) =>
      leavesScope
        ? prev.filter((h) => h.historyId !== historyId)
        : prev.map((h) =>
            h.historyId === historyId
              ? { ...h, folderId, folderName: target ? target.name : null }
              : h,
          ),
    );
    // 낙관적 카운트 보정
    setFolders((prev) =>
      prev.map((f) => {
        if (f.folderId === from) return { ...f, count: Math.max(0, f.count - 1) };
        if (f.folderId === folderId) return { ...f, count: f.count + 1 };
        return f;
      }),
    );
    if (from === null) setUnclassifiedCount((c) => Math.max(0, c - 1));
    if (folderId === null) setUnclassifiedCount((c) => c + 1);

    try {
      await axiosInstance.patch(`/history/${historyId}/folder`, { folderId });
      CustomToast.success(folderId ? t('폴더로 이동했습니다.') : t('미분류로 이동했습니다.'));
    } catch (error) {
      setQuizHistory(prevHistory);
      setFolders(prevFolders);
      setUnclassifiedCount(prevUnclassified);
      CustomToast.error(folderErrorMessage(error));
    }
  };

  return {
    state: {
      quizHistory,
      loading,
      listLoading,
      isAuthenticated,
      stats,
      pagination,
      folders,
      unclassifiedCount,
      selectedScope,
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
      selectScope,
      createFolder,
      renameFolder,
      deleteFolder,
      assignFolder,
    },
  };
};
