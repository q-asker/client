import { useTranslation } from 'i18nexus';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '#entities/auth';
import Header, { extractRoleFromToken } from '#widgets/header';
import { cn } from '@/shared/ui/lib/utils';
import { Badge } from '@/shared/ui/components/badge';
import { Button } from '@/shared/ui/components/button';
import { Skeleton } from '@/shared/ui/components/skeleton';
import {
  MOCK_BOARD_POSTS,
  MOCK_BOARD_RESPONSE,
  MOCK_UPDATE_LOG_POSTS,
  MOCK_UPDATE_LOG_RESPONSE,
} from './mockBoardData';
import type { BoardCategory, BoardPost } from '../../shared/types/board';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Sparkles,
  Eye,
  CheckCircle,
  Clock,
} from 'lucide-react';

const PAGE_SIZE = 10;

interface BoardProps {
  category?: BoardCategory;
}

/** Compact Table — 밀집 테이블 뷰, 카테고리별 게시판 공유 */
const Board = ({ category = 'INQUIRY' }: BoardProps) => {
  const { t } = useTranslation('board');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMock = searchParams.get('mock') === 'true';
  const accessToken = useAuthStore((state) => state.accessToken);

  const isInquiry = category === 'INQUIRY';

  const isAdmin = useMemo(() => {
    if (isMock) return true;
    const role = extractRoleFromToken(accessToken);
    return role === 'ROLE_ADMIN';
  }, [accessToken, isMock]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const getBaseUrl = (): string => {
    const baseUrl = import.meta.env.VITE_BASE_URL || '';
    return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  };

  const formatDate = (isoString: string | null): string => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const detailPath = isInquiry ? '/boards' : '/updates';

  const fetchPosts = useCallback(
    async (page: number) => {
      if (isMock) {
        const mockPosts = isInquiry ? MOCK_BOARD_POSTS : MOCK_UPDATE_LOG_POSTS;
        const mockResponse = isInquiry ? MOCK_BOARD_RESPONSE : MOCK_UPDATE_LOG_RESPONSE;
        setPosts(mockPosts);
        setTotalPages(mockResponse.totalPages);
        setTotalElements(mockResponse.totalElements);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${getBaseUrl()}/boards?category=${category}&page=${page}&size=${PAGE_SIZE}&sort=createdAt,desc`,
          { method: 'GET', headers: { 'Content-Type': 'application/json' } },
        );
        if (!response.ok) throw new Error(t('데이터를 불러오는데 실패했습니다.'));
        const data = await response.json();
        setPosts(data.posts || []);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
      } catch {
        setError(
          isInquiry
            ? t('게시글 목록을 불러올 수 없습니다.')
            : t('변경사항 목록을 불러올 수 없습니다.'),
        );
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isMock, category],
  );

  useEffect(() => {
    fetchPosts(currentPage);
  }, [fetchPosts, currentPage]);

  const handleWriteClick = () => {
    if (!accessToken) {
      if (window.confirm(t('로그인이 필요한 서비스입니다.\n로그인 페이지로 이동하시겠습니까?'))) {
        navigate('/login');
      }
      return;
    }
    navigate('/boards/write');
  };

  if (loading) {
    return (
      <>
        <Header
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
          setIsSidebarOpen={setIsSidebarOpen}
        />

        <div className="min-h-screen bg-background p-8 max-md:p-4">
          <div className="mx-auto max-w-5xl">
            <Skeleton className="mb-4 h-10 rounded-lg" />
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="mb-1 h-12 rounded" />
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-5xl px-6 py-6 max-md:px-4">
          {/* 헤더 */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">
                {isInquiry ? t('문의 게시판') : t('변경사항')}
              </h1>
              <span className="text-base text-muted-foreground">
                {t('총')}
                {totalElements}
                {t('건')}
              </span>
            </div>
            {isInquiry && posts.length > 0 && (
              <Button size="sm" onClick={handleWriteClick}>
                <Plus className="mr-1 size-3" />
                {t('문의하기')}
              </Button>
            )}
            {!isInquiry && isAdmin && (
              <Button size="sm" onClick={() => navigate('/updates/write')}>
                <Plus className="mr-1 size-3" />
                {t('작성')}
              </Button>
            )}
          </div>

          {/* 에러 */}
          {error && (
            <div className="mb-4 rounded-lg border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* 빈 상태 */}
          {posts.length === 0 && !error ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-muted-foreground">
              {isInquiry ? (
                <>
                  <MessageSquare className="mb-3 size-10 opacity-50" />
                  <p className="mb-4 text-base">{t('아직 등록된 문의가 없습니다')}</p>
                  <Button size="sm" onClick={handleWriteClick}>
                    <Plus className="mr-1 size-3" />
                    {t('문의 작성하기')}
                  </Button>
                </>
              ) : (
                <>
                  <Sparkles className="mb-3 size-10 opacity-50" />
                  <p className="text-base">{t('아직 등록된 변경사항이 없습니다')}</p>
                </>
              )}
            </div>
          ) : (
            <>
              {/* 테이블 헤더 */}
              <div className="flex items-center border-b-2 border-border px-3 py-2.5 text-sm font-semibold text-muted-foreground max-md:hidden">
                <span className="w-[6%] text-center">#</span>
                <span className="flex-1 pl-2">{t('제목')}</span>
                {isInquiry && <span className="w-[12%] text-center">{t('작성자')}</span>}
                <span className="w-[12%] text-center">{t('작성일')}</span>
                <span className="w-[8%] text-center">{t('조회')}</span>
                {isInquiry && <span className="w-[10%] text-center">{t('상태')}</span>}
              </div>

              {/* 게시글 행 */}
              {posts.map((post, index) => {
                const virtualNumber =
                  totalElements > 0
                    ? totalElements - currentPage * PAGE_SIZE - index
                    : currentPage * PAGE_SIZE + index + 1;

                return (
                  <div
                    key={post.boardId}
                    className={cn(
                      'flex items-center border-b border-border px-3 py-3 text-base transition-colors hover:bg-muted/50',
                      'max-md:flex-col max-md:items-start max-md:gap-1.5 max-md:py-3',
                    )}
                  >
                    <span className="w-[6%] text-center text-sm text-muted-foreground max-md:hidden">
                      {virtualNumber}
                    </span>
                    <span className="flex-1 truncate pl-2 max-md:w-full max-md:pl-0">
                      <Link
                        to={`${detailPath}/${post.boardId}`}
                        className="font-medium text-foreground no-underline transition-colors hover:text-primary"
                      >
                        {post.title}
                      </Link>
                    </span>
                    {isInquiry && (
                      <span className="w-[12%] text-center text-sm text-muted-foreground max-md:w-full max-md:text-left">
                        {post.userName}
                      </span>
                    )}
                    <span className="w-[12%] text-center text-sm text-muted-foreground max-md:hidden">
                      {formatDate(post.createdAt)}
                    </span>
                    <span className="w-[8%] text-center max-md:hidden">
                      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                        <Eye className="size-3" />
                        {post.viewCount || 0}
                      </span>
                    </span>
                    {isInquiry && (
                      <span className="w-[10%] text-center max-md:w-full max-md:text-left">
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs',
                            post.status === 'ANSWERED'
                              ? 'border-emerald-300 text-emerald-700'
                              : 'border-amber-300 text-amber-700',
                          )}
                        >
                          {post.status === 'ANSWERED' ? (
                            <CheckCircle className="mr-0.5 size-2.5" />
                          ) : (
                            <Clock className="mr-0.5 size-2.5" />
                          )}
                          {post.status === 'ANSWERED' ? t('답변완료') : t('대기중')}
                        </Badge>
                      </span>
                    )}
                  </div>
                );
              })}

              {/* 페이지네이션 */}
              <div className="mt-4 flex items-center justify-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="text-sm font-medium text-muted-foreground">
                  {currentPage + 1} / {totalPages === 0 ? 1 : totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={currentPage + 1 >= totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Board;
