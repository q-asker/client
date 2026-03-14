import { useTranslation } from 'i18nexus';
import Logo from '#shared/ui/logo';
import { Button } from '@/shared/ui/components/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/shared/ui/components/card';
import { LogIn, Sparkles, BookOpen, Zap } from 'lucide-react';

/** 좌우 분할 레이아웃 — 좌측 브랜드 소개, 우측 로그인 카드 */
const LoginSelectDesignB = () => {
  const { t } = useTranslation();
  const baseUrl = (import.meta.env.VITE_BASE_URL as string) || '';
  const kakaoLoginUrl = `${baseUrl}/oauth2/authorization/kakao`;
  const googleLoginUrl = `${baseUrl}/oauth2/authorization/google`;

  return (
    <div className="flex min-h-screen bg-background">
      {/* 좌측: 브랜드 영역 */}
      <div className="hidden flex-1 flex-col justify-between bg-primary p-12 text-primary-foreground lg:flex">
        <div>
          <Logo className="mb-2 [&_span]:text-primary-foreground" />
        </div>

        {/* 핵심 기능 소개 */}
        <div className="flex flex-col gap-8">
          <h1 className="text-4xl leading-tight font-bold">
            {t('AI가 만드는')}
            <br />
            {t('나만의 퀴즈')}
          </h1>
          <p className="max-w-md text-lg text-primary-foreground/80">
            {t('PDF, PPT, Word 파일을 업로드하면 AI가 자동으로 퀴즈를 생성합니다.')}
          </p>

          {/* 기능 하이라이트 */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary-foreground/15">
                <Sparkles className="size-5" />
              </div>
              <span className="text-sm font-medium">{t('AI 기반 자동 퀴즈 생성')}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary-foreground/15">
                <BookOpen className="size-5" />
              </div>
              <span className="text-sm font-medium">{t('다양한 파일 형식 지원')}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary-foreground/15">
                <Zap className="size-5" />
              </div>
              <span className="text-sm font-medium">{t('즉시 풀고 결과 확인')}</span>
            </div>
          </div>
        </div>

        {/* 하단 저작권 */}
        <p className="text-xs text-primary-foreground/50">
          &copy; 2025 Q-Asker. All rights reserved.
        </p>
      </div>

      {/* 우측: 로그인 영역 */}
      <div className="flex flex-1 items-center justify-center p-6 lg:max-w-lg">
        <div className="flex w-full max-w-sm flex-col gap-8">
          {/* 모바일에서만 보이는 로고 */}
          <div className="flex justify-center lg:hidden">
            <Logo />
          </div>

          <Card className="border-0 shadow-none lg:border lg:shadow-sm">
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10">
                <LogIn className="size-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">{t('로그인')}</CardTitle>
              <CardDescription>{t('소셜 계정으로 간편하게 시작하세요')}</CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col gap-3">
              {/* 카카오 로그인 */}
              <Button
                asChild
                size="lg"
                className="h-12 rounded-xl bg-[#fee500] text-base font-semibold text-foreground shadow-none hover:bg-[#f5dc00]"
              >
                <a href={kakaoLoginUrl} className="no-underline">
                  <svg className="mr-2 size-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3C6.48 3 2 6.58 2 10.94c0 2.8 1.86 5.27 4.66 6.67l-1.19 4.36c-.1.38.33.67.65.44l5.19-3.42c.22.02.44.03.67.03 5.52 0 10-3.58 10-7.98S17.52 3 12 3z" />
                  </svg>
                  {t('카카오 로그인')}
                </a>
              </Button>

              {/* 구글 로그인 */}
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 rounded-xl text-base font-semibold"
              >
                <a href={googleLoginUrl} className="no-underline">
                  <svg className="mr-2 size-5" viewBox="0 0 24 24">
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
          </Card>

          {/* 하단 안내 */}
          <p className="text-center text-xs text-muted-foreground">
            {t('로그인 시 서비스 이용약관에 동의하게 됩니다.')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginSelectDesignB;
