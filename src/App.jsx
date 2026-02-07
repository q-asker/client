import { initGA, logPageView } from '#utils/analytics';
import { getPageTitle } from '#app/model/pageTitles';
import React, { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import './App.css';
import MakeQuiz from './pages/make-quiz';
import QuizExplanation from './pages/quiz-explanation';
import QuizHistory from './pages/quiz-history';
import QuizResult from './pages/quiz-result';
import SolveQuiz from './pages/solve-quiz';
import { I18nProvider } from 'i18nexus';
import { translations } from '../locales';

// Google Analytics 측정 ID (실제 GA4 측정 ID로 교체 필요)
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

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

const App = () => {
  useEffect(() => {
    // Google Analytics 초기화
    initGA(GA_MEASUREMENT_ID);
  }, []);

  return (
    <I18nProvider translations={translations}>
      <BrowserRouter>
        <PageViewTracker />
        <ToastContainer position="top-center" />
        <Routes>
          <Route path="/" element={<MakeQuiz />} />
          <Route path="/quiz/:problemSetId" element={<SolveQuiz />} />
          <Route path="/result/:problemSetId" element={<QuizResult />} />
          <Route path="/explanation/:problemSetId" element={<QuizExplanation />} />
          <Route path="/history" element={<QuizHistory />} />
          <Route path="/help" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </I18nProvider>
  );
};

export default App;
