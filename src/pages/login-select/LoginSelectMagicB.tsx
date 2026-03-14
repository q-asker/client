import { useTranslation } from 'i18nexus';
import Logo from '#shared/ui/logo';
import { Button } from '@/shared/ui/components/button';
import { BlurFade } from '@/shared/ui/components/blur-fade';
import { TextAnimate } from '@/shared/ui/components/text-animate';

/** MagicB — 오픈 레이아웃, 그래디언트 텍스트, 순차 등장 애니메이션 */
const LoginSelectMagicB = () => {
  const { t } = useTranslation();
  const baseUrl = (import.meta.env.VITE_BASE_URL as string) || '';
  const kakaoLoginUrl = `${baseUrl}/oauth2/authorization/kakao`;
  const googleLoginUrl = `${baseUrl}/oauth2/authorization/google`;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-12">
      {/* 브랜드 영역 */}
      <div className="flex flex-col items-center gap-6">
        {/* 로고 — BlurFade로 등장 */}
        <BlurFade delay={0.1} direction="up">
          <div className="flex items-center justify-center">
            <Logo />
          </div>
        </BlurFade>

        {/* 타이틀 — 글자 단위 애니메이션 */}
        <TextAnimate
          as="h1"
          by="character"
          animation="blurInUp"
          delay={0.3}
          duration={1.2}
          className="text-center text-4xl font-bold tracking-tight max-md:text-3xl"
          segmentClassName="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"
        >
          {t('AI 퀴즈 생성기')}
        </TextAnimate>

        {/* 서브 텍스트 */}
        <BlurFade delay={0.6} direction="up">
          <p className="max-w-sm text-center text-base text-muted-foreground max-md:text-sm">
            {t('파일을 올리면 AI가 퀴즈를 만들어 드려요')}
          </p>
        </BlurFade>
      </div>

      {/* 구분선 */}
      <BlurFade delay={0.8} direction="up">
        <div className="my-10 h-px w-48 bg-gradient-to-r from-transparent via-border to-transparent" />
      </BlurFade>

      {/* 로그인 버튼 영역 */}
      <div className="flex w-[min(380px,100%)] flex-col gap-4">
        {/* 카카오 로그인 */}
        <BlurFade delay={1.0} direction="up">
          <Button
            asChild
            size="lg"
            className="w-full rounded-xl bg-[#fee500] py-6 text-base font-semibold text-gray-900 shadow-md transition-all duration-300 hover:scale-[1.02] hover:bg-[#f5dc00] hover:shadow-lg"
          >
            <a href={kakaoLoginUrl} className="no-underline">
              {t('카카오 로그인')}
            </a>
          </Button>
        </BlurFade>

        {/* 구글 로그인 */}
        <BlurFade delay={1.15} direction="up">
          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full rounded-xl py-6 text-base font-semibold shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
          >
            <a href={googleLoginUrl} className="no-underline">
              {t('구글 로그인')}
            </a>
          </Button>
        </BlurFade>
      </div>
    </div>
  );
};

export default LoginSelectMagicB;
