import { useTranslation } from 'i18nexus';
import Logo from '#shared/ui/logo';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/shared/ui/components/card';
import { Button } from '@/shared/ui/components/button';
import { LogIn } from 'lucide-react';

/** Shadcn Card 기반 미니멀 로그인 페이지 */
const LoginSelectDesignA = () => {
  const { t } = useTranslation();
  const baseUrl = (import.meta.env.VITE_BASE_URL as string) || '';
  const kakaoLoginUrl = `${baseUrl}/oauth2/authorization/kakao`;
  const googleLoginUrl = `${baseUrl}/oauth2/authorization/google`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-[min(420px,100%)] text-center">
        {/* 로고 + 서비스 설명 */}
        <CardHeader className="items-center gap-3 pb-2">
          <Logo className="mb-1" />
          <CardTitle className="text-xl">{t('로그인')}</CardTitle>
          <CardDescription className="text-balance">
            {t('소셜 계정으로 간편하게 시작하세요')}
          </CardDescription>
        </CardHeader>

        {/* 구분선 */}
        <div className="flex items-center gap-3 px-6">
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">{t('계정 선택')}</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        {/* OAuth 버튼 */}
        <CardContent className="flex flex-col gap-3 pt-4">
          {/* 카카오 로그인 */}
          <Button
            asChild
            size="lg"
            className="h-12 rounded-xl bg-[#fee500] text-base font-semibold text-foreground hover:bg-[#f5dc00] focus-visible:ring-[#fee500]/50"
          >
            <a href={kakaoLoginUrl} className="no-underline">
              <svg className="size-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                {/* 카카오 말풍선 아이콘 */}
                <path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.724 1.8 5.118 4.508 6.473-.148.543-.536 1.97-.614 2.275-.097.382.14.377.294.274.121-.08 1.93-1.313 2.715-1.846A12.6 12.6 0 0 0 12 18.382c5.523 0 10-3.463 10-7.691S17.523 3 12 3" />
              </svg>
              {t('카카오 로그인')}
            </a>
          </Button>

          {/* 구글 로그인 */}
          <Button asChild variant="outline" size="lg" className="h-12 rounded-xl text-base">
            <a href={googleLoginUrl} className="no-underline">
              <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              {t('구글 로그인')}
            </a>
          </Button>
        </CardContent>

        {/* 하단 안내 */}
        <CardFooter className="justify-center pb-6">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <LogIn className="size-3.5" />
            {t('로그인하면 퀴즈를 저장하고 관리할 수 있어요')}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginSelectDesignA;
