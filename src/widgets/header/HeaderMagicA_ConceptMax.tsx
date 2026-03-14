import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  MessageSquare,
  ClipboardList,
  LogIn,
  LogOut,
  Menu,
  X,
  Globe,
  HelpCircle,
} from 'lucide-react';
import { useHeader } from './model/useHeader';
import { useClickOutside } from '#shared/lib/useClickOutside';
import Logo from '#shared/ui/logo';
import { Marquee } from '@/shared/ui/components/marquee';
import { ShimmerButton } from '@/shared/ui/components/shimmer-button';
import { BlurFade } from '@/shared/ui/components/blur-fade';
import { cn } from '@/shared/ui/lib/utils';

interface HeaderProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setShowHelp?: React.Dispatch<React.SetStateAction<boolean>>;
}

// 사이드바 메뉴 항목 stagger 애니메이션
const sidebarItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.1, type: 'spring', damping: 22, stiffness: 280 },
  }),
};

// 프로필 드롭다운 항목 stagger 애니메이션
const dropdownItemVariants = {
  hidden: { opacity: 0, y: -6 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, type: 'spring', damping: 22, stiffness: 280 },
  }),
};

// 마퀴 브랜딩 텍스트 항목
const marqueeItems = [
  '✦ Q-Asker — AI 퀴즈 생성',
  '✦ 파일 업로드로 즉시 시작',
  '✦ PDF · PPT · Word 지원',
  '✦ 다국어 퀴즈 자동 생성',
];

const HeaderMagicA_ConceptMax = ({
  isSidebarOpen,
  toggleSidebar,
  setIsSidebarOpen,
  setShowHelp,
}: HeaderProps) => {
  const {
    state: { t, isAuthenticated, user },
    actions: { handleQuizManagement, handleHelp, handleLogout, handleLanguageChange, closeSidebar },
  } = useHeader({ setIsSidebarOpen, setShowHelp });
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showNavTooltip, setShowNavTooltip] = useState(false);
  const location = useLocation();

  // 사용자 표시 이름 계산
  const displayName = useMemo(() => {
    const u = user as Record<string, unknown> | null;
    const name =
      (u?.nickname as string) ||
      (u?.name as string) ||
      (u?.username as string) ||
      (u?.email as string) ||
      '';
    return name.trim() || t('사용자');
  }, [t, user]);
  const profileInitial = useMemo(
    () => displayName?.trim().slice(0, 1).toUpperCase() || '?',
    [displayName],
  );

  // 프로필 드롭다운 외부 클릭 감지
  useClickOutside({
    containerId: 'profileDropdown',
    triggerId: 'profileButton',
    onOutsideClick: () => setIsProfileOpen(false),
    isEnabled: isProfileOpen,
  });

  // 일일 네비게이션 툴팁 로직 (비인증 사용자)
  useEffect(() => {
    if (!isAuthenticated) {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const dismissedDate = localStorage.getItem('headerNavTooltipDismissedDate');
        setShowNavTooltip(dismissedDate !== today);
      } catch {
        setShowNavTooltip(true);
      }
      return undefined;
    }
    setShowNavTooltip(false);
    return undefined;
  }, [isAuthenticated]);

  const handleNavTooltipClose = () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      localStorage.setItem('headerNavTooltipDismissedDate', today);
    } catch {
      // 스토리지 에러 무시
    }
    setShowNavTooltip(false);
  };

  // 활성 경로 판별
  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div className="relative">
      {/* 마퀴 브랜딩 바 — 헤더 상단 */}
      <div className="bg-primary/5 py-1">
        <Marquee pauseOnHover className="[--duration:30s] [--gap:2rem]">
          {marqueeItems.map((text) => (
            <span key={text} className="text-xs font-medium text-primary/60">
              {text}
            </span>
          ))}
        </Marquee>
      </div>

      {/* 플로팅 헤더 바 — 오로라 그라디언트 배경 */}
      <div className="relative mx-3 mt-2 overflow-hidden rounded-2xl shadow-2xl">
        {/* 오로라 그라디언트 배경 (절대 위치) */}
        <motion.div
          className="pointer-events-none absolute inset-0 -z-0 opacity-30"
          style={{
            background:
              'conic-gradient(from 180deg at 50% 50%, oklch(0.7 0.15 280), oklch(0.75 0.12 200), oklch(0.8 0.1 150), oklch(0.7 0.14 320), oklch(0.7 0.15 280))',
          }}
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />

        {/* 실제 반투명 배경 + blur */}
        <div className="relative z-10 bg-background/80 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3 md:px-6">
            {/* 로고 영역 */}
            <div className="flex items-center">
              <button
                id="menuButton"
                className="mr-3 cursor-pointer rounded-xl border-none bg-transparent p-1.5 text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
                onClick={toggleSidebar}
              >
                <Menu className="size-5" />
              </button>
              <Link to="/" className="text-inherit no-underline">
                <Logo />
              </Link>
            </div>

            {/* 네비게이션 — pill 형태 칩 */}
            <div className="flex items-center gap-2">
              <nav className="flex items-center gap-1.5">
                <BlurFade delay={0.05}>
                  <Link
                    to="/boards"
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium no-underline backdrop-blur-md transition-all duration-200',
                      isActive('/boards')
                        ? 'border-primary/20 bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                        : 'border-primary/10 bg-background/60 text-muted-foreground hover:border-primary/20 hover:bg-background/80 hover:text-foreground',
                    )}
                  >
                    <MessageSquare className="size-4" />
                    <span className="max-sm:hidden">{t('문의하기')}</span>
                  </Link>
                </BlurFade>

                <BlurFade delay={0.1}>
                  <div className="relative inline-flex items-center">
                    <Link
                      to="/history"
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium no-underline backdrop-blur-md transition-all duration-200',
                        isActive('/history')
                          ? 'border-primary/20 bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                          : 'border-primary/10 bg-background/60 text-muted-foreground hover:border-primary/20 hover:bg-background/80 hover:text-foreground',
                      )}
                      onClick={handleQuizManagement}
                    >
                      <ClipboardList className="size-4" />
                      <span className="max-sm:hidden">{t('퀴즈 기록')}</span>
                    </Link>
                    {/* 비인증 사용자 안내 툴팁 */}
                    {!isAuthenticated && showNavTooltip && (
                      <span
                        className="absolute left-1/2 top-[calc(100%+6px)] z-[2] inline-flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-primary px-2 py-1.5 pl-2.5 text-xs text-primary-foreground shadow-lg before:absolute before:left-1/2 before:top-[-4px] before:-translate-x-1/2 before:border-x-[6px] before:border-b-[6px] before:border-t-0 before:border-solid before:border-transparent before:border-b-primary before:content-[''] max-sm:hidden"
                        role="status"
                      >
                        {t('로그인하고, 퀴즈기록을 저장해보세요')}
                        <button
                          type="button"
                          className="cursor-pointer border-none bg-transparent p-0.5 px-1 text-xs leading-none text-inherit hover:opacity-80"
                          aria-label={t('닫기')}
                          onClick={handleNavTooltipClose}
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    )}
                  </div>
                </BlurFade>

                {/* 비인증: ShimmerButton 로그인 CTA */}
                {!isAuthenticated && (
                  <BlurFade delay={0.15}>
                    <Link to="/login" className="no-underline">
                      <ShimmerButton
                        shimmerColor="oklch(0.9 0.05 280)"
                        background="oklch(0.45 0.15 280)"
                        shimmerSize="0.05em"
                        borderRadius="9999px"
                        className="px-4 py-1.5 text-sm font-medium"
                      >
                        <LogIn className="mr-1.5 size-4" />
                        <span className="max-sm:hidden">{t('로그인')}</span>
                      </ShimmerButton>
                    </Link>
                  </BlurFade>
                )}
              </nav>

              {/* 프로필 버튼 (인증 시) — 오로라 링 */}
              {isAuthenticated && (
                <div className="relative">
                  <button
                    id="profileButton"
                    className="inline-flex size-9 cursor-pointer items-center justify-center rounded-full border-none bg-primary/10 p-0 text-sm font-bold text-primary ring-2 ring-primary/30 backdrop-blur-sm transition-all duration-200 hover:bg-primary/20 hover:shadow-[0_0_12px_oklch(0.6_0.15_280/0.3)] md:size-10 md:text-base"
                    onClick={() => setIsProfileOpen((prev) => !prev)}
                    aria-expanded={isProfileOpen}
                    aria-haspopup="true"
                    title={displayName}
                    type="button"
                  >
                    {profileInitial}
                  </button>
                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div
                        id="profileDropdown"
                        initial={{ opacity: 0, scale: 0.9, y: -8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -8 }}
                        transition={{ type: 'spring', damping: 24, stiffness: 300 }}
                        className="absolute right-0 top-[calc(100%+10px)] z-[1001] min-w-[200px] rounded-2xl border border-primary/10 bg-background/90 p-4 shadow-2xl backdrop-blur-xl"
                      >
                        <motion.span
                          className="mb-3 block font-semibold text-foreground"
                          custom={0}
                          variants={dropdownItemVariants}
                          initial="hidden"
                          animate="visible"
                        >
                          {displayName}
                        </motion.span>
                        <div className="mb-2 h-px bg-border/40" />
                        <motion.button
                          className="flex w-full cursor-pointer items-center gap-2 rounded-xl border-none bg-transparent px-2 py-2 text-left text-primary transition-colors duration-150 hover:bg-primary/10"
                          type="button"
                          custom={1}
                          variants={dropdownItemVariants}
                          initial="hidden"
                          animate="visible"
                          onClick={() => {
                            setIsProfileOpen(false);
                            handleLogout();
                          }}
                        >
                          <LogOut className="size-4" />
                          <strong>{t('로그아웃')}</strong>
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 사이드바 + 오버레이 — 플로팅 + 오로라 그라디언트 */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* 오버레이 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-[999] bg-foreground/20 backdrop-blur-sm"
              onClick={closeSidebar}
            />

            {/* 플로팅 사이드바 */}
            <motion.aside
              id="sidebar"
              initial={{ x: '-100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '-100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 260 }}
              className="fixed bottom-3 left-3 top-3 z-[1000] flex w-[280px] flex-col overflow-hidden rounded-2xl border border-primary/10 shadow-2xl"
            >
              {/* 사이드바 오로라 배경 (약하게) */}
              <motion.div
                className="pointer-events-none absolute inset-0 -z-0 opacity-15"
                style={{
                  background:
                    'conic-gradient(from 90deg at 30% 70%, oklch(0.7 0.12 280), oklch(0.75 0.1 200), oklch(0.8 0.08 150), oklch(0.7 0.11 320), oklch(0.7 0.12 280))',
                }}
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
              />

              {/* 사이드바 내용 */}
              <div className="relative z-10 flex h-full flex-col bg-background/90 backdrop-blur-2xl">
                {/* 사이드바 헤더 */}
                <div className="flex items-center justify-between border-b border-primary/10 px-5 py-4">
                  <motion.h2
                    className="text-xs font-bold uppercase tracking-[0.2em] text-foreground"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05, type: 'spring', stiffness: 300, damping: 25 }}
                  >
                    {t('메뉴')}
                  </motion.h2>
                  <button
                    className="cursor-pointer rounded-xl border-none bg-transparent p-1.5 text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
                    onClick={closeSidebar}
                  >
                    <X className="size-5" />
                  </button>
                </div>

                {/* 사이드바 메뉴 */}
                <nav className="flex flex-col gap-1 p-3">
                  {/* 언어 전환 */}
                  <motion.div
                    className="flex cursor-pointer items-center justify-between rounded-xl px-4 py-3 text-sm text-muted-foreground transition-colors duration-200 hover:bg-primary/10"
                    custom={0}
                    variants={sidebarItemVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <span className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.15em]">
                      <Globe className="size-4" />
                      {t('언어')}
                    </span>
                    <div className="flex gap-1">
                      <button
                        className="cursor-pointer rounded-lg border-none bg-transparent px-2.5 py-1 text-xs font-bold text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground"
                        onClick={() => handleLanguageChange('ko')}
                      >
                        KO
                      </button>
                      <button
                        className="cursor-pointer rounded-lg border-none bg-transparent px-2.5 py-1 text-xs font-bold text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground"
                        onClick={() => handleLanguageChange('en')}
                      >
                        EN
                      </button>
                    </div>
                  </motion.div>

                  <div className="mx-3 h-px bg-primary/10" />

                  {/* 도움말 */}
                  <motion.button
                    className="flex w-full cursor-pointer items-center gap-3 rounded-xl border-none bg-transparent px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground transition-colors duration-200 hover:bg-primary/10 hover:text-foreground"
                    type="button"
                    custom={1}
                    variants={sidebarItemVariants}
                    initial="hidden"
                    animate="visible"
                    onClick={handleHelp}
                  >
                    <HelpCircle className="size-4" />
                    {t('도움말 보기')}
                  </motion.button>
                </nav>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HeaderMagicA_ConceptMax;
