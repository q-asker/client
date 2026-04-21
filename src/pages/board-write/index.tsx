import React, { useState, useEffect, useCallback, useRef, lazy, Suspense, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Header, { extractRoleFromToken } from '#widgets/header';
import CustomToast from '#shared/toast';
import axiosInstance from '#shared/api';
import { useAuthStore } from '#entities/auth';
import { useTranslation } from 'i18nexus';
import { Button } from '@/shared/ui/components/button';
import { Input } from '@/shared/ui/components/input';
import { Skeleton } from '@/shared/ui/components/skeleton';
import { BlurFade } from '@/shared/ui/components/blur-fade';
import { Send, X, Loader2 } from 'lucide-react';
import type { BoardCategory } from '../../shared/types/board';

const MDEditor = lazy(() => import('@uiw/react-md-editor'));

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

/** 이미지 파일을 서버에 업로드하고 URL을 반환한다 */
const uploadImage = async (file: File): Promise<string> => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('지원하지 않는 이미지 형식입니다. (jpg, png, gif, webp)');
  }
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error('이미지 크기는 5MB 이하여야 합니다.');
  }
  const formData = new FormData();
  formData.append('file', file);
  const res = await axiosInstance.post<{ url: string }>('/admin/images', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.url;
};

const MAX_TITLE_LENGTH = 100;
const MAX_CONTENT_LENGTH = 5000;

interface BoardEditData {
  title: string;
  content: string;
  isWriter: boolean;
}

interface BoardWriteProps {
  category?: BoardCategory;
}

/** Slide Form — BlurFade 섹션별 순차 등장, 카테고리별 게시판 공유 */
const BoardWrite = ({ category = 'INQUIRY' }: BoardWriteProps) => {
  const { t } = useTranslation('board-write');
  const navigate = useNavigate();
  const { boardId } = useParams<{ boardId: string }>();
  const [searchParams] = useSearchParams();
  const isMock = searchParams.get('mock') === 'true';

  const isInquiry = category === 'INQUIRY';
  const isEditMode = !!boardId;
  const listPath = isInquiry ? '/boards' : '/updates';
  const detailPath = isInquiry ? `/boards/${boardId}` : `/updates/${boardId}`;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(isEditMode && !isMock);

  const { accessToken, clearAuth } = useAuthStore();

  const isAdmin = useMemo(() => {
    const role = extractRoleFromToken(accessToken);
    return role === 'ROLE_ADMIN';
  }, [accessToken]);

  useEffect(() => {
    if (!isEditMode || isMock) return;

    const fetchPostAndVerify = async () => {
      try {
        if (!accessToken) {
          CustomToast.error(t('로그인이 필요합니다.'));
          navigate('/login', { replace: true });
          return;
        }
        if (!isInquiry && !isAdmin) {
          CustomToast.error(t('수정 권한이 없습니다.'));
          navigate(detailPath, { replace: true });
          return;
        }
        const { data } = await axiosInstance.get<BoardEditData>(`/boards/${boardId}`);
        if (isInquiry && !data.isWriter) {
          CustomToast.error(t('수정 권한이 없습니다.'));
          navigate(detailPath, { replace: true });
          return;
        }
        setTitle(data.title);
        setContent(data.content);
      } catch {
        navigate(listPath, { replace: true });
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
      if (isInquiry) {
        if (isEditMode) {
          await axiosInstance.put(`/boards/${boardId}`, { title, content });
        } else {
          await axiosInstance.post('/boards', { title, content });
        }
        CustomToast.success(
          t(`게시글이 성공적으로 ${isEditMode ? t('수정') : t('등록')}되었습니다.`),
        );
        navigate(isEditMode ? `/boards/${boardId}` : '/boards', { replace: true });
      } else {
        if (isEditMode) {
          await axiosInstance.put(`/admin/boards/update-logs/${boardId}`, { title, content });
        } else {
          await axiosInstance.post('/admin/boards/update-logs', { title, content });
        }
        CustomToast.success(
          t(`게시글이 성공적으로 ${isEditMode ? t('수정') : t('등록')}되었습니다.`),
        );
        navigate(isEditMode ? `/updates/${boardId}` : '/updates', { replace: true });
      }
    } catch {
      // 인터셉터에서 에러 토스트 처리
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingAccess) {
    return (
      <>
        <Header />

        <div className="min-h-screen bg-background p-8 max-md:p-4">
          <div className="mx-auto max-w-4xl space-y-4">
            <Skeleton className="h-12 rounded" />
            <Skeleton className="h-96 rounded" />
          </div>
        </div>
      </>
    );
  }

  const pageTitle = isInquiry
    ? isEditMode
      ? t('문의 수정')
      : t('새 문의 작성')
    : isEditMode
      ? t('변경사항 수정')
      : t('변경사항 작성');

  return (
    <>
      <Header />

      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-6 py-10 max-md:px-4">
          <BlurFade delay={0.05}>
            <h1 className="mb-8 border-l-4 border-primary/40 pl-4 text-4xl font-bold text-foreground max-md:text-2xl">
              {pageTitle}
            </h1>
          </BlurFade>

          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            <BlurFade delay={0.1}>
              <div>
                <label
                  htmlFor="title"
                  className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {t('제목')}
                </label>
                <Input
                  type="text"
                  id="title"
                  className="h-14 text-lg"
                  placeholder={t('제목을 입력해주세요')}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </BlurFade>

            <BlurFade delay={0.15}>
              <div>
                <label
                  htmlFor="content"
                  className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {t('내용')}
                </label>
                {isInquiry ? (
                  <textarea
                    id="content"
                    className="min-h-[400px] w-full resize-y rounded-lg border border-input bg-background p-5 text-base leading-relaxed transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:bg-muted"
                    placeholder={t('문의 내용을 상세히 적어주세요.')}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    disabled={isSubmitting}
                  />
                ) : (
                  <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-lg" />}>
                    <MarkdownEditorWithUpload
                      value={content}
                      onChange={setContent}
                      placeholder={t('마크다운으로 변경사항을 작성해주세요.')}
                      disabled={isSubmitting}
                    />
                  </Suspense>
                )}
              </div>
            </BlurFade>

            <BlurFade delay={0.2}>
              <div className="sticky bottom-0 -mx-6 border-t-2 border-primary/20 bg-background/95 px-6 py-4 backdrop-blur max-md:-mx-4 max-md:px-4">
                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => navigate(isEditMode ? detailPath : listPath)}
                  >
                    <X className="mr-1 size-4" />
                    {t('취소')}
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <Loader2 className="mr-1 size-4 animate-spin" />
                    ) : (
                      <Send className="mr-1 size-4" />
                    )}
                    {isSubmitting
                      ? isEditMode
                        ? t('수정 중...')
                        : t('등록 중...')
                      : isEditMode
                        ? t('수정완료')
                        : t('등록하기')}
                  </Button>
                </div>
              </div>
            </BlurFade>
          </form>
        </div>
      </div>
    </>
  );
};

export default BoardWrite;

/* ─── 이미지 업로드 기능이 포함된 마크다운 에디터 ─── */
interface MarkdownEditorWithUploadProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const MarkdownEditorWithUpload = ({
  value,
  onChange,
  placeholder,
  disabled,
}: MarkdownEditorWithUploadProps) => {
  const { t } = useTranslation('board-write');
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  /** 파일을 업로드하고 마크다운에 삽입한다 */
  const handleImageUpload = useCallback(
    async (file: File) => {
      setIsUploading(true);
      try {
        const url = await uploadImage(file);
        const alt = file.name.replace(/\.[^.]+$/, '');
        const markdown = `![${alt}](${url})`;
        onChange(value ? `${value}\n${markdown}` : markdown);
      } catch (err) {
        CustomToast.error(err instanceof Error ? err.message : t('이미지 업로드 실패'));
      } finally {
        setIsUploading(false);
      }
    },
    [value, onChange],
  );

  /** 드래그&드롭 핸들러 */
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      const file = e.dataTransfer?.files?.[0];
      if (file && file.type.startsWith('image/')) {
        e.preventDefault();
        handleImageUpload(file);
      }
    },
    [handleImageUpload],
  );

  /** 붙여넣기 핸들러 */
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) handleImageUpload(file);
          return;
        }
      }
    },
    [handleImageUpload],
  );

  /** 툴바 이미지 버튼을 파일 업로드로 교체하는 커스텀 커맨드 */
  const imageUploadCommand = {
    name: 'image-upload',
    keyCommand: 'image-upload',
    buttonProps: {
      'aria-label': t('이미지 업로드'),
      title: t('이미지 업로드 (jpg, png, gif, webp)'),
    },
    icon: (
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
      </svg>
    ),

    execute: () => {
      fileInputRef.current?.click();
    },
  };

  return (
    <div
      ref={editorRef}
      className="relative"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onPaste={handlePaste}
    >
      <div data-color-mode="auto">
        <MDEditor
          value={value}
          onChange={(val) => onChange(val || '')}
          height={400}
          preview="live"
          extraCommands={[imageUploadCommand]}
          textareaProps={{ placeholder, disabled: disabled || isUploading }}
        />
      </div>

      {isUploading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/60 backdrop-blur-sm">
          <div className="flex items-center gap-2 rounded-lg bg-card px-4 py-2 shadow-lg">
            <Loader2 className="size-4 animate-spin text-primary" />
            <span className="text-sm">{t('이미지 업로드 중...')}</span>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageUpload(file);
          e.target.value = '';
        }}
      />
    </div>
  );
};
