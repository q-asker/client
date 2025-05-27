import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./SolveQuiz.css";

// Mock data for the quiz
const quizData = {
  problemSetId: 1,
  title: "EXAMPLE QUIZ 1",
  quiz: [
    { number: 1, title: "WHICH NUMBER IS THE LARGEST?", selections: [
        { id: 1, content: "1" },
        { id: 2, content: "10" },
        { id: 3, content: "100" },
        { id: 4, content: "50" }
      ]
    },
    { number: 2, title: "WHICH OF THE FOLLOWING IS A WARM COLOR?", selections: [
        { id: 5, content: "RED" },
        { id: 6, content: "BLUE" },
        { id: 7, content: "BLACK" },
        { id: 8, content: "GRAY" }
      ]
    },
    { number: 3, title: "WHICH OF THE FOLLOWING IS AN ANIMAL?", selections: [
        { id: 9, content: "APPLE" },
        { id: 10, content: "BOOK" },
        { id: 11, content: "ROCK" },
        { id: 12, content: "CAT" }
      ]
    },
    { number: 4, title: "WHAT IS 2 + 2?", selections: [
        { id: 13, content: "3" },
        { id: 14, content: "4" },
        { id: 15, content: "5" },
        { id: 16, content: "6" }
      ]
    }
  ]
};

const SolveQuiz = () => {
  const [currentTime, setCurrentTime] = useState("00:00:00");
  const [selectedOption, setSelectedOption] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [skippedQuestions, setSkippedQuestions] = useState([]);
  const navigate = useNavigate();
  const totalQuestions = quizData.quiz.length;

  // Timer
  useEffect(() => {
    let seconds = 0, minutes = 0, hours = 0;
    const timer = setInterval(() => {
      seconds++;
      if (seconds === 60) { seconds = 0; minutes++; }
      if (minutes === 60) { minutes = 0; hours++; }
      setCurrentTime(
        `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleOptionSelect = (id) => setSelectedOption(id);

  const handlePrev = () => {
    if (currentQuestion > 1) {
      setCurrentQuestion(q => q - 1);
      setSelectedOption(null);
    }
  };

  const handleNext = () => {
    if (currentQuestion < totalQuestions) {
      setCurrentQuestion(q => q + 1);
      setSelectedOption(null);
    }
  };

  // Submit: add to or remove from skipped, then go to next
  const handleSubmit = () => {
    setSkippedQuestions(prev => {
      let updated;
      if (selectedOption === null) {
        // skipped: add if not present
        updated = prev.includes(currentQuestion)
          ? prev
          : [...prev, currentQuestion];
      } else {
        // answered: remove if present
        updated = prev.filter(n => n !== currentQuestion);
      }
      // sort ascending
      return updated.sort((a, b) => a - b);
    });
    handleNext();
  };

  // Jump to skipped question
  const jumpTo = (num) => {
    setCurrentQuestion(num);
    setSelectedOption(null);
  };

  const currentQuiz = quizData.quiz[currentQuestion - 1];

  return (
    <div className="app-container">
      <header className="navbar">
        <button className="close-button" onClick={() => navigate('/')}>x</button>
        <div className="time-display">{currentTime}</div>
      </header>
      <main className="quiz-wrapper">
        <div className="layout-container">
          <aside className="left-panel">
            {skippedQuestions.map(num => (
              <button
                key={num}
                className="skipped-button"
                onClick={() => jumpTo(num)}
              >{num}</button>
            ))}
          </aside>
          <section className="center-panel">
            <nav className="question-nav">
              <button className="nav-button" onClick={handlePrev}>이전</button>
              <div className="question-counter">{currentQuestion} / {totalQuestions}</div>
              <button className="nav-button" onClick={handleNext}>다음</button>
            </nav>
            <div className="question-area">
              <p className="question-text">{currentQuiz.title}</p>
            </div>
            <div className="options-container">
              {currentQuiz.selections.map((opt, idx) => (
                <div
                  key={opt.id}
                  className={`option ${selectedOption === opt.id ? 'selected' : ''}`}
                  onClick={() => handleOptionSelect(opt.id)}
                >
                  <div className="option-icon"><span>{idx+1}</span></div>
                  <div className="option-text">{opt.content}</div>
                </div>
              ))}
            </div>
            <button className="submit-button" onClick={handleSubmit}>확인</button>
          </section>
          <aside className="right-panel" />
        </div>
      </main>
    </div>
  );
};

export default SolveQuiz;
