import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '#entities/auth';
import Header from '#widgets/header';
import { cn } from '@/shared/ui/lib/utils';
import { Card, CardContent } from '@/shared/ui/components/card';
import { Badge } from '@/shared/ui/components/badge';
import { Button } from '@/shared/ui/components/button';
import { Skeleton } from '@/shared/ui/components/skeleton';
import { BlurFade } from '@/shared/ui/components/blur-fade';
import { MOCK_BOARD_POSTS, MOCK_BOARD_RESPONSE } from './mockBoardData';
import type { MockBoardPost } from './mockBoardData';
import {
  FileText,
  User,
  Calendar,
  Eye,
  Plus,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  CheckCircle,
  Clock,
} from 'lucide-react';

const PAGE_SIZE = 10;

/** Stagger Cards — DesignA + BlurFade stagger 애니메이션 */
const BoardMagicA = () => {
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
          <div className="mx-auto max-w-4xl space-y-4">
            <Skeleton className="h-16 rounded-xl" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
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
        <div className="mx-auto max-w-4xl px-6 py-8 max-md:px-4">
          {/* 헤더 */}
          <BlurFade delay={0.05}>
            <div className="mb-8 flex items-end justify-between max-md:flex-col max-md:items-start max-md:gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">문의 게시판</h1>
                <p className="mt-1 text-muted-foreground">
                  서비스 이용 중 궁금한 점이나 건의사항을 자유롭게 남겨주세요
                </p>
              </div>
              {posts.length > 0 && (
                <Button onClick={handleWriteClick}>
                  <Plus className="mr-1 size-4" />
                  문의하기
                </Button>
              )}
            </div>
          </BlurFade>

          {/* 에러 */}
          {error && (
            <BlurFade delay={0.1}>
              <Card className="mb-6 border-destructive">
                <CardContent className="pt-6 text-center text-destructive">{error}</CardContent>
              </Card>
            </BlurFade>
          )}

          {/* 게시글 목록 */}
          {posts.length === 0 && !error ? (
            <BlurFade delay={0.15}>
              <Card className="py-16 text-center">
                <CardContent>
                  <MessageSquare className="mx-auto mb-4 size-12 text-muted-foreground opacity-50" />
                  <h3 className="mb-2 text-xl font-semibold text-foreground">
                    아직 등록된 문의가 없습니다
                  </h3>
                  <p className="mb-6 text-muted-foreground">궁금한 점이나 건의사항을 남겨주세요!</p>
                  <Button onClick={handleWriteClick}>
                    <Plus className="mr-1 size-4" />
                    문의 작성하기
                  </Button>
                </CardContent>
              </Card>
            </BlurFade>
          ) : (
            <>
              <div className="flex flex-col gap-3">
                {posts.map((post, index) => {
                  const virtualNumber =
                    totalElements > 0
                      ? totalElements - currentPage * PAGE_SIZE - index
                      : currentPage * PAGE_SIZE + index + 1;

                  return (
                    <BlurFade key={post.boardId} delay={0.1 + 0.05 * index}>
                      <Card className="border-l-4 border-l-primary/30 bg-gradient-to-r from-primary/[0.02] to-transparent transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10">
                        <CardContent className="flex items-center gap-4 py-4 max-md:flex-col max-md:items-start">
                          {/* 번호 */}
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 text-sm font-bold text-primary max-md:hidden">
                            {virtualNumber}
                          </div>

                          {/* 제목 + 메타 */}
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <FileText className="size-4 shrink-0 text-muted-foreground" />
                              <Link
                                to={`/boards/${post.boardId}`}
                                className="truncate font-medium text-foreground no-underline transition-colors hover:text-primary"
                              >
                                {post.title}
                              </Link>
                            </div>
                            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <User className="size-3" />
                                {post.userName}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="size-3" />
                                {formatDate(post.createdAt)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye className="size-3" />
                                {post.viewCount || 0}
                              </span>
                            </div>
                          </div>

                          {/* 상태 배지 */}
                          <Badge
                            variant={post.status === 'ANSWERED' ? 'default' : 'secondary'}
                            className={cn(
                              'shrink-0',
                              post.status === 'ANSWERED'
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100'
                                : 'bg-amber-100 text-amber-800 hover:bg-amber-100',
                            )}
                          >
                            {post.status === 'ANSWERED' ? (
                              <CheckCircle className="mr-1 size-3" />
                            ) : (
                              <Clock className="mr-1 size-3" />
                            )}
                            {post.status === 'ANSWERED' ? '답변완료' : '대기중'}
                          </Badge>
                        </CardContent>
                      </Card>
                    </BlurFade>
                  );
                })}
              </div>

              {/* 페이지네이션 */}
              <BlurFade delay={0.1 + 0.05 * posts.length}>
                <div className="mt-8 flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 0}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    <ChevronLeft className="mr-1 size-4" />
                    이전
                  </Button>
                  <span className="text-sm font-semibold text-foreground">
                    {currentPage + 1} / {totalPages === 0 ? 1 : totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage + 1 >= totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    다음
                    <ChevronRight className="ml-1 size-4" />
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

export default BoardMagicA;
