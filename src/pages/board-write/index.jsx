import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './index.css';
import { useAuthStore, authService } from '#entities/auth'; // authService 추가

const BoardWrite = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { accessToken, clearAuth } = useAuthStore();

  const getBaseUrl = () => {
    const baseUrl = import.meta.env.VITE_BASE_URL || '';
    return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  };

  // API 호출 로직을 재사용하기 위해 분리합니다.
  const postBoardRequest = async (tokenToUse) => {
    return await fetch(`${getBaseUrl()}/board/create`, {
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

      if (!response.ok) {
        throw new Error('게시글 등록에 실패했습니다.');
      }

      alert('게시글이 등록되었습니다.');
      navigate('/board');
    } catch (error) {
      console.error(error);
      alert('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="board-write-container">
      <div className="write-card">
        <h1 className="write-header-title">✍️ 문의하기</h1>

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
            <button type="button" className="btn-cancel" onClick={() => navigate('/board')}>
              취소
            </button>
            <button type="submit" className="btn-submit" disabled={isSubmitting}>
              {isSubmitting ? '등록 중...' : '등록하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BoardWrite;
