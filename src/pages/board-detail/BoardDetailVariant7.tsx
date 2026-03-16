import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  ChevronDown,
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
 * Variant 7 — Accordion Expandable
 * 댓글을 아코디언 카드로 표시, 첫 줄 미리보기 + 클릭 확장
 * Framer Motion AnimatePresence 활용, Shadcn Card/Badge/Button
 */
const BoardDetailVariant7 = () => {
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
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set());
  const { accessToken, clearAuth } = useAuthStore();

  const isAdmin = useMemo(() => {
    if (isMock) return true;
    const role = extractRoleFromToken(accessToken);
    return role === 'ROLE_ADMIN';
  }, [accessToken, isMock]);

  const toggleReplyExpanded = (index: number) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  /** 첫 줄만 추출 */
  const getFirstLine = (text: string): string => {
    const firstLine = text.split('\n')[0];
    return firstLine.length > 80 ? firstLine.slice(0, 80) + '…' : firstLine;
  };

  /** 여러 줄인지 확인 */
  const isMultiLine = (text: string): boolean => {
    return text.includes('\n') || text.length > 80;
  };

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
      setShowReplyForm(false);
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
              문의 게시판
            </button>
            <span>/</span>
            <span className="text-foreground">상세</span>
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
            {post.status === 'ANSWERED' ? '답변완료' : '대기중'}
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

        {/* 댓글 섹션 — 아코디언 확장형 */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.35, ease: 'easeOut' as const, delay: 0.15 }}
        >
          <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
            <MessageCircle className="size-4" />
            댓글 {post.replies?.length || 0}건
          </h3>

          <div className="space-y-2">
            {post.replies && post.replies.length > 0 ? (
              post.replies.map((reply, index) => {
                const expanded = expandedReplies.has(index);
                const hasMore = isMultiLine(reply);

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.06, duration: 0.3 }}
                  >
                    <Card
                      className={cn(
                        'border-l-2 border-l-primary/20 bg-card transition-colors',
                        hasMore && 'cursor-pointer hover:bg-accent/30',
                      )}
                      onClick={() => hasMore && toggleReplyExpanded(index)}
                    >
                      <CardContent className="p-4">
                        {/* 관리자 뱃지 + 확장 아이콘 */}
                        <div className="mb-1.5 flex items-center justify-between">
                          <Badge
                            variant="secondary"
                            className="gap-1 bg-primary/10 text-xs text-primary"
                          >
                            <Shield className="size-3" />
                            관리자
                          </Badge>
                          {hasMore && (
                            <motion.div
                              animate={{ rotate: expanded ? 180 : 0 }}
                              transition={{ duration: 0.2, ease: 'easeOut' as const }}
                            >
                              <ChevronDown className="size-4 text-muted-foreground" />
                            </motion.div>
                          )}
                        </div>

                        {/* 미리보기 (첫 줄) — 항상 표시 */}
                        {!expanded && (
                          <p className="text-sm leading-relaxed text-card-foreground/80">
                            {hasMore ? getFirstLine(reply) : reply}
                          </p>
                        )}

                        {/* 확장된 전체 내용 */}
                        <AnimatePresence initial={false}>
                          {expanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25, ease: 'easeOut' as const }}
                              className="overflow-hidden"
                            >
                              <p className="text-sm leading-relaxed text-card-foreground/80 whitespace-pre-wrap">
                                {reply}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* 단일 줄이면 그냥 표시 */}
                        {!hasMore && !expanded && null}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            ) : (
              <div className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
                아직 등록된 댓글이 없습니다.
              </div>
            )}
          </div>
        </motion.div>

        {/* 관리자 답변 폼 — 인라인 확장형 */}
        {isAdmin && (
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.35, ease: 'easeOut' as const, delay: 0.25 }}
            className="mt-6"
          >
            <AnimatePresence initial={false}>
              {!showReplyForm ? (
                <motion.div
                  key="reply-trigger"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' as const }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowReplyForm(true)}
                    className="gap-1.5 border-primary/20 text-primary hover:bg-primary/5"
                  >
                    <Shield className="size-3.5" />
                    관리자 답변 작성
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="reply-form"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' as const }}
                  className="overflow-hidden"
                >
                  <Card className="border-primary/15">
                    <CardContent className="p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="gap-1 bg-primary/10 text-xs text-primary"
                        >
                          <Shield className="size-3" />
                          관리자
                        </Badge>
                        <span className="text-sm font-medium text-foreground">답변 작성</span>
                      </div>
                      <textarea
                        className="w-full resize-y rounded-lg border border-input bg-background p-3 text-sm leading-relaxed text-foreground transition-shadow focus:shadow-md focus:outline-none focus:ring-1 focus:ring-ring"
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="사용자 문의에 대한 답변 내용을 입력하세요."
                        rows={4}
                        autoFocus
                      />
                      <div className="mt-3 flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowReplyForm(false);
                            setReplyContent('');
                          }}
                          disabled={isSubmitting}
                        >
                          취소
                        </Button>
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
                          {isSubmitting ? '등록 중...' : '답변 등록'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
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
              목록
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/boards/write')}
              className="gap-1"
            >
              <Plus className="size-3.5" />새 문의
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
                수정
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                className="gap-1 max-md:flex-1"
              >
                <Trash2 className="size-3.5" />
                삭제
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default BoardDetailVariant7;
