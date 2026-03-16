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

/** Refined Article — 카드 기반 아티클 + 답변 카드 리스트 */
const BoardDetailDesignC = () => {
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

      {/* 서브 네비 (브레드크럼) */}
      <div className="border-b border-border/50 bg-background">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-6 py-2.5 max-md:px-4">
          <button
            className="inline-flex items-center gap-1 rounded bg-transparent px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={() => navigate('/boards')}
          >
            <ArrowLeft className="size-3" />
            목록
          </button>
          <span className="text-xs text-muted-foreground/50">/</span>
          <span className="text-xs text-muted-foreground">문의 게시판</span>
          <span className="text-xs text-muted-foreground/50">/</span>
          <span className="text-xs font-semibold text-foreground">#{post.boardId}</span>
        </div>
      </div>

      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-3xl px-6 py-9 max-md:px-4">
          {/* 게시글 카드 */}
          <Card className="mb-6 shadow-sm">
            <CardHeader className="pb-4">
              <div className="mb-3 flex items-center gap-2">
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  문의 게시판
                </Badge>
                <Badge
                  variant={post.status === 'ANSWERED' ? 'default' : 'secondary'}
                  className={
                    post.status === 'ANSWERED'
                      ? 'bg-chart-2/10 text-chart-2 hover:bg-chart-2/10'
                      : 'bg-chart-5/10 text-chart-5 hover:bg-chart-5/10'
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
              <CardTitle className="text-[1.6rem] font-extrabold leading-snug tracking-tight max-md:text-xl">
                {post.title}
              </CardTitle>
              <div className="mt-4 flex flex-wrap items-center gap-3.5 text-sm text-muted-foreground">
                <span className="flex items-center gap-1 font-medium text-foreground">
                  <User className="size-3.5" />
                  {post.username}
                </span>
                <span className="size-[3px] rounded-full bg-border" />
                <span className="flex items-center gap-1">
                  <Calendar className="size-3.5 opacity-50" />
                  {formatDate(post.createdAt)}
                </span>
                <span className="size-[3px] rounded-full bg-border" />
                <span className="flex items-center gap-1">
                  <Eye className="size-3.5 opacity-50" />
                  조회 {post.viewCount || 0}
                </span>
              </div>
            </CardHeader>
            <CardContent className="border-t border-border/50 pt-6">
              <div className="min-h-[180px] whitespace-pre-wrap text-[15px] leading-[1.85] text-foreground">
                {post.content}
              </div>
            </CardContent>
          </Card>

          {/* 댓글 섹션 */}
          <div className="mb-6">
            <div className="mb-3.5 flex items-center gap-2">
              <h3 className="text-base font-bold text-foreground">답변</h3>
              <span className="inline-flex size-[22px] items-center justify-center rounded-md bg-chart-2 text-[11px] font-bold text-white">
                {post.replies?.length || 0}
              </span>
            </div>

            {post.replies && post.replies.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                {post.replies.map((reply, index) => (
                  <Card
                    key={index}
                    className="border-l-[3px] border-l-chart-2 shadow-none transition-shadow hover:shadow-sm"
                  >
                    <CardContent className="py-5">
                      <div className="mb-2.5 flex items-center gap-2">
                        <span className="flex size-6 items-center justify-center rounded-md bg-gradient-to-br from-chart-2 to-chart-2/70 text-[11px] font-bold text-white">
                          Q
                        </span>
                        <span className="text-[13px] font-semibold text-foreground">
                          Q-Asker 운영팀
                        </span>
                        <span className="rounded bg-chart-2/10 px-1.5 py-0.5 text-[10px] font-semibold text-chart-2">
                          Admin
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap pl-8 text-sm leading-relaxed text-muted-foreground">
                        {reply}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed shadow-none">
                <CardContent className="py-9 text-center text-sm text-muted-foreground">
                  아직 등록된 댓글이 없습니다.
                </CardContent>
              </Card>
            )}
          </div>

          {/* 관리자 답변 폼 */}
          {isAdmin && (
            <Card className="mb-6 border border-border shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Shield className="size-4 text-chart-2" />
                  관리자 답변 작성
                </CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  className="w-full rounded-lg border border-input bg-muted/30 p-3.5 text-sm leading-relaxed transition-all focus:border-primary focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary"
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
              <Button variant="outline" size="sm" onClick={() => navigate('/boards')}>
                <ArrowLeft className="mr-1 size-3.5" />
                목록으로
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/boards/write')}>
                <Plus className="mr-1 size-3.5" />새 문의하기
              </Button>
            </div>

            {post.isWriter && (
              <div className="flex gap-2 max-md:w-full max-md:justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate(`/boards/edit/${boardId}`)}
                >
                  <Pencil className="mr-1 size-3.5" />
                  수정하기
                </Button>
                <Button variant="destructive" size="sm" onClick={handleDelete}>
                  <Trash2 className="mr-1 size-3.5" />
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

export default BoardDetailDesignC;
