import { useTranslation } from 'i18nexus';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '#entities/auth';
import Header, { extractRoleFromToken } from '#widgets/header';
import { cn } from '@/shared/ui/lib/utils';
import { Badge } from '@/shared/ui/components/badge';
import { Button } from '@/shared/ui/components/button';
import { Skeleton } from '@/shared/ui/components/skeleton';
import type { BoardCategory, BoardListResponse, BoardPost } from '../../shared/types/board';
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

/** ?mock=true 모드에서 사용하는 게시판 목록 mock 데이터 */
const MOCK_BOARD_POSTS: BoardPost[] = [
  {
    boardId: 'mock-bd-001',
    title: '퀴즈 생성 시 PDF 파일이 업로드되지 않습니다',
    userName: '김철수',
    createdAt: '2026-03-12T14:30:00.000Z',
    viewCount: 42,
    status: 'ANSWERED',
    category: 'INQUIRY',
  },
  {
    boardId: 'mock-bd-002',
    title: '영어 퀴즈 생성 시 한국어로 출제되는 문제',
    userName: '이영희',
    createdAt: '2026-03-12T10:15:00.000Z',
    viewCount: 28,
    status: 'CREATED',
    category: 'INQUIRY',
  },
  {
    boardId: 'mock-bd-003',
    title: '퀴즈 결과 페이지에서 점수가 표시되지 않아요',
    userName: '박지민',
    createdAt: '2026-03-11T16:45:00.000Z',
    viewCount: 15,
    status: 'ANSWERED',
    category: 'INQUIRY',
  },
  {
    boardId: 'mock-bd-004',
    title: '히스토리 삭제가 안 됩니다',
    userName: '최민수',
    createdAt: '2026-03-11T09:00:00.000Z',
    viewCount: 7,
    status: 'CREATED',
    category: 'INQUIRY',
  },
  {
    boardId: 'mock-bd-005',
    title: '모바일에서 퀴즈 풀기 화면이 깨져요',
    userName: '정수연',
    createdAt: '2026-03-10T20:30:00.000Z',
    viewCount: 53,
    status: 'ANSWERED',
    category: 'INQUIRY',
  },
  {
    boardId: 'mock-bd-006',
    title: 'PPT 파일 지원 문의드립니다',
    userName: '한지원',
    createdAt: '2026-03-10T11:00:00.000Z',
    viewCount: 19,
    status: 'CREATED',
    category: 'INQUIRY',
  },
];

const MOCK_UPDATE_LOG_POSTS: BoardPost[] = [
  {
    boardId: 'mock-ul-001',
    title: '퀴즈 해설 페이지 UI 개선 및 레이아웃 최적화',
    userName: '운영팀',
    createdAt: '2026-03-13T09:00:00.000Z',
    viewCount: 128,
    status: null,
    category: 'UPDATE_LOG',
  },
  {
    boardId: 'mock-ul-002',
    title: '문의 게시판 답변 알림 기능 추가 및 이메일 발송',
    userName: '운영팀',
    createdAt: '2026-03-12T14:30:00.000Z',
    viewCount: 95,
    status: null,
    category: 'UPDATE_LOG',
  },
  {
    boardId: 'mock-ul-003',
    title: 'PDF 업로드 속도 최적화 및 파일 용량 압축',
    userName: '운영팀',
    createdAt: '2026-03-11T11:00:00.000Z',
    viewCount: 203,
    status: null,
    category: 'UPDATE_LOG',
  },
  {
    boardId: 'mock-ul-004',
    title: '퀴즈 기록 통계 차트 추가 및 분석 기능 개선',
    userName: '운영팀',
    createdAt: '2026-03-10T16:00:00.000Z',
    viewCount: 67,
    status: null,
    category: 'UPDATE_LOG',
  },
  {
    boardId: 'mock-ul-005',
    title: '다크 모드 지원 시작 (베타) 및 전체 테마 통일',
    userName: '운영팀',
    createdAt: '2026-03-09T10:00:00.000Z',
    viewCount: 312,
    status: null,
    category: 'UPDATE_LOG',
  },
  {
    boardId: 'mock-ul-006',
    title: 'Safari 대용량 PDF Range 분할 다운로드 최적화',
    userName: '운영팀',
    createdAt: '2026-03-08T15:00:00.000Z',
    viewCount: 41,
    status: null,
    category: 'UPDATE_LOG',
  },
];

const MOCK_BOARD_RESPONSE: BoardListResponse = {
  posts: MOCK_BOARD_POSTS,
  totalPages: 2,
  totalElements: 16,
};

const MOCK_UPDATE_LOG_RESPONSE: BoardListResponse = {
  posts: MOCK_UPDATE_LOG_POSTS,
  totalPages: 2,
  totalElements: 16,
};

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
        <Header />

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
      <Header />

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
