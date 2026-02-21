import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '#widgets/header';
import { useAuthStore, authService } from '#entities/auth';
import './index.css';

const BoardWrite = () => {
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

  const getBaseUrl = () => {
    const baseUrl = import.meta.env.VITE_BASE_URL || '';
    return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  };

  // 💡 수정 모드일 때 백엔드에 데이터와 권한을 직접 요청합니다.
  useEffect(() => {
    if (!isEditMode) return;

    const fetchPostAndVerify = async () => {
      try {
        if (!accessToken) {
          alert('로그인이 필요합니다.');
          navigate('/login', { replace: true });
          return;
        }

        // 백엔드에 토큰을 보내 권한 검증 및 최신 데이터를 요청합니다.
        const response = await fetch(`${getBaseUrl()}/board/${boardId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!response.ok) throw new Error('데이터 로드 실패');

        const data = await response.json();

        // 백엔드가 권한이 없다고 판단하면 바로 쫓아냅니다.
        if (!data.isWriter) {
          alert('수정 권한이 없습니다.');
          navigate(`/board/${boardId}`, { replace: true });
          return;
        }

        // 권한이 확인되면 폼에 데이터를 채웁니다.
        setTitle(data.title);
        setContent(data.content);
      } catch (error) {
        alert('게시글 정보를 확인할 수 없습니다.');
        navigate('/board', { replace: true });
      } finally {
        setIsCheckingAccess(false);
      }
    };

    fetchPostAndVerify();
  }, [boardId, isEditMode, navigate, accessToken]);

  const postBoardRequest = async (tokenToUse) => {
    const url = isEditMode
      ? `${getBaseUrl()}/board/update/${boardId}`
      : `${getBaseUrl()}/board/create`;

    return await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenToUse}`,
      },
      body: JSON.stringify({ title, content }),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let currentToken = accessToken;

    if (!currentToken) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }
    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      let response = await postBoardRequest(currentToken);

      if (response.status === 401) {
        try {
          await authService.refresh();
          currentToken = useAuthStore.getState().accessToken;
          response = await postBoardRequest(currentToken);
        } catch (refreshError) {
          console.error('토큰 갱신 실패:', refreshError);
          alert('다시 로그인해주세요.');
          clearAuth();
          navigate('/login', { replace: true });
          return;
        }
      }

      if (!response.ok) throw new Error(`게시글 ${isEditMode ? '수정' : '등록'}에 실패했습니다.`);

      alert(`게시글이 성공적으로 ${isEditMode ? '수정' : '등록'}되었습니다.`);
      navigate(isEditMode ? `/board/${boardId}` : '/board', { replace: true });
    } catch (error) {
      console.error(error);
      alert('오류가 발생했습니다. 다시 시도해주세요.');
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
                onClick={() => navigate(isEditMode ? `/board/${boardId}` : '/board')}
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
