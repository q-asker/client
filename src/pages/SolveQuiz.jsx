// SolveQuiz.jsx

import axiosInstance from "#shared/api";
import CustomToast from "#shared/toast";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { trackQuizEvents } from "../utils/analytics";
import "./SolveQuiz.css";

const SolveQuiz = () => {
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
      CustomToast.info("마지막 문제입니다.");
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
    const unansweredCount = quizzes.filter((q) => q.userAnswer === 0).length;
    const reviewCount = quizzes.filter((q) => q.check).length;
    const answeredCount = quizzes.length - unansweredCount;

    const message = `안푼 문제: ${unansweredCount}개, 검토할 문제: ${reviewCount}개\n정말 제출하시겠습니까?`;
    if (!window.confirm(message)) return;

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
  };

  const handleJumpTo = (num) => {
    if (num !== currentQuestion) {
      // 문제 네비게이션 추적
      trackQuizEvents.navigateQuestion(problemSetId, currentQuestion, num);
    }

    setQuizzes((prev) =>
      prev.map((q, idx) => (idx === num - 1 ? { ...q, check: false } : q))
    );
    setCurrentQuestion(num);
  };

  if (isLoading) {
    return (
      <div className="solve-spinner-container">
        <div className="solve-spinner" />
        <p>문제 로딩 중…</p>
      </div>
    );
  }

  const currentQuiz = quizzes[currentQuestion - 1] || {};

  return (
    <div className="solve-app-container">
      <header className="solve-navbar">
        {/* 헤더는 항상 보여주고 */}
        <button className="solve-close-button" onClick={() => navigate("/")}>
          x
        </button>
        <div className="solve-time-display">{currentTime}</div>
      </header>

      <main className="solve-quiz-wrapper">
        <div className="solve-layout-container">
          {/* 왼쪽 패널도 그대로 */}
          <aside className="solve-left-panel">
            {quizzes.map((q) => (
              <button
                key={q.number}
                className={`solve-skipped-button${
                  q.userAnswer !== 0 ? " solve-answered" : ""
                }${q.check ? " solve-checked" : ""}`}
                onClick={() => handleJumpTo(q.number)}
              >
                {q.number}
              </button>
            ))}
          </aside>

          {/* 가운데 패널 */}
          <section className="solve-center-panel">
            <nav className="solve-question-nav">
              <button className="solve-nav-button" onClick={handlePrev}>
                이전
              </button>
              <span>
                {currentQuestion} / {totalQuestions}
              </span>
              <button className="solve-nav-button" onClick={handleNext}>
                다음
              </button>
            </nav>

            {/* ─── 여기부터 문제 영역 ─── */}
            {isLoading ? (
              <div className="solve-spinner-container">
                <div className="solve-spinner" />
                <p>문제 로딩 중…</p>
              </div>
            ) : (
              <>
                <div className="solve-question-area">
                  <p className="solve-question-text">{currentQuiz.title}</p>
                  <label>
                    <input
                      type="checkbox"
                      checked={currentQuiz.check || false}
                      onChange={handleCheckToggle}
                    />{" "}
                    검토하기
                  </label>
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
              </>
            )}
            {/* ─── 여기까지 문제 영역 ─── */}

            <button className="solve-submit-button" onClick={handleSubmit}>
              확인
            </button>
            <button
              className="solve-submit-button solve-submit-all-button"
              onClick={handleFinish}
            >
              제출하기
            </button>
          </section>

          {/* 오른쪽 패널 */}
          <aside className="solve-right-panel" />
        </div>
      </main>
    </div>
  );
};

export default SolveQuiz;
