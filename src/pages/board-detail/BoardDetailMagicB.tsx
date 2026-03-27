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
import { BlurFade } from '@/shared/ui/components/blur-fade';
import { BorderBeam } from '@/shared/ui/components/border-beam';
import { ShineBorder } from '@/shared/ui/components/shine-border';
import { ShimmerButton } from '@/shared/ui/components/shimmer-button';
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
  Shield,
} from 'lucide-react';
import { MOCK_BOARD_DETAIL } from './mockBoardDetailData';

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
 * MagicUI B — Bold Dynamic
 * BorderBeam 카드 장식, ShineBorder 댓글, ShimmerButton CTA
 */
const BoardDetailMagicB = () => {
  const { t } = useTranslation('common');
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
      const response = await axiosInstance.get(`/boards/${boardId}`, {
        skipAuthRefresh: true,
        skipErrorToast: true,
      } as Record<string, unknown>);
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
          navigate('/boards');
        }
      } else {
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
    if (!window.confirm(t('정말로 이 게시글을 삭제하시겠습니까?'))) return;
    try {
      await axiosInstance.delete(`/boards/${boardId}`);
      CustomToast.success(t('게시글이 삭제되었습니다.'));
      navigate('/boards', { replace: true });
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
      await axiosInstance.post(`/boards/${boardId}/replies`, { content: replyContent });
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

        <div className="min-h-screen bg-background p-8">
          <div className="mx-auto max-w-3xl space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-xl bg-muted"
                style={{ animationDelay: `${i * 120}ms` }}
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/boards')}
            className="mb-5 gap-1.5 text-muted-foreground"
          >
            <ArrowLeft className="size-4" />
            {t('목록으로')}
          </Button>
        </BlurFade>

        {/* 게시글 카드 — BorderBeam 장식 */}
        <BlurFade delay={0.1}>
          <div className="relative mb-8 overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-card max-md:p-5">
            <BorderBeam size={200} duration={8} />

            {/* 헤더 영역 */}
            <div className="mb-6 flex items-start justify-between gap-4 max-md:flex-col">
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-sm font-semibold text-primary">{t('문의 게시판')}</span>
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
                </div>
                <h1 className="text-2xl font-extrabold leading-tight text-card-foreground max-md:text-xl">
                  {post.title}
                </h1>
              </div>
            </div>

            {/* 메타 정보 바 */}
            <div className="mb-6 flex flex-wrap items-center gap-1 rounded-lg bg-muted/50 px-4 py-2.5 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 pr-3">
                <User className="size-3.5" />
                {post.username}
              </span>
              <span className="text-border">·</span>
              <span className="inline-flex items-center gap-1.5 px-3">
                <CalendarDays className="size-3.5" />
                {formatDate(post.createdAt)}
              </span>
              <span className="text-border">·</span>
              <span className="inline-flex items-center gap-1.5 pl-3">
                <Eye className="size-3.5" />
                {t('조회')}
                {post.viewCount || 0}
              </span>
            </div>

            {/* 본문 */}
            <div className="min-h-[160px] text-base leading-[1.85] text-card-foreground/85 whitespace-pre-wrap">
              {post.content}
            </div>
          </div>
        </BlurFade>

        {/* 댓글 섹션 */}
        <BlurFade delay={0.2}>
          <div className="mb-8">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
              <MessageCircle className="size-5 text-primary" />
              {t('댓글')}

              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-sm font-semibold text-primary">
                {post.replies?.length || 0}
              </span>
            </h3>

            <div className="space-y-3">
              {post.replies && post.replies.length > 0 ? (
                post.replies.map((reply, index) => (
                  <BlurFade key={index} delay={0.25 + index * 0.08}>
                    <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5">
                      <ShineBorder
                        shineColor={['oklch(0.511 0.2301 276.97)', 'oklch(0.501 0.1384 304.73)']}
                        borderWidth={1.5}
                        duration={10}
                      />

                      <div className="mb-2 flex items-center gap-2">
                        <Shield className="size-3.5 text-primary" />
                        <span className="text-xs font-semibold text-primary">
                          {t('관리자 답변')}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed text-card-foreground/80 whitespace-pre-wrap">
                        {reply}
                      </p>
                    </div>
                  </BlurFade>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                  <MessageCircle className="mx-auto mb-2 size-8 opacity-30" />
                  {t('아직 등록된 댓글이 없습니다.')}
                </div>
              )}
            </div>
          </div>
        </BlurFade>

        {/* 관리자 답변 폼 */}
        {isAdmin && (
          <BlurFade delay={0.35}>
            <div className="mb-8 rounded-xl border border-primary/20 bg-primary/5 p-6">
              <h4 className="mb-4 flex items-center gap-2 text-base font-bold text-foreground">
                <Shield className="size-4 text-primary" />
                {t('관리자 답변 작성')}
              </h4>
              <textarea
                className="w-full resize-y rounded-lg border border-border bg-card p-4 text-sm leading-relaxed text-card-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={t('사용자 문의에 대한 답변 내용을 입력하세요.')}
                rows={4}
              />

              <div className="mt-4 flex justify-end">
                <ShimmerButton
                  onClick={handleReplySubmit}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 text-sm font-semibold"
                  shimmerSize="0.08em"
                >
                  <span className="flex items-center gap-1.5">
                    {isSubmitting ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Send className="size-4" />
                    )}
                    {isSubmitting ? t('등록 중...') : t('답변 등록')}
                  </span>
                </ShimmerButton>
              </div>
            </div>
          </BlurFade>
        )}

        {/* 하단 액션 */}
        <BlurFade delay={0.4}>
          <div className="flex items-center justify-between pb-10 max-md:flex-col max-md:gap-3">
            <Button variant="outline" onClick={() => navigate('/boards/write')} className="gap-1.5">
              <Plus className="size-4" />
              {t('새 문의하기')}
            </Button>

            {post.isWriter && (
              <div className="flex gap-2 max-md:w-full">
                <Button
                  variant="secondary"
                  onClick={() => navigate(`/boards/edit/${boardId}`)}
                  className="gap-1.5 max-md:flex-1"
                >
                  <Pencil className="size-4" />
                  {t('수정')}
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  className="gap-1.5 max-md:flex-1"
                >
                  <Trash2 className="size-4" />
                  {t('삭제')}
                </Button>
              </div>
            )}
          </div>
        </BlurFade>
      </div>
    </div>
  );
};

export default BoardDetailMagicB;
