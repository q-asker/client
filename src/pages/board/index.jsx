import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '#entities/auth'; // [수정] 인증 스토어 import
import './index.css';

const Board = () => {
  const navigate = useNavigate();

  // [수정] 전역 상태(Store)에서 accessToken 가져오기
  // 이제 localStorage를 직접 뒤지지 않고, 앱이 알고 있는 로그인 상태를 확인합니다.
  const accessToken = useAuthStore((state) => state.accessToken);

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // 1. URL 생성 유틸리티
  const getBaseUrl = () => {
    const baseUrl = import.meta.env.VITE_BASE_URL || '';
    return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  };

  // 2. 날짜 포맷팅 함수
  const formatDate = (isoString) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // 3. 데이터 가져오기
  const fetchPosts = useCallback(async (page) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${getBaseUrl()}/board?page=${page}&size=10&sort=createdAt,desc`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error('데이터를 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setPosts(data.posts);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error(err);
      setError('게시글 목록을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts(currentPage);
  }, [fetchPosts, currentPage]);

  // 4. 문의하기 버튼 핸들러 (수정됨)
  const handleWriteClick = () => {
    // [수정] 스토어에 있는 accessToken 값으로 로그인 여부 판단
    const isLoggedIn = !!accessToken;

    if (!isLoggedIn) {
      const confirmLogin = window.confirm(
        '로그인이 필요한 서비스입니다.\n로그인 페이지로 이동하시겠습니까?',
      );
      if (confirmLogin) {
        // 로그인 페이지로 이동
        navigate('/login');
        // 만약 제공해주신 useLogin 로직처럼 바로 외부 로그인 URL로 보내야 한다면
        // 아래 코드를 사용하세요. (보통은 위 navigate('/login')을 씁니다)
        // window.location.assign(buildLoginUrl());
      }
      return;
    }

    // 로그인 상태라면 글쓰기 페이지로 이동
    navigate('/board/write');
  };

  return (
    <div className="board-page-wrapper">
      {/* 1. 메인 컨텐츠 영역 */}
      <div className="board-main-card">
        <div className="board-header">
          <h1 className="board-title">📞 문의 게시판</h1>
          <p className="board-subtitle">
            서비스 이용 중 궁금한 점이나 건의사항을 자유롭게 남겨주세요.
          </p>
        </div>

        <div className="board-content">
          <div className="list-header">
            <span className="col-id">번호</span>
            <span className="col-title">제목</span>
            <span className="col-author">작성자</span>
            <span className="col-date">작성일</span>
            <span className="col-status">상태</span>
          </div>

          {loading ? (
            <div className="loading-state">데이터를 불러오는 중...</div>
          ) : error ? (
            <div className="error-state">{error}</div>
          ) : posts.length > 0 ? (
            <>
              <ul className="inquiry-list">
                {posts.map((post) => (
                  <li key={post.boardId} className="inquiry-item">
                    <span className="col-id">{post.boardId}</span>

                    <span className="col-title">
                      <Link to={`/board/${post.boardId}`}>
                        {post.title}
                        {post.viewCount > 0 && (
                          <span className="view-count"> ({post.viewCount})</span>
                        )}
                      </Link>
                    </span>

                    <span className="col-author">{post.userName}</span>
                    <span className="col-date">{formatDate(post.createdAt)}</span>

                    <span className="col-status">
                      <span
                        className={`status-badge ${
                          post.status === 'ANSWERED' ? 'done' : 'pending'
                        }`}
                      >
                        {post.status || '대기중'}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>

              <div className="pagination">
                <button disabled={currentPage === 0} onClick={() => setCurrentPage((p) => p - 1)}>
                  &lt; 이전
                </button>
                <span className="page-info">
                  {currentPage + 1} / {totalPages === 0 ? 1 : totalPages}
                </span>
                <button
                  disabled={currentPage + 1 >= totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  다음 &gt;
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <span className="emoji">📭</span>
              <p>아직 등록된 문의가 없습니다.</p>
            </div>
          )}
        </div>
      </div>

      {/* 2. 하단 액션 영역 */}
      <div className="board-footer-card">
        <div className="footer-content">
          <div className="footer-text">
            <strong>문의 작성 가이드</strong>
            <p>욕설이나 비방은 제재될 수 있으며, 답변에는 시간이 소요될 수 있습니다.</p>
          </div>
          {/* onClick 핸들러 연결 */}
          <button type="button" className="custom-button primary" onClick={handleWriteClick}>
            ✏️ 문의하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default Board;
