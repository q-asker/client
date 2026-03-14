import { useTranslation } from 'i18nexus';
import Logo from '#shared/ui/logo';
import { BlurFade } from '@/shared/ui/components/blur-fade';
import { Card, CardContent } from '@/shared/ui/components/card';
import { ShimmerButton } from '@/shared/ui/components/shimmer-button';

/** MagicA — BlurFade 순차 페이드인 + ShimmerButton 로그인 */
const LoginSelectMagicA = () => {
  const { t } = useTranslation();
  const baseUrl = (import.meta.env.VITE_BASE_URL as string) || '';
  const kakaoLoginUrl = `${baseUrl}/oauth2/authorization/kakao`;
  const googleLoginUrl = `${baseUrl}/oauth2/authorization/google`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5 p-6">
      <Card className="w-[min(420px,100%)] border-none bg-card/80 shadow-xl backdrop-blur-md">
        <CardContent className="flex flex-col items-center gap-6 pt-8 pb-8">
          {/* 로고 */}
          <BlurFade delay={0.1} direction="up">
            <Logo />
          </BlurFade>

          {/* 환영 텍스트 */}
          <BlurFade delay={0.25} direction="up">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground">{t('환영합니다')}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {t('소셜 계정으로 간편하게 시작하세요')}
              </p>
            </div>
          </BlurFade>

          {/* 로그인 버튼 */}
          <BlurFade delay={0.4} direction="up" className="flex w-full flex-col gap-3">
            {/* 카카오 로그인 */}
            <a href={kakaoLoginUrl} className="block w-full no-underline">
              <ShimmerButton
                className="w-full text-base font-semibold"
                background="#fee500"
                shimmerColor="rgba(255, 255, 255, 0.5)"
                borderRadius="12px"
                shimmerSize="0.05em"
              >
                <span className="text-gray-900">{t('카카오 로그인')}</span>
              </ShimmerButton>
            </a>

            {/* 구글 로그인 */}
            <a href={googleLoginUrl} className="block w-full no-underline">
              <ShimmerButton
                className="w-full text-base font-semibold"
                background="oklch(1 0 0)"
                shimmerColor="oklch(0.7 0.15 245)"
                borderRadius="12px"
                shimmerSize="0.05em"
              >
                <span className="text-foreground">{t('구글 로그인')}</span>
              </ShimmerButton>
            </a>
          </BlurFade>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginSelectMagicA;
