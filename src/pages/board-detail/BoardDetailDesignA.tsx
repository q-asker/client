import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import CustomToast from '#shared/toast';
import { useAuthStore, authService } from '#entities/auth';
import axiosInstance from '#shared/api';
import { useTranslation } from 'i18nexus';
import Header, { extractRoleFromToken } from '#widgets/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/components/card';
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

/** Clean Article — Shadcn Card 기반 아티클 레이아웃 */
const BoardDetailDesignA = () => {
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
          <div className="mx-auto max-w-3xl space-y-4">
            <Skeleton className="h-8 w-48 rounded-lg" />
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
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
        <div className="mx-auto max-w-3xl px-6 py-8 max-md:px-4">
          {/* 게시글 카드 */}
          <Card className="mb-6">
            <CardHeader>
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="outline" className="text-xs text-primary">
                  문의 게시판
                </Badge>
                <Badge
                  variant={post.status === 'ANSWERED' ? 'default' : 'secondary'}
                  className={
                    post.status === 'ANSWERED'
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100'
                      : 'bg-amber-100 text-amber-800 hover:bg-amber-100'
                  }
                >
                  {post.status === 'ANSWERED' ? (
                    <CheckCircle className="mr-1 size-3" />
                  ) : (
                    <Clock className="mr-1 size-3" />
                  )}
                  {post.status === 'ANSWERED' ? '답변완료' : '대기중'}
                </Badge>
              </div>
              <CardTitle className="text-2xl leading-tight max-md:text-xl">{post.title}</CardTitle>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="size-4" />
                  {post.username}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="size-4" />
                  {formatDate(post.createdAt)}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="size-4" />
                  조회수 {post.viewCount || 0}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="min-h-[200px] whitespace-pre-wrap leading-relaxed text-foreground">
                {post.content}
              </div>
            </CardContent>
          </Card>

          {/* 댓글 섹션 */}
          <div className="mb-8">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
              <MessageCircle className="size-5" />
              댓글
              <span className="text-primary">{post.replies?.length || 0}</span>
            </h3>

            {post.replies && post.replies.length > 0 ? (
              <div className="flex flex-col gap-3">
                {post.replies.map((reply, index) => (
                  <Card key={index} className="border-l-4 border-l-primary/30">
                    <CardContent className="py-4">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                        {reply}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  아직 등록된 댓글이 없습니다.
                </CardContent>
              </Card>
            )}
          </div>

          {/* 관리자 답변 폼 */}
          {isAdmin && (
            <Card className="mb-8 border-primary/20 bg-muted/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="size-4 text-primary" />
                  관리자 답변 작성
                </CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  className="w-full rounded-xl border border-input bg-background p-4 text-sm leading-relaxed transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="사용자 문의에 대한 답변 내용을 입력하세요."
                  rows={4}
                />
                <div className="mt-3 flex justify-end">
                  <Button size="sm" onClick={handleReplySubmit}>
                    <Send className="mr-1 size-3" />
                    답변 등록
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 하단 액션 버튼 */}
          <div className="flex items-center justify-between gap-4 pb-10 max-md:flex-col max-md:gap-3">
            <div className="flex gap-2 max-md:w-full">
              <Button variant="outline" onClick={() => navigate('/boards')}>
                <ArrowLeft className="mr-1 size-4" />
                목록으로
              </Button>
              <Button variant="outline" onClick={() => navigate('/boards/write')}>
                <Plus className="mr-1 size-4" />새 문의하기
              </Button>
            </div>

            {post.isWriter && (
              <div className="flex gap-2 max-md:w-full max-md:justify-end">
                <Button variant="secondary" onClick={() => navigate(`/boards/edit/${boardId}`)}>
                  <Pencil className="mr-1 size-4" />
                  수정하기
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  <Trash2 className="mr-1 size-4" />
                  삭제하기
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default BoardDetailDesignA;
