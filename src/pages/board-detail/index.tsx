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
import type { BoardCategory, BoardDetailPost } from '../../shared/types/board';

/** ?mock=true 모드에서 사용하는 게시물 상세 mock 데이터 */
const MOCK_BOARD_DETAIL: BoardDetailPost = {
  boardId: 'mock-bd-001',
  title: '퀴즈 생성 시 PDF 파일이 업로드되지 않습니다',
  content:
    '안녕하세요.\n\n퀴즈 생성 페이지에서 PDF 파일을 업로드하려고 하면 "지원하지 않는 파일 형식입니다"라는 오류가 발생합니다.\n\n파일 크기는 약 2MB이고 일반적인 PDF 파일입니다.\n\n브라우저는 Chrome 최신 버전을 사용하고 있습니다.\n\n확인 부탁드립니다. 감사합니다.',
  username: '김철수',
  createdAt: '2026-03-12T14:30:00.000Z',
  viewCount: 42,
  status: 'ANSWERED',
  replies: [
    '안녕하세요, Q-Asker 운영팀입니다.\n\n해당 문제는 PDF 파일의 인코딩 방식에 따라 발생할 수 있습니다. 파일을 다시 저장한 후 업로드해 주시겠어요?\n\n문제가 지속되면 support@q-asker.com으로 파일을 보내주시면 확인해 드리겠습니다.',
    '추가로, 다음 업데이트에서 더 많은 PDF 형식을 지원할 예정입니다. 불편을 드려 죄송합니다.',
  ],
  isWriter: true,
  category: 'INQUIRY',
};

const MOCK_UPDATE_LOG_DETAIL: BoardDetailPost = {
  boardId: 'mock-ul-001',
  title: '퀴즈 해설 페이지 UI 개선 및 레이아웃 최적화',
  content:
    '안녕하세요, Q-Asker 팀입니다.\n\n이번 업데이트에서는 퀴즈 해설 페이지의 사용자 경험을 개선했습니다.\n\n## 주요 변경사항\n\n- 해설 텍스트의 가독성을 높이기 위해 줄 간격과 글꼴 크기를 조정했습니다.\n- 정답/오답 표시가 더 명확하게 구분되도록 색상과 아이콘을 개선했습니다.\n- 모바일 환경에서의 레이아웃이 최적화되어 작은 화면에서도 편하게 확인할 수 있습니다.\n\n## 개선 전후 비교\n\n- **이전**: 해설 텍스트가 좁은 영역에 밀집되어 가독성이 낮았음\n- **이후**: 충분한 여백과 시각적 구분으로 핵심 내용을 빠르게 파악 가능\n\n더 나은 서비스를 위해 노력하겠습니다.\n감사합니다.',
  username: '운영팀',
  createdAt: '2026-03-13T09:00:00.000Z',
  viewCount: 128,
  status: null,
  replies: null,
  isWriter: false,
  category: 'UPDATE_LOG',
};

interface BoardDetailProps {
  category?: BoardCategory;
}

const BoardDetail = ({ category = 'INQUIRY' }: BoardDetailProps) => {
  const { t } = useTranslation('board-detail');
  const { boardId } = useParams<{ boardId: string }>();
  const [searchParams] = useSearchParams();
  const isMock = searchParams.get('mock') === 'true';
  const navigate = useNavigate();
  const isInquiry = category === 'INQUIRY';
  const listPath = isInquiry ? '/boards' : '/updates';

  const [post, setPost] = useState<BoardDetailPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
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
        <Header />

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
      <Header />

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
        {isInquiry && isAdmin && (
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

          {!isInquiry && isAdmin && (
            <div className="flex gap-2 max-md:w-full">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate(`/updates/edit/${boardId}`)}
                className="gap-1 max-md:flex-1"
              >
                <Pencil className="size-3.5" />
                {t('수정')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BoardDetail;
