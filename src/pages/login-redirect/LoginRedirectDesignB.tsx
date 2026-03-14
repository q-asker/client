import { useTranslation } from 'i18nexus';
import Logo from '#shared/ui/logo';

/** DesignB: 풀스크린 배경 + 큰 로딩 인디케이터 + 브랜드 텍스트 */
const LoginRedirectDesignB = () => {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-10 bg-primary/5 p-6">
      {/* 로고 */}
      <Logo className="scale-150" />

      {/* 큰 로딩 인디케이터 */}
      <div className="relative flex items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>

      {/* 상태 텍스트 */}
      <p className="text-base font-medium text-foreground/70">{t('로그인 처리 중...')}</p>
    </div>
  );
};

export default LoginRedirectDesignB;
