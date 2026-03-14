import { useTranslation } from 'i18nexus';
import React, { lazy, Suspense } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLoginRedirect } from '#features/auth';

const LoginRedirect = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  useLoginRedirect({ navigate });

  return <div>{t('로그인 처리 중...')}</div>;
};

/* 쿼리 파라미터 기반 변형 스위칭 (compare/mix 페이지용) */
const LoginRedirectMagicA = lazy(() => import('./LoginRedirectMagicA'));
const LoginRedirectMagicB = lazy(() => import('./LoginRedirectMagicB'));
const LoginRedirectDesignA = lazy(() => import('./LoginRedirectDesignA'));
const LoginRedirectDesignB = lazy(() => import('./LoginRedirectDesignB'));

const LR_VARIANTS: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  '1': LoginRedirectMagicA,
  '2': LoginRedirectMagicB,
  '3': LoginRedirectDesignA,
  '4': LoginRedirectDesignB,
};

const LoginRedirectWithVariant = () => {
  const [searchParams] = useSearchParams();
  const variant = searchParams.get('lr');
  const VariantComponent = variant ? LR_VARIANTS[variant] : null;

  if (VariantComponent) {
    return (
      <Suspense fallback={null}>
        <VariantComponent />
      </Suspense>
    );
  }
  return <LoginRedirect />;
};

export default LoginRedirectWithVariant;
