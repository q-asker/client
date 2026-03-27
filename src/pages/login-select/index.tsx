import { useTranslation } from 'i18nexus';
import React from 'react';
import { useSearchParams } from 'react-router-dom';
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

/** 전면 브랜드 배경 + 정중앙 글래스 로그인 카드 */
const LoginSelect = () => {
  const { t } = useTranslation('login-select');
  const baseUrl = (import.meta.env.VITE_BASE_URL as string) || '';
  const kakaoLoginUrl = `${baseUrl}/oauth2/authorization/kakao`;
  const googleLoginUrl = `${baseUrl}/oauth2/authorization/google`;

  return (
    <div className="relative flex min-h-screen flex-col bg-primary/80">
      {/* 브랜드 로고 — 좌상단 고정 */}
      <div className="absolute left-8 top-6 z-10 hidden lg:block">
        <Logo className="[&_span]:text-primary-foreground" />
      </div>

      {/* 로그인 카드 — 화면 정중앙 */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="flex w-full max-w-sm flex-col items-center gap-8">
          {/* 모바일에서만 보이는 로고 */}
          <div className="flex justify-center lg:hidden">
            <Logo className="[&_span]:text-primary-foreground" />
          </div>

          {/* 브랜드 헤드라인 — 카드 위 */}
          <div className="hidden flex-col items-center gap-3 text-center text-primary-foreground lg:flex">
            <h1 className="text-3xl leading-tight font-bold">{t('AI가 만드는 나만의 퀴즈')}</h1>
            <div className="grid grid-cols-3 gap-x-5 gap-y-1">
              <div className="flex items-center gap-1.5">
                <Sparkles className="size-3.5 shrink-0 text-primary-foreground/60" />
                <span className="whitespace-nowrap text-xs text-primary-foreground/70">
                  {t('AI 기반 자동 퀴즈 생성')}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <BookOpen className="size-3.5 shrink-0 text-primary-foreground/60" />
                <span className="whitespace-nowrap text-xs text-primary-foreground/70">
                  {t('다양한 파일 형식 지원')}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="size-3.5 shrink-0 text-primary-foreground/60" />
                <span className="whitespace-nowrap text-xs text-primary-foreground/70">
                  {t('즉시 풀고 결과 확인')}
                </span>
              </div>
            </div>
          </div>

          <Card className="w-full border-0 bg-card/95 shadow-xl backdrop-blur-sm">
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
                className="h-12 rounded-xl border-border/50 bg-background text-base font-semibold"
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

          {/* 하단 안내 + 저작권 */}
          <div className="flex flex-col items-center gap-2">
            <p className="text-center text-xs text-primary-foreground/60">
              {t('로그인 시 서비스 이용약관에 동의하게 됩니다.')}
            </p>
            <p className="hidden text-center text-xs text-primary-foreground/40 lg:block">
              &copy; 2025 Q-Asker. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/* 쿼리 파라미터 기반 변형 스위칭 (compare/mix 페이지용) */
const LS_VARIANTS: Record<string, React.LazyExoticComponent<React.ComponentType>> = {};

const LoginSelectWithVariant = () => {
  const [searchParams] = useSearchParams();
  const variant = searchParams.get('ls');
  const VariantComponent = variant ? LS_VARIANTS[variant] : null;

  if (VariantComponent) {
    return <VariantComponent />;
  }
  return <LoginSelect />;
};

export default LoginSelectWithVariant;
