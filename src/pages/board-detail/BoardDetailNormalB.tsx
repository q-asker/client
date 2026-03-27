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
import { Card, CardContent } from '@/shared/ui/components/card';
import { Skeleton } from '@/shared/ui/components/skeleton';
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  MessageSquare,
  Eye,
  Calendar,
  UserCircle,
  Send,
  Loader2,
  CheckCircle2,
  Clock4,
  Shield,
  CornerDownRight,
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
 * Normal B — Structured Professional
 * 명확한 섹션 구분, 사이드 메타 패널, Shadcn 컴포넌트 전면 활용
 */
const BoardDetailNormalB = () => {
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

  const formatDateShort = (isoString: string | null): string => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
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
    if (!window.confirm('정말로 이 게시글을 삭제하시겠습니까?')) return;
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
          <div className="mx-auto max-w-4xl">
            <Skeleton className="mb-4 h-6 w-32" />
            <div className="grid grid-cols-[1fr_280px] gap-6 max-md:grid-cols-1">
              <div className="space-y-4">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-48 rounded-xl" />
              </div>
              <Skeleton className="h-40 rounded-xl" />
            </div>
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

      <div className="mx-auto max-w-4xl px-6 py-6 max-md:px-4">
        {/* 상단 네비게이션 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-5 flex items-center gap-3"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/boards')}
            className="gap-1 text-muted-foreground"
          >
            <ArrowLeft className="size-4" />
            목록
          </Button>
          <span className="text-sm text-border">/</span>
          <span className="text-sm text-muted-foreground">#{boardId}</span>
        </motion.div>

        {/* 2열 레이아웃: 본문 + 사이드 패널 */}
        <div className="grid grid-cols-[1fr_260px] gap-6 max-lg:grid-cols-1">
          {/* 좌측: 본문 영역 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            {/* 제목 */}
            <h1 className="mb-5 text-2xl font-bold leading-snug text-foreground max-md:text-xl">
              {post.title}
            </h1>

            {/* 본문 카드 */}
            <Card className="mb-6">
              <CardContent className="p-6 max-md:p-4">
                <div className="min-h-[180px] text-base leading-[1.9] text-card-foreground/85 whitespace-pre-wrap">
                  {post.content}
                </div>
              </CardContent>
            </Card>

            {/* 댓글 섹션 */}
            <div className="mb-6">
              <div className="mb-3 flex items-center gap-2">
                <MessageSquare className="size-4 text-muted-foreground" />
                <h3 className="text-base font-semibold text-foreground">
                  답변 ({post.replies?.length || 0})
                </h3>
              </div>

              <AnimatePresence>
                <div className="space-y-2.5">
                  {post.replies && post.replies.length > 0 ? (
                    post.replies.map((reply, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.08, duration: 0.3 }}
                      >
                        <Card className="bg-muted/30">
                          <CardContent className="p-4">
                            <div className="mb-2 flex items-center gap-2">
                              <CornerDownRight className="size-3.5 text-muted-foreground" />
                              <Badge variant="secondary" className="text-xs">
                                <Shield className="mr-0.5 size-2.5" />
                                관리자
                              </Badge>
                            </div>
                            <p className="pl-5 text-sm leading-relaxed text-card-foreground/80 whitespace-pre-wrap">
                              {reply}
                            </p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))
                  ) : (
                    <div className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
                      아직 등록된 답변이 없습니다.
                    </div>
                  )}
                </div>
              </AnimatePresence>
            </div>

            {/* 관리자 답변 폼 */}
            {isAdmin && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="mb-6 border-primary/15">
                  <CardContent className="p-5">
                    <h4 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                      <Shield className="size-4 text-primary" />
                      답변 작성
                    </h4>
                    <textarea
                      className="w-full resize-y rounded-lg border border-input bg-background p-3 text-sm leading-relaxed text-foreground transition-colors focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="답변 내용을 입력하세요."
                      rows={4}
                    />
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
                        {isSubmitting ? '등록 중...' : '등록'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>

          {/* 우측: 사이드 정보 패널 */}
          <motion.aside
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.35 }}
            className="max-lg:order-first"
          >
            <div className="sticky top-24 space-y-4">
              {/* 상태 & 메타 정보 카드 */}
              <Card>
                <CardContent className="space-y-4 p-5">
                  {/* 상태 */}
                  <div>
                    <span className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      상태
                    </span>
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
                        <CheckCircle2 className="mr-0.5 size-3" />
                      ) : (
                        <Clock4 className="mr-0.5 size-3" />
                      )}
                      {post.status === 'ANSWERED' ? '답변완료' : '대기중'}
                    </Badge>
                  </div>

                  <div className="border-t border-border" />

                  {/* 작성자 */}
                  <div>
                    <span className="mb-1 block text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      작성자
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
                      <UserCircle className="size-4 text-muted-foreground" />
                      {post.username}
                    </span>
                  </div>

                  {/* 작성일 */}
                  <div>
                    <span className="mb-1 block text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      작성일
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
                      <Calendar className="size-4 text-muted-foreground" />
                      {formatDateShort(post.createdAt)}
                    </span>
                  </div>

                  {/* 조회수 */}
                  <div>
                    <span className="mb-1 block text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      조회수
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
                      <Eye className="size-4 text-muted-foreground" />
                      {post.viewCount || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* 액션 카드 */}
              <Card>
                <CardContent className="space-y-2 p-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-1.5"
                    onClick={() => navigate('/boards/write')}
                  >
                    <Plus className="size-3.5" />새 문의하기
                  </Button>

                  {post.isWriter && (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full justify-start gap-1.5"
                        onClick={() => navigate(`/boards/edit/${boardId}`)}
                      >
                        <Pencil className="size-3.5" />
                        수정하기
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full justify-start gap-1.5"
                        onClick={handleDelete}
                      >
                        <Trash2 className="size-3.5" />
                        삭제하기
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
};

export default BoardDetailNormalB;
