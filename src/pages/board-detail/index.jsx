import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '#widgets/header';
import { useAuthStore, authService } from '#entities/auth';
import axiosInstance from '#shared/api';
import './index.css';

const BoardDetail = () => {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  const { clearAuth } = useAuthStore();

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
        await authService.refresh();
      } catch (ignored) {}

      try {
        const response = await axiosInstance.get(`/board/${boardId}`);
        setPost(response.data);
      } catch (error) {
        if (error.response?.status === 401) {
          clearAuth();

          try {
            const fallbackResponse = await axiosInstance.get(`/board/${boardId}`, {
              skipAuthRefresh: true,
            });
            setPost(fallbackResponse.data);
          } catch (fallbackError) {
            alert('게시글을 불러올 권한이 없거나 삭제된 게시글입니다.');
            navigate('/board');
          }
        } else {
          alert('서버와 통신 중 문제가 발생했습니다.');
          navigate('/board');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [boardId, navigate, clearAuth]);

  const handleDelete = async () => {
    if (!window.confirm('정말로 이 게시글을 삭제하시겠습니까?')) return;

    try {
      await axiosInstance.delete(`/board/${boardId}`);
      alert('게시글이 삭제되었습니다.');
      navigate('/board', { replace: true });
    } catch (error) {
      if (error.response?.status === 401) {
        alert('인증이 만료되었습니다. 다시 로그인해주세요.');
        clearAuth();
        navigate('/login', { replace: true });
      } else {
        alert('오류가 발생했습니다. 다시 시도해주세요.');
      }
    }
  };

  const handleEdit = () => {
    navigate(`/board/edit/${boardId}`);
  };

  if (loading) return <div className="loading-wrapper">로딩 중...</div>;
  if (!post) return null;

  return (
    <div className="board-container-wrapper">
      <Header
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <div className="board-detail-container">
        <div className="detail-card">
          <div className="detail-header">
            <div className="detail-category">문의 게시판</div>
            <h1 className="detail-title">{post.title}</h1>
            <div className="detail-meta">
              <span className="meta-author">{post.username}</span>
              <span className="meta-divider">|</span>
              <span className="meta-date">{formatDate(post.createAt)}</span>
              <span className="meta-divider">|</span>
              <span className="meta-views">조회수 {post.viewCount || 0}</span>
            </div>
          </div>

          <div className="detail-content">{post.content}</div>
        </div>

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

        <div className="detail-actions">
          <div className="left-actions">
            <button className="btn-back" onClick={() => navigate('/board')}>
              목록으로
            </button>
            <button className="btn-write-new" onClick={() => navigate('/board/write')}>
              새 문의하기
            </button>
          </div>

          {post.isWriter && (
            <div className="author-actions">
              <button className="btn-edit" onClick={handleEdit}>
                수정하기
              </button>
              <button className="btn-delete" onClick={handleDelete}>
                삭제하기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BoardDetail;
