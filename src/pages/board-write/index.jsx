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
      // 1. 현재 토큰으로 최초 요청 시도
      let response = await postBoardRequest(currentToken);

      // 2. 401 에러 발생 시 (Access Token 만료 의심)
      if (response.status === 401) {
        try {
          // 백그라운드에서 Refresh API 호출하여 토큰 갱신 시도
          await authService.refresh();

          // 갱신 성공 시, 스토어에서 새로 발급받은 토큰을 꺼내옴
          currentToken = useAuthStore.getState().accessToken;

          // 3. 새로운 토큰으로 원래 하려던 글쓰기 요청 재시도
          response = await postBoardRequest(currentToken);
        } catch (refreshError) {
          // 4. Refresh API마저 에러가 났다면 (Refresh Token 만료)
          console.error('토큰 갱신 실패:', refreshError);
          alert('인증이 완전히 만료되었습니다. 다시 로그인해주세요.');
          clearAuth();
          navigate('/login', { replace: true });
          return; // 함수 즉시 종료
        }
      }

      // 재시도까지 거쳤는데도 200번대 응답이 아니면 일반 에러 처리
      if (!response.ok) {
        throw new Error('게시글 등록에 실패했습니다.');
      }

      // 성공 시 목록으로 이동
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
