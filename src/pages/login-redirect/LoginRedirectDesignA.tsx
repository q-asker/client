import { useTranslation } from 'i18nexus';
import Logo from '#shared/ui/logo';
import { Card, CardContent, CardHeader } from '@/shared/ui/components/card';
import { Skeleton } from '@/shared/ui/components/skeleton';

/** DesignA: Shadcn Card 구조 + Logo + Skeleton 로딩 바 */
const LoginRedirectDesignA = () => {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <Card className="w-[min(400px,100%)]">
        <CardHeader className="items-center">
          <Logo />
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-5">
          {/* Skeleton 로딩 바 */}
          <div className="flex w-full flex-col gap-2">
            <Skeleton className="h-2.5 w-full" />
            <Skeleton className="h-2.5 w-3/4" />
            <Skeleton className="h-2.5 w-1/2" />
          </div>

          {/* 상태 텍스트 */}
          <p className="text-sm font-medium text-muted-foreground">{t('로그인 처리 중...')}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginRedirectDesignA;
