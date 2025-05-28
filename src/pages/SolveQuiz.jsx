import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./SolveQuiz.css";

// Initial mock data
const initialQuizData = {
  problemSetId: 1,
  title: "EXAMPLE QUIZ 1",
  quiz: [
    {
      number: 1,
      title: "WHICH NUMBER IS THE LARGEST?",
      selections: [
        { id: 1, content: "1" },
        { id: 2, content: "10" },
        { id: 3, content: "100" },
        { id: 4, content: "50" },
      ],
      userAnswer: 0,
      check: false,
    },
    {
      number: 2,
      title: "WHICH OF THE FOLLOWING IS A WARM COLOR?",
      selections: [
        { id: 1, content: "RED" },
        { id: 2, content: "BLUE" },
        { id: 3, content: "BLACK" },
        { id: 4, content: "GRAY" },
      ],
      userAnswer: 0,
      check: false,
    },
    {
      number: 3,
      title: "WHICH OF THE FOLLOWING IS AN ANIMAL?",
      selections: [
        { id: 1, content: "APPLE" },
        { id: 2, content: "BOOK" },
        { id: 3, content: "ROCK" },
        { id: 4, content: "CAT" },
      ],
      userAnswer: 0,
      check: false,
    },
    {
      number: 4,
      title: "WHAT IS 2 + 2?",
      selections: [
        { id: 1, content: "3" },
        { id: 2, content: "4" },
        { id: 3, content: "5" },
        { id: 4, content: "6" },
      ],
      userAnswer: 0,
      check: false,
    },
  ],
};

const SolveQuiz = () => {
  const [quizzes, setQuizzes] = useState(initialQuizData.quiz);
  const [currentTime, setCurrentTime] = useState("00:00:00");
  const [selectedOption, setSelectedOption] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const navigate = useNavigate();
  const totalQuestions = quizzes.length;

  // Timer
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
        `${String(hours).padStart(2, "0")}:
         ${String(minutes).padStart(2, "0")}:
         ${String(seconds).padStart(2, "0")}`
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync selected option when question changes
  useEffect(() => {
    const saved = quizzes[currentQuestion - 1].userAnswer;
    setSelectedOption(saved !== 0 ? saved : null);
  }, [currentQuestion, quizzes]);

  const handleOptionSelect = (id) => {
    setQuizzes((prev) =>
      prev.map((q, idx) =>
        idx === currentQuestion - 1 ? { ...q, userAnswer: id } : q
      )
    );
    setSelectedOption(id);
  };

  const handlePrev = () =>
    currentQuestion > 1 && setCurrentQuestion((q) => q - 1);
  const handleNext = () =>
    currentQuestion < totalQuestions && setCurrentQuestion((q) => q + 1);
  const handleSubmit = () => {
    if (currentQuestion === totalQuestions) {
      alert("마지막 문제입니다.");
      return;
    }
    setCurrentQuestion((q) => q + 1);
  };

  // Toggle review check
  const handleCheckToggle = () => {
    setQuizzes((prev) =>
      prev.map((q, idx) =>
        idx === currentQuestion - 1 ? { ...q, check: !q.check } : q
      )
    );
  };

  // Submission confirmation and grading
  const handleFinish = () => {
    const unansweredCount = quizzes.filter((q) => q.userAnswer === 0).length;
    const reviewCount = quizzes.filter((q) => q.check).length;
    const message = `안푼 문제: ${unansweredCount}개, 검토할 문제: ${reviewCount}개\n정말 제출하시겠습니까?`;
    if (!window.confirm(message)) return;
    alert("퀴즈를 제출합니다. 결과 페이지로 이동하세요.");
    navigate("/result", { state: { quizzes, totalTime: currentTime } });
  };

  const handleJumpTo = (num) => {
    setQuizzes((prev) =>
      prev.map((q, idx) => (idx === num - 1 ? { ...q, check: false } : q))
    );
    setCurrentQuestion(num);
  };
  const currentQuiz = quizzes[currentQuestion - 1];

  return (
    <div className="app-container">
      <header className="navbar">
        <button className="close-button" onClick={() => navigate("/")}>
          x
        </button>
        <div className="time-display">{currentTime}</div>
      </header>
      <main className="quiz-wrapper">
        <div className="layout-container">
          <aside className="left-panel">
            {quizzes.map((q) => (
              <button
                key={q.number}
                className={`skipped-button${
                  q.userAnswer !== 0 ? " answered" : ""
                }${q.check ? " checked" : ""}`}
                onClick={() => handleJumpTo(q.number)}
              >
                {q.number}
              </button>
            ))}
          </aside>
          <section className="center-panel">
            <nav className="question-nav">
              <button className="nav-button" onClick={handlePrev}>
                이전
              </button>
              <div className="question-counter">
                {currentQuestion} / {totalQuestions}
              </div>
              <button className="nav-button" onClick={handleNext}>
                다음
              </button>
            </nav>
            <div className="question-area">
              <p className="question-text">{currentQuiz.title}</p>
              <label className="check-container">
                <input
                  type="checkbox"
                  checked={currentQuiz.check}
                  onChange={handleCheckToggle}
                />{" "}
                검토하기
              </label>
            </div>
            <div className="options-container">
              {currentQuiz.selections.map((opt, idx) => (
                <div
                  key={opt.id}
                  className={`option${
                    selectedOption === opt.id ? " selected" : ""
                  }`}
                  onClick={() => handleOptionSelect(opt.id)}
                >
                  <div className="option-icon">
                    <span>{idx + 1}</span>
                  </div>
                  <div className="option-text">{opt.content}</div>
                </div>
              ))}
            </div>
            <button className="submit-button" onClick={handleSubmit}>
              확인
            </button>
            <button
              className="submit-button submit-all-button"
              onClick={handleFinish}
            >
              제출하기
            </button>
          </section>
          <aside className="right-panel" />
        </div>
      </main>
    </div>
  );
};

export default SolveQuiz;
