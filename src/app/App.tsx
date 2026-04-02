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
              url: 'https://www.q-asker.com/#how-to-use',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'AI 퀴즈 옵션 설정',
              url: 'https://www.q-asker.com/#how-to-use',
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: 'AI 퀴즈 자동 생성',
              url: 'https://www.q-asker.com/#how-to-use',
            },
            {
              '@type': 'ListItem',
              position: 4,
              name: '생성된 퀴즈 풀기',
              url: 'https://www.q-asker.com/#how-to-use',
            },
            {
              '@type': 'ListItem',
              position: 5,
              name: '결과 확인 및 해설 학습',
              url: 'https://www.q-asker.com/#how-to-use',
            },
            {
              '@type': 'ListItem',
              position: 6,
              name: '퀴즈 히스토리 관리',
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
          description:
            'AI 기반 퀴즈 자동 생성 서비스. PDF, PPT, Word 파일로 빈칸·OX·객관식 문제를 즉시 생성합니다.',
          contactPoint: {
            '@type': 'ContactPoint',
            email: 'contact@q-asker.com',
            contactType: 'customer-support',
            availableLanguage: ['Korean', 'English'],
          },
          sameAs: ['https://github.com/q-asker'],
          foundingDate: '2025-01-01',
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
                text: '네, Q-Asker의 AI 퀴즈 생성은 현재 완전 무료입니다. 회원가입 없이 PDF, PPT, Word 파일(최대 30MB)을 업로드하면 빈칸 채우기, OX, 객관식 문제를 5~25개까지 자동 생성할 수 있습니다. 별도 결제나 구독 없이 누구나 자유롭게 이용 가능합니다.',
              },
            },
            {
              '@type': 'Question',
              name: '업로드한 제 파일은 안전하게 관리되나요?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: '네, 보안을 최우선으로 관리합니다. 업로드된 파일은 퀴즈 생성을 위해서만 일시적으로 사용되며, 24시간 뒤 서버에서 자동 삭제됩니다. 파일은 상업적 목적이나 AI 학습 데이터로 사용되지 않습니다.',
              },
            },
            {
              '@type': 'Question',
              name: 'AI가 만든 퀴즈의 정확도는 어느 정도인가요?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'AI는 높은 정확도로 문서를 분석하여 핵심 개념 중심의 퀴즈를 생성합니다. 다만 100% 완벽하지 않을 수 있으므로, 생성된 문제는 학습 참고용으로 활용하시고 중요한 정보는 반드시 원본 자료와 교차 확인해주세요. 페이지 범위를 지정하면 더 정확한 문제를 얻을 수 있습니다.',
              },
            },
            {
              '@type': 'Question',
              name: '이미지로 된 파일도 퀴즈로 만들 수 있나요?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: '네, OCR(광학 문자 인식) 기술을 지원합니다. 스캔본이나 사진으로 촬영한 문서도 텍스트를 자동 추출하여 퀴즈를 생성할 수 있습니다. PDF, PPT, Word 형식의 이미지 기반 파일을 그대로 업로드하면 됩니다. 해상도가 높을수록 인식 정확도가 올라가며, 손글씨보다는 인쇄된 텍스트에서 최적의 결과를 얻을 수 있습니다.',
              },
            },
            {
              '@type': 'Question',
              name: '한 번에 몇 문제까지 생성할 수 있나요?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: '한 번에 5개, 10개, 15개, 20개, 25개 중 선택하여 생성할 수 있습니다. 빈칸 채우기, OX, 객관식 3가지 유형을 선택할 수 있으며, 페이지 범위를 지정하면 특정 구간의 내용에 집중한 문제를 생성할 수 있어 더 효율적인 학습이 가능합니다.',
              },
            },
            {
              '@type': 'Question',
              name: '생성된 퀴즈는 저장되나요?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: '네, 로그인한 상태에서 생성한 퀴즈는 퀴즈 기록 페이지에 자동 저장됩니다. 언제든지 다시 방문하여 복습하거나 이어서 문제를 풀 수 있습니다. 비로그인 상태에서도 24시간 동안 브라우저에 임시 저장됩니다.',
              },
            },
          ],
        },
        software: {
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'Q-Asker',
          sameAs: 'https://www.q-asker.com',
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Web Browser',
          description:
            'PDF, PPT, Word 파일을 업로드하면 AI가 퀴즈를 자동 생성합니다. 빈칸, OX, 객관식 문제로 시험에 완벽 대비하세요.',
          inLanguage: ['ko', 'en'],
          image: {
            '@type': 'ImageObject',
            url: 'https://www.q-asker.com/background.png',
          },
          screenshot: {
            '@type': 'ImageObject',
            url: 'https://www.q-asker.com/background.png',
          },
          softwareVersion: '1.0',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'KRW',
            availability: 'https://schema.org/OnlineOnly',
          },
          featureList: [
            'PDF 퀴즈 자동 생성',
            'PPT 퀴즈 만들기',
            'Word 퀴즈 변환',
            'OCR 지원',
            '빈칸/OX/객관식 문제 유형',
            '퀴즈 히스토리 관리',
          ],
        },
        webpage: {
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Q-Asker: PDF, PPT, Word로 무료 AI 퀴즈 생성',
          description:
            'PDF, PPT, Word 파일을 업로드하면 AI가 퀴즈를 자동 생성합니다. 빈칸, OX, 객관식 문제로 시험에 완벽 대비하세요.',
          url: 'https://www.q-asker.com',
          inLanguage: 'ko',
          isPartOf: {
            '@type': 'WebSite',
            name: 'Q-Asker',
            url: 'https://www.q-asker.com',
          },
          about: {
            '@type': 'SoftwareApplication',
            name: 'Q-Asker',
          },
          datePublished: '2025-01-01',
          dateModified: '2026-04-02',
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
          url: 'https://www.q-asker.com/en#how-to-use',
          numberOfItems: 6,
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Upload your study file',
              url: 'https://www.q-asker.com/en#how-to-use',
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Configure quiz options',
              url: 'https://www.q-asker.com/en#how-to-use',
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: 'Generate quizzes',
              url: 'https://www.q-asker.com/en#how-to-use',
            },
            {
              '@type': 'ListItem',
              position: 4,
              name: 'Solve the quizzes',
              url: 'https://www.q-asker.com/en#how-to-use',
            },
            {
              '@type': 'ListItem',
              position: 5,
              name: 'Review results and explanations',
              url: 'https://www.q-asker.com/en#how-to-use',
            },
            {
              '@type': 'ListItem',
              position: 6,
              name: 'Manage quiz history',
              url: 'https://www.q-asker.com/en#how-to-use',
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
          description:
            'AI-powered quiz generation service. Instantly create fill-in-the-blank, true/false, and multiple-choice questions from PDF, PPT, and Word files.',
          contactPoint: {
            '@type': 'ContactPoint',
            email: 'contact@q-asker.com',
            contactType: 'customer-support',
            availableLanguage: ['Korean', 'English'],
          },
          sameAs: ['https://github.com/q-asker'],
          foundingDate: '2025-01-01',
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
                text: "Yes, Q-Asker's AI quiz generation is completely free. Upload PDF, PPT, or Word files (up to 30MB) and generate 5-25 fill-in-the-blank, true/false, or multiple-choice questions instantly. No signup, payment, or subscription required.",
              },
            },
            {
              '@type': 'Question',
              name: 'Are my uploaded files secure?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes, security is our top priority. Uploaded files are used only to generate quizzes and are automatically deleted from our servers within 24 hours. Files are never used for commercial purposes or AI training data.',
              },
            },
            {
              '@type': 'Question',
              name: 'How accurate are the AI-generated quizzes?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'The AI analyzes documents with high accuracy to generate questions focused on key concepts. However, it may not be 100% perfect, so use the questions as study aids and verify critical details with the original material. Specifying a page range helps generate more targeted and accurate questions.',
              },
            },
            {
              '@type': 'Question',
              name: 'Can I create quizzes from image files?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes, OCR (Optical Character Recognition) is fully supported. Scanned documents and photos are automatically processed to extract text for quiz generation. Simply upload image-based PDF, PPT, or Word files as-is. Higher resolution scans produce more accurate results, and printed text works best compared to handwriting.',
              },
            },
            {
              '@type': 'Question',
              name: 'How many questions can I generate at once?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'You can choose to generate 5, 10, 15, 20, or 25 questions per session. Three question types are available: fill-in-the-blank, true/false, and multiple-choice. Specifying a page range focuses the AI on specific sections, producing more targeted and accurate questions for efficient studying.',
              },
            },
            {
              '@type': 'Question',
              name: 'Are my generated quizzes saved?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes, quizzes generated while logged in are automatically saved to your Quiz History page. You can revisit anytime to review or continue solving. Even without an account, quizzes are temporarily stored in your browser for 24 hours.',
              },
            },
          ],
        },
        software: {
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'Q-Asker',
          sameAs: 'https://www.q-asker.com',
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Web Browser',
          description:
            'Upload PDF, PPT, and Word files to automatically generate AI quizzes. Prepare for exams with fill-in-the-blank, true/false, and multiple-choice questions.',
          inLanguage: ['ko', 'en'],
          image: {
            '@type': 'ImageObject',
            url: 'https://www.q-asker.com/background.png',
          },
          screenshot: {
            '@type': 'ImageObject',
            url: 'https://www.q-asker.com/background.png',
          },
          softwareVersion: '1.0',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'KRW',
            availability: 'https://schema.org/OnlineOnly',
          },
          featureList: [
            'AI Quiz Generation from PDF',
            'PPT Quiz Creator',
            'Word Document Quiz Converter',
            'OCR Support',
            'Fill-in-the-blank / True-False / Multiple-choice',
            'Quiz History Management',
          ],
        },
        webpage: {
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Q-Asker: Free AI Quiz Generator for PDF, PPT, Word',
          description:
            'Upload PDF, PPT, and Word files to automatically generate AI quizzes. Prepare for exams with fill-in-the-blank, true/false, and multiple-choice questions.',
          url: 'https://www.q-asker.com/en',
          inLanguage: 'en',
          isPartOf: {
            '@type': 'WebSite',
            name: 'Q-Asker',
            url: 'https://www.q-asker.com',
          },
          about: {
            '@type': 'SoftwareApplication',
            name: 'Q-Asker',
          },
          datePublished: '2025-01-01',
          dateModified: '2026-04-02',
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
    const canonicalPath = location.pathname === '/' ? '' : location.pathname.replace(/\/$/, '');
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
      updateJsonLd('ld-webpage', (config.jsonLd as Record<string, unknown>).webpage);

      // Breadcrumb 동적 삽입 (index.html에 기본 태그가 없으므로 동적 생성)
      const breadcrumbData = (config.jsonLd as Record<string, unknown>).breadcrumb;
      let breadcrumbEl = document.head.querySelector('#ld-breadcrumb');
      if (breadcrumbData) {
        if (!breadcrumbEl) {
          breadcrumbEl = document.createElement('script');
          breadcrumbEl.id = 'ld-breadcrumb';
          breadcrumbEl.setAttribute('type', 'application/ld+json');
          document.head.appendChild(breadcrumbEl);
        }
        breadcrumbEl.textContent = JSON.stringify(breadcrumbData);
      } else if (breadcrumbEl) {
        breadcrumbEl.textContent = '';
      }
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
