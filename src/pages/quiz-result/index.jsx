import { useTranslation } from "i18nexus";
import axiosInstance from "#shared/api";
import { trackQuizEvents, trackResultEvents } from "#shared/lib/analytics";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "./index.css";

const QuizResult = () => {
  const { t } = useTranslation();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { problemSetId } = useParams();
  const { quizzes = [], totalTime = "00:00:00", uploadedUrl } = state || {};
  const [explanation, setExplanation] = useState(null);

  const getQuizExplanation = async () => {
    // 해설 보기 버튼 클릭 추적
    trackResultEvents.clickExplanation(problemSetId);

    try {
      const res = await axiosInstance.get(`/explanation/${problemSetId}`);
      const data = res.data;
      setExplanation(data);
      navigate(`/explanation/${problemSetId}`, {
        state: { quizzes, explanation: data, uploadedUrl },
      });
    } catch (err) {
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

  // 결과 페이지 진입 추적
  useEffect(() => {
    if (problemSetId && quizzes.length > 0) {
      trackResultEvents.viewResult(
        problemSetId,
        correctCount,
        quizzes.length,
        totalTime
      );
      trackQuizEvents.completeQuiz(
        problemSetId,
        correctCount,
        quizzes.length,
        totalTime
      );

      // 퀴즈 완료 기록을 localStorage에 업데이트
      updateQuizHistoryResult(
        problemSetId,
        correctCount,
        quizzes.length,
        totalTime,
        scorePercent
      );
    }
  }, [problemSetId, correctCount, quizzes.length, totalTime, scorePercent]);

  // 퀴즈 완료 기록을 localStorage에 업데이트하는 함수
  const updateQuizHistoryResult = (
    problemSetId,
    correctCount,
    totalQuestions,
    totalTime,
    score
  ) => {
    try {
      const existingHistory = JSON.parse(
        localStorage.getItem("quizHistory") || "[]"
      );

      const existingIndex = existingHistory.findIndex(
        (item) => item.problemSetId === problemSetId
      );
      if (existingIndex !== -1) {
        // 기존 기록 업데이트 + 퀴즈 데이터도 함께 저장
        existingHistory[existingIndex] = {
          ...existingHistory[existingIndex],
          status: "completed",
          score,
          correctCount,
          totalQuestions,
          totalTime,
          completedAt: new Date().toISOString(),
          quizData: quizzes, // 실제 퀴즈 데이터 저장 (문제, 선택지, 사용자 답안 포함)
        };

        localStorage.setItem("quizHistory", JSON.stringify(existingHistory));
      }
    } catch (error) {
      console.error(t("퀴즈 결과 기록 업데이트 실패:"), error);
    }
  };
  // ─────────────────

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
                  className={`result-status ${
                    isCorrect ? "correct" : "wrong"
                  }`}
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
