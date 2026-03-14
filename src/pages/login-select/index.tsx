import { useTranslation } from 'i18nexus';
import React, { lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import Logo from '#shared/ui/logo';

const LoginSelect = () => {
  const { t } = useTranslation();
  const baseUrl = (import.meta.env.VITE_BASE_URL as string) || '';
  const kakaoLoginUrl = `${baseUrl}/oauth2/authorization/kakao`;
  const googleLoginUrl = `${baseUrl}/oauth2/authorization/google`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="flex w-[min(420px,100%)] flex-col gap-4 rounded-2xl bg-white p-8 text-center shadow-lg">
        <Logo />
        <div className="flex flex-col gap-3">
          <a
            className="inline-flex items-center justify-center rounded-xl bg-[#fee500] px-4 py-3 text-base font-semibold text-gray-900 no-underline transition-colors duration-200 hover:bg-[#f5dc00]"
            href={kakaoLoginUrl}
          >
            {t('카카오 로그인')}
          </a>
          <a
            className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-3 text-base font-semibold text-gray-800 no-underline transition-colors duration-200 hover:bg-gray-50"
            href={googleLoginUrl}
          >
            {t('구글 로그인')}
          </a>
        </div>
      </div>
    </div>
  );
};

/* 쿼리 파라미터 기반 변형 스위칭 (compare/mix 페이지용) */
const LoginSelectMagicA = lazy(() => import('./LoginSelectMagicA'));
const LoginSelectMagicB = lazy(() => import('./LoginSelectMagicB'));
const LoginSelectDesignA = lazy(() => import('./LoginSelectDesignA'));
const LoginSelectDesignB = lazy(() => import('./LoginSelectDesignB'));

const LS_VARIANTS: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  '1': LoginSelectMagicA,
  '2': LoginSelectMagicB,
  '3': LoginSelectDesignA,
  '4': LoginSelectDesignB,
};

const LoginSelectWithVariant = () => {
  const [searchParams] = useSearchParams();
  const variant = searchParams.get('ls');
  const VariantComponent = variant ? LS_VARIANTS[variant] : null;

  if (VariantComponent) {
    return (
      <Suspense fallback={null}>
        <VariantComponent />
      </Suspense>
    );
  }
  return <LoginSelect />;
};

export default LoginSelectWithVariant;
