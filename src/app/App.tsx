import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { ToastContainer } from 'react-toastify';
import { I18nProvider } from 'i18nexus';
import MakeQuiz from '#pages/make-quiz';
import { loadNamespace } from '#shared/i18n';
import PageViewTracker from '#app/ui/PageViewTracker';
import { useInitGA } from '#app/model/useInitGA';
import { useInitClarity } from '#app/model/useInitClarity';
import { configureAuth } from '#shared/api';
import { useAuthStore, authService } from '#entities/auth';
import { cleanupExpiredItems } from '#features/solve-quiz';
import SeoMetaSync from '#app/seo';
import { LanguageRouteSync, getInitialLanguage } from '#app/i18n-route';

// 코드 스플리팅: 홈페이지 외 페이지는 lazy load
const Maintenance = lazy(() => import('#pages/maintenance'));
const LoginSelect = lazy(() => import('#pages/login-select'));
const LoginRedirect = lazy(() => import('#pages/login-redirect'));
const Board = lazy(() => import('#pages/board'));
const BoardDetail = lazy(() => import('#pages/board-detail'));
const BoardWrite = lazy(() => import('#pages/board-write'));
const PrivacyPolicy = lazy(() => import('#pages/privacy-policy'));
const TermsOfService = lazy(() => import('#pages/terms-of-service'));
const QuizExplanation = lazy(() => import('#pages/quiz-explanation'));
const QuizHistory = lazy(() => import('#pages/quiz-history'));
const QuizHistoryDetail = lazy(() => import('#pages/quiz-history-detail'));
const QuizResult = lazy(() => import('#pages/quiz-result'));
const solveQuizImport = () => import('#pages/solve-quiz');
const SolveQuiz = lazy(solveQuizImport);

// idle 시 퀴즈 풀기 페이지 백그라운드 프리로드 (Safari는 requestIdleCallback 미지원)
if (typeof window !== 'undefined') {
  if (window.requestIdleCallback) {
    window.requestIdleCallback(() => solveQuizImport());
  } else {
    requestAnimationFrame(() => setTimeout(() => solveQuizImport(), 0));
  }
}

// Google Analytics 측정 ID (실제 GA4 측정 ID로 교체 필요)
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

// Microsoft Clarity 프로젝트 ID — prod에서만 활성화
const CLARITY_PROJECT_ID = import.meta.env.PROD
  ? (import.meta.env.VITE_CLARITY_PROJECT_ID as string | undefined)
  : undefined;

configureAuth({
  getAccessToken: () => useAuthStore.getState().accessToken,
  clearAuth: () => useAuthStore.getState().clearAuth(),
  refreshAuthToken: async () => {
    await authService.refresh();
  },
});

const App = () => {
  useInitGA(GA_MEASUREMENT_ID);
  useInitClarity(CLARITY_PROJECT_ID);

  // 프리렌더링: React 마운트 완료 시 이벤트 발행
  useEffect(() => {
    document.dispatchEvent(new Event('prerender-ready'));
  }, []);

  // 만료된 퀴즈 localStorage 항목 정리 (하루 1회)
  useEffect(() => {
    cleanupExpiredItems();
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" storageKey="theme">
      <I18nProvider
        loadNamespace={loadNamespace}
        fallbackNamespace="common"
        preloadNamespaces={[
          'common',
          'make-quiz',
          'solve-quiz',
          'quiz-result',
          'quiz-explanation',
          'quiz-history',
          'quiz-history-detail',
          'board',
          'board-detail',
          'board-write',
          'login-select',
          'login-redirect',
          'maintenance',
          'privacy-policy',
          'terms-of-service',
        ]}
        initialLanguage={getInitialLanguage()}
        languageManagerOptions={{ defaultLanguage: 'ko' }}
      >
        <BrowserRouter>
          <LanguageRouteSync />
          <SeoMetaSync />
          <PageViewTracker />
          <ToastContainer />
          <main>
            <Suspense>
              <Routes>
                {/* 점검 완료 후 아래 라우트로 복원
            <Route path="*" element={<Maintenance />} />
            */}
                <Route path="/" element={<MakeQuiz />} />
                <Route path="/ko" element={<MakeQuiz />} />
                <Route path="/en" element={<MakeQuiz />} />
                <Route path="/login" element={<LoginSelect />} />
                <Route path="/login/redirect" element={<LoginRedirect />} />
                <Route path="/maintenance" element={<Maintenance />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/quiz/:problemSetId" element={<SolveQuiz />} />
                <Route path="/result/:problemSetId" element={<QuizResult />} />
                <Route path="/explanation/:problemSetId" element={<QuizExplanation />} />
                <Route path="/history" element={<QuizHistory />} />
                <Route path="/history/:historyId" element={<QuizHistoryDetail />} />
                <Route path="/boards" element={<Board />} />
                <Route path="/boards/:boardId" element={<BoardDetail />} />
                <Route path="/boards/write" element={<BoardWrite />} />
                <Route path="/boards/edit/:boardId" element={<BoardWrite />} />
                <Route path="/updates" element={<Board category="UPDATE_LOG" />} />
                <Route path="/updates/write" element={<BoardWrite category="UPDATE_LOG" />} />
                <Route
                  path="/updates/edit/:boardId"
                  element={<BoardWrite category="UPDATE_LOG" />}
                />
                <Route path="/updates/:boardId" element={<BoardDetail category="UPDATE_LOG" />} />
                <Route path="/help" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </main>
        </BrowserRouter>
      </I18nProvider>
    </ThemeProvider>
  );
};

export default App;
