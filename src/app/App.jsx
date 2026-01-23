import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "./App.css";
import Login from "#pages/login";
import LoginRedirect from "#pages/login-redirect";
import MakeQuiz from "#pages/make-quiz";
import QuizExplanation from "#pages/quiz-explanation";
import QuizHistory from "#pages/quiz-history";
import QuizResult from "#pages/quiz-result";
import SolveQuiz from "#pages/solve-quiz";
import { I18nProvider } from "i18nexus";
import { translations } from "#shared/i18n";
import PageViewTracker from "#app/ui/PageViewTracker";
import { useInitGA } from "#app/model/useInitGA";

// Google Analytics 측정 ID (실제 GA4 측정 ID로 교체 필요)
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

const App = () => {
  useInitGA(GA_MEASUREMENT_ID);

  return (
    <I18nProvider translations={translations}>
      <BrowserRouter>
        <PageViewTracker />
        <ToastContainer />
        <Routes>
          <Route path="/" element={<MakeQuiz />} />
          <Route path="/login" element={<Login />} />
          <Route path="/login/redirect" element={<LoginRedirect />} />
          <Route path="/quiz/:problemSetId" element={<SolveQuiz />} />
          <Route path="/result/:problemSetId" element={<QuizResult />} />
          <Route
            path="/explanation/:problemSetId"
            element={<QuizExplanation />}
          />
          <Route path="/history" element={<QuizHistory />} />
          <Route path="/help" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </I18nProvider>
  );
};

export default App;
