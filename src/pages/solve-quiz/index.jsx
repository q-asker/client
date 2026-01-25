import { useTranslation } from "i18nexus"; // SolveQuiz.jsx

import React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useSolveQuiz } from "#features/solve-quiz";
import { useQuizGenerationStore } from "#features/quiz-generation";
import "./index.css";

const SolveQuiz = () => {
  const { t } = useTranslation();
  const { problemSetId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { uploadedUrl } = location.state || {};
  const storeProblemSetId = useQuizGenerationStore(
    (state) => state.problemSetId,
  );
  const streamQuizzes = useQuizGenerationStore((state) => state.quizzes);
  const streamIsLoading = useQuizGenerationStore((state) => state.isLoading);
  const streamTotalCount = useQuizGenerationStore((state) => state.totalCount);

  const streamedQuizzes =
    storeProblemSetId === problemSetId ? streamQuizzes : [];
  const isStreaming =
    storeProblemSetId === problemSetId ? streamIsLoading : false;
  const totalCount = storeProblemSetId === problemSetId ? streamTotalCount : 0;
  const {
    state: {
      quizzes,
      isLoading,
      currentTime,
      selectedOption,
      currentQuestion,
      showSubmitDialog,
      totalQuestions,
      unansweredCount,
      reviewCount,
      answeredCount,
      currentQuiz,
    },
    actions: {
      handleOptionSelect,
      handlePrev,
      handleNext,
      handleSubmit,
      handleCheckToggle,
      handleFinish,
      handleConfirmSubmit,
      handleCancelSubmit,
      handleJumpTo,
      handleOverlayClick,
    },
  } = useSolveQuiz({
    t,
    navigate,
    problemSetId,
    uploadedUrl,
    streamedQuizzes,
    isStreaming,
  });

  const remainingCount =
    isStreaming && totalCount > 0
      ? Math.max(0, totalCount - totalQuestions)
      : 0;

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
                            (sel) => sel.id === quiz.userAnswer,
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
                {Array.from({ length: remainingCount }).map((_, index) => (
                  <button
                    key={`pending-${index}`}
                    className="solve-skipped-button solve-pending"
                    disabled
                  >
                    …
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
          {Array.from({ length: remainingCount }).map((_, index) => (
            <button
              key={`pending-bottom-${index}`}
              className="solve-skipped-button solve-pending"
              disabled
            >
              …
            </button>
          ))}
        </aside>
      </main>
    </div>
  );
};

export default SolveQuiz;
