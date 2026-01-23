import { useTranslation } from "i18nexus";
import React from "react";
import { Document, Page } from "react-pdf";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuizExplanation } from "#features/quiz-explanation";
import "./index.css";

const QuizExplanation = () => {
  const { t } = useTranslation();
  const { problemSetId } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const {
    quizzes: initialQuizzes = [],
    explanation: rawExplanation = [],
    uploadedUrl,
  } = state || {};
  const {
    state: {
      showPdf,
      pdfWidth,
      pdfContainerRef,
      currentPdfPage,
      showWrongOnly,
      specificExplanation,
      isSpecificExplanationLoading,
      currentQuestion,
      totalQuestions,
      filteredQuizzes,
      filteredTotalQuestions,
      isLoading,
      currentQuiz,
      thisExplanationText,
      thisExplanationObj,
      pdfOptions,
    },
    actions: {
      handleExit,
      handlePrev,
      handleNext,
      handleFetchSpecificExplanation,
      handleQuestionClick,
      handlePdfToggle,
      handleWrongOnlyToggle,
      handlePrevPdfPage,
      handleNextPdfPage,
      setCurrentPdfPage,
      renderTextWithLinks,
    },
  } = useQuizExplanation({
    t,
    navigate,
    problemSetId,
    initialQuizzes,
    rawExplanation,
    uploadedUrl,
  });

  if (isLoading) {
    return (
      <div className="spinner-container">
        <div className="spinner" />
        <p>{t("로딩 중…")}</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="navbar">
        <button className="close-button" onClick={() => handleExit("/")}>
          x
        </button>
      </header>

      <main className="quiz-wrapper">
        <div className="layout-container">
          <section className="center-panel">
            <div className="counter-wrapper">
              <div className="toggle-wrapper toggle-wrapper-invisible">
                <span className="toggle-label">{t("❌ 오답만")}</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={showWrongOnly}
                    onChange={handleWrongOnlyToggle}
                  />

                  <span className="slider round" />
                </label>
              </div>
              <span className="question-counter">
                {currentQuestion} /{" "}
                {showWrongOnly ? filteredTotalQuestions : totalQuestions}
              </span>

              <div className="toggle-wrapper">
                <span className="toggle-label">{t("❌ 오답만")}</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={showWrongOnly}
                    onChange={handleWrongOnlyToggle}
                  />

                  <span className="slider round" />
                </label>
              </div>
            </div>
            <div className="question-area-container">
              {/* 좌측 번호 패널 */}
              <aside className="left-panel">
                {filteredQuizzes.map((q, index) => {
                  let resultClass = "";
                  if (q.userAnswer !== undefined && q.userAnswer !== null) {
                    // userAnswer가 존재하는 경우 (0 포함)
                    const correctOption = q.selections.find(
                      (opt) => opt.correct === true
                    );

                    if (correctOption) {
                      // 데이터 타입 불일치 방지를 위해 숫자로 변환하여 비교
                      if (Number(q.userAnswer) === Number(correctOption.id)) {
                        resultClass = " correct";
                      } else {
                        resultClass = " incorrect";
                      }
                    }
                  }

                  return (
                    <button
                      key={q.number}
                      className={`skipped-button${resultClass}${
                        showWrongOnly
                          ? index + 1 === currentQuestion
                            ? " current"
                            : ""
                          : q.number === currentQuestion
                          ? " current"
                          : ""
                      }`}
                      onClick={() =>
                        showWrongOnly
                          ? handleQuestionClick(index + 1)
                          : handleQuestionClick(q.number)
                      }
                    >
                      {q.number}
                    </button>
                  );
                })}
              </aside>
              <div
                className={`question-area${
                  currentQuiz.userAnswer === 0 ? " unanswered" : ""
                }`}
              >
                <p className="question-text">{currentQuiz.title}</p>
              </div>

              <div className="options-container">
                {currentQuiz.selections.map((opt, idx) => {
                  const isCorrectOption = opt.correct === true;
                  const isWrongSelected =
                    currentQuiz.userAnswer === opt.id && !opt.correct;
                  const borderClass = isCorrectOption
                    ? "correct-option"
                    : isWrongSelected
                    ? "wrong-option"
                    : "";
                  return (
                    <div key={opt.id} className={`option ${borderClass}`}>
                      <span className="option-icon">{idx + 1}</span>
                      <span className="option-text">{opt.content}</span>
                    </div>
                  );
                })}
              </div>

              <nav className="question-nav">
                <button
                  className="nav-button disabled"
                  onClick={handlePrev}
                  disabled={currentQuestion === 1}
                >
                  {t("이전")}
                </button>

                <button
                  className="nav-button"
                  onClick={handleNext}
                  disabled={
                    currentQuestion ===
                    (showWrongOnly ? filteredTotalQuestions : totalQuestions)
                  }
                >
                  {t("다음")}
                </button>
              </nav>
              <button
                className="go-home-button"
                onClick={() => handleExit("/")}
              >
                {t("홈으로")}
              </button>
            </div>

            <div className="explanation-box">
              <div className="explanation-header">
                <h3 className="explanation-title">{t("해설")}</h3>
                <button
                  className="detailed-explanation-button"
                  onClick={handleFetchSpecificExplanation}
                  disabled={isSpecificExplanationLoading}
                >
                  {isSpecificExplanationLoading ? (
                    <div className="spinner-in-button" />
                  ) : (
                    t("AI 상세 해설 보기")
                  )}
                </button>
              </div>
              <p className="explanation-text">{thisExplanationText}</p>

              {specificExplanation && (
                <div className="specific-explanation-section">
                  <h4 className="specific-explanation-title">
                    {t("상세 해설")}
                  </h4>
                  <p className="explanation-text">
                    {renderTextWithLinks(specificExplanation)}
                  </p>
                </div>
              )}

              <div className="all-referenced-pages">
                <h4 className="all-pages-title">{t("📚 참조 페이지")}</h4>
                <div className="pages-list">
                  {thisExplanationObj?.referencedPages?.map((page, index) => (
                    <span
                      key={index}
                      className={`page-number ${
                        currentPdfPage === index ? "active" : ""
                      }`}
                      onClick={() => setCurrentPdfPage(index)}
                    >
                      {page}
                    </span>
                  ))}
                </div>
              </div>

              {/**추가 사항 */}
              <div className="pdf-slide-box">
                <div className="slide-header">
                  <h4 className="slide-title">{t("📄 관련 슬라이드")}</h4>

                  {/* CSS 기반 스위치 */}
                  <label className="switch switch-with-margin">
                    <input
                      type="checkbox"
                      checked={showPdf}
                      onChange={handlePdfToggle}
                    />

                    <span className="slider round" />
                  </label>
                </div>
              </div>
              {showPdf && (
                <div className="pdf-slide-box" ref={pdfContainerRef}>
                  <div className="pdf-navigation">
                    <button
                      className="pdf-nav-button"
                      onClick={handlePrevPdfPage}
                      disabled={currentPdfPage === 0}
                    >
                      ←
                    </button>
                    <span className="pdf-page-counter">
                      {t("슬라이드의")}

                      {" " +
                        thisExplanationObj?.referencedPages?.[currentPdfPage] +
                        " "}
                      {t("페이지")}
                    </span>
                    <button
                      className="pdf-nav-button"
                      onClick={handleNextPdfPage}
                      disabled={
                        currentPdfPage ===
                        (thisExplanationObj?.referencedPages?.length || 1) - 1
                      }
                    >
                      →
                    </button>
                  </div>
                  {!uploadedUrl ? (
                    <p>{t("파일 링크가 만료되었습니다.")}</p>
                  ) : uploadedUrl.toLowerCase().endsWith(".pdf") ? (
                    <Document
                      file={uploadedUrl}
                      loading={<p>{t("PDF 로딩 중...")}</p>}
                      onLoadError={(err) => (
                        <p>{t("파일이 존재하지 않습니다.")}</p>
                      )}
                      options={pdfOptions}
                    >
                      <Page
                        pageNumber={
                          thisExplanationObj?.referencedPages?.[
                            currentPdfPage
                          ] || 1
                        }
                        width={pdfWidth}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                      />
                    </Document>
                  ) : (
                    <p>{t("현재는 pdf 파일만 지원합니다.")}</p>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default QuizExplanation;
