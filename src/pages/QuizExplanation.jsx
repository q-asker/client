import CustomToast from "#shared/toast";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "./QuizExplanation.css";

import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const QuizExplanation = () => {
  const { problemSetId } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();

  // state로 전달된 값 꺼내기
  const {
    quizzes: initialQuizzes = [],
    explanation: rawExplanation = [],
    uploadedUrl,
  } = state || {};
  console.log("quiz", initialQuizzes);
  console.log("해설", rawExplanation);
  console.log("업로드된 URL", uploadedUrl);

  // “rawExplanation”이 배열인지 확인. 아니면 빈 배열로 치환

  const [currentQuestion, setCurrentQuestion] = useState(1);
  const totalQuestions = initialQuizzes.length;
  const allExplanation = Array.isArray(rawExplanation.results)
    ? rawExplanation.results
    : [];
  console.log("allExplanation 배열:", allExplanation);

  // 로딩 체크
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    if (!problemSetId || initialQuizzes.length === 0) {
      CustomToast.error("유효한 퀴즈 정보가 없습니다. 홈으로 이동합니다.");
      navigate("/");
    } else {
      setIsLoading(false);
    }
  }, [problemSetId, initialQuizzes, navigate]);

  if (isLoading) {
    return (
      <div className="spinner-container">
        <div className="spinner" />
        <p>로딩 중…</p>
      </div>
    );
  }

  // 현재 문제 객체
  const currentQuiz = initialQuizzes[currentQuestion - 1] || {
    selections: [],
    userAnswer: 0,
  };

  // 이 문제에 대응하는 해설을 찾되, “allExplanation”이 배열이므로 find 사용 가능
  const thisExplanationObj =
    allExplanation.find((e) => e.number === currentQuiz.number) || {};
  const thisExplanationText =
    thisExplanationObj.explanation || "해설이 없습니다.";

  // 이전/다음 핸들러
  const handlePrev = () => {
    if (currentQuestion > 1) setCurrentQuestion((q) => q - 1);
  };
  const handleNext = () => {
    if (currentQuestion < totalQuestions) setCurrentQuestion((q) => q + 1);
  };

  return (
    <div className="app-container">
      <header className="navbar">
        <button className="close-button" onClick={() => navigate("/")}>
          x
        </button>
        <span className="time-display">설명 보기</span>
      </header>

      <main className="quiz-wrapper">
        <div className="layout-container">
          {/* 좌측 번호 패널 */}
          <aside className="left-panel">
            {initialQuizzes.map((q) => (
              <button
                key={q.number}
                className={`skipped-button${
                  q.userAnswer !== 0 ? " answered" : ""
                }${q.check ? " checked" : ""}${
                  q.number === currentQuestion ? " current" : ""
                }`}
                onClick={() => setCurrentQuestion(q.number)}
              >
                {q.number}
              </button>
            ))}
          </aside>

          {/* 가운데 패널: 문제 + 선지 + 확인 + 해설 */}
          <section className="center-panel">
            <nav className="question-nav">
              <button
                className="nav-button"
                onClick={handlePrev}
                disabled={currentQuestion === 1}
              >
                이전
              </button>
              <span className="question-counter">
                {currentQuestion} / {totalQuestions}
              </span>
              <button
                className="nav-button"
                onClick={handleNext}
                disabled={currentQuestion === totalQuestions}
              >
                다음
              </button>
            </nav>

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

            <button
              className="submit-button"
              onClick={handleNext}
              disabled={currentQuestion === totalQuestions}
            >
              확인
            </button>
            <button
              className="go-home-button"
              onClick={() => {
                navigate("/");
              }}
            >
              홈으로
            </button>

            <div className="explanation-box">
              <h3 className="explanation-title">해설</h3>
              <p className="explanation-text">{thisExplanationText}</p>

              {/**추가 사항 */}
              <div className="pdf-slide-box">
                <h4 className="slide-title">📄 관련 슬라이드</h4>
                <Document file={uploadedUrl} loading="PDF 로딩 중...">
                  <Page pageNumber={1} width={600} />
                </Document>
              </div>

              {/**추가 사항 */}
            </div>
          </section>

          <aside className="right-panel" />
        </div>
      </main>
    </div>
  );
};

export default QuizExplanation;
