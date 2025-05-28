import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./QuizResult.css";

const QuizResult = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { quizzes = [], totalTime = "00:00:00" } = state || {};

  const total = quizzes.length;

  return (
    <div className="result-container">
      <div className="metadata-box">
        <p>문제 수: {total}</p>
        <p>걸린 시간: {totalTime}</p>
      </div>

      <div className="result-content">
        <section className="result-right-panel">
          {quizzes.map((q) => {
            const userAns = q.userAnswer;
            const selection = q.selections.find((s) => s.id === userAns) || {};
            return (
              <div
                key={q.number}
                className={`result-item ${userAns === 0 ? "wrong-box" : ""}`}
              >
                {/* 문제 번호와 제목 */}
                <div className="result-question">
                  {q.number}. {q.title}
                </div>
                {/* 사용자 답변 */}
                <div className="result-user-answer">
                  선택한 답: {userAns === 0 ? "입력 X" : selection.content}
                </div>
              </div>
            );
          })}
        </section>
      </div>

      <button
        className="explanation-button"
        onClick={() => navigate("/explanation", { state: { quizzes } })}
      >
        해설 보기
      </button>
    </div>
  );
};

export default QuizResult;
