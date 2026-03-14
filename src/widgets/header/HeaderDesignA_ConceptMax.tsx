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
import { TextAnimate } from '@/shared/ui/components/text-animate';
import { ShimmerButton } from '@/shared/ui/components/shimmer-button';
import { BlurFade } from '@/shared/ui/components/blur-fade';
import { cn } from '@/shared/ui/lib/utils';

interface HeaderProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setShowHelp?: React.Dispatch<React.SetStateAction<boolean>>;
}

// 프로필 드롭다운 항목 stagger 애니메이션
const dropdownItemVariants = {
  hidden: { opacity: 0, y: -4 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, type: 'spring', damping: 22, stiffness: 300 },
  }),
};

// 사이드바 메뉴 항목 stagger 애니메이션
const sidebarItemVariants = {
  hidden: { opacity: 0, x: -24 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.08, type: 'spring', damping: 20, stiffness: 260 },
  }),
};

const HeaderDesignA_ConceptMax = ({
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

  useClickOutside({
    containerId: 'profileDropdown',
    triggerId: 'profileButton',
    onOutsideClick: () => setIsProfileOpen(false),
    isEnabled: isProfileOpen,
  });

  // 일일 툴팁 표시 로직
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
      {/* ── 헤더 바: Brutalist 해체 타이포그래피 ── */}
      <div className="relative border-b-4 border-foreground">
        <div className="mx-auto flex w-full max-w-5xl items-end justify-between px-4 py-3 font-mono tracking-tighter">
          {/* 좌측: 세로 MENU 텍스트 + 로고 극대화 */}
          <div className="flex items-end gap-3">
            {/* 세로 회전 MENU 버튼 */}
            <button
              id="menuButton"
              className="flex cursor-pointer items-center border-none bg-transparent p-0 text-foreground transition-opacity duration-200 hover:opacity-50"
              onClick={toggleSidebar}
            >
              <span className="-rotate-90 text-[10px] font-black uppercase tracking-[0.3em] text-foreground">
                MENU
              </span>
              <Menu className="ml-1 size-4" />
            </button>

            {/* 로고 — 극대화 */}
            <Link to="/" className="text-inherit no-underline">
              <span className="text-3xl font-black uppercase tracking-tighter">
                <Logo />
              </span>
            </Link>
          </div>

          {/* 중앙: 네비 아이템 — 비대칭 font-size 배치 */}
          <nav className="hidden items-baseline gap-6 sm:flex">
            <BlurFade delay={0.05}>
              <Link
                to="/boards"
                className={cn(
                  'relative inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.2em] no-underline transition-all duration-200',
                  isActive('/boards')
                    ? 'text-foreground after:absolute after:-bottom-1 after:left-0 after:h-[3px] after:w-full after:bg-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <MessageSquare className="size-3" />
                {t('문의하기')}
              </Link>
            </BlurFade>

            <BlurFade delay={0.1}>
              <div className="relative inline-flex items-baseline">
                <Link
                  to="/history"
                  className={cn(
                    'relative inline-flex items-center gap-1.5 text-lg font-light lowercase tracking-tight no-underline transition-all duration-200',
                    isActive('/history')
                      ? 'text-foreground after:absolute after:-bottom-1 after:left-0 after:h-[3px] after:w-full after:bg-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                  onClick={handleQuizManagement}
                >
                  <ClipboardList className="size-4" />
                  {t('퀴즈 기록')}
                </Link>

                {/* 툴팁: Brutalist 스타일 — 반전 색상, 굵은 보더 */}
                {!isAuthenticated && showNavTooltip && (
                  <span
                    className="absolute left-1/2 top-[calc(100%+8px)] z-[2] inline-flex -translate-x-1/2 items-center gap-2 whitespace-nowrap border-2 border-foreground bg-foreground px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-background before:absolute before:left-1/2 before:top-[-6px] before:-translate-x-1/2 before:border-x-[6px] before:border-b-[6px] before:border-t-0 before:border-solid before:border-transparent before:border-b-foreground before:content-[''] max-sm:hidden"
                    role="status"
                  >
                    {t('로그인하고, 퀴즈기록을 저장해보세요')}
                    <button
                      type="button"
                      className="cursor-pointer border-none bg-transparent p-0 font-mono text-xs font-black leading-none text-background hover:opacity-60"
                      aria-label={t('닫기')}
                      onClick={handleNavTooltipClose}
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                )}
              </div>
            </BlurFade>
          </nav>

          {/* 우측: 프로필 / 로그인 */}
          <div className="flex items-center gap-3">
            {/* 모바일 전용 네비 아이콘 */}
            <div className="flex items-center gap-2 sm:hidden">
              <Link
                to="/boards"
                className={cn(
                  'p-1 no-underline transition-opacity',
                  isActive('/boards') ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                <MessageSquare className="size-5" />
              </Link>
              <Link
                to="/history"
                className={cn(
                  'p-1 no-underline transition-opacity',
                  isActive('/history') ? 'text-foreground' : 'text-muted-foreground',
                )}
                onClick={handleQuizManagement}
              >
                <ClipboardList className="size-5" />
              </Link>
            </div>

            {/* 비인증 상태: ShimmerButton 로그인 */}
            {!isAuthenticated && (
              <BlurFade delay={0.15}>
                <Link to="/login" className="no-underline">
                  <ShimmerButton className="px-4 py-1.5 font-mono text-xs font-black uppercase tracking-[0.2em]">
                    <span className="flex items-center gap-1.5">
                      <LogIn className="size-3.5" />
                      <span className="max-sm:hidden">{t('로그인')}</span>
                    </span>
                  </ShimmerButton>
                </Link>
              </BlurFade>
            )}

            {/* 인증 상태: 프로필 버튼 */}
            {isAuthenticated && (
              <div className="relative">
                <button
                  id="profileButton"
                  className="inline-flex size-9 cursor-pointer items-center justify-center border-2 border-foreground bg-transparent p-0 font-mono text-sm font-black text-foreground transition-all duration-200 hover:bg-foreground hover:text-background md:size-10 md:text-base"
                  onClick={() => setIsProfileOpen((prev) => !prev)}
                  aria-expanded={isProfileOpen}
                  aria-haspopup="true"
                  title={displayName}
                  type="button"
                >
                  {profileInitial}
                </button>

                {/* 프로필 드롭다운: Brutalist — 굵은 보더, mono 대문자 */}
                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      id="profileDropdown"
                      initial={{ opacity: 0, scale: 0.95, y: -6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -6 }}
                      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                      className="absolute right-0 top-[calc(100%+8px)] z-[1001] min-w-[180px] border-4 border-foreground bg-background p-3 font-mono"
                    >
                      <motion.span
                        className="mb-2 block text-sm font-black uppercase tracking-wider text-foreground"
                        custom={0}
                        variants={dropdownItemVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        {displayName}
                      </motion.span>
                      <div className="mb-2 h-[2px] bg-foreground" />
                      <motion.button
                        className="flex w-full cursor-pointer items-center gap-2 border-none bg-transparent px-1 py-1.5 text-left font-mono text-sm uppercase tracking-wider text-muted-foreground transition-colors duration-200 hover:text-foreground"
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
                        <LogOut className="size-3.5" />
                        {t('로그아웃')}
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* 하단 불규칙 라인 장식 — 2px offset 보더 */}
        <div className="absolute -bottom-[2px] left-[10%] h-[2px] w-[30%] bg-muted-foreground/40" />
        <div className="absolute -bottom-[6px] right-[5%] h-[4px] w-[15%] bg-foreground/20" />
      </div>

      {/* ── 사이드바: 전체화면 반전 오버레이 ── */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* 배경 오버레이 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[999] bg-foreground/20"
              onClick={closeSidebar}
            />

            {/* 전체화면 사이드바 — 색상 반전 */}
            <motion.aside
              id="sidebar"
              initial={{ opacity: 0, clipPath: 'inset(0 100% 0 0)' }}
              animate={{ opacity: 1, clipPath: 'inset(0 0% 0 0)' }}
              exit={{ opacity: 0, clipPath: 'inset(0 100% 0 0)' }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-0 z-[1000] flex flex-col bg-foreground text-background"
            >
              {/* 닫기 버튼 — 우상단, 크게 */}
              <button
                className="absolute right-6 top-6 cursor-pointer border-none bg-transparent p-2 text-background transition-opacity duration-200 hover:opacity-60"
                onClick={closeSidebar}
              >
                <X className="size-8" />
              </button>

              {/* 사이드바 콘텐츠 */}
              <div className="flex h-full flex-col justify-between p-8 pt-20 md:p-16 md:pt-24">
                {/* 상단: MENU 타이틀 + 네비게이션 */}
                <div className="flex flex-col gap-12">
                  {/* TextAnimate 타이틀 */}
                  <TextAnimate
                    animation="blurInUp"
                    by="character"
                    className="font-mono text-6xl font-black uppercase tracking-tighter text-background md:text-8xl"
                  >
                    MENU
                  </TextAnimate>

                  {/* 메뉴 아이템 — 대형 텍스트, 호버 시 font-black */}
                  <nav className="flex flex-col gap-6">
                    <motion.div
                      custom={0}
                      variants={sidebarItemVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      <Link
                        to="/boards"
                        className={cn(
                          'group flex items-center gap-3 font-mono text-4xl font-light uppercase tracking-tight no-underline transition-all duration-300 md:text-5xl',
                          isActive('/boards')
                            ? 'font-black text-background'
                            : 'text-background/60 hover:font-black hover:text-background',
                        )}
                        onClick={closeSidebar}
                      >
                        <MessageSquare className="size-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                        {t('문의하기')}
                      </Link>
                    </motion.div>

                    <motion.div
                      custom={1}
                      variants={sidebarItemVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      <Link
                        to="/history"
                        className={cn(
                          'group flex items-center gap-3 font-mono text-4xl font-light uppercase tracking-tight no-underline transition-all duration-300 md:text-5xl',
                          isActive('/history')
                            ? 'font-black text-background'
                            : 'text-background/60 hover:font-black hover:text-background',
                        )}
                        onClick={() => {
                          closeSidebar();
                          handleQuizManagement();
                        }}
                      >
                        <ClipboardList className="size-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                        {t('퀴즈 기록')}
                      </Link>
                    </motion.div>

                    <motion.button
                      className="group flex cursor-pointer items-center gap-3 border-none bg-transparent p-0 text-left font-mono text-4xl font-light uppercase tracking-tight text-background/60 transition-all duration-300 hover:font-black hover:text-background md:text-5xl"
                      type="button"
                      custom={2}
                      variants={sidebarItemVariants}
                      initial="hidden"
                      animate="visible"
                      onClick={handleHelp}
                    >
                      <HelpCircle className="size-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      {t('도움말 보기')}
                    </motion.button>
                  </nav>
                </div>

                {/* 하단: 언어 스위처 — 대형 텍스트 */}
                <motion.div
                  className="flex items-center gap-6"
                  custom={3}
                  variants={sidebarItemVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <Globe className="size-6 text-background/40" />
                  <button
                    className="cursor-pointer border-none bg-transparent p-0 font-mono text-2xl font-light uppercase tracking-[0.2em] text-background/60 transition-all duration-200 hover:font-black hover:text-background"
                    onClick={() => handleLanguageChange('ko')}
                  >
                    KO
                  </button>
                  <span className="text-2xl text-background/20">/</span>
                  <button
                    className="cursor-pointer border-none bg-transparent p-0 font-mono text-2xl font-light uppercase tracking-[0.2em] text-background/60 transition-all duration-200 hover:font-black hover:text-background"
                    onClick={() => handleLanguageChange('en')}
                  >
                    EN
                  </button>
                </motion.div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HeaderDesignA_ConceptMax;
