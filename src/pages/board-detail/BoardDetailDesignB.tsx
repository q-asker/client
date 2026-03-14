import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import CustomToast from '#shared/toast';
import { useAuthStore, authService } from '#entities/auth';
import axiosInstance from '#shared/api';
import { useTranslation } from 'i18nexus';
import Header, { extractRoleFromToken } from '#widgets/header';
import { cn } from '@/shared/ui/lib/utils';
import { Card, CardContent } from '@/shared/ui/components/card';
import { Badge } from '@/shared/ui/components/badge';
import { Button } from '@/shared/ui/components/button';
import { Skeleton } from '@/shared/ui/components/skeleton';
import { MOCK_BOARD_DETAIL } from './mockBoardDetailData';
import type { MockBoardDetailPost } from './mockBoardDetailData';
import {
  User,
  Calendar,
  Eye,
  MessageCircle,
  ArrowLeft,
  Pencil,
  Trash2,
  Send,
  Shield,
  Plus,
  CheckCircle,
  Clock,
} from 'lucide-react';

/** Side Panel — 좌측 본문 + 우측 sticky 메타정보 패널 */
const BoardDetailDesignB = () => {
  const { t } = useTranslation();
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMock = searchParams.get('mock') === 'true';

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const [post, setPost] = useState<MockBoardDetailPost | null>(isMock ? MOCK_BOARD_DETAIL : null);
  const [loading, setLoading] = useState(!isMock);
  const [replyContent, setReplyContent] = useState('');
  const { accessToken, clearAuth } = useAuthStore();

  const isAdmin = useMemo(() => {
    if (isMock) return true;
    const role = extractRoleFromToken(accessToken);
    return role === 'ROLE_ADMIN';
  }, [accessToken, isMock]);

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
    if (isMock) return;
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
  }, [boardId, navigate, clearAuth, isMock]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const handleDelete = async () => {
    if (isMock) return;
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
        CustomToast.error(
          t(
            err.response.data?.message ||
              '삭제 권한이 없거나 이미 답변이 달린 글은 삭제할 수 없습니다.',
          ),
        );
      } else {
        CustomToast.error(t('게시글 삭제 중 오류가 발생했습니다.'));
      }
    }
  };

  const handleReplySubmit = async () => {
    if (isMock) return;
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

  if (loading) {
    return (
      <>
        <Header
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
          setIsSidebarOpen={setIsSidebarOpen}
        />
        <div className="min-h-screen bg-background p-8 max-md:p-4">
          <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_280px]">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        </div>
      </>
    );
  }

  if (!post) return null;

  return (
    <>
      <Header
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-5xl px-6 py-8 max-md:px-4">
          <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
            {/* 좌측: 본문 + 댓글 */}
            <div>
              {/* 제목 */}
              <h1 className="mb-4 text-2xl font-bold text-foreground max-md:text-xl">
                {post.title}
              </h1>

              {/* 본문 */}
              <div className="mb-8 min-h-[200px] whitespace-pre-wrap leading-relaxed text-foreground">
                {post.content}
              </div>

              {/* 구분선 */}
              <div className="mb-6 border-t border-border" />

              {/* 댓글 */}
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                <MessageCircle className="size-4" />
                댓글 ({post.replies?.length || 0})
              </h3>

              {post.replies && post.replies.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {post.replies.map((reply, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-border bg-muted/30 px-4 py-3"
                    >
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                        {reply}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
                  아직 등록된 댓글이 없습니다.
                </div>
              )}

              {/* 관리자 답변 폼 */}
              {isAdmin && (
                <div className="mt-6 rounded-lg border border-primary/20 bg-muted/20 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Shield className="size-4 text-primary" />
                    관리자 답변
                  </div>
                  <textarea
                    className="w-full rounded-lg border border-input bg-background p-3 text-sm leading-relaxed transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="답변 내용을 입력하세요."
                    rows={3}
                  />
                  <div className="mt-2 flex justify-end">
                    <Button size="sm" onClick={handleReplySubmit}>
                      <Send className="mr-1 size-3" />
                      등록
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* 우측: sticky 메타정보 패널 */}
            <div className="max-lg:order-first">
              <div className="sticky top-24 space-y-4">
                {/* 메타 정보 */}
                <Card>
                  <CardContent className="space-y-3 pt-6">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">상태</span>
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
                          <CheckCircle className="mr-1 size-3" />
                        ) : (
                          <Clock className="mr-1 size-3" />
                        )}
                        {post.status === 'ANSWERED' ? '답변완료' : '대기중'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">작성자</span>
                      <span className="flex items-center gap-1 text-xs font-medium text-foreground">
                        <User className="size-3" />
                        {post.username}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">작성일</span>
                      <span className="flex items-center gap-1 text-xs text-foreground">
                        <Calendar className="size-3" />
                        {formatDate(post.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">조회수</span>
                      <span className="flex items-center gap-1 text-xs text-foreground">
                        <Eye className="size-3" />
                        {post.viewCount || 0}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* 액션 버튼 */}
                <Card>
                  <CardContent className="space-y-2 pt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => navigate('/boards')}
                    >
                      <ArrowLeft className="mr-1 size-3" />
                      목록으로
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => navigate('/boards/write')}
                    >
                      <Plus className="mr-1 size-3" />새 문의하기
                    </Button>
                    {post.isWriter && (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full"
                          onClick={() => navigate(`/boards/edit/${boardId}`)}
                        >
                          <Pencil className="mr-1 size-3" />
                          수정하기
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-full"
                          onClick={handleDelete}
                        >
                          <Trash2 className="mr-1 size-3" />
                          삭제하기
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BoardDetailDesignB;
