import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { ToastContainer } from 'react-toastify';
import MakeQuiz from '#pages/make-quiz';

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
const SolveQuiz = lazy(() => import('#pages/solve-quiz'));
import { I18nProvider, useLanguageSwitcher, useTranslation } from 'i18nexus';
import { loadNamespace } from '#shared/i18n';
import PageViewTracker from '#app/ui/PageViewTracker';
import { useInitGA } from '#app/model/useInitGA';
import { configureAuth } from '#shared/api';
import { useAuthStore, authService } from '#entities/auth';

// Google Analytics 측정 ID (실제 GA4 측정 ID로 교체 필요)
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

const SUPPORTED_LANGUAGES = new Set(['ko', 'en']);
const SEO_CONFIG = {
  ko: {
    '/': {
      title: '[한국어 특화] Q-Asker: PDF, PPT, Word로 무료 AI 퀴즈 생성',
      description:
        'PDF, PPT, Word 파일을 업로드하면 AI가 퀴즈를 생성해줘요. 빈칸, OX, 객관식 문제로 시험에 완벽 대비할 수 있어요. 지금 회원가입 없이 무료로 시작하세요.',
      ogLocale: 'ko_KR',
      ogImageAlt: 'Q-Asker AI 퀴즈 생성 서비스 소개 이미지',
      twitterImageAlt: 'Q-Asker AI 퀴즈 생성 서비스 소개 이미지',
      jsonLd: {
        itemlist: {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'AI 퀴즈 생성 6단계 가이드',
          description: 'PDF, PPT, Word 파일로 AI 퀴즈를 만드는 방법',
          url: 'https://www.q-asker.com/#how-to-use',
          numberOfItems: 6,
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: '학습 자료 파일 업로드',
              description:
                'AI 퀴즈 생성을 위해 PDF, PPT, Word 등 학습 자료 파일을 업로드합니다. 원하는 페이지를 지정하면 AI 퀴즈 생성시 더 좋은 퀴즈를 만들 수 있습니다.',
              url: 'https://www.q-asker.com/#how-to-use',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'AI 퀴즈 옵션 설정',
              description:
                '자동으로 생성할 문제 수량, 페이지 범위, 그리고 퀴즈 유형(빈칸, OX, 객관식)을 선택하여 맞춤형 AI 퀴즈 생성을 준비합니다.',
              url: 'https://www.q-asker.com/#how-to-use',
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: 'AI 퀴즈 자동 생성',
              description: '설정이 끝나면 AI가 문서 내용을 분석하여 퀴즈를 자동으로 생성합니다.',
              url: 'https://www.q-asker.com/#how-to-use',
            },
            {
              '@type': 'ListItem',
              position: 4,
              name: '생성된 퀴즈 풀기',
              description:
                'AI가 만든 퀴즈를 풀어보며 학습 내용을 점검합니다. 나중에 다시 볼 문제는 체크 표시를 하여 효율적인 복습이 가능합니다.',
              url: 'https://www.q-asker.com/#how-to-use',
            },
            {
              '@type': 'ListItem',
              position: 5,
              name: '결과 확인 및 해설 학습',
              description:
                '채점 결과와 함께 모든 문제에 대한 상세한 해설을 제공합니다. 참조한 페이지 미리보기를 통해 내용을 다시 확인하며 깊이 있는 학습을 할 수 있습니다.',
              url: 'https://www.q-asker.com/#how-to-use',
            },
            {
              '@type': 'ListItem',
              position: 6,
              name: '퀴즈 히스토리 관리',
              description:
                '생성했던 모든 AI 퀴즈 기록이 자동으로 저장됩니다. 언제든지 다시 방문하여 복습하거나 이어서 문제를 풀 수 있습니다.',
              url: 'https://www.q-asker.com/#how-to-use',
            },
          ],
        },
        website: {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Q-Asker',
          url: 'https://www.q-asker.com',
          inLanguage: 'ko',
          hasPart: [
            {
              '@type': 'SiteNavigationElement',
              name: '퀴즈 기록',
              url: 'https://www.q-asker.com/history',
            },
          ],
        },
        organization: {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Q-Asker',
          url: 'https://www.q-asker.com',
          logo: {
            '@type': 'ImageObject',
            url: 'https://www.q-asker.com/icons/favicon-512x512.png',
            width: 512,
            height: 512,
          },
          contactPoint: {
            '@type': 'ContactPoint',
            email: 'inhapj01@gmail.com',
            contactType: 'customer support',
          },
        },
        faq: {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'Q-Asker는 정말 무료인가요?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: '네, PDF, PPT, Word 기반 AI 퀴즈 생성은 현재 완전 무료입니다. 별도의 회원가입 없이 누구나 자유롭게 이용할 수 있습니다.',
              },
            },
            {
              '@type': 'Question',
              name: '업로드한 제 파일은 안전하게 관리되나요?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: '네. 업로드된 파일은 퀴즈 생성을 위해서만 일시적으로 사용되며, 24시간 뒤에 삭제됩니다.',
              },
            },
            {
              '@type': 'Question',
              name: 'AI가 만든 퀴즈의 정확도는 어느 정도인가요?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'AI는 높은 정확도로 문서를 분석하지만, 100% 완벽하지 않을 수 있습니다. 생성된 문제는 학습 참고용이며, 중요한 정보는 반드시 원본과 교차 확인해주세요.',
              },
            },
            {
              '@type': 'Question',
              name: '이미지로 된 파일도 퀴즈로 만들 수 있나요?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: '네. OCR을 지원하여 스캔 본이나 사진 형태의 문서도 분석할 수 있습니다.',
              },
            },
          ],
        },
        software: {
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'Q-Asker',
          url: 'https://www.q-asker.com',
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Web Browser',
          description:
            'PDF, PPT, Word 파일을 업로드하면 AI가 퀴즈를 자동 생성합니다. 빈칸, OX, 객관식 문제로 시험에 완벽 대비하세요.',
          inLanguage: ['ko', 'en'],
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'KRW' },
          featureList: [
            'PDF 퀴즈 자동 생성',
            'PPT 퀴즈 만들기',
            'Word 퀴즈 변환',
            'OCR 지원',
            '빈칸/OX/객관식 문제 유형',
            '퀴즈 히스토리 관리',
          ],
        },
      },
    },
    '/history': {
      title: '퀴즈 기록',
      description:
        '내가 생성했던 퀴즈 기록을 확인해보세요. 과거에 풀었던 문제를 다시 복습할 수 있습니다.',
      ogLocale: 'ko_KR',
      ogImageAlt: 'Q-Asker 퀴즈 기록 페이지',
      twitterImageAlt: 'Q-Asker 퀴즈 기록 페이지',
      jsonLd: {
        website: {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Q-Asker',
          url: 'https://www.q-asker.com',
          inLanguage: 'ko',
          hasPart: [
            {
              '@type': 'SiteNavigationElement',
              name: '퀴즈 생성하기',
              url: 'https://www.q-asker.com/',
            },
          ],
        },
        breadcrumb: {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: '홈',
              item: 'https://www.q-asker.com',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: '퀴즈 기록',
              item: 'https://www.q-asker.com/history',
            },
          ],
        },
      },
    },
  },
  en: {
    '/': {
      title: 'Q-Asker: Free AI Quiz Generator for PDF, PPT, Word',
      description:
        'Upload PDF, PPT, and Word files to automatically generate AI quizzes. Prepare perfectly for exams with Fill-in-the-blank, True/False, and Multiple-choice questions. Start for free now without signing up.',
      ogLocale: 'en_US',
      ogImageAlt: 'Q-Asker AI quiz generator preview',
      twitterImageAlt: 'Q-Asker AI quiz generator preview',
      jsonLd: {
        itemlist: {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'How to Generate AI Quizzes in 6 Steps',
          description: 'How to create AI quizzes from PDF, PPT, and Word files',
          url: 'https://www.q-asker.com/#how-to-use',
          numberOfItems: 6,
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Upload your study file',
              description:
                'Upload a PDF, PPT, or Word file to generate AI quizzes. Selecting specific pages helps create better questions.',
              url: 'https://www.q-asker.com/#how-to-use',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Configure quiz options',
              description:
                'Choose the number of questions, page range, and quiz types (fill-in-the-blank, true/false, multiple choice).',
              url: 'https://www.q-asker.com/#how-to-use',
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: 'Generate quizzes',
              description:
                'Once set, the AI analyzes the document and generates quizzes automatically.',
              url: 'https://www.q-asker.com/#how-to-use',
            },
            {
              '@type': 'ListItem',
              position: 4,
              name: 'Solve the quizzes',
              description:
                'Practice with AI-generated quizzes and check your understanding. Mark questions to review later.',
              url: 'https://www.q-asker.com/#how-to-use',
            },
            {
              '@type': 'ListItem',
              position: 5,
              name: 'Review results and explanations',
              description:
                'See scores and detailed explanations for every question. Preview the referenced pages to study in depth.',
              url: 'https://www.q-asker.com/#how-to-use',
            },
            {
              '@type': 'ListItem',
              position: 6,
              name: 'Manage quiz history',
              description:
                'All generated quizzes are saved automatically. Revisit anytime to review or continue solving.',
              url: 'https://www.q-asker.com/#how-to-use',
            },
          ],
        },
        website: {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Q-Asker',
          url: 'https://www.q-asker.com',
          inLanguage: 'en',
          hasPart: [
            {
              '@type': 'SiteNavigationElement',
              name: 'Quiz History',
              url: 'https://www.q-asker.com/history',
            },
          ],
        },
        organization: {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Q-Asker',
          url: 'https://www.q-asker.com',
          logo: {
            '@type': 'ImageObject',
            url: 'https://www.q-asker.com/icons/favicon-512x512.png',
            width: 512,
            height: 512,
          },
          contactPoint: {
            '@type': 'ContactPoint',
            email: 'inhapj01@gmail.com',
            contactType: 'customer support',
          },
        },
        faq: {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: 'Is Q-Asker really free?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes. AI quiz generation for PDF, PPT, and Word files is currently free with no signup required.',
              },
            },
            {
              '@type': 'Question',
              name: 'Are my uploaded files secure?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes. Files are used only to generate quizzes and are deleted within 24 hours.',
              },
            },
            {
              '@type': 'Question',
              name: 'How accurate are the AI-generated quizzes?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'The AI is highly accurate, but not perfect. Use the questions as study aids and verify critical details with the original.',
              },
            },
            {
              '@type': 'Question',
              name: 'Can I create quizzes from image files?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes. OCR is supported, so scans and photo-based documents can be analyzed too.',
              },
            },
          ],
        },
        software: {
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'Q-Asker',
          url: 'https://www.q-asker.com',
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Web Browser',
          description:
            'Upload PDF, PPT, and Word files to automatically generate AI quizzes. Prepare for exams with fill-in-the-blank, true/false, and multiple-choice questions.',
          inLanguage: ['ko', 'en'],
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          featureList: [
            'AI Quiz Generation from PDF',
            'PPT Quiz Creator',
            'Word Document Quiz Converter',
            'OCR Support',
            'Fill-in-the-blank / True-False / Multiple-choice',
            'Quiz History Management',
          ],
        },
      },
    },
    '/history': {
      title: 'Quiz History',
      description:
        'Check the quiz history you created. You can review the questions you solved in the past.',
      ogLocale: 'en_US',
      ogImageAlt: 'Q-Asker Quiz History Page',
      twitterImageAlt: 'Q-Asker Quiz History Page',
      jsonLd: {
        website: {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Q-Asker',
          url: 'https://www.q-asker.com',
          inLanguage: 'en',
          hasPart: [
            {
              '@type': 'SiteNavigationElement',
              name: 'Create Quiz',
              url: 'https://www.q-asker.com/',
            },
          ],
        },
        breadcrumb: {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: 'https://www.q-asker.com',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Quiz History',
              item: 'https://www.q-asker.com/history',
            },
          ],
        },
      },
    },
  },
};

const updateMetaContent = (selector: string, content: string | undefined): void => {
  if (!content) return;
  const element = document.head.querySelector(selector);
  if (!element) return;
  element.setAttribute('content', content);
};

const updateLinkHref = (selector: string, href: string | undefined): void => {
  if (!href) return;
  const element = document.head.querySelector(selector);
  if (!element) return;
  element.setAttribute('href', href);
};

const updateJsonLd = (id: string, data: Record<string, unknown> | undefined): void => {
  const element = document.head.querySelector(`#${id}`);
  if (!element) return;
  if (!data) {
    element.textContent = '';
    return;
  }
  element.textContent = JSON.stringify(data);
};
configureAuth({
  getAccessToken: () => useAuthStore.getState().accessToken,
  clearAuth: () => useAuthStore.getState().clearAuth(),
  refreshAuthToken: () => authService.refresh(),
});

const SeoMetaSync = () => {
  const { currentLanguage } = useTranslation('common');
  const location = useLocation();

  useEffect(() => {
    const langConfig = SEO_CONFIG[currentLanguage] ?? SEO_CONFIG.ko;
    const path = location.pathname;
    // 경로에 맞는 설정 찾기 (정확히 일치하거나, /history 포함시)
    const config = path.includes('/history') ? langConfig['/history'] : langConfig['/'];

    if (!config) return;

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

    const canonicalBase = 'https://www.q-asker.com';
    const canonicalPath = location.pathname === '/' ? '' : location.pathname;
    const canonical = `${canonicalBase}${canonicalPath}`;
    updateLinkHref('link[rel="canonical"]', canonical);
    updateMetaContent('meta[property="og:url"]', canonical);

    // JSON-LD 업데이트
    if (config.jsonLd) {
      updateJsonLd('ld-itemlist', config.jsonLd.itemlist);
      updateJsonLd('ld-website', config.jsonLd.website);
      updateJsonLd('ld-organization', config.jsonLd.organization);
      updateJsonLd('ld-faq', config.jsonLd.faq);
      updateJsonLd('ld-software', config.jsonLd.software);

      // Breadcrumb는 index.html에 기본 태그가 없으므로 동적으로 생성/관리 필요
      // 여기서는 기존 구조를 유지하며 단순화
    }
  }, [currentLanguage, location.pathname]);

  return null;
};

const LanguageRouteSync = () => {
  const { changeLanguage } = useLanguageSwitcher();
  const { currentLanguage } = useTranslation('common');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === '/') {
      const userAgent = window.navigator?.userAgent ?? '';
      const isBot =
        /bot|crawler|spider|googlebot|bingbot|yandex|baiduspider|duckduckbot|slurp|facebookexternalhit|twitterbot|rogerbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest|slackbot|vkshare|w3c_validator|HeadlessChrome/i.test(
          userAgent,
        );
      if (isBot) {
        return;
      }
      const browserLang = window.navigator?.language?.toLowerCase() ?? '';
      if (browserLang.startsWith('en')) {
        navigate('/en', { replace: true });
        return;
      }
    }
    const path = location.pathname;
    const langFromPath = path === '/en' ? 'en' : path === '/ko' ? 'ko' : null;
    if (!langFromPath || !SUPPORTED_LANGUAGES.has(langFromPath)) return;
    if (currentLanguage === langFromPath) return;
    changeLanguage(langFromPath);
  }, [changeLanguage, currentLanguage, location.pathname, navigate]);

  return null;
};

const getInitialLanguage = (): string => {
  if (typeof window === 'undefined') return 'ko';
  const path = window.location.pathname;
  const langFromPath = path === '/en' ? 'en' : path === '/ko' ? 'ko' : null;
  return langFromPath ?? 'ko';
};

const App = () => {
  useInitGA(GA_MEASUREMENT_ID);

  // 프리렌더링: React 마운트 완료 시 이벤트 발행
  useEffect(() => {
    document.dispatchEvent(new Event('prerender-ready'));
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" storageKey="theme">
      <I18nProvider
        loadNamespace={loadNamespace}
        fallbackNamespace="common"
        preloadNamespaces={['common']}
        initialLanguage={getInitialLanguage()}
        languageManagerOptions={{ defaultLanguage: 'ko' }}
      >
        <BrowserRouter>
          <LanguageRouteSync />
          <SeoMetaSync />
          <PageViewTracker />
          <ToastContainer />
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
              <Route path="/help" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </I18nProvider>
    </ThemeProvider>
  );
};

export default App;
