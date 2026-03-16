import { useTranslation } from 'i18nexus';
import React, { lazy, Suspense } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLoginRedirect } from '#features/auth';
import Logo from '#shared/ui/logo';
import { BlurFade } from '@/shared/ui/components/blur-fade';
import { TextAnimate } from '@/shared/ui/components/text-animate';

/** MagicB: TextAnimate 글자 단위 + BlurFade + 오픈 레이아웃 + 그래디언트 배경 */
const LoginRedirect = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  useLoginRedirect({ navigate });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gradient-to-b from-primary/15 via-primary/5 to-background p-6">
      {/* 로고 블러 페이드 */}
      <BlurFade delay={0.1}>
        <Logo className="scale-150" />
      </BlurFade>

      {/* 글자 단위 애니메이션 텍스트 */}
      <TextAnimate
        by="character"
        animation="blurInUp"
        delay={0.3}
        duration={0.8}
        className="text-lg font-medium text-foreground/80"
        startOnView={false}
      >
        {t('로그인 처리 중...')}
      </TextAnimate>

      {/* 스피너 블러 페이드 */}
      <BlurFade delay={0.6}>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:0ms]" />
          <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:150ms]" />
          <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:300ms]" />
        </div>
      </BlurFade>
    </div>
  );
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
