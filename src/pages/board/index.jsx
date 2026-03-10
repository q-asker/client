import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '#entities/auth';
import Header from '#widgets/header';
import './index.css';

// 유지보수를 위해 페이지 사이즈를 상수로 분리
const PAGE_SIZE = 10;

const Board = () => {
  const navigate = useNavigate();
  const accessToken = useAuthStore((state) => state.accessToken);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0); // 전체 게시글 수 상태 추가

  const getBaseUrl = () => {
    const baseUrl = import.meta.env.VITE_BASE_URL || '';
    return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  };

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const fetchPosts = useCallback(async (page) => {
    setLoading(true);
    setError(null);
    try {
      // 상수로 분리한 PAGE_SIZE 적용
      const response = await fetch(
        `${getBaseUrl()}/boards?page=${page}&size=${PAGE_SIZE}&sort=createdAt,desc`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        },
      );

      if (!response.ok) throw new Error('데이터를 불러오는데 실패했습니다.');

      const data = await response.json();
      setPosts(data.posts || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0); // 백엔드 응답에서 전체 개수 저장
    } catch (err) {
      // console.error(err);
      setError('게시글 목록을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts(currentPage);
  }, [fetchPosts, currentPage]);

  const handleWriteClick = () => {
    if (!accessToken) {
      if (window.confirm('로그인이 필요한 서비스입니다.\n로그인 페이지로 이동하시겠습니까?')) {
        navigate('/login');
      }
      return;
    }
    navigate('/boards/write');
  };

  return (
    <div className="board-container-wrapper">
      <Header
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <div className="board-container">
        <div className="board-header">
          <div className="header-content">
            <h1>문의 게시판</h1>
            <p>서비스 이용 중 궁금한 점이나 건의사항을 자유롭게 남겨주세요</p>
          </div>
          {posts.length > 0 && (
            <div className="header-actions">
              <button className="create-board-btn" onClick={handleWriteClick}>
                문의하기
              </button>
            </div>
          )}
        </div>

        <div className="board-content-wrapper">
          {loading ? (
            <div className="loading-container">
              <div className="spinner" />
              <p>데이터를 불러오는 중...</p>
            </div>
          ) : error ? (
            <div className="empty-history">
              <p className="error-text">{error}</p>
            </div>
          ) : posts.length > 0 ? (
            <div className="board-list-section">
              <div className="list-header">
                <span className="col-id">번호</span>
                <span className="col-title">제목</span>
                <span className="col-author">작성자</span>
                <span className="col-date">작성일</span>
                <span className="col-view">조회수</span>
                <span className="col-status">상태</span>
              </div>

              <ul className="inquiry-list">
                {posts.map((post, index) => {
                  const virtualNumber =
                    totalElements > 0
                      ? totalElements - currentPage * PAGE_SIZE - index
                      : currentPage * PAGE_SIZE + index + 1;

                  return (
                    <li key={post.boardId} className="inquiry-item">
                      <span className="col-id">{virtualNumber}</span>
                      <span className="col-title">
                        <Link to={`/boards/${post.boardId}`}>{post.title}</Link>
                      </span>
                      <span className="col-author">{post.userName}</span>{' '}
                      <span className="col-date">{formatDate(post.createdAt)}</span>
                      <span className="col-view">{post.viewCount || 0}</span>
                      <span className="col-status">
                        <span
                          className={`status-badge ${post.status === 'ANSWERED' ? 'completed' : 'created'}`}
                        >
                          {post.status || '대기중'}
                        </span>
                      </span>
                    </li>
                  );
                })}
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
            </div>
          ) : (
            <div className="empty-history">
              <div className="empty-icon">📋</div>
              <h3>아직 등록된 문의가 없습니다</h3>
              <p>궁금한 점이나 건의사항을 남겨주세요!</p>
              <button className="create-board-btn" onClick={handleWriteClick}>
                문의 작성하기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Board;
