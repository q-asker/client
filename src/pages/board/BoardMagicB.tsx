import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '#entities/auth';
import Header from '#widgets/header';
import { cn } from '@/shared/ui/lib/utils';
import { Badge } from '@/shared/ui/components/badge';
import { Button } from '@/shared/ui/components/button';
import { Skeleton } from '@/shared/ui/components/skeleton';
import { BlurFade } from '@/shared/ui/components/blur-fade';
import { MOCK_BOARD_POSTS, MOCK_BOARD_RESPONSE } from './mockBoardData';
import type { MockBoardPost } from './mockBoardData';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Eye,
  CheckCircle,
  Clock,
} from 'lucide-react';

const PAGE_SIZE = 10;

/** Slide Table — DesignB + BlurFade stagger 애니메이션 */
const BoardMagicB = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMock = searchParams.get('mock') === 'true';
  const accessToken = useAuthStore((state) => state.accessToken);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const [posts, setPosts] = useState<MockBoardPost[]>([]);
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

  const fetchPosts = useCallback(
    async (page: number) => {
      if (isMock) {
        setPosts(MOCK_BOARD_POSTS);
        setTotalPages(MOCK_BOARD_RESPONSE.totalPages);
        setTotalElements(MOCK_BOARD_RESPONSE.totalElements);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${getBaseUrl()}/boards?page=${page}&size=${PAGE_SIZE}&sort=createdAt,desc`,
          { method: 'GET', headers: { 'Content-Type': 'application/json' } },
        );
        if (!response.ok) throw new Error('데이터를 불러오는데 실패했습니다.');
        const data = await response.json();
        setPosts(data.posts || []);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
      } catch {
        setError('게시글 목록을 불러올 수 없습니다.');
      } finally {
        setLoading(false);
      }
    },
    [isMock],
  );

  useEffect(() => {
    fetchPosts(currentPage);
  }, [fetchPosts, currentPage]);

  const handleWriteClick = () => {
    if (!accessToken) {
      if (window.confirm('로그인이 필요한 서비스입니다.\n로그인 페이지로 이동하시겠습니까?')) {
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
          <BlurFade delay={0.05}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-foreground">문의 게시판</h1>
                <span className="text-sm text-muted-foreground">총 {totalElements}건</span>
              </div>
              {posts.length > 0 && (
                <Button size="sm" onClick={handleWriteClick}>
                  <Plus className="mr-1 size-3" />
                  문의하기
                </Button>
              )}
            </div>
          </BlurFade>

          {/* 에러 */}
          {error && (
            <BlurFade delay={0.1}>
              <div className="mb-4 rounded-lg border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            </BlurFade>
          )}

          {/* 빈 상태 */}
          {posts.length === 0 && !error ? (
            <BlurFade delay={0.1}>
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-muted-foreground">
                <MessageSquare className="mb-3 size-10 opacity-50" />
                <p className="mb-4 text-sm">아직 등록된 문의가 없습니다</p>
                <Button size="sm" onClick={handleWriteClick}>
                  <Plus className="mr-1 size-3" />
                  문의 작성하기
                </Button>
              </div>
            </BlurFade>
          ) : (
            <>
              {/* 테이블 헤더 */}
              <BlurFade delay={0.08}>
                <div className="flex items-center border-b-2 border-primary/30 bg-gradient-to-r from-primary/5 to-transparent px-3 py-2 text-xs font-semibold text-muted-foreground max-md:hidden">
                  <span className="w-[6%] text-center">#</span>
                  <span className="flex-1 pl-2">제목</span>
                  <span className="w-[12%] text-center">작성자</span>
                  <span className="w-[12%] text-center">작성일</span>
                  <span className="w-[8%] text-center">조회</span>
                  <span className="w-[10%] text-center">상태</span>
                </div>
              </BlurFade>

              {/* 게시글 행 */}
              {posts.map((post, index) => {
                const virtualNumber =
                  totalElements > 0
                    ? totalElements - currentPage * PAGE_SIZE - index
                    : currentPage * PAGE_SIZE + index + 1;

                return (
                  <BlurFade key={post.boardId} delay={0.1 + 0.03 * index}>
                    <div
                      className={cn(
                        'flex items-center border-b border-border px-3 py-2.5 text-sm transition-all duration-200 hover:bg-primary/5 hover:pl-4',
                        index % 2 === 0 ? 'bg-muted/20' : '',
                        'max-md:flex-col max-md:items-start max-md:gap-1.5 max-md:py-3',
                      )}
                    >
                      <span className="w-[6%] text-center text-xs text-muted-foreground max-md:hidden">
                        {virtualNumber}
                      </span>
                      <span className="flex-1 truncate pl-2 max-md:w-full max-md:pl-0">
                        <Link
                          to={`/boards/${post.boardId}`}
                          className="font-medium text-foreground no-underline transition-colors hover:text-primary"
                        >
                          {post.title}
                        </Link>
                      </span>
                      <span className="w-[12%] text-center text-xs text-muted-foreground max-md:w-full max-md:text-left">
                        {post.userName}
                      </span>
                      <span className="w-[12%] text-center text-xs text-muted-foreground max-md:hidden">
                        {formatDate(post.createdAt)}
                      </span>
                      <span className="w-[8%] text-center max-md:hidden">
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Eye className="size-3" />
                          {post.viewCount || 0}
                        </span>
                      </span>
                      <span className="w-[10%] text-center max-md:w-full max-md:text-left">
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[0.7rem]',
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
                          {post.status === 'ANSWERED' ? '답변완료' : '대기중'}
                        </Badge>
                      </span>
                    </div>
                  </BlurFade>
                );
              })}

              {/* 페이지네이션 */}
              <BlurFade delay={0.1 + 0.03 * posts.length}>
                <div className="mt-4 flex items-center justify-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={currentPage === 0}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <span className="text-xs font-medium text-muted-foreground">
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
              </BlurFade>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default BoardMagicB;
