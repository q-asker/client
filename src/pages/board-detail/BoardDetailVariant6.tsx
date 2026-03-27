import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import CustomToast from '#shared/toast';
import { useAuthStore, authService } from '#entities/auth';
import axiosInstance from '#shared/api';
import { useTranslation } from 'i18nexus';
import Header, { extractRoleFromToken } from '#widgets/header';
import { cn } from '@/shared/ui/lib/utils';
import { Button } from '@/shared/ui/components/button';
import { Badge } from '@/shared/ui/components/badge';
import { Card, CardContent, CardHeader } from '@/shared/ui/components/card';
import { Skeleton } from '@/shared/ui/components/skeleton';
import { MagicCard } from '@/shared/ui/components/magic-card';
import { BlurFade } from '@/shared/ui/components/blur-fade';
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

/** Framer Motion 트랜지션 */
const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: 'easeOut' as const },
};

/**
 * Variant 6 — Timeline Thread
 * 타임라인 스레드 형태의 댓글 섹션, MagicCard + BlurFade 활용
 */
const BoardDetailVariant6 = () => {
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
        <motion.div {...fadeUp} className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <button
              onClick={() => navigate('/boards')}
              className="transition-colors hover:text-foreground"
            >
              {t('문의 게시판')}
            </button>
            <span>/</span>
            <span className="text-foreground">{t('상세')}</span>
          </div>
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
        </motion.div>

        {/* 제목 영역 */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.35, ease: 'easeOut' as const, delay: 0.05 }}
        >
          <h1 className="mb-3 text-2xl font-bold text-foreground max-md:text-xl">{post.title}</h1>

          {/* 메타 정보 — 보드 목록과 동일한 밀도 */}
          <div className="mb-6 flex items-center border-b-2 border-border pb-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1 pr-4">
              <User className="size-3.5" />
              {post.username}
            </span>
            <span className="inline-flex items-center gap-1 border-l border-border px-4">
              <CalendarDays className="size-3.5" />
              {formatDate(post.createdAt)}
            </span>
            <span className="inline-flex items-center gap-1 border-l border-border pl-4">
              <Eye className="size-3.5" />
              {post.viewCount || 0}
            </span>
          </div>
        </motion.div>

        {/* 본문 */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.35, ease: 'easeOut' as const, delay: 0.1 }}
          className="mb-8 min-h-[180px] text-base leading-[1.85] text-foreground/85 whitespace-pre-wrap"
        >
          {post.content}
        </motion.div>

        {/* 구분선 */}
        <div className="mb-6 border-t border-border" />

        {/* 댓글 섹션 — Timeline Thread */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.35, ease: 'easeOut' as const, delay: 0.15 }}
        >
          <h3 className="mb-6 flex items-center gap-2 text-base font-semibold text-foreground">
            <MessageCircle className="size-4" />
            {t('댓글')}
            {post.replies?.length || 0}
            {t('건')}
          </h3>

          {post.replies && post.replies.length > 0 ? (
            <div className="relative ml-4 max-md:ml-2">
              {/* 타임라인 세로 줄 */}
              <div className="absolute top-0 bottom-0 left-4 w-0.5 bg-border" />

              <div className="space-y-5">
                {post.replies.map((reply, index) => (
                  <BlurFade key={index} delay={0.15 + index * 0.08} inView>
                    <div className="relative flex items-start gap-4">
                      {/* 타임라인 도트 + 번호 배지 */}
                      <div className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-sm">
                        {index + 1}
                      </div>

                      {/* 수평 연결선 */}
                      <div className="absolute left-8 top-3.5 h-0.5 w-3 bg-border" />

                      {/* 댓글 카드 */}
                      <div className="ml-3 flex-1">
                        <MagicCard className="border border-border bg-card shadow-sm">
                          <CardContent className="p-4">
                            <div className="mb-1.5 flex items-center gap-2">
                              <Badge
                                variant="secondary"
                                className="bg-primary/10 text-xs text-primary"
                              >
                                {t('관리자')}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {t('답변 #')}
                                {index + 1}
                              </span>
                            </div>
                            <p className="text-sm leading-relaxed text-card-foreground/80 whitespace-pre-wrap">
                              {reply}
                            </p>
                          </CardContent>
                        </MagicCard>
                      </div>
                    </div>
                  </BlurFade>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
              {t('아직 등록된 댓글이 없습니다.')}
            </div>
          )}
        </motion.div>

        {/* 관리자 답변 폼 — 상단 그라디언트 보더 */}
        {isAdmin && (
          <BlurFade delay={0.3} inView>
            <Card className="mt-6 overflow-hidden border-border">
              {/* 상단 그라디언트 라인 */}
              <div className="h-1 w-full bg-primary" />
              <CardHeader className="pb-3">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Send className="size-3.5 text-primary" />
                  {t('관리자 답변 작성')}
                </h4>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="relative">
                  <textarea
                    className="w-full resize-y rounded-lg border border-input bg-background p-3 pb-8 text-sm leading-relaxed text-foreground transition-colors focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={t('사용자 문의에 대한 답변 내용을 입력하세요.')}
                    rows={4}
                    maxLength={2000}
                  />

                  {/* 글자 수 카운트 */}
                  <span className="absolute right-3 bottom-3 text-xs text-muted-foreground">
                    {replyContent.length} / 2,000
                  </span>
                </div>
                <div className="mt-3 flex justify-end">
                  <Button
                    size="sm"
                    onClick={handleReplySubmit}
                    disabled={isSubmitting}
                    className="gap-1.5"
                  >
                    {isSubmitting ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Send className="size-3.5" />
                    )}
                    {isSubmitting ? t('등록 중...') : t('답변 등록')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </BlurFade>
        )}

        {/* 하단 액션 — 보드 목록과 동일한 간결함 */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.35, ease: 'easeOut' as const, delay: 0.3 }}
          className="mt-8 flex items-center justify-between border-t border-border pt-5 pb-10 max-md:flex-col max-md:gap-3"
        >
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/boards')} className="gap-1">
              <ArrowLeft className="size-3.5" />
              {t('목록')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/boards/write')}
              className="gap-1"
            >
              <Plus className="size-3.5" />
              {t('새 문의')}
            </Button>
          </div>

          {post.isWriter && (
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
        </motion.div>
      </div>
    </div>
  );
};

export default BoardDetailVariant6;
