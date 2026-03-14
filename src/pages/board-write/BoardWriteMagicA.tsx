import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Header from '#widgets/header';
import CustomToast from '#shared/toast';
import axiosInstance from '#shared/api';
import { useAuthStore } from '#entities/auth';
import { useTranslation } from 'i18nexus';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/components/card';
import { Button } from '@/shared/ui/components/button';
import { Input } from '@/shared/ui/components/input';
import { Skeleton } from '@/shared/ui/components/skeleton';
import { BlurFade } from '@/shared/ui/components/blur-fade';
import { Pencil, Send, X, Loader2 } from 'lucide-react';

const MAX_TITLE_LENGTH = 100;
const MAX_CONTENT_LENGTH = 5000;

interface BoardEditData {
  title: string;
  content: string;
  isWriter: boolean;
}

/** Fade Form — DesignA + BlurFade 폼 필드 순차 등장 */
const BoardWriteMagicA = () => {
  const { t } = useTranslation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const navigate = useNavigate();
  const { boardId } = useParams<{ boardId: string }>();
  const [searchParams] = useSearchParams();
  const isMock = searchParams.get('mock') === 'true';
  const isEditMode = !!boardId;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(isEditMode && !isMock);

  const { accessToken, clearAuth } = useAuthStore();

  useEffect(() => {
    if (!isEditMode || isMock) return;

    const fetchPostAndVerify = async () => {
      try {
        if (!accessToken) {
          CustomToast.error(t('로그인이 필요합니다.'));
          navigate('/login', { replace: true });
          return;
        }
        const { data } = await axiosInstance.get<BoardEditData>(`/boards/${boardId}`);
        if (!data.isWriter) {
          CustomToast.error(t('수정 권한이 없습니다.'));
          navigate(`/boards/${boardId}`, { replace: true });
          return;
        }
        setTitle(data.title);
        setContent(data.content);
      } catch {
        CustomToast.error(t('게시글 정보를 확인할 수 없습니다.'));
        navigate('/boards', { replace: true });
      } finally {
        setIsCheckingAccess(false);
      }
    };

    fetchPostAndVerify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isMock) return;

    if (!accessToken) {
      CustomToast.error(t('로그인이 필요합니다.'));
      navigate('/login');
      return;
    }
    if (!title.trim() || !content.trim()) {
      CustomToast.error(t('제목과 내용을 모두 입력해주세요.'));
      return;
    }
    if (title.length > MAX_TITLE_LENGTH) {
      CustomToast.error(t(`제목은 최대 ${MAX_TITLE_LENGTH}자까지 입력 가능합니다.`));
      return;
    }
    if (content.length > MAX_CONTENT_LENGTH) {
      CustomToast.error(t(`내용은 최대 ${MAX_CONTENT_LENGTH}자까지 입력 가능합니다.`));
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditMode) {
        await axiosInstance.put(`/boards/${boardId}`, { title, content });
      } else {
        await axiosInstance.post('/boards', { title, content });
      }
      CustomToast.success(t(`게시글이 성공적으로 ${isEditMode ? '수정' : '등록'}되었습니다.`));
      navigate(isEditMode ? `/boards/${boardId}` : '/boards', { replace: true });
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: { message?: string } } };
      const status = err?.response?.status;
      if (status === 401) {
        CustomToast.error(t('다시 로그인해주세요.'));
        clearAuth();
        navigate('/login', { replace: true });
      } else if (status === 403) {
        CustomToast.error(
          t(
            err?.response?.data?.message ||
              '수정 권한이 없거나 이미 답변이 달린 글은 수정할 수 없습니다.',
          ),
        );
      } else {
        CustomToast.error(t('오류가 발생했습니다. 다시 시도해주세요.'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingAccess) {
    return (
      <>
        <Header
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
          setIsSidebarOpen={setIsSidebarOpen}
        />
        <div className="min-h-screen bg-background p-8 max-md:p-4">
          <div className="mx-auto max-w-3xl space-y-4">
            <Skeleton className="h-12 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-3xl px-6 py-8 max-md:px-4">
          <BlurFade delay={0.05}>
            <Card className="border-t-4 border-t-primary/30 shadow-lg shadow-primary/5">
              <CardHeader className="text-center">
                <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5">
                  <Pencil className="size-6 text-primary" />
                </div>
                <CardTitle className="text-2xl max-md:text-xl">
                  {isEditMode ? '문의 수정하기' : '문의하기'}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {isEditMode
                    ? '수정할 내용을 입력해주세요'
                    : '정확한 답변을 위해 상세히 적어주세요'}
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                  <BlurFade delay={0.1}>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="title" className="text-sm font-semibold text-foreground">
                        제목
                      </label>
                      <Input
                        type="text"
                        id="title"
                        placeholder="제목을 입력해주세요"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                  </BlurFade>

                  <BlurFade delay={0.15}>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="content" className="text-sm font-semibold text-foreground">
                        내용
                      </label>
                      <textarea
                        id="content"
                        className="min-h-[250px] w-full resize-y rounded-xl border border-input bg-background p-4 text-sm leading-relaxed transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:bg-muted"
                        placeholder="문의 내용을 상세히 적어주세요."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                  </BlurFade>

                  <BlurFade delay={0.2}>
                    <div className="flex justify-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate(isEditMode ? `/boards/${boardId}` : '/boards')}
                      >
                        <X className="mr-1 size-4" />
                        취소
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <Loader2 className="mr-1 size-4 animate-spin" />
                        ) : (
                          <Send className="mr-1 size-4" />
                        )}
                        {isSubmitting
                          ? isEditMode
                            ? '수정 중...'
                            : '등록 중...'
                          : isEditMode
                            ? '수정완료'
                            : '등록하기'}
                      </Button>
                    </div>
                  </BlurFade>
                </form>
              </CardContent>
            </Card>
          </BlurFade>
        </div>
      </div>
    </>
  );
};

export default BoardWriteMagicA;
