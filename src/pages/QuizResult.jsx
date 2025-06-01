import React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import "./QuizResult.css";

const QuizResult = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { problemSetId } = useParams();
  const { quizzes = [], totalTime = "00:00:00" } = state || {};
  const [explanation, setExplanation] = useState(null);
  const baseUrl = import.meta.env.VITE_BASE_URL;

  const getQuizExplanation = async () => {
    try {
      const res = await fetch(`${baseUrl}/explanation/${problemSetId}`, {
        method: "GET",
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "해설 불러오기 실패");
      }
      const data = await res.json();
      console.log(data);

      setExplanation(data);
      navigate(`/explanation/${problemSetId}`, {
        state: { quizzes, explanation: data },
      });
    } catch (err) {
      alert(err.message);
      navigate("/");
    }
  };
  // ─── 점수 계산 ───
  // 각 문제마다 사용자가 고른 답안이 correct인지 검사
  const correctCount = quizzes.reduce((count, q) => {
    const selected = q.selections.find((s) => s.id === q.userAnswer);
    return count + (selected?.correct ? 1 : 0);
  }, 0);

  // 백분율(소수 없이 정수로 반올림)
  const scorePercent = quizzes.length
    ? Math.round((correctCount / quizzes.length) * 100)
    : 0;
  // ─────────────────

  return (
    <div className="result-container">
      <div className="metadata-box">
        <p>문제 수: {quizzes.length}</p>
        <p>걸린 시간: {totalTime}</p>
        <p>점수: {scorePercent}점</p>
      </div>

      <div className="result-content">
        <section className="result-right-panel">
          {quizzes.map((q) => {
            const userAns = q.userAnswer;
            const selection = q.selections.find((s) => s.id === userAns) || {};
            const isCorrect = selection.correct === true;
            const correctSelection =
              q.selections.find((s) => s.correct === true) || {};

            return (
              <div
                key={q.number}
                className={`result-item ${
                  isCorrect ? "correct-box" : "wrong-box"
                }`}
              >
                <div className="result-question">
                  {q.number}. {q.title}
                </div>

                <div className="result-user-answer">
                  선택한 답: {userAns === 0 ? "입력 X" : selection.content}
                </div>

                {!isCorrect && (
                  <div className="result-correct-answer">
                    정답 답안: {correctSelection.content}
                  </div>
                )}

                <div
                  className={`result-status ${isCorrect ? "correct" : "wrong"}`}
                >
                  {isCorrect ? "정답" : "오답"}
                </div>
              </div>
            );
          })}
        </section>
      </div>

      <button className="explanation-button" onClick={getQuizExplanation}>
        해설 보기
      </button>
    </div>
  );
};

export default QuizResult;
