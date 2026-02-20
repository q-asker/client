import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '#widgets/header';
import './index.css';

const BoardDetail = () => {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  // 환경변수에서 Base URL 가져오기
  const getBaseUrl = () => {
    const baseUrl = import.meta.env.VITE_BASE_URL || '';
    return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  };

  // 날짜 포맷터
  const formatDate = (isoString) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`${getBaseUrl()}/board/${boardId}`);
        if (!response.ok) throw new Error('게시글을 불러올 수 없습니다.');

        const data = await response.json();
        setPost(data); // SinglePostResponse 데이터
      } catch (error) {
        alert(error.message);
        navigate('/board'); // 에러 시 목록으로 이동
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [boardId, navigate]);

  if (loading) return <div className="loading-wrapper">로딩 중...</div>;
  if (!post) return null;

  return (
    <>
      <Header
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <div className="board-detail-container">
        {/* 상세 내용 카드 */}
        <div className="detail-card">
          <div className="detail-header">
            <div className="detail-category">문의 게시판</div>
            <h1 className="detail-title">{post.title}</h1>
            <div className="detail-meta">
              {/* 백엔드 DTO 필드명이 username 이므로 이에 맞춤 */}
              <span className="meta-author">{post.username}</span>
              <span className="meta-divider">|</span>
              <span className="meta-date">{formatDate(post.createAt)}</span>
              <span className="meta-divider">|</span>
              <span className="meta-views">조회수 {post.viewCount || 0}</span>
            </div>
          </div>

          <div className="detail-content">{post.content}</div>
        </div>

        {/* 💬 댓글 영역 추가 */}
        <div className="replies-section">
          <h3 className="replies-title">
            댓글 <span className="replies-count">{post.replies?.length || 0}</span>
          </h3>

          <div className="replies-list">
            {post.replies && post.replies.length > 0 ? (
              post.replies.map((reply, index) => (
                <div key={index} className="reply-item">
                  <div className="reply-content">{reply}</div>
                </div>
              ))
            ) : (
              <div className="empty-reply">아직 등록된 댓글이 없습니다.</div>
            )}
          </div>
        </div>

        {/* 하단 버튼 영역 */}
        <div className="detail-actions">
          <button className="btn-back" onClick={() => navigate('/board')}>
            목록으로
          </button>
        </div>
      </div>
    </>
  );
};

export default BoardDetail;
