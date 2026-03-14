import { useTranslation } from 'i18nexus';
import { Construction } from 'lucide-react';

import { BlurFade } from '@/shared/ui/components/blur-fade';
import { TextAnimate } from '@/shared/ui/components/text-animate';

/** MagicB — TextAnimate 글자 단위 애니메이션 + 그래디언트 배경 오픈 레이아웃 */
const MaintenanceMagicB = () => {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-primary/5 via-background to-secondary/10 p-8 text-center">
      {/* 아이콘 */}
      <BlurFade delay={0.1}>
        <Construction className="mb-6 size-16 text-primary/70" />
      </BlurFade>

      {/* 제목 — 글자 단위 애니메이션 */}
      <TextAnimate
        as="h1"
        by="character"
        animation="blurInUp"
        duration={1.2}
        delay={0.2}
        className="mb-4 text-3xl font-bold text-foreground"
        startOnView={false}
      >
        {t('서비스 점검 중입니다')}
      </TextAnimate>

      {/* 설명 텍스트 */}
      <BlurFade delay={0.5}>
        <p className="max-w-[440px] text-lg leading-relaxed text-muted-foreground">
          {t('더 나은 서비스를 위해 시스템을 점검하고 있습니다.')}
        </p>
      </BlurFade>

      <BlurFade delay={0.65}>
        <p className="mt-2 max-w-[440px] text-lg leading-relaxed text-muted-foreground">
          {t('빠른 시일 내에 다시 찾아뵙겠습니다.')}
        </p>
      </BlurFade>

      {/* 새로고침 링크 */}
      <BlurFade delay={0.8}>
        <button
          onClick={() => window.location.reload()}
          className="mt-8 text-sm font-medium text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline"
        >
          {t('새로고침')}
        </button>
      </BlurFade>
    </div>
  );
};

export default MaintenanceMagicB;
