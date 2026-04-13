import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import CustomToast from '#shared/toast';
import { useAuthStore, authService } from '#entities/auth';
import axiosInstance from '#shared/api';
import { useTranslation } from 'i18nexus';
import Header, { extractRoleFromToken } from '#widgets/header';
import { cn } from '@/shared/ui/lib/utils';
import { Button } from '@/shared/ui/components/button';
import { Badge } from '@/shared/ui/components/badge';
import { Skeleton } from '@/shared/ui/components/skeleton';
import MarkdownText from '@/shared/ui/components/markdown-text';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  MessageCircle,
  Eye,
  CalendarDays,
  User,
  Send,
  Loader2,
  CheckCircle,
  Clock,
  Shield,
} from 'lucide-react';
import { MOCK_BOARD_DETAIL, MOCK_UPDATE_LOG_DETAIL } from './mockBoardDetailData';
import type { BoardCategory, BoardDetailPost } from '../../shared/types/board';

interface BoardDetailProps {
  category?: BoardCategory;
}

const BoardDetail = ({ category = 'INQUIRY' }: BoardDetailProps) => {
  const { t } = useTranslation('board-detail');
  const { boardId } = useParams<{ boardId: string }>();
  const [searchParams] = useSearchParams();
  const isMock = searchParams.get('mock') === 'true';
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const isInquiry = category === 'INQUIRY';
  const listPath = isInquiry ? '/boards' : '/updates';

  const [post, setPost] = useState<BoardDetailPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { accessToken, clearAuth } = useAuthStore();

  const isAdmin = useMemo(() => {
    if (!isInquiry) return false;
    if (isMock) return true;
    const role = extractRoleFromToken(accessToken);
    return role === 'ROLE_ADMIN';
  }, [accessToken, isMock, isInquiry]);

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
    if (isMock) {
      setPost(isInquiry ? MOCK_BOARD_DETAIL : MOCK_UPDATE_LOG_DETAIL);
      setLoading(false);
      return;
    }

    // 문의 게시판은 인증 refresh 시도
    if (isInquiry) {
      try {
        await authService.refresh();
      } catch {
        /* 무시 */
      }
    }

    try {
      const response = await axiosInstance.get(`/boards/${boardId}`, {
        skipAuthRefresh: true,
        skipErrorToast: true,
      } as Record<string, unknown>);
      setPost(response.data);
    } catch (error: unknown) {
      if (isInquiry) {
        const err = error as { response?: { status?: number } };
        if (err.response?.status === 401) {
          clearAuth();
          try {
            const fallbackResponse = await axiosInstance.get(`/boards/${boardId}`, {
              skipAuthRefresh: true,
            } as Record<string, unknown>);
            setPost(fallbackResponse.data);
          } catch {
            navigate(listPath);
          }
        } else {
          navigate(listPath);
        }
      } else {
        navigate(listPath);
      }
    } finally {
      setLoading(false);
    }
  }, [boardId, navigate, clearAuth, isMock, isInquiry, listPath]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const handleDelete = async () => {
    if (!window.confirm(t('정말로 이 게시글을 삭제하시겠습니까?'))) return;
    try {
      await axiosInstance.delete(`/boards/${boardId}`);
      CustomToast.success(t('게시글이 삭제되었습니다.'));
      navigate(listPath, { replace: true });
    } catch {
      // 인터셉터에서 에러 토스트 처리
    }
  };

  const handleReplySubmit = async () => {
    if (!replyContent.trim()) {
      CustomToast.error(t('글 내용을 입력해주세요.'));
      return;
    }
    setIsSubmitting(true);
    try {
      await axiosInstance.post(`/admin/boards/${boardId}/replies`, { content: replyContent });
      CustomToast.success(t('댓글이 등록되었습니다.'));
      setReplyContent('');
      fetchPost();
    } catch {
      // 인터셉터에서 에러 토스트 처리
    } finally {
      setIsSubmitting(false);
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
            <Skeleton className="h-8 w-24 rounded-lg" />
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        </div>
      </>
    );
  }

  if (!post) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <div className="mx-auto max-w-3xl px-6 py-6 max-md:px-4">
        {/* 상단 브레드크럼 스타일 */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <button
              onClick={() => navigate(listPath)}
              className="transition-colors hover:text-foreground"
            >
              {isInquiry ? t('문의 게시판') : t('변경사항')}
            </button>
            <span>/</span>
            <span className="text-foreground">{t('상세')}</span>
          </div>
          {isInquiry && (
            <Badge
              variant="outline"
              className={cn(
                'text-xs',
                post.status === 'ANSWERED'
                  ? 'border-chart-2/30 bg-chart-2/10 text-chart-2'
                  : 'border-chart-5/30 bg-chart-5/10 text-chart-5',
              )}
            >
              {post.status === 'ANSWERED' ? (
                <CheckCircle className="mr-0.5 size-3" />
              ) : (
                <Clock className="mr-0.5 size-3" />
              )}
              {post.status === 'ANSWERED' ? t('답변완료') : t('대기중')}
            </Badge>
          )}
        </div>

        {/* 제목 영역 */}
        <div>
          <h1 className="mb-3 text-2xl font-bold text-foreground max-md:text-xl">{post.title}</h1>

          {/* 메타 정보 */}
          <div className="mb-6 flex items-center border-b-2 border-border pb-3 text-sm text-muted-foreground">
            {isInquiry && (
              <span className="inline-flex items-center gap-1 pr-4">
                <User className="size-3.5" />
                {post.username}
              </span>
            )}
            <span
              className={cn(
                'inline-flex items-center gap-1',
                isInquiry ? 'border-l border-border px-4' : 'pr-4',
              )}
            >
              <CalendarDays className="size-3.5" />
              {formatDate(post.createdAt)}
            </span>
            <span className="inline-flex items-center gap-1 border-l border-border pl-4">
              <Eye className="size-3.5" />
              {post.viewCount || 0}
            </span>
          </div>
        </div>

        {/* 본문 */}
        {isInquiry ? (
          <div className="mb-8 min-h-[180px] text-base leading-[1.85] text-foreground/85 whitespace-pre-wrap">
            {post.content}
          </div>
        ) : (
          <div className="mb-8 min-h-[180px] text-base leading-[1.85] text-foreground/85">
            <MarkdownText>{post.content}</MarkdownText>
          </div>
        )}

        {/* 구분선 */}
        <div className="mb-6 border-t border-border" />

        {/* 댓글 섹션 — 문의 게시판에서만 표시 */}
        {isInquiry && (
          <div>
            <div className="mb-5 flex items-center gap-2">
              <MessageCircle className="size-4 text-foreground" />
              <span className="text-base font-semibold text-foreground">
                {t('댓글 {{expr0}}건', { expr0: post.replies?.length || 0 })}
              </span>
            </div>

            <div className="space-y-4">
              {post.replies && post.replies.length > 0 ? (
                post.replies.map((reply, index) => (
                  <div key={index}>
                    <div className="flex items-start gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15">
                        <Shield className="size-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="relative rounded-2xl rounded-tl-sm bg-muted/60 px-4 py-3">
                          <div className="absolute top-3 -left-1.5 size-3 rotate-45 bg-muted/60" />
                          <div className="mb-1 text-xs font-semibold text-primary">
                            {t('관리자')}
                          </div>
                          <p className="text-sm leading-relaxed text-foreground/85 whitespace-pre-wrap">
                            {reply}
                          </p>
                        </div>
                        <div className="mt-1 pl-2 text-[11px] text-muted-foreground/60">
                          {formatDate(post.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
                  {t('아직 등록된 댓글이 없습니다.')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 관리자 답변 폼 — 문의 게시판 + 관리자만 */}
        {isAdmin && (
          <div className="sticky bottom-4 z-10 mt-6">
            <div className="rounded-2xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur-md">
              <div className="flex items-center gap-2">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15">
                  <Shield className="size-3.5 text-primary" />
                </div>
                <input
                  type="text"
                  className="flex-1 rounded-full border border-input bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder={t('답변을 입력하세요...')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !isSubmitting) {
                      e.preventDefault();
                      handleReplySubmit();
                    }
                  }}
                />
                <Button
                  size="icon"
                  onClick={handleReplySubmit}
                  disabled={isSubmitting}
                  className="size-9 shrink-0 rounded-full"
                >
                  {isSubmitting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 하단 액션 */}
        <div className="mt-8 flex items-center justify-between border-t border-border pt-5 pb-10 max-md:flex-col max-md:gap-3">
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate(listPath)} className="gap-1">
              <ArrowLeft className="size-3.5" />
              {t('목록')}
            </Button>
          </div>

          {isInquiry && post.isWriter && (
            <div className="flex gap-2 max-md:w-full">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate(`/boards/edit/${boardId}`)}
                className="gap-1 max-md:flex-1"
              >
                <Pencil className="size-3.5" />
                {t('수정')}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                className="gap-1 max-md:flex-1"
              >
                <Trash2 className="size-3.5" />
                {t('삭제')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BoardDetail;
