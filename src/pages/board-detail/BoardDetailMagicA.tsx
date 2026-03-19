import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import CustomToast from '#shared/toast';
import { useAuthStore, authService } from '#entities/auth';
import axiosInstance from '#shared/api';
import { useTranslation } from 'i18nexus';
import Header, { extractRoleFromToken } from '#widgets/header';
import { cn } from '@/shared/ui/lib/utils';
import { Button } from '@/shared/ui/components/button';
import { Badge } from '@/shared/ui/components/badge';
import { Card } from '@/shared/ui/components/card';
import { BlurFade } from '@/shared/ui/components/blur-fade';
import { TextAnimate } from '@/shared/ui/components/text-animate';
import { MagicCard } from '@/shared/ui/components/magic-card';
import {
  ArrowLeft,
  Plus,
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
} from 'lucide-react';
import { MOCK_BOARD_DETAIL } from './mockBoardDetailData';

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

/**
 * MagicUI A — Glass Elegance
 * BlurFade 순차 진입, TextAnimate 타이틀, MagicCard 게시글 카드
 */
const BoardDetailMagicA = () => {
  const { t } = useTranslation();
  const { boardId } = useParams<{ boardId: string }>();
  const [searchParams] = useSearchParams();
  const isMock = searchParams.get('mock') === 'true';
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

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
      setPost(MOCK_BOARD_DETAIL as BoardDetailPost);
      setLoading(false);
      return;
    }
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
    if (!replyContent.trim()) {
      CustomToast.error(t('글 내용을 입력해주세요.'));
      return;
    }
    setIsSubmitting(true);
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
        <div className="min-h-screen bg-background p-8">
          <div className="mx-auto max-w-3xl space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-2xl bg-muted"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
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

      <div className="mx-auto max-w-3xl px-6 py-8 max-md:px-4 max-md:py-5">
        {/* 상단 네비게이션 */}
        <BlurFade delay={0.05}>
          <div className="mb-6 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/boards')}
              className="gap-1.5 text-muted-foreground"
            >
              <ArrowLeft className="size-4" />
              목록으로
            </Button>
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
                <CheckCircle className="mr-1 size-3" />
              ) : (
                <Clock className="mr-1 size-3" />
              )}
              {post.status === 'ANSWERED' ? '답변완료' : '대기중'}
            </Badge>
          </div>
        </BlurFade>

        {/* 게시글 카드 — MagicCard 효과 */}
        <BlurFade delay={0.1}>
          <MagicCard className="mb-6 rounded-2xl border border-border bg-card p-8 shadow-card max-md:p-5">
            {/* 카테고리 */}
            <span className="mb-3 inline-block text-sm font-semibold text-primary">
              문의 게시판
            </span>

            {/* 제목 — TextAnimate */}
            <TextAnimate
              as="h1"
              animation="blurInUp"
              by="word"
              className="mb-4 text-2xl font-extrabold leading-tight text-card-foreground max-md:text-xl"
            >
              {post.title}
            </TextAnimate>

            {/* 메타 정보 */}
            <div className="mb-6 flex flex-wrap items-center gap-4 border-b border-border pb-5 text-sm text-muted-foreground max-md:gap-3">
              <span className="inline-flex items-center gap-1.5">
                <User className="size-3.5" />
                {post.username}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-3.5" />
                {formatDate(post.createdAt)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Eye className="size-3.5" />
                {post.viewCount || 0}
              </span>
            </div>

            {/* 본문 */}
            <div className="min-h-[160px] text-base leading-relaxed text-card-foreground/85 whitespace-pre-wrap">
              {post.content}
            </div>
          </MagicCard>
        </BlurFade>

        {/* 댓글 섹션 */}
        <BlurFade delay={0.2}>
          <div className="mb-8">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
              <MessageCircle className="size-5 text-primary" />
              댓글
              <span className="text-base text-primary">{post.replies?.length || 0}</span>
            </h3>

            <div className="space-y-3">
              {post.replies && post.replies.length > 0 ? (
                post.replies.map((reply, index) => (
                  <BlurFade key={index} delay={0.25 + index * 0.08}>
                    <Card className="border border-border bg-card p-5 shadow-sm">
                      <div className="mb-2 flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          관리자
                        </Badge>
                      </div>
                      <p className="text-sm leading-relaxed text-card-foreground/80 whitespace-pre-wrap">
                        {reply}
                      </p>
                    </Card>
                  </BlurFade>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-muted/30 py-10 text-center text-sm text-muted-foreground">
                  아직 등록된 댓글이 없습니다.
                </div>
              )}
            </div>
          </div>
        </BlurFade>

        {/* 관리자 답변 폼 */}
        {isAdmin && (
          <BlurFade delay={0.35}>
            <Card className="mb-8 border border-primary/20 bg-primary/5 p-6">
              <h4 className="mb-4 text-base font-bold text-foreground">관리자 답변 작성</h4>
              <textarea
                className="w-full resize-y rounded-xl border border-border bg-card p-4 text-sm leading-relaxed text-card-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="사용자 문의에 대한 답변 내용을 입력하세요."
                rows={4}
              />
              <div className="mt-4 flex justify-end">
                <Button onClick={handleReplySubmit} disabled={isSubmitting} className="gap-1.5">
                  {isSubmitting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                  {isSubmitting ? '등록 중...' : '답변 등록'}
                </Button>
              </div>
            </Card>
          </BlurFade>
        )}

        {/* 하단 액션 */}
        <BlurFade delay={0.4}>
          <div className="flex items-center justify-between pb-10 max-md:flex-col max-md:gap-3">
            <Button variant="outline" onClick={() => navigate('/boards/write')} className="gap-1.5">
              <Plus className="size-4" />새 문의하기
            </Button>

            {post.isWriter && (
              <div className="flex gap-2 max-md:w-full">
                <Button
                  variant="secondary"
                  onClick={() => navigate(`/boards/edit/${boardId}`)}
                  className="gap-1.5 max-md:flex-1"
                >
                  <Pencil className="size-4" />
                  수정
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  className="gap-1.5 max-md:flex-1"
                >
                  <Trash2 className="size-4" />
                  삭제
                </Button>
              </div>
            )}
          </div>
        </BlurFade>
      </div>
    </div>
  );
};

export default BoardDetailMagicA;
