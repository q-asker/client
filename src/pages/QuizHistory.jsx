import { useTranslation } from "i18nexus";
import Header from "#components/header";
import axiosInstance from "#shared/api";
import CustomToast from "#shared/toast";
import { trackQuizHistoryEvents } from "#utils/analytics";
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./QuizHistory.css";

const QuizHistory = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [quizHistory, setQuizHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 체류 시간 추적을 위한 ref
  const startTimeRef = useRef(Date.now());

  // 퀴즈 기록 불러오기
  const loadQuizHistory = () => {
    try {
      const history = JSON.parse(localStorage.getItem("quizHistory") || "[]");

      setQuizHistory(history);
      return history;
    } catch (error) {
      console.error(t("퀴즈 기록 불러오기 실패:"), error);
      CustomToast.error(t("기록을 불러오는데 실패했습니다."));
      return [];
    } finally {
      setLoading(false);
    }
  };

  // 사이드바 토글
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  // 페이지 로드 시 기록 불러오기
  useEffect(() => {
    loadQuizHistory();
  }, []);

  // 사이드바 외부 클릭 감지
  useEffect(() => {
    const handler = (e) => {
      const sidebar = document.getElementById("sidebar");
      const btn = document.getElementById("menuButton");
      if (
        sidebar &&
        !sidebar.contains(e.target) &&
        btn &&
        !btn.contains(e.target)
      ) {
        setIsSidebarOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // 해설 페이지로 이동
  const navigateToExplanation = async (record) => {
    if (record.status !== "completed") {
      CustomToast.info(t("완료된 퀴즈만 해설을 볼 수 있습니다."));
      return;
    }

    // 해설 보기 버튼 클릭 추적
    trackQuizHistoryEvents.clickViewExplanation(
      record.problemSetId,
      record.quizLevel,
      record.score
    );

    setExplanationLoading(true);

    try {
      // 저장된 퀴즈 데이터가 있는지 확인
      if (record.quizData && record.quizData.length > 0) {
        // 해설 데이터만 API로 가져오기
        const explanationResponse = await axiosInstance.get(
          `/explanation/${record.problemSetId}`
        );
        const explanationData = explanationResponse.data;

        const stateData = {
          quizzes: record.quizData, // 저장된 퀴즈 데이터 사용 (사용자 답안 포함)
          explanation: explanationData,
          uploadedUrl: record.uploadedUrl,
        };

        // 해설 페이지로 이동
        navigate(`/explanation/${record.problemSetId}`, {
          state: stateData,
        });
      } else {
        // 1. 문제 데이터 가져오기
        const quizResponse = await axiosInstance.get(
          `/problem-set/${record.problemSetId}`
        );
        const quizData = quizResponse.data;

        // 2. 해설 데이터 가져오기
        const explanationResponse = await axiosInstance.get(
          `/explanation/${record.problemSetId}`
        );
        const explanationData = explanationResponse.data;

        // 3. 최종 전달할 데이터 확인
        const finalQuizzes = quizData.problems || quizData.quizzes || [];

        const stateData = {
          quizzes: finalQuizzes,
          explanation: explanationData,
          uploadedUrl: record.uploadedUrl,
        };

        // 4. 해설 페이지로 이동
        navigate(`/explanation/${record.problemSetId}`, {
          state: stateData,
        });
      }
    } catch (error) {
      console.error(t("해설 데이터 로딩 실패:"), error);
      console.error(t("에러 상세 정보:"), {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config,
      });
      CustomToast.error(
        t("해설을 불러오는데 실패했습니다. 문제가 삭제되었을 수 있습니다.")
      );
    } finally {
      setExplanationLoading(false);
    }
  };

  // 퀴즈 다시 풀기 (문제 생성 페이지로 이동)
  const navigateToQuiz = (record) => {
    // 퀴즈 상태에 따라 다른 이벤트 추적
    if (record.status === "completed") {
      // 완료된 퀴즈 다시 풀기
      trackQuizHistoryEvents.clickRetryQuiz(
        record.problemSetId,
        record.quizLevel,
        record.score
      );
    } else {
      // 미완료 퀴즈 이어서 풀기
      trackQuizHistoryEvents.clickResumeQuiz(
        record.problemSetId,
        record.quizLevel,
        record.questionCount
      );
    }

    navigate(`/quiz/${record.problemSetId}`, {
      state: {
        uploadedUrl: record.uploadedUrl,
      },
    });
  };

  // 기록 삭제
  const deleteQuizRecord = (problemSetId) => {
    if (window.confirm(t("이 기록을 삭제하시겠습니까?"))) {
      try {
        const record = quizHistory.find(
          (item) => item.problemSetId === problemSetId
        );

        // 삭제 이벤트 추적
        trackQuizHistoryEvents.deleteQuizRecord(
          problemSetId,
          record?.status || "unknown",
          record?.quizLevel || "unknown"
        );

        const updatedHistory = quizHistory.filter(
          (item) => item.problemSetId !== problemSetId
        );
        localStorage.setItem("quizHistory", JSON.stringify(updatedHistory));
        setQuizHistory(updatedHistory);
        CustomToast.success(t("기록이 삭제되었습니다."));
      } catch (error) {
        console.error(t("기록 삭제 실패:"), error);
        CustomToast.error(t("기록 삭제에 실패했습니다."));
      }
    }
  };

  // 모든 기록 삭제
  const clearAllHistory = () => {
    if (
      window.confirm(
        t("모든 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")
      )
    ) {
      try {
        const completed = quizHistory.filter(
          (item) => item.status === "completed"
        );

        // 전체 삭제 이벤트 추적
        trackQuizHistoryEvents.clearAllHistory(
          quizHistory.length,
          completed.length
        );

        localStorage.removeItem("quizHistory");
        setQuizHistory([]);
        CustomToast.success(t("모든 기록이 삭제되었습니다."));
      } catch (error) {
        console.error(t("전체 기록 삭제 실패:"), error);
        CustomToast.error(t("기록 삭제에 실패했습니다."));
      }
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 통계 계산
  const getStats = () => {
    const completed = quizHistory.filter((item) => item.status === "completed");
    const totalQuizzes = quizHistory.length;
    const completedQuizzes = completed.length;
    const averageScore =
      completed.length > 0
        ? Math.round(
            completed.reduce((sum, item) => sum + item.score, 0) /
              completed.length
          )
        : 0;

    const stats = {
      totalQuizzes,
      completedQuizzes,
      averageScore,
      completionRate:
        totalQuizzes > 0
          ? Math.round((completedQuizzes / totalQuizzes) * 100)
          : 0,
    };

    return stats;
  };

  const stats = getStats();

  // 페이지 진입 및 체류 시간 추적
  useEffect(() => {
    if (!loading && quizHistory.length >= 0) {
      // 페이지 진입 이벤트 추적
      trackQuizHistoryEvents.viewHistory(
        stats.totalQuizzes,
        stats.completedQuizzes,
        stats.averageScore
      );
    }
  }, [loading, stats.totalQuizzes, stats.completedQuizzes, stats.averageScore]);

  // 페이지 떠날 때 체류 시간 추적
  useEffect(() => {
    return () => {
      const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
      if (timeSpent > 3) {
        // 3초 이상 머문 경우만 추적
        trackQuizHistoryEvents.trackTimeSpent(timeSpent, quizHistory.length);
      }
    };
  }, [quizHistory.length]);

  const handleCreateFromEmpty = () => {
    trackQuizHistoryEvents.clickCreateFromEmpty();
    navigate("/");
  };

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
            <p>{t("기록을 불러오는 중...")}</p>
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
              <h1>{t("내 퀴즈 기록")}</h1>
              <p>{t("지금까지 만들고 푼 퀴즈들을 확인해보세요")}</p>
            </div>

            {quizHistory.length > 0 && (
              <div className="header-actions">
                <button className="clear-all-btn" onClick={clearAllHistory}>
                  {t("전체 삭제")}
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
                    <div className="stat-label">{t("총 퀴즈 수")}</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">✅</div>
                  <div className="stat-content">
                    <div className="stat-number">{stats.completedQuizzes}</div>
                    <div className="stat-label">{t("완료한 퀴즈")}</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">📊</div>
                  <div className="stat-content">
                    <div className="stat-number">{stats.completionRate}%</div>
                    <div className="stat-label">{t("완료율")}</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">🏆</div>
                  <div className="stat-content">
                    <div className="stat-number">
                      {stats.averageScore}
                      {t("점")}
                    </div>
                    <div className="stat-label">{t("평균 점수")}</div>
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
                <h3 className="storage-notice-title">{t("퀴즈 보관 정책")}</h3>
              </div>
              <div className="storage-notice-content">
                {t("• 퀴즈 기록은 최대")}
                <strong>{t("20개")}</strong>
                {t("까지 자동으로 저장됩니다")}
                <br />
                {t("• 생성된 퀴즈는")}{" "}
                <strong>{t("24시간 후 서버에서 자동 삭제")}</strong>
                {t("되어 해설을 볼 수\n              없게 됩니다")}
                <br />
                {t(
                  "• 중요한 퀴즈는 생성 후 24시간 내에 완료하여 기록을\n              남겨두시기 바랍니다"
                )}
              </div>
            </div>
          )}

          {/* 기록 목록 */}
          <div className="quiz-history-content">
            {quizHistory.length === 0 ? (
              <div className="empty-history">
                <div className="empty-icon">📋</div>
                <h3>{t("아직 만든 퀴즈가 없습니다")}</h3>
                <p>{t("퀴즈를 만들어서 문제를 풀어보세요!")}</p>
                <button
                  className="create-quiz-btn"
                  onClick={handleCreateFromEmpty}
                >
                  {t("퀴즈 만들기")}
                </button>
              </div>
            ) : (
              <div className="history-list">
                {quizHistory.map((record) => (
                  <div
                    key={record.problemSetId}
                    className={`history-item ${record.status}`}
                  >
                    <div className="history-main">
                      <div className="history-title">
                        <span className="file-icon">📄</span>
                        <span className="history-file-name">
                          {record.fileName}
                        </span>
                        <span className={`status-badge ${record.status}`}>
                          {record.status === "completed"
                            ? t("완료")
                            : t("미완료")}
                        </span>
                      </div>

                      <div className="history-details">
                        <span className="detail-item">
                          📝 {record.questionCount}
                          {t("문제")}
                        </span>
                        <span className="detail-item">
                          🎯 {record.quizLevel}
                        </span>
                        {record.status === "completed" && (
                          <>
                            <span className="detail-item score">
                              🏆 {record.score}
                              {t("점 (")}
                              {record.correctCount}/{record.totalQuestions})
                            </span>
                            <span className="detail-item">
                              ⏱️ {record.totalTime}
                            </span>
                          </>
                        )}
                      </div>

                      <div className="history-date">
                        <div>
                          {t("생성:")}
                          {formatDate(record.createdAt)}
                        </div>
                        {record.completedAt && (
                          <div>
                            {t("완료:")}
                            {formatDate(record.completedAt)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="history-actions">
                      {record.status === "completed" ? (
                        <>
                          <button
                            className="action-btn view-btn"
                            onClick={() => navigateToExplanation(record)}
                            disabled={explanationLoading}
                          >
                            {explanationLoading ? t("로딩...") : t("해설 보기")}
                          </button>
                          <button
                            className="action-btn retry-btn"
                            onClick={() => navigateToQuiz(record)}
                          >
                            {t("다시 풀기")}
                          </button>
                        </>
                      ) : (
                        <button
                          className="action-btn quiz-btn"
                          onClick={() => navigateToQuiz(record)}
                        >
                          {t("퀴즈 풀기")}
                        </button>
                      )}
                      <button
                        className="action-btn delete-btn"
                        onClick={() => deleteQuizRecord(record.problemSetId)}
                      >
                        {t("삭제")}
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
