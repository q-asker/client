import React, { useEffect } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "./App.css";
import LoginSelect from "#pages/login-select";
import LoginRedirect from "#pages/login-redirect";
import MakeQuiz from "#pages/make-quiz";
import PrivacyPolicy from "#pages/privacy-policy";
import QuizExplanation from "#pages/quiz-explanation";
import QuizHistory from "#pages/quiz-history";
import QuizResult from "#pages/quiz-result";
import SolveQuiz from "#pages/solve-quiz";
import { I18nProvider, useLanguageSwitcher, useTranslation } from "i18nexus";
import { translations } from "#shared/i18n";
import PageViewTracker from "#app/ui/PageViewTracker";
import { useInitGA } from "#app/model/useInitGA";

// Google Analytics 측정 ID (실제 GA4 측정 ID로 교체 필요)
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

const SUPPORTED_LANGUAGES = new Set(["ko", "en"]);

const SEO_CONFIG = {
  ko: {
    title: "Q-Asker: PDF, PPT, Word로 무료 AI 퀴즈 생성",
    description:
      "PDF, PPT, Word 파일을 업로드하면 AI가 퀴즈를 생성해줘요. 빈칸, OX, 객관식 문제로 시험에 완벽 대비할 수 있어요. 지금 회원가입 없이 무료로 시작하세요.",
    ogLocale: "ko_KR",
    ogImageAlt: "Q-Asker AI 퀴즈 생성 서비스 소개 이미지",
    twitterImageAlt: "Q-Asker AI 퀴즈 생성 서비스 소개 이미지",
    jsonLd: {
      howto: {
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: "학습 자료로 퀴즈를 생성하는 방법",
        description:
          "PDF, PPT, Word 파일을 업로드하면 AI가 퀴즈를 생성해줘요. 빈칸, OX, 객관식 문제로 시험에 완벽 대비할 수 있어요. 지금 회원가입 없이 무료로 시작하세요.",
        inLanguage: "ko",
        step: [
          {
            "@type": "HowToStep",
            name: "1단계: 학습 자료 파일 업로드",
            text: "AI 퀴즈 생성을 위해 PDF, PPT, Word 등 학습 자료 파일을 업로드합니다. 원하는 페이지를 지정하면 AI 퀴즈 생성시 더 좋은 퀴즈를 만들 수 있습니다.",
            url: "https://www.q-asker.com#how-to-use",
          },
          {
            "@type": "HowToStep",
            name: "2단계: AI 퀴즈 옵션 설정",
            text: "자동으로 생성할 문제 수량, 페이지 범위, 그리고 퀴즈 유형(빈칸, OX, 객관식)을 선택하여 맞춤형 AI 퀴즈 생성을 준비합니다.",
            url: "https://www.q-asker.com#how-to-use",
          },
          {
            "@type": "HowToStep",
            name: "3단계: AI 퀴즈 자동 생성",
            text: "설정이 끝나면 AI가 문서 내용을 분석하여 퀴즈를 자동으로 생성합니다.",
            url: "https://www.q-asker.com#how-to-use",
          },
          {
            "@type": "HowToStep",
            name: "4단계: 생성된 퀴즈 풀기",
            text: "AI가 만든 퀴즈를 풀어보며 학습 내용을 점검합니다. 나중에 다시 볼 문제는 체크 표시를 하여 효율적인 복습이 가능합니다.",
            url: "https://www.q-asker.com#how-to-use",
          },
          {
            "@type": "HowToStep",
            name: "5단계: 결과 확인 및 해설 학습",
            text: "채점 결과와 함께 모든 문제에 대한 상세한 해설을 제공합니다. 참조한 페이지 미리보기를 통해 내용을 다시 확인하며 깊이 있는 학습을 할 수 있습니다.",
            url: "https://www.q-asker.com#how-to-use",
          },
          {
            "@type": "HowToStep",
            name: "6단계: 퀴즈 히스토리 관리",
            text: "생성했던 모든 AI 퀴즈 기록이 자동으로 저장됩니다. 언제든지 다시 방문하여 복습하거나 이어서 문제를 풀 수 있습니다.",
            url: "https://www.q-asker.com#how-to-use",
          },
        ],
      },
      website: {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Q-Asker",
        url: "https://www.q-asker.com",
        inLanguage: "ko",
      },
      organization: {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Q-Asker",
        url: "https://www.q-asker.com",
        logo: "https://www.q-asker.com/favicon-512x512.png",
      },
      faq: {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "Q. Q-Asker는 정말 무료인가요?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "네, PDF, PPT, Word 기반 AI 퀴즈 생성은 현재 완전 무료입니다. 별도의 회원가입 없이 누구나 자유롭게 이용할 수 있습니다.",
            },
          },
          {
            "@type": "Question",
            name: "Q. 업로드한 제 파일은 안전하게 관리되나요?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "네. 업로드된 파일은 퀴즈 생성을 위해서만 일시적으로 사용되며, 24시간 뒤에 삭제됩니다.",
            },
          },
          {
            "@type": "Question",
            name: "Q. AI가 만든 퀴즈의 정확도는 어느 정도인가요?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "AI는 높은 정확도로 문서를 분석하지만, 100% 완벽하지 않을 수 있습니다. 생성된 문제는 학습 참고용이며, 중요한 정보는 반드시 원본과 교차 확인해주세요.",
            },
          },
          {
            "@type": "Question",
            name: "Q. 이미지로 된 파일도 퀴즈로 만들 수 있나요?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "네. OCR을 지원하여 스캔 본이나 사진 형태의 문서도 분석할 수 있습니다.",
            },
          },
        ],
      },
    },
  },
  en: {
    title: "Q-Asker: Free AI Quiz Generator for PDF, PPT, Word",
    description:
      "Upload PDF, PPT, and Word files to automatically generate AI quizzes. Prepare perfectly for exams with Fill-in-the-blank, True/False, and Multiple-choice questions. Start for free now without signing up.",
    ogLocale: "en_US",
    ogImageAlt: "Q-Asker AI quiz generator preview",
    twitterImageAlt: "Q-Asker AI quiz generator preview",
    jsonLd: {
      howto: {
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: "How to generate quizzes from study materials",
        description:
          "Upload PDF, PPT, and Word files to automatically generate AI quizzes. Prepare perfectly for exams with Fill-in-the-blank, True/False, and Multiple-choice questions. Start for free now without signing up.",
        inLanguage: "en",
        step: [
          {
            "@type": "HowToStep",
            name: "Step 1: Upload your study file",
            text: "Upload a PDF, PPT, or Word file to generate AI quizzes. Selecting specific pages helps create better questions.",
            url: "https://www.q-asker.com#how-to-use",
          },
          {
            "@type": "HowToStep",
            name: "Step 2: Configure quiz options",
            text: "Choose the number of questions, page range, and quiz types (fill-in-the-blank, true/false, multiple choice).",
            url: "https://www.q-asker.com#how-to-use",
          },
          {
            "@type": "HowToStep",
            name: "Step 3: Generate quizzes",
            text: "Once set, the AI analyzes the document and generates quizzes automatically.",
            url: "https://www.q-asker.com#how-to-use",
          },
          {
            "@type": "HowToStep",
            name: "Step 4: Solve the quizzes",
            text: "Practice with AI-generated quizzes and check your understanding. Mark questions to review later.",
            url: "https://www.q-asker.com#how-to-use",
          },
          {
            "@type": "HowToStep",
            name: "Step 5: Review results and explanations",
            text: "See scores and detailed explanations for every question. Preview the referenced pages to study in depth.",
            url: "https://www.q-asker.com#how-to-use",
          },
          {
            "@type": "HowToStep",
            name: "Step 6: Manage quiz history",
            text: "All generated quizzes are saved automatically. Revisit anytime to review or continue solving.",
            url: "https://www.q-asker.com#how-to-use",
          },
        ],
      },
      website: {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Q-Asker",
        url: "https://www.q-asker.com",
        inLanguage: "en",
      },
      organization: {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Q-Asker",
        url: "https://www.q-asker.com",
        logo: "https://www.q-asker.com/favicon-512x512.png",
      },
      faq: {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "Is Q-Asker really free?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. AI quiz generation for PDF, PPT, and Word files is currently free with no signup required.",
            },
          },
          {
            "@type": "Question",
            name: "Are my uploaded files secure?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. Files are used only to generate quizzes and are deleted within 24 hours.",
            },
          },
          {
            "@type": "Question",
            name: "How accurate are the AI-generated quizzes?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "The AI is highly accurate, but not perfect. Use the questions as study aids and verify critical details with the original.",
            },
          },
          {
            "@type": "Question",
            name: "Can I create quizzes from image files?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. OCR is supported, so scans and photo-based documents can be analyzed too.",
            },
          },
        ],
      },
    },
  },
};

const updateMetaContent = (selector, content) => {
  if (!content) return;
  const element = document.head.querySelector(selector);
  if (!element) return;
  element.setAttribute("content", content);
};

const updateLinkHref = (selector, href) => {
  if (!href) return;
  const element = document.head.querySelector(selector);
  if (!element) return;
  element.setAttribute("href", href);
};

const updateJsonLd = (id, data) => {
  if (!data) return;
  const element = document.head.querySelector(`#${id}`);
  if (!element) return;
  element.textContent = JSON.stringify(data);
};

const SeoMetaSync = () => {
  const { currentLanguage } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    const config = SEO_CONFIG[currentLanguage] ?? SEO_CONFIG.ko;
    document.title = config.title;
    document.documentElement.lang = currentLanguage;

    updateMetaContent('meta[name="description"]', config.description);
    updateMetaContent('meta[property="og:title"]', config.title);
    updateMetaContent('meta[property="og:description"]', config.description);
    updateMetaContent('meta[property="og:locale"]', config.ogLocale);
    updateMetaContent('meta[property="og:image:alt"]', config.ogImageAlt);
    updateMetaContent('meta[name="twitter:title"]', config.title);
    updateMetaContent('meta[name="twitter:description"]', config.description);
    updateMetaContent('meta[name="twitter:image:alt"]', config.twitterImageAlt);

    const canonicalBase = "https://www.q-asker.com";
    const canonicalPath = location.pathname === "/" ? "/" : location.pathname;
    const canonical = `${canonicalBase}${canonicalPath}`;
    updateLinkHref('link[rel="canonical"]', canonical);
    updateMetaContent('meta[property="og:url"]', canonical);

    updateJsonLd("ld-howto", config.jsonLd.howto);
    updateJsonLd("ld-website", config.jsonLd.website);
    updateJsonLd("ld-organization", config.jsonLd.organization);
    updateJsonLd("ld-faq", config.jsonLd.faq);
  }, [currentLanguage, location.pathname]);

  return null;
};

const LanguageRouteSync = () => {
  const { changeLanguage } = useLanguageSwitcher();
  const { currentLanguage } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === "/") {
      const browserLang = window.navigator?.language?.toLowerCase() ?? "";
      if (browserLang.startsWith("en")) {
        navigate("/en", { replace: true });
        return;
      }
    }
    const path = location.pathname;
    const langFromPath = path === "/en" ? "en" : path === "/ko" ? "ko" : null;
    if (!langFromPath || !SUPPORTED_LANGUAGES.has(langFromPath)) return;
    if (currentLanguage === langFromPath) return;
    changeLanguage(langFromPath);
  }, [changeLanguage, currentLanguage, location.pathname, navigate]);

  return null;
};

const getInitialLanguage = () => {
  if (typeof window === "undefined") return "ko";
  const path = window.location.pathname;
  const langFromPath = path === "/en" ? "en" : path === "/ko" ? "ko" : null;
  return langFromPath ?? "ko";
};

const App = () => {
  useInitGA(GA_MEASUREMENT_ID);

  return (
    <I18nProvider
      translations={translations}
      initialLanguage={getInitialLanguage()}
      languageManagerOptions={{ defaultLanguage: "ko" }}
    >
      <BrowserRouter>
        <LanguageRouteSync />
        <SeoMetaSync />
        <PageViewTracker />
        <ToastContainer />
        <Routes>
          <Route path="/" element={<MakeQuiz />} />
          <Route path="/ko" element={<MakeQuiz />} />
          <Route path="/en" element={<MakeQuiz />} />
          <Route path="/login" element={<LoginSelect />} />
          <Route path="/login/redirect" element={<LoginRedirect />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
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
