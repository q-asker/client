import React, { lazy, Suspense, useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '#entities/auth';
import Header from '#widgets/header';
import { cn } from '@/shared/ui/lib/utils';
import { MOCK_BOARD_RESPONSE } from './mockBoardData';

// 유지보수를 위해 페이지 사이즈를 상수로 분리
const PAGE_SIZE = 10;

/** 게시글 항목 타입 */
interface BoardPost {
  boardId: string;
  title: string;
  userName: string;
  createdAt: string;
  viewCount: number;
  status: 'ANSWERED' | 'CREATED' | string;
}

/** 게시글 목록 API 응답 타입 */
interface BoardListResponse {
  posts: BoardPost[];
  totalPages: number;
  totalElements: number;
}

const Board = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMock = searchParams.get('mock') === 'true';
  const accessToken = useAuthStore((state) => state.accessToken);
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
    const date = new Date(isoString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const fetchPosts = useCallback(
    async (page: number) => {
      setLoading(true);
      setError(null);

      /* mock 모드: API 호출 없이 로컬 데이터 사용 */
      if (isMock) {
        setPosts(MOCK_BOARD_RESPONSE.posts);
        setTotalPages(MOCK_BOARD_RESPONSE.totalPages);
        setTotalElements(MOCK_BOARD_RESPONSE.totalElements);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${getBaseUrl()}/boards?page=${page}&size=${PAGE_SIZE}&sort=createdAt,desc`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          },
        );

        if (!response.ok) throw new Error('데이터를 불러오는데 실패했습니다.');

        const data: BoardListResponse = await response.json();
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

  return (
    <div className="w-full bg-gray-50 min-h-screen">
      <Header
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <div className="p-8 w-[90%] max-w-[1200px] mx-auto md:px-8 max-md:px-0 max-md:w-full max-md:max-w-[90%]">
        {/* 헤더 섹션 */}
        <div className="flex justify-between items-center mb-8 pb-6 border-b-2 border-gray-200 max-md:flex-col max-md:items-start max-md:gap-4">
          <div>
            <h1 className="text-[2.5rem] font-extrabold text-gray-900 mb-2 max-md:text-[2rem]">
              문의 게시판
            </h1>
            <p className="text-lg text-gray-500">
              서비스 이용 중 궁금한 점이나 건의사항을 자유롭게 남겨주세요
            </p>
          </div>
          {posts.length > 0 && (
            <div>
              <button
                className="bg-gradient-to-br from-brand-gradient-from to-brand-gradient-to text-white border-none px-8 py-4 rounded-xl text-lg font-semibold cursor-pointer shadow-brand-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-brand-md"
                onClick={handleWriteClick}
              >
                문의하기
              </button>
            </div>
          )}
        </div>

        {/* 컨텐츠 래퍼 */}
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 px-8">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-brand-gradient-from rounded-full animate-spin mb-4" />
              <p>데이터를 불러오는 중...</p>
            </div>
          ) : error ? (
            <div className="text-center py-16 px-8 text-gray-500">
              <p className="text-red-500 font-medium">{error}</p>
            </div>
          ) : posts.length > 0 ? (
            <div className="p-6">
              {/* 리스트 헤더 */}
              <div className="flex py-4 border-b-2 border-gray-200 text-gray-500 font-semibold text-[0.95rem] text-center max-md:hidden">
                <span className="w-[8%]">번호</span>
                <span className="w-[45%] text-left pl-5">제목</span>
                <span className="w-[12%]">작성자</span>
                <span className="w-[15%]">작성일</span>
                <span className="w-[8%]">조회수</span>
                <span className="w-[12%]">상태</span>
              </div>

              {/* 게시글 목록 */}
              <ul className="list-none p-0 m-0">
                {posts.map((post, index) => {
                  const virtualNumber =
                    totalElements > 0
                      ? totalElements - currentPage * PAGE_SIZE - index
                      : currentPage * PAGE_SIZE + index + 1;

                  return (
                    <li
                      key={post.boardId}
                      className="flex items-center py-5 border-b border-gray-200 transition-colors duration-200 hover:bg-gray-50 last:border-b-0 max-md:flex-col max-md:items-start max-md:gap-3 max-md:p-6"
                    >
                      <span className="w-[8%] text-center text-gray-500 max-md:hidden">
                        {virtualNumber}
                      </span>
                      <span className="w-[45%] pl-5 font-medium text-left max-md:w-full max-md:p-0 max-md:text-[1.15rem] max-md:mb-1">
                        <Link
                          to={`/boards/${post.boardId}`}
                          className="no-underline text-gray-900 text-[1.05rem] transition-colors duration-200 hover:text-brand-gradient-from"
                        >
                          {post.title}
                        </Link>
                      </span>
                      <span className="w-[12%] text-center text-gray-500 font-medium max-md:w-full max-md:text-left max-md:p-0 max-md:before:content-['작성자:_'] max-md:before:text-gray-400">
                        {post.userName}
                      </span>
                      <span className="w-[15%] text-center text-gray-400 text-[0.95rem] max-md:hidden">
                        {formatDate(post.createdAt)}
                      </span>
                      <span className="w-[8%] text-center text-gray-400 text-[0.95rem] max-md:hidden">
                        {post.viewCount || 0}
                      </span>
                      <span className="w-[12%] text-center max-md:w-full max-md:text-left max-md:p-0">
                        <span
                          className={cn(
                            'px-3 py-1 rounded-md text-[0.8rem] font-semibold uppercase tracking-wider whitespace-nowrap',
                            post.status === 'ANSWERED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800',
                          )}
                        >
                          {post.status || '대기중'}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>

              {/* 페이지네이션 */}
              <div className="flex justify-center items-center mt-8 gap-4">
                <button
                  className="bg-white border border-gray-200 px-4 py-2 rounded-lg cursor-pointer text-gray-700 font-medium transition-all duration-200 hover:bg-gray-100 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  &lt; 이전
                </button>
                <span className="font-semibold text-gray-900">
                  {currentPage + 1} / {totalPages === 0 ? 1 : totalPages}
                </span>
                <button
                  className="bg-white border border-gray-200 px-4 py-2 rounded-lg cursor-pointer text-gray-700 font-medium transition-all duration-200 hover:bg-gray-100 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={currentPage + 1 >= totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  다음 &gt;
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 px-8 text-gray-500">
              <div className="text-[4rem] mb-4 opacity-70">📋</div>
              <h3 className="text-2xl font-semibold mb-2 text-gray-700">
                아직 등록된 문의가 없습니다
              </h3>
              <p className="text-lg mb-8">궁금한 점이나 건의사항을 남겨주세요!</p>
              <button
                className="bg-gradient-to-br from-brand-gradient-from to-brand-gradient-to text-white border-none px-8 py-4 rounded-xl text-lg font-semibold cursor-pointer shadow-brand-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-brand-md"
                onClick={handleWriteClick}
              >
                문의 작성하기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* 쿼리 파라미터 기반 변형 스위칭 (compare/mix 페이지용) */
const BoardMagicA = lazy(() => import('./BoardMagicA'));
const BoardMagicB = lazy(() => import('./BoardMagicB'));
const BoardDesignA = lazy(() => import('./BoardDesignA'));
const BoardDesignB = lazy(() => import('./BoardDesignB'));

const BD_VARIANTS: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  '1': BoardMagicA,
  '2': BoardMagicB,
  '3': BoardDesignA,
  '4': BoardDesignB,
};

const BoardWithVariant = () => {
  const [searchParams] = useSearchParams();
  const variant = searchParams.get('bd');
  const VariantComponent = variant ? BD_VARIANTS[variant] : null;

  if (VariantComponent) {
    return (
      <Suspense fallback={null}>
        <VariantComponent />
      </Suspense>
    );
  }
  return <Board />;
};

export default BoardWithVariant;
