import { useTranslation } from 'i18nexus';
import Logo from '#shared/ui/logo';
import { BlurFade } from '@/shared/ui/components/blur-fade';
import { Card, CardContent } from '@/shared/ui/components/card';

/** MagicA: BlurFade 순차 등장 + Card 래핑 + primary 그래디언트 배경 */
const LoginRedirectMagicA = () => {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5 p-6">
      <Card className="w-[min(400px,100%)] items-center border-none bg-card/80 backdrop-blur-sm">
        <CardContent className="flex flex-col items-center gap-6 py-8">
          {/* 로고 순차 등장 */}
          <BlurFade delay={0.1}>
            <Logo className="scale-125" />
          </BlurFade>

          {/* 텍스트 순차 등장 */}
          <BlurFade delay={0.3}>
            <p className="text-base font-medium text-muted-foreground">{t('로그인 처리 중...')}</p>
          </BlurFade>

          {/* 스피너 순차 등장 */}
          <BlurFade delay={0.5}>
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-muted border-t-primary" />
          </BlurFade>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginRedirectMagicA;
