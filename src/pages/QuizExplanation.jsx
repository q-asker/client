import CustomToast from "#shared/toast";
import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { trackQuizEvents } from "../utils/analytics";
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
  const [showPdf, setShowPdf] = useState(false);
  const [pdfWidth, setPdfWidth] = useState(600);
  const pdfContainerRef = useRef(null);
  const [currentPdfPage, setCurrentPdfPage] = useState(0);

  // state로 전달된 값 꺼내기
  const {
    quizzes: initialQuizzes = [],
    explanation: rawExplanation = [],
    uploadedUrl,
  } = state || {};

  const isPdfFile = uploadedUrl?.toLowerCase().endsWith(".pdf");

  const [currentQuestion, setCurrentQuestion] = useState(1);
  const totalQuestions = initialQuizzes.length;
  const allExplanation = Array.isArray(rawExplanation.results)
    ? rawExplanation.results
    : [];

  // 로딩 체크
  const [isLoading, setIsLoading] = useState(true);

  // 모든 useEffect를 여기로 이동
  useEffect(() => {
    if (!problemSetId || initialQuizzes.length === 0) {
      CustomToast.error("유효한 퀴즈 정보가 없습니다. 홈으로 이동합니다.");
      navigate("/");
    } else {
      setIsLoading(false);
      trackQuizEvents.viewExplanation(problemSetId, currentQuestion);
    }
  }, [problemSetId, initialQuizzes, navigate, currentQuestion]);

  useEffect(() => {
    const calculatePdfWidth = () => {
      if (pdfContainerRef.current) {
        const containerWidth = pdfContainerRef.current.offsetWidth;
        const isMobile = window.innerWidth <= 768;
        const padding = isMobile ? 20 : 40;
        const maxWidth = isMobile
          ? containerWidth - padding
          : Math.min(containerWidth - padding, 1200);
        setPdfWidth(maxWidth);
      }
    };

    calculatePdfWidth();
    window.addEventListener("resize", calculatePdfWidth);
    window.addEventListener("orientationchange", calculatePdfWidth);

    return () => {
      window.removeEventListener("resize", calculatePdfWidth);
      window.removeEventListener("orientationchange", calculatePdfWidth);
    };
  }, [showPdf]);

  useEffect(() => {
    setCurrentPdfPage(0);
  }, [currentQuestion]);

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

  // 이 문제에 대응하는 해설을 찾되, "allExplanation"이 배열이므로 find 사용 가능
  const thisExplanationObj =
    allExplanation.find((e) => e.number === currentQuiz.number) || {};
  const thisExplanationText =
    thisExplanationObj.explanation || "해설이 없습니다.";

  // 이전/다음 핸들러
  const handlePrev = () => {
    if (currentQuestion > 1) {
      const prevQuestion = currentQuestion - 1;
      // 문제 네비게이션 추적
      trackQuizEvents.navigateQuestion(
        problemSetId,
        currentQuestion,
        prevQuestion
      );
      setCurrentQuestion(prevQuestion);
    }
  };
  const handleNext = () => {
    if (currentQuestion < totalQuestions) {
      const nextQuestion = currentQuestion + 1;
      // 문제 네비게이션 추적
      trackQuizEvents.navigateQuestion(
        problemSetId,
        currentQuestion,
        nextQuestion
      );
      setCurrentQuestion(nextQuestion);
    }
  };

  // 문제 번호 직접 클릭 핸들러
  const handleQuestionClick = (questionNumber) => {
    if (questionNumber !== currentQuestion) {
      // 문제 네비게이션 추적
      trackQuizEvents.navigateQuestion(
        problemSetId,
        currentQuestion,
        questionNumber
      );
      setCurrentQuestion(questionNumber);
    }
  };

  // PDF 토글 핸들러
  const handlePdfToggle = () => {
    const newShowPdf = !showPdf;
    setShowPdf(newShowPdf);
    // PDF 슬라이드 토글 추적
    trackQuizEvents.togglePdfSlide(problemSetId, newShowPdf);
  };

  // PDF 페이지 네비게이션 핸들러
  const handlePrevPdfPage = () => {
    if (currentPdfPage > 0) {
      setCurrentPdfPage(currentPdfPage - 1);
    }
  };

  const handleNextPdfPage = () => {
    const currentPages =
      allExplanation[currentQuestion - 1]?.referencedPages || [];
    if (currentPdfPage < currentPages.length - 1) {
      setCurrentPdfPage(currentPdfPage + 1);
    }
  };

  return (
    <div className="app-container">
      <header className="navbar">
        <button className="close-button" onClick={() => navigate("/")}>
          x
        </button>
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
                onClick={() => handleQuestionClick(q.number)}
              >
                {q.number}
              </button>
            ))}
          </aside>

          {/* 가운데 패널: 문제 + 선지 + 확인 + 해설 */}
          <section className="center-panel">
            <div className="counter-wrapper">
              <span className="question-counter">
                {currentQuestion} / {totalQuestions}
              </span>
            </div>

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
                className="nav-button"
                onClick={handlePrev}
                disabled={currentQuestion === 1}
              >
                이전
              </button>

              <button
                className="nav-button"
                onClick={handleNext}
                disabled={currentQuestion === totalQuestions}
              >
                다음
              </button>
            </nav>
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
                <div
                  className="slide-header"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginTop: "1rem",
                  }}
                ></div>
                <div className="slide-header">
                  <h4 className="slide-title">📄 관련 슬라이드</h4>

                  {/* CSS 기반 스위치 */}
                  <label className="switch" style={{ marginLeft: "0.75rem" }}>
                    <input
                      type="checkbox"
                      checked={showPdf}
                      onChange={handlePdfToggle}
                    />
                    <span className="slider round" />
                  </label>
                </div>
              </div>
              {showPdf &&
                (isPdfFile ? (
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
                        슬라이드의
                        {" " +
                          allExplanation[currentQuestion - 1]?.referencedPages[
                            currentPdfPage
                          ] +
                          " "}
                        페이지
                      </span>
                      <button
                        className="pdf-nav-button"
                        onClick={handleNextPdfPage}
                        disabled={
                          currentPdfPage ===
                          allExplanation[currentQuestion - 1].referencedPages
                            .length -
                            1
                        }
                      >
                        →
                      </button>
                    </div>
                    <Document
                      file={uploadedUrl}
                      loading={<p>PDF 로딩 중...</p>}
                      onLoadError={(err) =>
                        console.error("PDF 로드 에러:", err)
                      }
                    >
                      <Page
                        pageNumber={
                          allExplanation[currentQuestion - 1].referencedPages[
                            currentPdfPage
                          ]
                        }
                        width={pdfWidth}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                      />
                    </Document>
                  </div>
                ) : (
                  <p>현재는 pdf파일만 지원합니다.</p>
                ))}
            </div>
          </section>

          <aside className="right-panel" />
        </div>
      </main>
    </div>
  );
};

export default QuizExplanation;
