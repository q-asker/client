import CustomToast from "#shared/toast";
import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "./QuizExplanation.css";
import { trackQuizEvents } from "../utils/analytics";

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

  // state로 전달된 값 꺼내기
  const {
    quizzes: initialQuizzes = [],
    explanation: rawExplanation = [],
    uploadedUrl,
  } = state || {};
  console.log("quiz", initialQuizzes);
  console.log("해설", rawExplanation);
  console.log("업로드된 URL", uploadedUrl);

  // "rawExplanation"이 배열인지 확인. 아니면 빈 배열로 치환

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
      // 해설 페이지 방문 추적
      trackQuizEvents.viewExplanation(problemSetId, currentQuestion);
    }
  }, [problemSetId, initialQuizzes, navigate, currentQuestion]);

  // PDF 컨테이너 너비 계산
  useEffect(() => {
    const calculatePdfWidth = () => {
      if (pdfContainerRef.current) {
        const containerWidth = pdfContainerRef.current.offsetWidth;
        // 모바일 환경 감지
        const isMobile = window.innerWidth <= 768;
        // 모바일에서는 여백을 줄이고, 데스크탑에서는 여유있게 설정
        const padding = isMobile ? 20 : 40;
        // 최대 너비도 모바일에서는 제한 없이, 데스크탑에서만 1200px로 제한
        const maxWidth = isMobile
          ? containerWidth - padding
          : Math.min(containerWidth - padding, 1200);
        setPdfWidth(maxWidth);
      }
    };

    // 초기 계산
    calculatePdfWidth();

    // resize 이벤트 리스너 추가
    window.addEventListener("resize", calculatePdfWidth);
    // 모바일 방향 전환 감지
    window.addEventListener("orientationchange", calculatePdfWidth);

    return () => {
      window.removeEventListener("resize", calculatePdfWidth);
      window.removeEventListener("orientationchange", calculatePdfWidth);
    };
  }, [showPdf]); // showPdf가 변경될 때도 재계산

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
              {showPdf && (
                <div className="pdf-slide-box" ref={pdfContainerRef}>
                  <Document
                    file={uploadedUrl}
                    loading={<p>PDF 로딩 중...</p>}
                    onLoadError={(err) => console.error("PDF 로드 에러:", err)}
                  >
                    <Page
                      pageNumber={1}
                      width={pdfWidth}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />
                  </Document>
                </div>
              )}
            </div>
          </section>

          <aside className="right-panel" />
        </div>
      </main>
    </div>
  );
};

export default QuizExplanation;
