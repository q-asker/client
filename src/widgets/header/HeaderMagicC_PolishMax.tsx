import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'motion/react';
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
import { BlurFade } from '@/shared/ui/components/blur-fade';
import { cn } from '@/shared/ui/lib/utils';

interface HeaderProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setShowHelp?: React.Dispatch<React.SetStateAction<boolean>>;
}

/** 글래스 + glow Dock 아이콘 */
const GlowDockIcon = ({
  children,
  mouseX,
  label,
  isActive,
}: {
  children: React.ReactNode;
  mouseX: ReturnType<typeof useMotionValue<number>>;
  label: string;
  isActive?: boolean;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const distance = useTransform(mouseX, (val: number) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return 150;
    return val - rect.x - rect.width / 2;
  });
  const scale = useTransform(distance, [-80, 0, 80], [1, 1.35, 1]);
  const springScale = useSpring(scale, { stiffness: 350, damping: 25 });

  return (
    <motion.div
      ref={ref}
      style={{ scale: springScale }}
      className={cn(
        'group relative flex size-8 items-center justify-center rounded-lg transition-shadow duration-200',
        isActive && 'shadow-[0_0_8px_oklch(var(--primary)_/_0.3)]',
      )}
    >
      {children}
      <span className="pointer-events-none absolute bottom-full z-50 mb-1.5 whitespace-nowrap rounded bg-foreground px-2 py-0.5 text-[10px] font-medium text-background opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100">
        {label}
      </span>
    </motion.div>
  );
};

/** PolishMax — 글래스 Dock 배경 + 아이콘 glow + BlurFade stagger */
const Header = ({ isSidebarOpen, toggleSidebar, setIsSidebarOpen, setShowHelp }: HeaderProps) => {
  const {
    state: { t, isAuthenticated, user },
    actions: { handleQuizManagement, handleHelp, handleLogout, handleLanguageChange, closeSidebar },
  } = useHeader({ setIsSidebarOpen, setShowHelp });

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showNavTooltip, setShowNavTooltip] = useState(false);
  const location = useLocation();
  const mouseX = useMotionValue(Infinity);

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
      /* 스토리지 에러 무시 */
    }
    setShowNavTooltip(false);
  };

  const checkActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div className="relative bg-background">
      <div className="border-b border-border/60">
        <div className="mx-auto flex h-12 w-full max-w-5xl items-center justify-between px-4 md:px-6">
          {/* 좌측: BlurFade stagger 입장 */}
          <div className="flex items-center gap-3">
            <BlurFade delay={0.02}>
              <button
                id="menuButton"
                className="flex size-8 cursor-pointer items-center justify-center rounded-lg border-none bg-transparent p-0 text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
                onClick={toggleSidebar}
                type="button"
              >
                <Menu className="size-4" />
              </button>
            </BlurFade>
            <BlurFade delay={0.06}>
              <Link to="/" className="flex items-center text-inherit no-underline">
                <Logo />
              </Link>
            </BlurFade>
          </div>

          {/* 우측: 글래스 Dock + glow */}
          <BlurFade delay={0.1}>
            <div
              className="flex items-center gap-1 rounded-xl border border-border/40 bg-background/60 px-2 py-1 shadow-sm backdrop-blur-xl"
              onMouseMove={(e) => mouseX.set(e.pageX)}
              onMouseLeave={() => mouseX.set(Infinity)}
            >
              <GlowDockIcon mouseX={mouseX} label={t('문의하기')} isActive={checkActive('/boards')}>
                <Link
                  to="/boards"
                  className={cn(
                    'flex size-8 items-center justify-center rounded-lg no-underline transition-all duration-150',
                    checkActive('/boards')
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <MessageSquare className="size-4" />
                </Link>
              </GlowDockIcon>

              <GlowDockIcon
                mouseX={mouseX}
                label={t('퀴즈 기록')}
                isActive={checkActive('/history')}
              >
                <div className="relative">
                  <Link
                    to="/history"
                    className={cn(
                      'flex size-8 items-center justify-center rounded-lg no-underline transition-all duration-150',
                      checkActive('/history')
                        ? 'bg-primary/15 text-primary'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                    onClick={handleQuizManagement}
                  >
                    <ClipboardList className="size-4" />
                  </Link>

                  {!isAuthenticated && showNavTooltip && (
                    <span
                      className="absolute left-1/2 top-[calc(100%+8px)] z-[2] inline-flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded bg-foreground px-2 py-1 text-xs text-background shadow-sm before:absolute before:left-1/2 before:top-[-4px] before:-translate-x-1/2 before:border-x-[5px] before:border-b-[5px] before:border-t-0 before:border-solid before:border-transparent before:border-b-foreground before:content-[''] max-sm:hidden"
                      role="status"
                    >
                      {t('로그인하고, 퀴즈기록을 저장해보세요')}
                      <button
                        type="button"
                        className="cursor-pointer border-none bg-transparent p-0.5 px-1 text-xs leading-none text-inherit hover:opacity-70"
                        aria-label={t('닫기')}
                        onClick={handleNavTooltipClose}
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  )}
                </div>
              </GlowDockIcon>

              <div className="mx-0.5 h-5 w-px bg-border/30" />

              {!isAuthenticated ? (
                <GlowDockIcon mouseX={mouseX} label={t('로그인')} isActive={checkActive('/login')}>
                  <Link
                    to="/login"
                    className={cn(
                      'flex size-8 items-center justify-center rounded-lg no-underline transition-all duration-150',
                      checkActive('/login')
                        ? 'bg-primary/15 text-primary'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <LogIn className="size-4" />
                  </Link>
                </GlowDockIcon>
              ) : (
                <div className="relative">
                  <GlowDockIcon mouseX={mouseX} label={displayName} isActive>
                    <button
                      id="profileButton"
                      className="flex size-8 cursor-pointer items-center justify-center rounded-full border border-primary/30 bg-primary/5 p-0 text-xs font-bold text-foreground shadow-[0_0_10px_oklch(var(--primary)_/_0.15)] transition-all duration-150 hover:shadow-[0_0_14px_oklch(var(--primary)_/_0.25)]"
                      onClick={() => setIsProfileOpen((prev) => !prev)}
                      aria-expanded={isProfileOpen}
                      aria-haspopup="true"
                      title={displayName}
                      type="button"
                    >
                      {profileInitial}
                    </button>
                  </GlowDockIcon>

                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div
                        id="profileDropdown"
                        initial={{ opacity: 0, y: -4, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.96 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                        className="absolute right-0 top-[calc(100%+8px)] z-[1001] min-w-[160px] rounded-lg border border-border/50 bg-background/90 p-2 shadow-lg backdrop-blur-xl"
                      >
                        <BlurFade delay={0.02}>
                          <span className="block px-2 py-1 text-sm font-semibold text-foreground">
                            {displayName}
                          </span>
                        </BlurFade>
                        <div className="my-1 h-px bg-border/50" />
                        <BlurFade delay={0.06}>
                          <button
                            className="flex w-full cursor-pointer items-center gap-2 rounded border-none bg-transparent px-2 py-1.5 text-left text-sm text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
                            type="button"
                            onClick={() => {
                              setIsProfileOpen(false);
                              handleLogout();
                            }}
                          >
                            <LogOut className="size-3.5" />
                            {t('로그아웃')}
                          </button>
                        </BlurFade>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </BlurFade>
        </div>
      </div>

      {/* 글래스 사이드바 + stagger */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[999] bg-foreground/15"
              onClick={closeSidebar}
            />
            <motion.aside
              id="sidebar"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed left-0 top-0 z-[1000] flex h-full w-[280px] flex-col border-r border-border/30 bg-background/80 backdrop-blur-xl"
            >
              {/* 우측 그라데이션 보더 효과 */}
              <div className="pointer-events-none absolute right-0 top-0 h-full w-px bg-gradient-to-b from-primary/30 via-primary/10 to-transparent" />

              <div className="flex items-center justify-between px-6 py-5">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  {t('메뉴')}
                </span>
                <button
                  className="cursor-pointer rounded-md border-none bg-transparent p-1.5 text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
                  onClick={closeSidebar}
                  type="button"
                >
                  <X className="size-5" />
                </button>
              </div>
              <div className="mx-6 h-px bg-border/40" />
              <nav className="flex flex-col gap-2 px-4 py-5">
                <BlurFade delay={0.05}>
                  <div className="flex items-center justify-between rounded-xl bg-muted/15 px-4 py-3.5 text-muted-foreground">
                    <span className="flex items-center gap-4 text-sm font-semibold">
                      <Globe className="size-5" />
                      {t('언어')}
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        className="cursor-pointer rounded-lg border-none bg-transparent px-3 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                        onClick={() => handleLanguageChange('ko')}
                        type="button"
                      >
                        KO
                      </button>
                      <button
                        className="cursor-pointer rounded-lg border-none bg-transparent px-3 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                        onClick={() => handleLanguageChange('en')}
                        type="button"
                      >
                        EN
                      </button>
                    </div>
                  </div>
                </BlurFade>
                <BlurFade delay={0.1}>
                  <button
                    className="flex w-full cursor-pointer items-center gap-4 rounded-xl border-none bg-transparent px-4 py-3.5 text-left text-sm font-semibold text-muted-foreground transition-colors duration-200 hover:bg-muted/15 hover:text-foreground"
                    type="button"
                    onClick={handleHelp}
                  >
                    <HelpCircle className="size-5" />
                    {t('도움말 보기')}
                  </button>
                </BlurFade>
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Header;
