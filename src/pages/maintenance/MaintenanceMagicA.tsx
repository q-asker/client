import { useTranslation } from 'i18nexus';
import { Wrench } from 'lucide-react';

import { BlurFade } from '@/shared/ui/components/blur-fade';
import { Card, CardContent } from '@/shared/ui/components/card';
import { ShimmerButton } from '@/shared/ui/components/shimmer-button';

/** MagicA — BlurFade 순차 등장 + ShimmerButton + Card 래핑 */
const MaintenanceMagicA = () => {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <Card className="w-full max-w-md text-center">
        <CardContent className="flex flex-col items-center gap-6 py-10">
          {/* 아이콘 */}
          <BlurFade delay={0.1}>
            <div className="flex size-20 items-center justify-center rounded-full bg-primary/10">
              <Wrench className="size-10 text-primary" />
            </div>
          </BlurFade>

          {/* 제목 */}
          <BlurFade delay={0.25}>
            <h1 className="text-2xl font-bold text-foreground">{t('서비스 점검 중입니다')}</h1>
          </BlurFade>

          {/* 설명 */}
          <BlurFade delay={0.4}>
            <p className="max-w-[380px] leading-relaxed text-muted-foreground">
              {t('더 나은 서비스를 위해 시스템을 점검하고 있습니다.')}
              <br />
              {t('빠른 시일 내에 다시 찾아뵙겠습니다.')}
            </p>
          </BlurFade>

          {/* 새로고침 버튼 */}
          <BlurFade delay={0.55}>
            <ShimmerButton
              className="mt-2 px-8 py-3 text-sm font-medium"
              onClick={() => window.location.reload()}
            >
              {t('새로고침')}
            </ShimmerButton>
          </BlurFade>
        </CardContent>
      </Card>
    </div>
  );
};

export default MaintenanceMagicA;
