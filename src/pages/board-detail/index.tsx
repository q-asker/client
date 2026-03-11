import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CustomToast from '#shared/toast';
import { useAuthStore, authService } from '#entities/auth';
import axiosInstance from '#shared/api';
import { useTranslation } from 'i18nexus';
import Header, { extractRoleFromToken } from '#widgets/header';
import { cn } from '@/shared/ui/lib/utils';

/** 댓글을 포함한 게시글 상세 타입 */
interface BoardDetailPost {
  boardId: string;
  title: string;
  content: string;
  username: string;
  createdAt: string;
  viewCount: number;
  status: string;
  replies: string[];
  isWriter: boolean;
}

const BoardDetail = () => {
  const { t } = useTranslation();
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const [post, setPost] = useState<BoardDetailPost | null>(null);
  const [loading, setLoading] = useState(true);

  const [replyContent, setReplyContent] = useState('');
  const { accessToken, clearAuth } = useAuthStore();

  const isAdmin = useMemo(() => {
    const role = extractRoleFromToken(accessToken);
    return role === 'ROLE_ADMIN';
  }, [accessToken]);

  const formatDate = (isoString: string | null): string => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const fetchPost = useCallback(async () => {
    try {
      await authService.refresh();
    } catch {
      /* 무시 */
    }

    try {
      const response = await axiosInstance.get(`/boards/${boardId}`);
      setPost(response.data);
    } catch (error: unknown) {
      const err = error as { response?: { status?: number } };
      if (err.response?.status === 401) {
        clearAuth();

        try {
          const fallbackResponse = await axiosInstance.get(`/boards/${boardId}`, {
            skipAuthRefresh: true,
          } as Record<string, unknown>);
          setPost(fallbackResponse.data);
        } catch {
          CustomToast.error(t('게시글을 불러올 권한이 없거나 삭제된 게시글입니다.'));
          navigate('/boards');
        }
      } else {
        CustomToast.error(t('서버와 통신 중 문제가 발생했습니다.'));
        navigate('/boards');
      }
    } finally {
      setLoading(false);
    }
  }, [boardId, navigate, clearAuth]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const handleDelete = async () => {
    if (!window.confirm('정말로 이 게시글을 삭제하시겠습니까?')) return;

    try {
      await axiosInstance.delete(`/boards/${boardId}`);
      CustomToast.success(t('게시글이 삭제되었습니다.'));
      navigate('/boards', { replace: true });
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: { message?: string } } };
      if (err.response?.status === 401) {
        CustomToast.error(t('다시 로그인해주세요.'));
        clearAuth();
        navigate('/login', { replace: true });
      } else if (err.response?.status === 403) {
        const errorMessage =
          err.response.data?.message ||
          '삭제 권한이 없거나 이미 답변이 달린 글은 삭제할 수 없습니다.';
        CustomToast.error(t(errorMessage));
      } else {
        CustomToast.error(t('게시글 삭제 중 오류가 발생했습니다.'));
      }
    }
  };

  const handleEdit = () => {
    navigate(`/boards/edit/${boardId}`);
  };

  const handleReplySubmit = async () => {
    if (!replyContent.trim()) {
      CustomToast.error(t('글 내용을 입력해주세요.'));
      return;
    }

    try {
      await axiosInstance.post(`/boards/${boardId}/replies`, { content: replyContent });
      CustomToast.success(t('댓글이 등록되었습니다.'));
      setReplyContent('');
      fetchPost();
    } catch (error: unknown) {
      const err = error as { response?: { status?: number } };
      if (err.response?.status === 403) {
        CustomToast.error(t('댓글을 작성할 권한이 없습니다.'));
      } else {
        CustomToast.error(t('댓글 등록 중 오류가 발생했습니다.'));
      }
    }
  };

  if (loading) return <div className="text-center p-24 text-gray-500 text-lg">로딩 중...</div>;
  if (!post) return null;

  return (
    <div className="w-full bg-gray-50 min-h-screen flex flex-col">
      <Header
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <div className="w-full max-w-[800px] mx-auto mt-10 px-5 box-border max-md:mt-5 max-md:px-4">
        {/* 게시글 카드 */}
        <div className="bg-white rounded-2xl p-10 shadow-card mb-6 box-border max-md:px-5 max-md:py-6">
          <div className="border-b border-gray-200 pb-5 mb-8">
            <div className="text-indigo-500 font-semibold text-sm mb-2">문의 게시판</div>
            <h1 className="text-[1.75rem] text-gray-900 font-extrabold leading-tight mb-4 max-md:text-[1.4rem]">
              {post.title}
            </h1>
            <div className="text-[0.95rem] text-gray-500 flex items-center flex-wrap gap-3 max-md:text-[0.85rem] max-md:gap-2">
              <span>{post.username}</span>
              <span className="text-gray-200 max-md:hidden">|</span>
              <span>{formatDate(post.createdAt)}</span>
              <span className="text-gray-200 max-md:hidden">|</span>
              <span>조회수 {post.viewCount || 0}</span>
            </div>
          </div>

          <div className="min-h-[200px] text-gray-700 leading-[1.8] text-[1.05rem] whitespace-pre-wrap">
            {post.content}
          </div>
        </div>

        {/* 댓글 섹션 */}
        <div className="mt-8 mb-10">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            댓글 <span className="text-indigo-500 text-lg">{post.replies?.length || 0}</span>
          </h3>
          <div className="flex flex-col gap-4">
            {post.replies && post.replies.length > 0 ? (
              post.replies.map((reply, index) => (
                <div
                  key={index}
                  className="relative bg-white border border-gray-200 rounded-2xl p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] before:content-['↳'] before:absolute before:-left-5 before:top-[18px] before:text-gray-300 before:text-xl before:font-bold"
                >
                  <div className="text-gray-600 leading-relaxed text-[0.95rem] whitespace-pre-wrap">
                    {reply}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-300 text-[0.95rem]">
                아직 등록된 댓글이 없습니다.
              </div>
            )}
          </div>

          {/* 관리자 답변 폼 */}
          {isAdmin && (
            <div className="mt-6 bg-slate-50 border border-gray-200 rounded-2xl p-6 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
              <h4 className="m-0 mb-4 text-lg font-bold text-gray-700 flex items-center gap-2 before:content-['🛡️'] before:text-xl">
                관리자 답변 작성
              </h4>
              <textarea
                className="w-full p-4 rounded-xl border border-gray-300 text-[0.95rem] font-[inherit] leading-relaxed text-gray-800 resize-y box-border transition-[border-color,box-shadow] duration-200 bg-white focus:outline-none focus:border-brand focus:shadow-focus-ring"
                value={replyContent}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setReplyContent(e.target.value)
                }
                placeholder="사용자 문의에 대한 답변 내용을 입력하세요."
                rows={4}
              />
              <div className="flex justify-end mt-4">
                <button
                  className="px-7 py-3 bg-indigo-500 text-white border-none rounded-xl font-semibold text-[0.95rem] cursor-pointer transition-all duration-200 hover:bg-indigo-600 hover:-translate-y-0.5 hover:shadow-brand-sm active:translate-y-0"
                  onClick={handleReplySubmit}
                >
                  답변 등록
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 하단 액션 버튼 */}
        <div className="flex justify-between items-center mt-8 pb-10 gap-4 flex-wrap max-md:flex-col max-md:gap-3">
          <div className="flex gap-3 max-md:w-full max-md:justify-between">
            <button
              className="px-6 py-3 rounded-xl font-semibold text-[0.95rem] cursor-pointer border border-gray-200 bg-white text-gray-600 transition-all duration-200 hover:bg-gray-100 whitespace-nowrap text-center max-md:flex-1 max-md:px-0"
              onClick={() => navigate('/boards')}
            >
              목록으로
            </button>
            <button
              className="px-6 py-3 rounded-xl font-semibold text-[0.95rem] cursor-pointer border border-indigo-500 bg-white text-indigo-500 transition-all duration-200 hover:bg-indigo-50 whitespace-nowrap text-center max-md:flex-1 max-md:px-0"
              onClick={() => navigate('/boards/write')}
            >
              새 문의하기
            </button>
          </div>

          {post.isWriter && (
            <div className="flex gap-3 max-md:w-full max-md:justify-between">
              <button
                className="px-6 py-3 rounded-xl font-semibold text-[0.95rem] cursor-pointer border-none bg-blue-500 text-white transition-all duration-200 hover:bg-blue-600 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(59,130,246,0.3)] whitespace-nowrap text-center max-md:flex-1 max-md:px-0"
                onClick={handleEdit}
              >
                수정하기
              </button>
              <button
                className="px-6 py-3 rounded-xl font-semibold text-[0.95rem] cursor-pointer border-none bg-red-500 text-white transition-all duration-200 hover:bg-red-600 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(239,68,68,0.3)] whitespace-nowrap text-center max-md:flex-1 max-md:px-0"
                onClick={handleDelete}
              >
                삭제하기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BoardDetail;
