import { useTranslation } from "i18nexus";
import React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuizResult } from "#features/quiz-result";
import "./index.css";

const QuizResult = () => {
  const { t } = useTranslation();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { problemSetId } = useParams();
  const { quizzes = [], totalTime = "00:00:00", uploadedUrl } = state || {};
  const {
    state: { correctCount, scorePercent },
    actions: { getQuizExplanation },
  } = useQuizResult({
    t,
    navigate,
    problemSetId,
    quizzes,
    totalTime,
    uploadedUrl,
  });

  return (
    <div className="result-container">
      <div className="metadata-box">
        {/* 문제 수 아이템 */}
        <div className="metadata-item">
          <span className="metadata-icon">📋</span>
          <div className="metadata-text">
            <span className="metadata-label">{t("문제 수")}</span>
            <span className="metadata-value">
              {quizzes.length}
              {t("개")}
            </span>
          </div>
        </div>

        {/* 걸린 시간 아이템 */}
        <div className="metadata-item">
          <span className="metadata-icon">⏱️</span>
          <div className="metadata-text">
            <span className="metadata-label">{t("걸린 시간")}</span>
            <span className="metadata-value">{totalTime}</span>
          </div>
        </div>

        {/* 점수 아이템 */}
        <div className="metadata-item">
          <span className="metadata-icon">🏆</span>
          <div className="metadata-text">
            <span className="metadata-label">{t("점수")}</span>
            <span className="metadata-value">
              {scorePercent}
              {t("점")}
            </span>
          </div>
        </div>
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
                  {t("선택한 답:")}
                  {userAns === 0 ? t("입력 X") : selection.content}
                </div>

                {!isCorrect && (
                  <div className="result-correct-answer">
                    {t("정답 답안:")}
                    {correctSelection.content}
                  </div>
                )}

                <div
                  className={`result-status ${isCorrect ? "correct" : "wrong"}`}
                >
                  {isCorrect ? t("정답") : t("오답")}
                </div>
              </div>
            );
          })}
        </section>
      </div>

      <button className="explanation-button" onClick={getQuizExplanation}>
        {t("해설 보기")}
      </button>
    </div>
  );
};

export default QuizResult;
