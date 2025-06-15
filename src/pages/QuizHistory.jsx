import CustomToast from "#shared/toast";
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import axiosInstance from "#shared/api";
import { trackQuizHistoryEvents } from "../utils/analytics";
import "./QuizHistory.css";

const QuizHistory = () => {
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
      console.log("=== 퀴즈 히스토리 전체 데이터 ===");
      console.log("전체 기록 배열:", history);
      console.log("총 기록 개수:", history.length);

      // 각 기록 상세 정보 출력
      history.forEach((record, index) => {
        console.log(`--- 기록 ${index + 1} ---`);
        console.log("문제셋 ID:", record.problemSetId);
        console.log("파일명:", record.fileName);
        console.log("문제 개수:", record.questionCount);
        console.log("퀴즈 레벨:", record.quizLevel);
        console.log("점수:", record.score);
        console.log("상태:", record.status);
        console.log("생성일:", record.createdAt);
        console.log("완료일:", record.completedAt);
        console.log("업로드 URL:", record.uploadedUrl);
        console.log("퀴즈 데이터 존재 여부:", !!record.quizData);
        console.log("퀴즈 데이터 길이:", record.quizData?.length || 0);
        if (record.quizData) {
          console.log("퀴즈 데이터:", record.quizData);
        }
        console.log("전체 데이터:", record);
        console.log("------------------");
      });

      setQuizHistory(history);
      return history;
    } catch (error) {
      console.error("퀴즈 기록 불러오기 실패:", error);
      CustomToast.error("기록을 불러오는데 실패했습니다.");
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
      CustomToast.info("완료된 퀴즈만 해설을 볼 수 있습니다.");
      return;
    }

    // 해설 보기 버튼 클릭 추적
    trackQuizHistoryEvents.clickViewExplanation(
      record.problemSetId,
      record.quizLevel,
      record.score
    );

    console.log("=== 해설 페이지 이동 시작 ===");
    console.log("선택된 기록:", record);

    setExplanationLoading(true);

    try {
      // 저장된 퀴즈 데이터가 있는지 확인
      if (record.quizData && record.quizData.length > 0) {
        console.log("저장된 퀴즈 데이터 사용:");
        console.log("퀴즈 데이터:", record.quizData);
        console.log("퀴즈 데이터 길이:", record.quizData.length);

        // 해설 데이터만 API로 가져오기
        console.log(`API 호출: /explanation/${record.problemSetId}`);
        const explanationResponse = await axiosInstance.get(
          `/explanation/${record.problemSetId}`
        );
        const explanationData = explanationResponse.data;
        console.log("해설 데이터:", explanationData);

        const stateData = {
          quizzes: record.quizData, // 저장된 퀴즈 데이터 사용 (사용자 답안 포함)
          explanation: explanationData,
          uploadedUrl: record.uploadedUrl,
        };
        console.log("해설 페이지로 전달할 state 데이터:", stateData);

        // 해설 페이지로 이동
        navigate(`/explanation/${record.problemSetId}`, {
          state: stateData,
        });
      } else {
        console.log("저장된 퀴즈 데이터가 없음. API로 데이터 가져오기");

        // 1. 문제 데이터 가져오기
        console.log(`API 호출: /problem-set/${record.problemSetId}`);
        const quizResponse = await axiosInstance.get(
          `/problem-set/${record.problemSetId}`
        );
        const quizData = quizResponse.data;
        console.log("퀴즈 데이터 응답:", quizResponse);
        console.log("퀴즈 데이터:", quizData);

        // 2. 해설 데이터 가져오기
        console.log(`API 호출: /explanation/${record.problemSetId}`);
        const explanationResponse = await axiosInstance.get(
          `/explanation/${record.problemSetId}`
        );
        const explanationData = explanationResponse.data;
        console.log("해설 데이터 응답:", explanationResponse);
        console.log("해설 데이터:", explanationData);

        // 3. 최종 전달할 데이터 확인
        const finalQuizzes = quizData.problems || quizData.quizzes || [];
        console.log("최종 퀴즈 배열:", finalQuizzes);
        console.log("퀴즈 배열 길이:", finalQuizzes.length);

        const stateData = {
          quizzes: finalQuizzes,
          explanation: explanationData,
          uploadedUrl: record.uploadedUrl,
        };
        console.log("해설 페이지로 전달할 state 데이터:", stateData);

        // 4. 해설 페이지로 이동
        navigate(`/explanation/${record.problemSetId}`, {
          state: stateData,
        });
      }
    } catch (error) {
      console.error("해설 데이터 로딩 실패:", error);
      console.error("에러 상세 정보:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config,
      });
      CustomToast.error(
        "해설을 불러오는데 실패했습니다. 문제가 삭제되었을 수 있습니다."
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
    if (window.confirm("이 기록을 삭제하시겠습니까?")) {
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
        CustomToast.success("기록이 삭제되었습니다.");
      } catch (error) {
        console.error("기록 삭제 실패:", error);
        CustomToast.error("기록 삭제에 실패했습니다.");
      }
    }
  };

  // 모든 기록 삭제
  const clearAllHistory = () => {
    if (
      window.confirm(
        "모든 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
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
        CustomToast.success("모든 기록이 삭제되었습니다.");
      } catch (error) {
        console.error("전체 기록 삭제 실패:", error);
        CustomToast.error("기록 삭제에 실패했습니다.");
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

    console.log("=== 퀴즈 통계 정보 ===");
    console.log("전체 퀴즈 수:", stats.totalQuizzes);
    console.log("완료된 퀴즈 수:", stats.completedQuizzes);
    console.log("평균 점수:", stats.averageScore);
    console.log("완료율:", stats.completionRate + "%");
    console.log("완료된 퀴즈 배열:", completed);

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

  // 통계 카드 클릭 핸들러 추가
  const handleStatClick = (statType, statValue) => {
    trackQuizHistoryEvents.interactWithStats(statType, statValue);
  };

  // 빈 히스토리에서 퀴즈 만들기 클릭
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
            <p>기록을 불러오는 중...</p>
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

      <div className="quiz-history-container">
        <div className="quiz-history-header">
          <div className="header-content">
            <h1>내 퀴즈 기록</h1>
            <p>지금까지 만들고 푼 퀴즈들을 확인해보세요</p>
          </div>

          {quizHistory.length > 0 && (
            <div className="header-actions">
              <button className="clear-all-btn" onClick={clearAllHistory}>
                전체 삭제
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
                  <div className="stat-label">총 퀴즈 수</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-content">
                  <div className="stat-number">{stats.completedQuizzes}</div>
                  <div className="stat-label">완료한 퀴즈</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-content">
                  <div className="stat-number">{stats.completionRate}%</div>
                  <div className="stat-label">완료율</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">🏆</div>
                <div className="stat-content">
                  <div className="stat-number">{stats.averageScore}점</div>
                  <div className="stat-label">평균 점수</div>
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
              <h3 className="storage-notice-title">퀴즈 보관 정책</h3>
            </div>
            <div className="storage-notice-content">
              • 퀴즈 기록은 최대 <strong>20개</strong>까지 자동으로 저장됩니다
              <br />• 생성된 퀴즈는{" "}
              <strong>24시간 후 서버에서 자동 삭제</strong>되어 해설을 볼 수
              없게 됩니다
              <br />• 중요한 퀴즈는 생성 후 24시간 내에 완료하여 기록을
              남겨두시기 바랍니다
            </div>
          </div>
        )}

        {/* 기록 목록 */}
        <div className="quiz-history-content">
          {quizHistory.length === 0 ? (
            <div className="empty-history">
              <div className="empty-icon">📋</div>
              <h3>아직 만든 퀴즈가 없습니다</h3>
              <p>퀴즈를 만들어서 문제를 풀어보세요!</p>
              <button
                className="create-quiz-btn"
                onClick={handleCreateFromEmpty}
              >
                퀴즈 만들기
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
                      <span className="file-name">{record.fileName}</span>
                      <span className={`status-badge ${record.status}`}>
                        {record.status === "completed" ? "완료" : "미완료"}
                      </span>
                    </div>

                    <div className="history-details">
                      <span className="detail-item">
                        📝 {record.questionCount}문제
                      </span>
                      <span className="detail-item">🎯 {record.quizLevel}</span>
                      {record.status === "completed" && (
                        <>
                          <span className="detail-item score">
                            🏆 {record.score}점 ({record.correctCount}/
                            {record.totalQuestions})
                          </span>
                          <span className="detail-item">
                            ⏱️ {record.totalTime}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="history-date">
                      <div>생성: {formatDate(record.createdAt)}</div>
                      {record.completedAt && (
                        <div>완료: {formatDate(record.completedAt)}</div>
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
                          {explanationLoading ? "로딩..." : "해설 보기"}
                        </button>
                        <button
                          className="action-btn retry-btn"
                          onClick={() => navigateToQuiz(record)}
                        >
                          다시 풀기
                        </button>
                      </>
                    ) : (
                      <button
                        className="action-btn quiz-btn"
                        onClick={() => navigateToQuiz(record)}
                      >
                        퀴즈 풀기
                      </button>
                    )}
                    <button
                      className="action-btn delete-btn"
                      onClick={() => deleteQuizRecord(record.problemSetId)}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default QuizHistory;
