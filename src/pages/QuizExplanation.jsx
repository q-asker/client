import { useTranslation } from "i18nexus";import axiosInstance from "#shared/api";
import CustomToast from "#shared/toast";
import { trackQuizEvents } from "#utils/analytics";
import React, { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "./QuizExplanation.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const QuizExplanation = () => {const { t } = useTranslation();
  const { problemSetId } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [showPdf, setShowPdf] = useState(false);
  const [pdfWidth, setPdfWidth] = useState(600);
  const pdfContainerRef = useRef(null);
  const [currentPdfPage, setCurrentPdfPage] = useState(0);
  // const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showWrongOnly, setShowWrongOnly] = useState(false);
  const [specificExplanation, setSpecificExplanation] = useState("");
  const [isSpecificExplanationLoading, setIsSpecificExplanationLoading] =
  useState(false);

  // state로 전달된 값 꺼내기
  const {
    quizzes: initialQuizzes = [],
    explanation: rawExplanation = [],
    uploadedUrl
  } = state || {};

  const [currentQuestion, setCurrentQuestion] = useState(1);
  const totalQuestions = initialQuizzes.length;
  const allExplanation = Array.isArray(rawExplanation.results) ?
  rawExplanation.results :
  [];

  // 오답만 보기용 필터링된 퀴즈 목록
  const getFilteredQuizzes = () => {
    if (!showWrongOnly) return initialQuizzes;

    return initialQuizzes.filter((q) => {
      if (q.userAnswer === undefined || q.userAnswer === null) return false;

      const correctOption = q.selections.find((opt) => opt.correct === true);
      if (!correctOption) return false;

      return Number(q.userAnswer) !== Number(correctOption.id);
    });
  };

  const filteredQuizzes = getFilteredQuizzes();
  const filteredTotalQuestions = filteredQuizzes.length;

  // 로딩 체크
  const [isLoading, setIsLoading] = useState(true);

  // 피드백 다이얼로그 관련 함수들 - 주석 처리
  /*
  const handleOpenFeedback = () => {
    window.open("https://forms.gle/ABE8458smVmXeu6s8", "_blank");
    setShowFeedbackModal(false);
  };
   const handleCloseFeedback = () => {
    setShowFeedbackModal(false);
  };
   const handleDontShowAgain = () => {
    localStorage.setItem("feedbackModalDismissed", "true");
    setShowFeedbackModal(false);
  };
   const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      setShowFeedbackModal(false);
    }
  };
   // X 버튼과 홈 버튼 클릭 시 피드백 다이얼로그 표시 후 이동
  const handleExitWithFeedback = (targetPath = "/") => {
    const isDismissed = localStorage.getItem("feedbackModalDismissed");
     if (!isDismissed) {
      setShowFeedbackModal(true);
      // 피드백 다이얼로그에서 이동할 경로를 저장
      localStorage.setItem("tempNavigateTo", targetPath);
    } else {
      navigate(targetPath);
    }
  };
   // 피드백 다이얼로그 닫기 후 이동 처리
  const handleFeedbackClose = () => {
    setShowFeedbackModal(false);
    const targetPath = localStorage.getItem("tempNavigateTo");
    if (targetPath) {
      localStorage.removeItem("tempNavigateTo");
      navigate(targetPath);
    }
  };
   // 피드백 다이얼로그에서 설문 참여 후 이동 처리
  const handleFeedbackParticipate = () => {
    window.open("https://forms.gle/ABE8458smVmXeu6s8", "_blank");
    setShowFeedbackModal(false);
    const targetPath = localStorage.getItem("tempNavigateTo");
    if (targetPath) {
      localStorage.removeItem("tempNavigateTo");
      navigate(targetPath);
    }
  };
   // 피드백 다이얼로그에서 다시 안보기 후 이동 처리
  const handleFeedbackDontShowAgain = () => {
    localStorage.setItem("feedbackModalDismissed", "true");
    setShowFeedbackModal(false);
    const targetPath = localStorage.getItem("tempNavigateTo");
    if (targetPath) {
      localStorage.removeItem("tempNavigateTo");
      navigate(targetPath);
    }
  };
  */









  // 피드백 다이얼로그 없이 바로 이동하는 함수
  const handleExit = (targetPath = "/") => {
    navigate(targetPath);
  };

  // 피드백 다이얼로그 컴포넌트 - 주석 처리
  /*
  const FeedbackModal = () => (
    <div className="feedback-modal-overlay" onClick={handleOverlayClick}>
      <div className="feedback-modal">
        <button className="feedback-modal-close" onClick={handleFeedbackClose}>
          ×
        </button>
         <div className="feedback-modal-header">
          <h2 className="feedback-modal-title">
            🎯 더 나은 서비스를 위한 피드백
          </h2>
          <p className="feedback-modal-subtitle">
            여러분의 소중한 의견으로 더 나은 솔루션을 개발하고자 합니다.
          </p>
        </div>
         <div className="feedback-modal-content">
          <div className="feedback-info-item">
            <span>⏰</span>
            <span className="feedback-info-text">응답 소요 시간: 3분 이내</span>
          </div>
           <div className="feedback-info-item">
            <span>🎁</span>
            <span className="feedback-info-text">
              추첨 상품: 스타벅스 카페 아메리카노 T 기프티콘 4명
            </span>
          </div>
           <div className="feedback-info-item">
            <span>🗓</span>
            <span className="feedback-info-text">
              설문 기간: ~ 6월 12일까지
            </span>
          </div>
           <div className="feedback-contact-info">
            <p className="feedback-contact-text">
              추가 문의사항은{" "}
              <a
                href="mailto:inhapj01@gmail.com"
                className="feedback-contact-email"
              >
                inhapj01@gmail.com
              </a>
              으로 부탁드립니다.
            </p>
          </div>
        </div>
         <div className="feedback-modal-buttons">
          <button
            className="feedback-button feedback-button-primary"
            onClick={handleFeedbackParticipate}
          >
            설문 참여하기
          </button>
          <button
            className="feedback-button feedback-button-secondary"
            onClick={handleFeedbackClose}
          >
            나중에 하기
          </button>
          <button
            className="feedback-button feedback-button-tertiary"
            onClick={handleFeedbackDontShowAgain}
          >
            다시 안보기
          </button>
        </div>
      </div>
    </div>
  );
  */







  // 모든 useEffect를 여기로 이동
  useEffect(() => {
    if (!problemSetId || initialQuizzes.length === 0) {
      CustomToast.error(t("유효한 퀴즈 정보가 없습니다. 홈으로 이동합니다."));
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
        const maxWidth = isMobile ?
        containerWidth - padding :
        Math.min(containerWidth - padding, 1200);
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
    setSpecificExplanation("");
  }, [currentQuestion]);

  // 오답만 보기 토글 시 현재 문제 유효성 체크
  useEffect(() => {
    if (showWrongOnly) {
      if (filteredTotalQuestions === 0) {
        // 오답이 없는 경우 토글을 다시 끄고 알림
        setShowWrongOnly(false);
        CustomToast.error(t("오답이 없습니다!"));
        return;
      }

      if (currentQuestion > filteredTotalQuestions) {
        setCurrentQuestion(1);
      }
    }
  }, [showWrongOnly, filteredTotalQuestions, currentQuestion]);

  if (isLoading) {
    return (
      <div className="spinner-container">
        <div className="spinner" />
        <p>{t("로딩 중…")}</p>
      </div>);

  }

  // 현재 문제 객체
  const currentQuizIndex = showWrongOnly ?
  currentQuestion - 1 :
  currentQuestion - 1;

  const currentQuiz = showWrongOnly ?
  filteredQuizzes[currentQuestion - 1] || { selections: [], userAnswer: 0 } :
  initialQuizzes[currentQuestion - 1] || { selections: [], userAnswer: 0 };

  // 이 문제에 대응하는 해설을 찾되, "allExplanation"이 배열이므로 find 사용 가능
  const thisExplanationObj =
  allExplanation.find((e) => e.number === currentQuiz.number) || {};
  const thisExplanationText =
  thisExplanationObj.explanation || t("해설이 없습니다.");

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
    const maxQuestions = showWrongOnly ?
    filteredTotalQuestions :
    totalQuestions;
    if (currentQuestion < maxQuestions) {
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

  const handleFetchSpecificExplanation = async () => {
    setIsSpecificExplanationLoading(true);
    try {
      const response = await axiosInstance.get(
        `/specific-explanation/${problemSetId}?number=${currentQuiz.number}`
      );
      setSpecificExplanation(response.data.specificExplanation);
    } catch (error) {
      console.error(t("상세 해설을 불러오는데 실패했습니다."), error);
      // 임시: 에러 발생 시 모의 상세 해설을 표시합니다.
      CustomToast.error(t("상세 해설을 불러오는데 실패했습니다."));
    } finally {
      setIsSpecificExplanationLoading(false);
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

  // 오답만 보기 토글 핸들러
  const handleWrongOnlyToggle = () => {
    const newShowWrongOnly = !showWrongOnly;
    setShowWrongOnly(newShowWrongOnly);

    // 토글 시 첫 번째 문제로 이동
    setCurrentQuestion(1);
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

  // URL을 링크로 변환하는 함수
  const renderTextWithLinks = (text) => {
    if (!text) return text;

    // URL 패턴을 찾는 정규식 (http:// 또는 https://로 시작하는 URL)
    const urlRegex = /(https?:\/\/[^\s)]+)/g;

    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#0066cc",
              textDecoration: "underline",
              wordBreak: "break-all"
            }}>

            {part}
          </a>);

      }
      return part;
    });
  };

  return (
    <div className="app-container">
      {/* 피드백 모달 - 주석 처리 */}
      {/* {showFeedbackModal && <FeedbackModal />} */}

      <header className="navbar">
        <button className="close-button" onClick={() => handleExit("/")}>
          x
        </button>
      </header>

      <main className="quiz-wrapper">
        <div className="layout-container">
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
                  showWrongOnly ?
                  index + 1 === currentQuestion ?
                  " current" :
                  "" :
                  q.number === currentQuestion ?
                  " current" :
                  ""}`
                  }
                  onClick={() =>
                  showWrongOnly ?
                  handleQuestionClick(index + 1) :
                  handleQuestionClick(q.number)
                  }>

                  {q.number}
                </button>);

            })}
          </aside>

          {/* 가운데 패널: 문제 + 선지 + 확인 + 해설 */}
          <section className="center-panel">
            <div
              className="counter-wrapper"
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
                position: "relative"
              }}>

              <span className="question-counter">
                {currentQuestion} /{" "}
                {showWrongOnly ? filteredTotalQuestions : totalQuestions}
              </span>

              {/* 오답만 보기 토글 */}
              <div
                className="toggle-wrapper"
                style={{
                  display: "flex",
                  alignItems: "center",
                  position: "absolute",
                  right: "0"
                }}>

                <span style={{ marginRight: "0.5rem", fontSize: "0.9rem" }}>{t("❌ 오답만")}

                </span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={showWrongOnly}
                    onChange={handleWrongOnlyToggle} />

                  <span className="slider round" />
                </label>
              </div>
            </div>

            <div
              className={`question-area${
              currentQuiz.userAnswer === 0 ? " unanswered" : ""}`
              }>

              <p className="question-text">{currentQuiz.title}</p>
            </div>

            <div className="options-container">
              {currentQuiz.selections.map((opt, idx) => {
                const isCorrectOption = opt.correct === true;
                const isWrongSelected =
                currentQuiz.userAnswer === opt.id && !opt.correct;
                const borderClass = isCorrectOption ?
                "correct-option" :
                isWrongSelected ?
                "wrong-option" :
                "";
                return (
                  <div key={opt.id} className={`option ${borderClass}`}>
                    <span className="option-icon">{idx + 1}</span>
                    <span className="option-text">{opt.content}</span>
                  </div>);

              })}
            </div>

            <nav className="question-nav">
              <button
                className="nav-button"
                onClick={handlePrev}
                disabled={currentQuestion === 1}>{t("이전")}


              </button>

              <button
                className="nav-button"
                onClick={handleNext}
                disabled={
                currentQuestion === (
                showWrongOnly ? filteredTotalQuestions : totalQuestions)
                }>{t("다음")}


              </button>
            </nav>
            <button className="go-home-button" onClick={() => handleExit("/")}>{t("홈으로")}

            </button>

            <div className="explanation-box">
              <div className="explanation-header">
                <h3 className="explanation-title">{t("해설")}</h3>
                <button
                  className="detailed-explanation-button"
                  onClick={handleFetchSpecificExplanation}
                  disabled={isSpecificExplanationLoading}>

                  {isSpecificExplanationLoading ?
                  <div className="spinner-in-button" /> : t("AI 상세 해설 보기")


                  }
                </button>
              </div>
              <p className="explanation-text">{thisExplanationText}</p>

              {specificExplanation &&
              <div className="specific-explanation-section">
                  <h4 className="specific-explanation-title">{t("상세 해설")}</h4>
                  <p className="explanation-text">
                    {renderTextWithLinks(specificExplanation)}
                  </p>
                </div>
              }

              <div className="all-referenced-pages">
                <h4 className="all-pages-title">{t("📚 참조 페이지")}</h4>
                <div className="pages-list">
                  {allExplanation[currentQuestion - 1]?.referencedPages?.map(
                    (page, index) =>
                    <span
                      key={index}
                      className={`page-number ${
                      currentPdfPage === index ? "active" : ""}`
                      }
                      onClick={() => setCurrentPdfPage(index)}>

                        {page}
                      </span>

                  )}
                </div>
              </div>

              {/**추가 사항 */}
              <div className="pdf-slide-box">
                <div
                  className="slide-header"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginTop: "1rem"
                  }}>
                </div>
                <div className="slide-header">
                  <h4 className="slide-title">{t("📄 관련 슬라이드")}</h4>

                  {/* CSS 기반 스위치 */}
                  <label className="switch" style={{ marginLeft: "0.75rem" }}>
                    <input
                      type="checkbox"
                      checked={showPdf}
                      onChange={handlePdfToggle} />

                    <span className="slider round" />
                  </label>
                </div>
              </div>
              {showPdf &&
              <div className="pdf-slide-box" ref={pdfContainerRef}>
                  <div className="pdf-navigation">
                    <button
                    className="pdf-nav-button"
                    onClick={handlePrevPdfPage}
                    disabled={currentPdfPage === 0}>

                      ←
                    </button>
                    <span className="pdf-page-counter">{t("슬라이드의")}

                    {" " +
                    allExplanation[currentQuestion - 1]?.referencedPages[
                    currentPdfPage] +

                    " "}{t("페이지")}

                  </span>
                    <button
                    className="pdf-nav-button"
                    onClick={handleNextPdfPage}
                    disabled={
                    currentPdfPage ===
                    allExplanation[currentQuestion - 1].referencedPages.
                    length -
                    1
                    }>

                      →
                    </button>
                  </div>
                  {!uploadedUrl ?
                <p>{t("파일 링크가 만료되었습니다.")}</p> :
                uploadedUrl.toLowerCase().endsWith(".pdf") ?
                <Document
                  file={uploadedUrl}
                  loading={<p>{t("PDF 로딩 중...")}</p>}
                  onLoadError={(err) => <p>{t("파일이 존재하지 않습니다.")}</p>}>

                      <Page
                    pageNumber={
                    allExplanation[currentQuestion - 1].referencedPages[
                    currentPdfPage]

                    }
                    width={pdfWidth}
                    renderTextLayer={false}
                    renderAnnotationLayer={false} />

                    </Document> :

                <p>{t("현재는 pdf 파일만 지원합니다.")}</p>
                }
                </div>
              }
            </div>
          </section>

          <aside className="right-panel" />
        </div>
      </main>
    </div>);

};

export default QuizExplanation;