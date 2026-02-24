import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CustomToast from '#shared/toast';
import { useAuthStore, authService } from '#entities/auth';
import axiosInstance from '#shared/api';
import { useTranslation } from 'i18nexus';
import Header, { extractRoleFromToken } from '#widgets/header';
import './index.css';

const BoardDetail = () => {
  const { t } = useTranslation();
  const { boardId } = useParams();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  const [replyContent, setReplyContent] = useState('');
  const { accessToken, clearAuth } = useAuthStore();

  const isAdmin = useMemo(() => {
    const role = extractRoleFromToken(accessToken);
    return role === 'ROLE_ADMIN';
  }, [accessToken]);

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
  const fetchPost = useCallback(async () => {
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
          CustomToast.error(t('게시글을 불러올 권한이 없거나 삭제된 게시글입니다.'));
          navigate('/board');
        }
      } else {
        CustomToast.error(t('서버와 통신 중 문제가 발생했습니다.'));
        navigate('/board');
      }
    } finally {
      setLoading(false);
    }
  }, [boardId, navigate, clearAuth]);
  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const handleDelete = async () => {
    if (!window.confirm('정말로 이 게시글을 삭제하시겠습니까?')) return;

    try {
      await axiosInstance.delete(`/board/delete/${boardId}`);
      CustomToast.success(t('게시글이 삭제되었습니다.'));
      navigate('/board', { replace: true });
    } catch (error) {
      if (error.response?.status === 401) {
        CustomToast.error(t('다시 로그인해주세요.'));
        clearAuth();
        navigate('/login', { replace: true });
      } else if (error.response?.status === 403) {
        const errorMessage =
          error.response.data?.message ||
          '삭제 권한이 없거나 이미 답변이 달린 글은 삭제할 수 없습니다.';
        CustomToast.error(t(errorMessage));
      } else {
        CustomToast.error(t('게시글 삭제 중 오류가 발생했습니다.'));
      }
      // console.error('Delete error:', error);
    }
  };

  const handleEdit = () => {
    navigate(`/board/edit/${boardId}`);
  };
  const handleReplySubmit = async () => {
    if (!replyContent.trim()) {
      CustomToast.error(t('글 내용을 입력해주세요.'));
      return;
    }

    try {
      // API 명세에 맞춰 RequestBody 객체로 전송
      await axiosInstance.post(`/board/reply/${boardId}`, { content: replyContent });
      CustomToast.success(t('댓글이 등록되었습니다.'));
      setReplyContent(''); // 텍스트 에어리어 초기화
      fetchPost(); // 최신 댓글 데이터 불러오기
    } catch (error) {
      // console.error(error);
      if (error.response?.status === 403) {
        CustomToast.error(t('댓글을 작성할 권한이 없습니다.'));
      } else {
        CustomToast.error(t('댓글 등록 중 오류가 발생했습니다.'));
      }
    }
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
              <span className="meta-date">{formatDate(post.createdAt)}</span>
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
          {isAdmin && (
            <div className="admin-reply-form">
              <h4 className="admin-reply-title">관리자 답변 작성</h4>
              <textarea
                className="admin-reply-textarea"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="사용자 문의에 대한 답변 내용을 입력하세요."
                rows={4}
              />
              <div className="admin-reply-actions">
                <button className="btn-reply-submit" onClick={handleReplySubmit}>
                  답변 등록
                </button>
              </div>
            </div>
          )}
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
