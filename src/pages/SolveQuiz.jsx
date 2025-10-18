import { useTranslation } from "i18nexus"; // SolveQuiz.jsx

import axiosInstance from "#shared/api";
import CustomToast from "#shared/toast";
import { trackQuizEvents } from "#utils/analytics";
import React, { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "./SolveQuiz.css";

const SolveQuiz = () => {
  const { t } = useTranslation();
  const { problemSetId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { uploadedUrl } = location.state || {};

  // States
  const [quizzes, setQuizzes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState("00:00:00");
  const [selectedOption, setSelectedOption] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const totalQuestions = quizzes.length;

  // Redirect if no problemSetId
  useEffect(() => {
    if (!problemSetId) {
      navigate("/");
    }
  }, [problemSetId, navigate]);

  // Fetch quiz data on mount
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await axiosInstance.get(`/problem-set/${problemSetId}`);
        const data = res.data;
        console.log(data);
        setQuizzes(data.quiz || []);

        // 퀴즈 시작 추적
        trackQuizEvents.startQuiz(problemSetId);
      } catch (err) {
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };

    if (problemSetId) {
      fetchQuiz();
    } else {
      setIsLoading(false);
    }
  }, [problemSetId, navigate]);

  // Timer effect
  useEffect(() => {
    let seconds = 0,
      minutes = 0,
      hours = 0;
    const timer = setInterval(() => {
      seconds++;
      if (seconds === 60) {
        seconds = 0;
        minutes++;
      }
      if (minutes === 60) {
        minutes = 0;
        hours++;
      }
      setCurrentTime(
        `${String(hours).padStart(2, "0")}:` +
          `${String(minutes).padStart(2, "0")}:` +
          `${String(seconds).padStart(2, "0")}`
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync selected option when question changes
  useEffect(() => {
    const saved = quizzes[currentQuestion - 1]?.userAnswer;
    setSelectedOption(saved && saved !== 0 ? saved : null);
  }, [currentQuestion, quizzes]);

  // Handlers
  const handleOptionSelect = (id) => {
    const currentQuiz = quizzes[currentQuestion - 1];
    const selectedOption = currentQuiz?.selections?.find((s) => s.id === id);

    // 답안 선택 추적
    if (selectedOption) {
      trackQuizEvents.selectAnswer(
        problemSetId,
        currentQuestion,
        id,
        selectedOption.correct || false
      );
    }

    setQuizzes((prev) =>
      prev.map((q, idx) =>
        idx === currentQuestion - 1 ? { ...q, userAnswer: id } : q
      )
    );
    setSelectedOption(id);
  };

  const handlePrev = () => {
    if (currentQuestion > 1) {
      const prevQuestion = currentQuestion - 1;
      trackQuizEvents.navigateQuestion(
        problemSetId,
        currentQuestion,
        prevQuestion
      );
      setCurrentQuestion(prevQuestion);
    }
  };

  const handleNext = () => {
    if (currentQuestion < totalQuestions) {
      const nextQuestion = currentQuestion + 1;
      trackQuizEvents.navigateQuestion(
        problemSetId,
        currentQuestion,
        nextQuestion
      );
      setCurrentQuestion(nextQuestion);
    }
  };

  const handleSubmit = () => {
    // 문제 확인 버튼 클릭 추적
    trackQuizEvents.confirmAnswer(problemSetId, currentQuestion);

    if (currentQuestion === totalQuestions) {
      CustomToast.info(t("마지막 문제입니다."));
      return;
    }

    const nextQuestion = currentQuestion + 1;
    trackQuizEvents.navigateQuestion(
      problemSetId,
      currentQuestion,
      nextQuestion
    );
    setCurrentQuestion(nextQuestion);
  };

  const handleCheckToggle = () => {
    const currentQuiz = quizzes[currentQuestion - 1];
    const newCheckState = !currentQuiz.check;

    // 검토 체크박스 토글 추적
    trackQuizEvents.toggleReview(problemSetId, currentQuestion, newCheckState);

    setQuizzes((prev) =>
      prev.map((q, idx) =>
        idx === currentQuestion - 1 ? { ...q, check: newCheckState } : q
      )
    );
  };

  const handleFinish = () => {
    setShowSubmitDialog(true);
  };

  const handleConfirmSubmit = useCallback(() => {
    const unansweredCount = quizzes.filter((q) => q.userAnswer === 0).length;
    const reviewCount = quizzes.filter((q) => q.check).length;
    const answeredCount = quizzes.length - unansweredCount;

    // 퀴즈 제출 추적
    trackQuizEvents.submitQuiz(
      problemSetId,
      answeredCount,
      quizzes.length,
      reviewCount
    );

    navigate(`/result/${problemSetId}`, {
      state: { quizzes, totalTime: currentTime, uploadedUrl },
    });
  }, [quizzes, problemSetId, currentTime, uploadedUrl, navigate]);

  const handleCancelSubmit = useCallback(() => {
    setShowSubmitDialog(false);
  }, []);

  const handleJumpTo = (num) => {
    if (num !== currentQuestion) {
      // 문제 네비게이션 추적
      trackQuizEvents.navigateQuestion(problemSetId, currentQuestion, num);
    }
    setCurrentQuestion(num);
  };

  // 제출 다이얼로그용 통계 계산
  const unansweredCount = quizzes.filter((q) => q.userAnswer === 0).length;
  const reviewCount = quizzes.filter((q) => q.check).length;
  const answeredCount = quizzes.length - unansweredCount;

  const handleOverlayClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      setShowSubmitDialog(false);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="solve-spinner-container">
        <div className="solve-spinner" />
        <p>{t("문제 로딩 중…")}</p>
      </div>
    );
  }

  const currentQuiz = quizzes[currentQuestion - 1] || {};

  return (
    <div className="solve-app-container">
      {/* 제출 다이얼로그 */}
      {showSubmitDialog && (
        <div className="submit-dialog-overlay" onClick={handleOverlayClick}>
          <div className="submit-dialog">
            <div className="submit-dialog-header">
              <h2>{t("제출 확인")}</h2>
              <button
                className="submit-dialog-close"
                onClick={handleCancelSubmit}
              >
                ×
              </button>
            </div>

            <div className="submit-dialog-content">
              {/* 상단 통계 정보 */}
              <div className="submit-stats">
                <div className="stat-item">
                  <span className="stat-label">{t("전체 문제:")}</span>
                  <span className="stat-value">
                    {quizzes.length}
                    {t("개")}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">{t("답변한 문제:")}</span>
                  <span className="stat-value answered">
                    {answeredCount}
                    {t("개")}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">{t("안푼 문제:")}</span>
                  <span className="stat-value unanswered">
                    {unansweredCount}
                    {t("개")}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">{t("검토할 문제:")}</span>
                  <span className="stat-value review">
                    {reviewCount}
                    {t("개")}
                  </span>
                </div>
              </div>

              {/* 하단 문제별 선택 답안 */}
              <div className="submit-answers">
                <h3>{t("선택한 답안")}</h3>
                <div className="answers-list">
                  {quizzes.map((quiz) => {
                    const selectedAnswer =
                      quiz.userAnswer === 0
                        ? t("미선택")
                        : quiz.selections?.find(
                            (sel) => sel.id === quiz.userAnswer
                          )?.content || `${quiz.userAnswer}번`;

                    return (
                      <div key={quiz.number} className="answer-item">
                        <span className="answer-number">
                          {quiz.number}
                          {t("번:")}
                        </span>
                        <span
                          className={`answer-text ${
                            quiz.userAnswer === 0 ? "unanswered" : ""
                          } ${quiz.check ? "review" : ""}`}
                        >
                          {selectedAnswer}
                          {quiz.check && (
                            <span className="review-badge">{t("검토")}</span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="submit-dialog-buttons">
              <button
                className="submit-button cancel"
                onClick={handleCancelSubmit}
              >
                {t("취소")}
              </button>
              <button
                className="submit-button confirm"
                onClick={handleConfirmSubmit}
              >
                {t("제출하기")}
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="solve-navbar">
        {/* 헤더는 항상 보여주고 */}
        <button className="solve-close-button" onClick={() => navigate("/")}>
          x
        </button>
        <div className="solve-time-display">{currentTime}</div>
      </header>

      <main className="solve-quiz-wrapper">
        {/* 왼쪽 패널도 그대로 */}

        {/* 가운데 패널 */}
        <section className="solve-center-panel">
          <nav className="solve-question-nav">
            <button className="solve-nav-button" onClick={handlePrev}>
              {t("이전")}
            </button>
            <span>
              {currentQuestion} / {totalQuestions}
            </span>
            <button className="solve-nav-button" onClick={handleNext}>
              {t("다음")}
            </button>
          </nav>

          {/* ─── 여기부터 문제 영역 ─── */}
          {isLoading ? (
            <div className="solve-spinner-container">
              <div className="solve-spinner" />
              <p>{t("문제 로딩 중…")}</p>
            </div>
          ) : (
            <div className="solve-question-and-review-container">
              <aside className="solve-left-panel">
                {quizzes.map((q) => (
                  <button
                    key={q.number}
                    className={`solve-skipped-button${
                      q.userAnswer !== 0 ? " solve-answered" : ""
                    }${q.check ? " solve-checked" : ""}${
                      q.number === currentQuestion ? " solve-current" : ""
                    }`}
                    onClick={() => handleJumpTo(q.number)}
                  >
                    {q.number}
                  </button>
                ))}
              </aside>
              <div className="solve-question-and-review-wrapper">
                <div className="solve-question-area">
                  <p className="solve-question-text">{currentQuiz.title}</p>
                </div>
                <div className="solve-review-area">
                  <label>
                    <input
                      type="checkbox"
                      checked={currentQuiz.check || false}
                      onChange={handleCheckToggle}
                    />{" "}
                    {t("검토")}
                  </label>
                </div>
              </div>
              <div className="solve-options-container">
                {currentQuiz.selections.map((opt, idx) => (
                  <div
                    key={opt.id}
                    className={`solve-option${
                      selectedOption === opt.id ? " solve-selected" : ""
                    }`}
                    onClick={() => handleOptionSelect(opt.id)}
                  >
                    <span className="solve-option-icon">{idx + 1}</span>
                    <span className="solve-option-text">{opt.content}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* ─── 여기까지 문제 영역 ─── */}

          <button className="solve-submit-button" onClick={handleSubmit}>
            {t("확인")}
          </button>
          <button
            className="solve-submit-button solve-submit-all-button"
            onClick={handleFinish}
          >
            {t("제출하기")}
          </button>
        </section>
        <aside className="solve-bottom-panel">
          {quizzes.map((q) => (
            <button
              key={q.number}
              className={`solve-skipped-button${
                q.userAnswer !== 0 ? " solve-answered" : ""
              }${q.check ? " solve-checked" : ""}${
                q.number === currentQuestion ? " solve-current" : ""
              }`}
              onClick={() => handleJumpTo(q.number)}
            >
              {q.number}
            </button>
          ))}
        </aside>
      </main>
    </div>
  );
};

export default SolveQuiz;
