import { useTranslation } from 'i18nexus';
import { Wrench } from 'lucide-react';

import { Button } from '@/shared/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/components/card';

/** DesignA — Shadcn Card 구조 + Wrench 아이콘 + Button (MagicUI 미사용) */
const MaintenanceDesignA = () => {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          {/* 아이콘 */}
          <div className="mb-2 flex size-16 items-center justify-center rounded-full bg-muted">
            <Wrench className="size-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl">{t('서비스 점검 중입니다')}</CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col items-center gap-6 text-center">
          <p className="max-w-[380px] leading-relaxed text-muted-foreground">
            {t('더 나은 서비스를 위해 시스템을 점검하고 있습니다.')}
            <br />
            {t('빠른 시일 내에 다시 찾아뵙겠습니다.')}
          </p>

          <Button variant="default" onClick={() => window.location.reload()}>
            {t('새로고침')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default MaintenanceDesignA;
