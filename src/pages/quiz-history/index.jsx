import { useTranslation } from 'i18nexus';
import Header from '#widgets/header';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuizHistory } from '#features/quiz-history';
import './index.css';

const QuizHistory = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    state: { quizHistory, loading, explanationLoading, isSidebarOpen, stats },
    actions: {
      toggleSidebar,
      setIsSidebarOpen,
      navigateToExplanation,
      navigateToQuiz,
      deleteQuizRecord,
      clearAllHistory,
      formatDate,
      handleCreateFromEmpty,
    },
  } = useQuizHistory({ t, navigate });

  if (loading) {
    return (
      <>
        <Header
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
          setIsSidebarOpen={setIsSidebarOpen}
        />

        <div className="quiz-history-container">
          <div className="loading-container">
            <div className="spinner" />
            <p>{t('기록을 불러오는 중...')}</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <div className="quiz-history-container-wrapper">
        <div className="quiz-history-container">
          <div className="quiz-history-header">
            <div className="header-content">
              <h1>{t('내 퀴즈 기록')}</h1>
              <p>{t('지금까지 만들고 푼 퀴즈들을 확인해보세요')}</p>
            </div>

            {quizHistory.length > 0 && (
              <div className="header-actions">
                <button className="clear-all-btn" onClick={clearAllHistory}>
                  {t('전체 삭제')}
                </button>
              </div>
            )}
          </div>

          {/* 통계 섹션 */}
          {quizHistory.length > 0 && (
            <div className="stats-section">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">📝</div>
                  <div className="stat-content">
                    <div className="stat-number">{stats.totalQuizzes}</div>
                    <div className="stat-label">{t('총 퀴즈 수')}</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">✅</div>
                  <div className="stat-content">
                    <div className="stat-number">{stats.completedQuizzes}</div>
                    <div className="stat-label">{t('완료한 퀴즈')}</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">📊</div>
                  <div className="stat-content">
                    <div className="stat-number">{stats.completionRate}%</div>
                    <div className="stat-label">{t('완료율')}</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">🏆</div>
                  <div className="stat-content">
                    <div className="stat-number">
                      {stats.averageScore}
                      {t('점')}
                    </div>
                    <div className="stat-label">{t('평균 점수')}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 퀴즈 보관 안내 */}
          {quizHistory.length > 0 && (
            <div className="storage-notice-section">
              <div className="storage-notice-header">
                <span className="storage-notice-icon">📋</span>
                <h3 className="storage-notice-title">{t('퀴즈 보관 정책')}</h3>
              </div>
              <div className="storage-notice-content">
                {t('• 퀴즈 기록은 최대')}
                <strong>{t('20개')}</strong>
                {t('까지 자동으로 저장됩니다')}
                <br />
                {t('• 생성된 퀴즈는')} <strong>{t('24시간 후 서버에서 자동 삭제')}</strong>
                {t('되어 해설을 볼 수\n              없게 됩니다')}
                <br />
                {t(
                  '• 중요한 퀴즈는 생성 후 24시간 내에 완료하여 기록을\n              남겨두시기 바랍니다',
                )}
              </div>
            </div>
          )}

          {/* 기록 목록 */}
          <div className="quiz-history-content">
            {quizHistory.length === 0 ? (
              <div className="empty-history">
                <div className="empty-icon">📋</div>
                <h3>{t('아직 만든 퀴즈가 없습니다')}</h3>
                <p>{t('퀴즈를 만들어서 문제를 풀어보세요!')}</p>
                <button className="create-quiz-btn" onClick={handleCreateFromEmpty}>
                  {t('퀴즈 만들기')}
                </button>
              </div>
            ) : (
              <div className="history-list">
                {quizHistory.map((record) => (
                  <div key={record.problemSetId} className={`history-item ${record.status}`}>
                    <div className="history-main">
                      <div className="history-title">
                        <span className="file-icon">📄</span>
                        <span className="history-file-name">{record.fileName}</span>
                        <span className={`status-badge ${record.status}`}>
                          {record.status === 'completed' ? t('완료') : t('미완료')}
                        </span>
                      </div>

                      <div className="history-details">
                        <span className="detail-item">
                          📝 {record.questionCount}
                          {t('문제')}
                        </span>
                        <span className="detail-item">🎯 {record.quizLevel}</span>
                        {record.status === 'completed' && (
                          <>
                            <span className="detail-item score">
                              🏆 {record.score}
                              {t('점 (')}
                              {record.correctCount}/{record.totalQuestions})
                            </span>
                            <span className="detail-item">⏱️ {record.totalTime}</span>
                          </>
                        )}
                      </div>

                      <div className="history-date">
                        <div>
                          {t('생성:')}
                          {formatDate(record.createdAt)}
                        </div>
                        {record.completedAt && (
                          <div>
                            {t('완료:')}
                            {formatDate(record.completedAt)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="history-actions">
                      {record.status === 'completed' ? (
                        <>
                          <button
                            className="action-btn view-btn"
                            onClick={() => navigateToExplanation(record)}
                            disabled={explanationLoading}
                          >
                            {explanationLoading ? t('로딩...') : t('해설 보기')}
                          </button>
                          <button
                            className="action-btn retry-btn"
                            onClick={() => navigateToQuiz(record)}
                          >
                            {t('다시 풀기')}
                          </button>
                        </>
                      ) : (
                        <button
                          className="action-btn quiz-btn"
                          onClick={() => navigateToQuiz(record)}
                        >
                          {t('퀴즈 풀기')}
                        </button>
                      )}
                      <button
                        className="action-btn delete-btn"
                        onClick={() => deleteQuizRecord(record.problemSetId)}
                      >
                        {t('삭제')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default QuizHistory;
