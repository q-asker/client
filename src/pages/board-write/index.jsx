import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '#widgets/header';
import CustomToast from '#shared/toast';
import axiosInstance from '#shared/api';
import { useAuthStore } from '#entities/auth';
import { useTranslation } from 'i18nexus';
import './index.css';

const MAX_TITLE_LENGTH = 100;
const MAX_CONTENT_LENGTH = 5000;

const BoardWrite = () => {
  const { t } = useTranslation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const navigate = useNavigate();
  const { boardId } = useParams();

  const isEditMode = !!boardId;

  // 초기값은 비워두고 백엔드에서 받아와서 채웁니다.
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

        const { data } = await axiosInstance.get(`/boards/${boardId}`);

        if (!data.isWriter) {
          CustomToast.error(t('수정 권한이 없습니다.'));
          navigate(`/boards/${boardId}`, { replace: true });
          return;
        }

        setTitle(data.title);
        setContent(data.content);
      } catch (error) {
        CustomToast.error(t('게시글 정보를 확인할 수 없습니다.'));
        navigate('/boards', { replace: true });
      } finally {
        setIsCheckingAccess(false);
      }
    };

    fetchPostAndVerify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  const handleSubmit = async (e) => {
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
    } catch (error) {
      const status = error?.response?.status;
      if (status === 401) {
        CustomToast.error(t('다시 로그인해주세요.'));
        clearAuth();
        navigate('/login', { replace: true });
      } else if (status === 403) {
        const errorMessage =
          error?.response?.data?.message ||
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
      <div
        className="board-container-wrapper"
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
      >
        <div className="loading-wrapper">권한 확인 중...</div>
      </div>
    );
  }

  return (
    <div className="board-container-wrapper">
      <Header
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <div className="board-write-container">
        <div className="write-card">
          <div className="write-header">
            <h1 className="write-header-title">
              {isEditMode ? '✍️ 문의 수정하기' : '✍️ 문의하기'}
            </h1>
            <p className="write-header-subtitle">
              {isEditMode ? '수정할 내용을 입력해주세요' : '정확한 답변을 위해 상세히 적어주세요'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="write-form">
            <div className="form-group">
              <label htmlFor="title">제목</label>
              <input
                type="text"
                id="title"
                className="form-input"
                placeholder="제목을 입력해주세요"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="content">내용</label>
              <textarea
                id="content"
                className="form-textarea"
                placeholder="문의 내용을 상세히 적어주세요."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => navigate(isEditMode ? `/boards/${boardId}` : '/boards')}
              >
                취소
              </button>
              <button type="submit" className="btn-submit" disabled={isSubmitting}>
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
