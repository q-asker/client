import { useTranslation } from 'i18nexus';
import { Construction } from 'lucide-react';

import { Button } from '@/shared/ui/components/button';

/** 풀스크린 muted 배경 + 대형 아이콘 + animate-pulse 진행 바 */
const Maintenance = () => {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted p-8 text-center">
      {/* 대형 아이콘 */}
      <Construction className="mb-8 size-24 text-muted-foreground/60" />

      {/* 제목 */}
      <h1 className="mb-3 text-3xl font-bold text-foreground">{t('서비스 점검 중입니다')}</h1>

      {/* 설명 */}
      <p className="mb-8 max-w-[480px] leading-relaxed text-muted-foreground">
        {t('더 나은 서비스를 위해 시스템을 점검하고 있습니다.')}
        <br />
        {t('빠른 시일 내에 다시 찾아뵙겠습니다.')}
      </p>

      {/* 새로고침 버튼 */}
      <Button variant="outline" onClick={() => window.location.reload()}>
        {t('새로고침')}
      </Button>
    </div>
  );
};

export default Maintenance;
