import React from 'react';
import { useTranslation } from 'i18nexus';
import { Link } from 'react-router-dom';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <div className="mt-8 bg-gray-800 py-6 text-center text-sm text-gray-400 md:text-base">
      © {new Date().getFullYear()} Q-Asker{' | '}
      <Link
        to="/privacy-policy"
        className="text-[0.9em] font-medium text-inherit no-underline transition-colors duration-200"
      >
        {t('개인정보 처리방침')}
      </Link>
      <br />
      {t('문의 및 피드백')}
      <span>: </span>
      <a
        href="https://docs.google.com/forms/d/e/1FAIpQLSfibmR4WmBghb74tM0ugldhiutitTsJJx3KN5wYHINpr5GRnw/viewform?usp=dialog"
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-indigo-400 no-underline transition-colors duration-200 hover:text-indigo-300 hover:underline"
      >
        {t('구글 폼 링크')}
      </a>
      <span>, </span>
      <a
        href="mailto:inhapj01@gmail.com"
        aria-label={t('Q-Asker 이메일 문의')}
        className="font-semibold text-indigo-400 no-underline transition-colors duration-200 hover:text-indigo-300 hover:underline"
      >
        inhapj01@gmail.com
      </a>
    </div>
  );
};

/* 쿼리 파라미터 기반 변형 스위칭 (compare/mix 페이지용) */
import { lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';

const FooterMagicA = lazy(() => import('./FooterMagicA'));
const FooterMagicB = lazy(() => import('./FooterMagicB'));
const FooterDesignA = lazy(() => import('./FooterDesignA'));
const FooterDesignB = lazy(() => import('./FooterDesignB'));

const FOOTER_VARIANTS: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  b: FooterMagicA,
  c: FooterMagicB,
  d: FooterDesignA,
  e: FooterDesignB,
};

const FooterWithVariant = () => {
  const [searchParams] = useSearchParams();
  const variant = searchParams.get('footer');
  const VariantComponent = variant ? FOOTER_VARIANTS[variant] : null;

  if (VariantComponent) {
    return (
      <Suspense fallback={null}>
        <VariantComponent />
      </Suspense>
    );
  }
  return <Footer />;
};

export default FooterWithVariant;
