import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axiosInstance from '#shared/api';
import type { BoardPost } from '../../../shared/types/board';
import { MOCK_UPDATE_LOG_POSTS } from '../../../pages/board/mockBoardData';

/** 미리보기용 최대 표시 건수 */
const PREVIEW_SIZE = 3;

interface UseRecentChangesReturn {
  state: {
    posts: BoardPost[];
    isLoading: boolean;
  };
  actions: {
    formatDate: (isoString: string) => string;
  };
}

const formatDate = (isoString: string): string => {
  if (!isoString) return '-';
  return new Date(isoString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export const useRecentChanges = (): UseRecentChangesReturn => {
  const [searchParams] = useSearchParams();
  const isMock = searchParams.get('mock') === 'true';
  const [posts, setPosts] = useState<BoardPost[]>(
    isMock ? MOCK_UPDATE_LOG_POSTS.slice(0, PREVIEW_SIZE) : [],
  );
  const [isLoading, setIsLoading] = useState(!isMock);

  useEffect(() => {
    if (isMock) return;

    const fetchPosts = async () => {
      try {
        const res = await axiosInstance.get(
          `/boards?category=UPDATE_LOG&page=0&size=${PREVIEW_SIZE}&sort=createdAt,desc`,
          { skipErrorToast: true } as Record<string, unknown>,
        );
        setPosts(res.data.posts || []);
      } catch {
        // 실패 시 빈 목록 유지
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [isMock]);

  return {
    state: { posts, isLoading },
    actions: { formatDate },
  };
};
