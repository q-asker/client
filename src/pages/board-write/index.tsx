import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '#widgets/header';
import CustomToast from '#shared/toast';
import axiosInstance from '#shared/api';
import { useAuthStore } from '#entities/auth';
import { useTranslation } from 'i18nexus';

const MAX_TITLE_LENGTH = 100;
const MAX_CONTENT_LENGTH = 5000;

/** 게시글 상세 응답 (수정 모드에서 사용) */
interface BoardEditData {
  title: string;
  content: string;
  isWriter: boolean;
}

const BoardWrite = () => {
  const { t } = useTranslation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const navigate = useNavigate();
  const { boardId } = useParams<{ boardId: string }>();

  const isEditMode = !!boardId;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(isEditMode);

  const { accessToken, clearAuth } = useAuthStore();

  // 수정 모드일 때 백엔드에 데이터와 권한을 직접 요청 (마운트 시 1회만 실행)
  useEffect(() => {
    if (!isEditMode) return;

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
        const errorMessage =
          err?.response?.data?.message ||
          '수정 권한이 없거나 이미 답변이 달린 글은 수정할 수 없습니다.';
        CustomToast.error(t(errorMessage));
      } else {
        CustomToast.error(t('오류가 발생했습니다. 다시 시도해주세요.'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingAccess) {
    return (
      <div className="w-full bg-gray-50 min-h-screen flex flex-col justify-center items-center">
        <div className="text-center p-24 text-gray-500 text-lg">권한 확인 중...</div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-50 min-h-screen flex flex-col">
      <Header
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <div className="w-full max-w-[800px] mx-auto mt-10 px-5 box-border max-md:mt-5 max-md:px-4">
        <div className="bg-white rounded-2xl shadow-card p-10 box-border max-md:px-5 max-md:py-6">
          {/* 헤더 */}
          <div className="border-b-2 border-gray-200 pb-5 mb-8 text-center">
            <h1 className="text-[2rem] text-gray-900 font-extrabold mb-2.5 max-md:text-2xl">
              {isEditMode ? '✍️ 문의 수정하기' : '✍️ 문의하기'}
            </h1>
            <p className="text-gray-500 text-[1.05rem] max-md:text-[0.95rem]">
              {isEditMode ? '수정할 내용을 입력해주세요' : '정확한 답변을 위해 상세히 적어주세요'}
            </p>
          </div>

          {/* 폼 */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="title" className="font-semibold text-gray-700 text-[1.05rem]">
                제목
              </label>
              <input
                type="text"
                id="title"
                className="w-full p-4 border border-gray-300 rounded-xl text-base font-[inherit] transition-[border-color,box-shadow] duration-200 bg-gray-50 box-border focus:outline-none focus:border-brand focus:shadow-focus-ring focus:bg-white disabled:bg-gray-200 disabled:cursor-not-allowed"
                placeholder="제목을 입력해주세요"
                value={title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="content" className="font-semibold text-gray-700 text-[1.05rem]">
                내용
              </label>
              <textarea
                id="content"
                className="w-full p-4 border border-gray-300 rounded-xl text-base font-[inherit] transition-[border-color,box-shadow] duration-200 bg-gray-50 box-border min-h-[250px] resize-y focus:outline-none focus:border-brand focus:shadow-focus-ring focus:bg-white disabled:bg-gray-200 disabled:cursor-not-allowed"
                placeholder="문의 내용을 상세히 적어주세요."
                value={content}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {/* 하단 버튼 */}
            <div className="flex justify-center gap-4 mt-5 max-md:gap-3">
              <button
                type="button"
                className="px-7 py-3.5 rounded-xl font-semibold text-[1.05rem] cursor-pointer transition-all duration-200 border border-gray-300 bg-white text-gray-600 min-w-[120px] hover:bg-gray-100 max-md:flex-1 max-md:px-0 max-md:min-w-0 max-md:text-center"
                onClick={() => navigate(isEditMode ? `/boards/${boardId}` : '/boards')}
              >
                취소
              </button>
              <button
                type="submit"
                className="px-7 py-3.5 rounded-xl font-semibold text-[1.05rem] cursor-pointer transition-all duration-200 border-none bg-gradient-to-br from-brand-gradient-from to-brand-gradient-to text-white shadow-brand-sm min-w-[120px] hover:not-disabled:-translate-y-0.5 hover:not-disabled:shadow-brand-md disabled:bg-gray-400 disabled:bg-none disabled:shadow-none disabled:cursor-not-allowed max-md:flex-1 max-md:px-0 max-md:min-w-0 max-md:text-center"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? isEditMode
                    ? '수정 중...'
                    : '등록 중...'
                  : isEditMode
                    ? '수정완료'
                    : '등록하기'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BoardWrite;
