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

/** Framer Motion 트랜지션 */
const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: 'easeOut' as const },
};

/** 상대 시간 표시 */
const getRelativeTime = (index: number): string => {
  const units = ['방금 전', '1시간 전', '3시간 전', '1일 전', '2일 전', '3일 전', '1주 전'];
  return units[index % units.length];
};

/**
 * Variant 8 — Stacked Notification Cards
 * 댓글을 알림 카드 스타일로 표시, 워터마크 인덱스 넘버,
 * 관리자 답변 폼은 좌측 가이드라인 + 우측 입력 분할 레이아웃
 */
const BoardDetailVariant8 = () => {
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

          {/* 메타 정보 */}
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

        {/* 댓글 섹션 — Stacked Notification Cards */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.35, ease: 'easeOut' as const, delay: 0.15 }}
        >
          <h3 className="mb-5 flex items-center gap-2 text-base font-semibold text-foreground">
            <MessageCircle className="size-4" />
            {t('댓글')}
            {post.replies?.length || 0}
            {t('건')}
          </h3>

          <div className="space-y-3">
            {post.replies && post.replies.length > 0 ? (
              post.replies.map((reply, index) => (
                <React.Fragment key={index}>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.08, duration: 0.35 }}
                    whileHover={{ scale: 1.01 }}
                    className="group"
                  >
                    <Card
                      className={cn(
                        'relative overflow-hidden border-l-4 transition-shadow duration-200',
                        'border-l-primary bg-card hover:shadow-md',
                      )}
                    >
                      {/* 워터마크 인덱스 넘버 */}
                      <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 select-none text-7xl font-black text-muted-foreground/5">
                        {String(index + 1).padStart(2, '0')}
                      </div>

                      <CardContent className="relative p-4">
                        {/* 관리자 정보 행 */}
                        <div className="mb-2 flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className="gap-1 bg-primary/10 text-xs text-primary"
                          >
                            <Shield className="size-3" />
                            {t('관리자')}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {getRelativeTime(index)}
                          </span>
                        </div>

                        {/* 댓글 본문 */}
                        <p className="text-sm leading-relaxed text-card-foreground/80 whitespace-pre-wrap">
                          {reply}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* 구분 점 (마지막 항목 제외) */}
                  {index < post.replies.length - 1 && (
                    <div className="flex items-center justify-center py-1">
                      <div className="flex gap-1">
                        <span className="size-1 rounded-full bg-border" />
                        <span className="size-1 rounded-full bg-border" />
                        <span className="size-1 rounded-full bg-border" />
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
                {t('아직 등록된 댓글이 없습니다.')}
              </div>
            )}
          </div>
        </motion.div>

        {/* 관리자 답변 폼 — 분할 레이아웃 */}
        {isAdmin && (
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.35, ease: 'easeOut' as const, delay: 0.25 }}
          >
            <Card className="mt-6 border-primary/15">
              <CardContent className="p-0">
                <div className="grid grid-cols-[1fr_2fr] max-md:grid-cols-1">
                  {/* 좌측: 가이드라인 */}
                  <div className="flex flex-col justify-center gap-3 border-r border-border bg-muted/30 p-5 max-md:border-b max-md:border-r-0">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Shield className="size-4 text-primary" />
                      {t('관리자 답변 작성')}
                    </h4>
                    <ul className="space-y-1.5 text-xs leading-relaxed text-muted-foreground">
                      <li className="flex items-start gap-1.5">
                        <span className="mt-0.5 size-1 shrink-0 rounded-full bg-primary/40" />
                        {t('정확하고 친절한 답변을 작성해 주세요.')}
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="mt-0.5 size-1 shrink-0 rounded-full bg-primary/40" />
                        {t('답변 등록 후 사용자에게 알림이 전송됩니다.')}
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="mt-0.5 size-1 shrink-0 rounded-full bg-primary/40" />
                        {t('개인정보가 포함되지 않도록 주의하세요.')}
                      </li>
                    </ul>
                  </div>

                  {/* 우측: 입력 영역 */}
                  <div className="flex flex-col gap-3 p-5">
                    <textarea
                      className="w-full flex-1 resize-y rounded-lg border border-input bg-background p-3 text-sm leading-relaxed text-foreground transition-colors focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder={t('사용자 문의에 대한 답변 내용을 입력하세요.')}
                      rows={4}
                    />

                    <div className="flex justify-end">
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
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* 하단 액션 */}
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

export default BoardDetailVariant8;
