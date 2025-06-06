import React, { useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "./App.css";
import MakeQuiz from "./pages/MakeQuiz";
import QuizExplanation from "./pages/QuizExplanation";
import QuizResult from "./pages/QuizResult";
import SolveQuiz from "./pages/SolveQuiz";
import { initGA, logPageView } from "./utils/analytics";

// Google Analytics 측정 ID (실제 GA4 측정 ID로 교체 필요)
const GA_MEASUREMENT_ID =
  import.meta.env.VITE_GA_MEASUREMENT_ID || "G-XXXXXXXXXX";

// 페이지뷰 추적 컴포넌트
const PageViewTracker = () => {
  const location = useLocation();

  useEffect(() => {
    // 페이지 변경시 Google Analytics에 페이지뷰 전송
    const pageTitle = getPageTitle(location.pathname);
    logPageView(location.pathname + location.search, pageTitle);
  }, [location]);

  return null;
};

// 페이지별 제목 생성 함수
const getPageTitle = (pathname) => {
  const pathMap = {
    "/": "퀴즈 생성",
    "/quiz": "퀴즈 풀기",
    "/result": "퀴즈 결과",
    "/explanation": "퀴즈 해설",
  };

  // 동적 라우트 처리
  for (const [key, title] of Object.entries(pathMap)) {
    if (pathname.startsWith(key)) {
      return title;
    }
  }

  return "알 수 없는 페이지";
};

const App = () => {
  useEffect(() => {
    // Google Analytics 초기화
    initGA(GA_MEASUREMENT_ID);
  }, []);

  return (
    <BrowserRouter>
      <PageViewTracker />
      <ToastContainer />
      <Routes>
        <Route path="/" element={<MakeQuiz />} />
        <Route path="/quiz/:problemSetId" element={<SolveQuiz />} />
        <Route path="/result/:problemSetId" element={<QuizResult />} />
        <Route
          path="/explanation/:problemSetId"
          element={<QuizExplanation />}
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
