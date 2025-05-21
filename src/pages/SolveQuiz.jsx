// SolveQuiz.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import "./SolveQuiz.css";

const SolveQuiz = () => {
  const [currentTime, setCurrentTime] = useState("00:00:00");
  const [selectedOption, setSelectedOption] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const navigate = useNavigate();
  const totalQuestions = 20;

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
      const hh = String(hours).padStart(2, "0");
      const mm = String(minutes).padStart(2, "0");
      const ss = String(seconds).padStart(2, "0");
      setCurrentTime(`${hh}:${mm}:${ss}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleOptionSelect = (opt) => setSelectedOption(opt);
  const handlePrevQuestion = () => {
    if (currentQuestion > 1) {
      setCurrentQuestion((q) => q - 1);
      setSelectedOption(null);
    }
  };
  const handleNextQuestion = () => {
    if (currentQuestion < totalQuestions) {
      setCurrentQuestion((q) => q + 1);
      setSelectedOption(null);
    }
  };

  return (
    <div className="app-container">
      <header className="navbar">
        <button
          className="close-button"
          onClick={() => {
            navigate("/");
          }}
        >
          x
        </button>
        <div className="time-display">{currentTime}</div>
      </header>

      <main className="quiz-wrapper">
        <nav className="question-nav">
          <button
            onClick={handlePrevQuestion}
            className="nav-button prev-button"
          >
            <i className="fas fa-chevron-left prev-icon"></i>
            <span className="button-label">이전</span>
          </button>
          <div className="question-counter">
            {currentQuestion} / {totalQuestions}
          </div>
          <button
            onClick={handleNextQuestion}
            className="nav-button next-button"
          >
            <span className="button-label">다음</span>
            <i className="fas fa-chevron-right next-icon"></i>
          </button>
        </nav>

        <section className="question-area">
          <div className="question-content">
            <i className="fas fa-search search-icon"></i>
            <p className="question-text">
              회사가 자원을 구성하고 AWS 비용을 세부 수준으로 추적해야 합니다.
              회사는 비즈니스 부서, 환경 및 애플리케이션별로 비용을 분류해야
              합니다. 어떤 솔루션이 이러한 요구 사항을 충족합니까?
            </p>
          </div>
        </section>

        <section className="options-container">
          {[1, 2, 3, 4].map((opt) => (
            <div
              key={opt}
              className={`option ${selectedOption === opt ? "selected" : ""}`}
              onClick={() => handleOptionSelect(opt)}
            >
              <div className="option-content">
                <div className="option-icon">
                  <span>{opt}</span>
                </div>
                <div className="option-text">
                  {opt === 1 &&
                    "세부 수준에서 리소스 소비를 구성하고 추적하기 위해 AWS 결제 및 비용 관리 대시보드에 액세스합니다."}
                  {opt === 2 &&
                    "리소스를 구성하고, AWS 예산을 설정하고, 의도하지 않은 사용에 대한 알림을 받으려면 AWS 비용 관리 콘솔에 액세스하세요."}
                  {opt === 3 &&
                    "태그를 사용하여 리소스를 구성합니다. 세부 수준에서 AWS 비용을 추적하기 위해 비용 할당 태그를 활성화합니다."}
                  {opt === 4 &&
                    "개별적으로 비용을 시각적으로 구성하고 추적하기 위해 Amazon CloudWatch 대시보드를 만듭니다."}
                </div>
              </div>
            </div>
          ))}
        </section>

        <button className="submit-button" onClick={handleNextQuestion}>
          확인
        </button>
      </main>
    </div>
  );
};
export default SolveQuiz;
