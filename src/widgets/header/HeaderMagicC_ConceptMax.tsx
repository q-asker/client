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

/** 플로팅 원형 Dock 아이콘 */
const ArcDockIcon = ({
  children,
  mouseX,
  label,
}: {
  children: React.ReactNode;
  mouseX: ReturnType<typeof useMotionValue<number>>;
  label: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const distance = useTransform(mouseX, (val: number) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return 200;
    return val - rect.x - rect.width / 2;
  });
  const scale = useTransform(distance, [-100, 0, 100], [1, 1.5, 1]);
  const y = useTransform(distance, [-100, 0, 100], [0, -6, 0]);
  const springScale = useSpring(scale, { stiffness: 350, damping: 22 });
  const springY = useSpring(y, { stiffness: 350, damping: 22 });

  return (
    <motion.div
      ref={ref}
      style={{ scale: springScale, y: springY }}
      className="group relative flex size-9 items-center justify-center"
    >
      {children}
      <span className="pointer-events-none absolute bottom-full z-50 mb-2 whitespace-nowrap rounded-lg bg-foreground px-2.5 py-1 text-[10px] font-medium text-background opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100">
        {label}
      </span>
    </motion.div>
  );
};

/** ConceptMax — 플로팅 원형 배치(arc) Dock */
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

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div className="relative bg-background">
      {/* 중앙 플로팅 Dock */}
      <div className="flex items-center justify-center px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          {/* 메뉴 */}
          <BlurFade delay={0.05}>
            <button
              id="menuButton"
              className="flex size-9 cursor-pointer items-center justify-center rounded-full border border-border bg-muted/30 p-0 text-muted-foreground shadow-sm transition-colors duration-150 hover:bg-muted hover:text-foreground"
              onClick={toggleSidebar}
              type="button"
            >
              <Menu className="size-4" />
            </button>
          </BlurFade>

          {/* 로고 */}
          <Link to="/" className="flex items-center text-inherit no-underline">
            <Logo />
          </Link>

          {/* Dock 바 — 원형 아이콘 + arc 효과 */}
          <div
            className="flex items-end gap-1.5 rounded-2xl border border-border bg-muted/20 px-3 py-1.5 shadow-sm backdrop-blur-sm"
            onMouseMove={(e) => mouseX.set(e.pageX)}
            onMouseLeave={() => mouseX.set(Infinity)}
          >
            <ArcDockIcon mouseX={mouseX} label={t('문의하기')}>
              <Link
                to="/boards"
                className={cn(
                  'flex size-9 items-center justify-center rounded-full no-underline transition-colors duration-150',
                  isActive('/boards')
                    ? 'bg-primary/15 text-primary shadow-sm'
                    : 'text-muted-foreground hover:bg-background hover:text-foreground',
                )}
              >
                <MessageSquare className="size-4" />
              </Link>
            </ArcDockIcon>

            <ArcDockIcon mouseX={mouseX} label={t('퀴즈 기록')}>
              <div className="relative">
                <Link
                  to="/history"
                  className={cn(
                    'flex size-9 items-center justify-center rounded-full no-underline transition-colors duration-150',
                    isActive('/history')
                      ? 'bg-primary/15 text-primary shadow-sm'
                      : 'text-muted-foreground hover:bg-background hover:text-foreground',
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
            </ArcDockIcon>

            <div className="mx-0.5 h-6 w-px self-center bg-border/40" />

            {!isAuthenticated ? (
              <ArcDockIcon mouseX={mouseX} label={t('로그인')}>
                <Link
                  to="/login"
                  className={cn(
                    'flex size-9 items-center justify-center rounded-full no-underline transition-colors duration-150',
                    isActive('/login')
                      ? 'bg-primary/15 text-primary shadow-sm'
                      : 'text-muted-foreground hover:bg-background hover:text-foreground',
                  )}
                >
                  <LogIn className="size-4" />
                </Link>
              </ArcDockIcon>
            ) : (
              <div className="relative">
                <ArcDockIcon mouseX={mouseX} label={displayName}>
                  <button
                    id="profileButton"
                    className="flex size-9 cursor-pointer items-center justify-center rounded-full border border-border bg-background p-0 text-xs font-bold text-foreground transition-colors duration-150 hover:border-primary/50"
                    onClick={() => setIsProfileOpen((prev) => !prev)}
                    aria-expanded={isProfileOpen}
                    aria-haspopup="true"
                    title={displayName}
                    type="button"
                  >
                    {profileInitial}
                  </button>
                </ArcDockIcon>

                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      id="profileDropdown"
                      initial={{ opacity: 0, y: -6, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.95 }}
                      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                      className="absolute right-0 top-[calc(100%+10px)] z-[1001] min-w-[160px] rounded-xl border border-border bg-background p-2 shadow-lg"
                    >
                      <BlurFade delay={0.02}>
                        <span className="block px-2 py-1 text-sm font-semibold text-foreground">
                          {displayName}
                        </span>
                      </BlurFade>
                      <div className="my-1 h-px bg-border" />
                      <BlurFade delay={0.06}>
                        <button
                          className="flex w-full cursor-pointer items-center gap-2 rounded-lg border-none bg-transparent px-2 py-1.5 text-left text-sm text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
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
        </div>
      </div>

      {/* 헤더 확장 메뉴 */}
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
            <motion.div
              id="sidebar"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              className="relative z-[1000] overflow-hidden border-b border-border bg-background"
            >
              <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 md:px-6">
                <div className="flex items-center gap-6">
                  {/* 언어 스위처 */}
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Globe className="size-3.5" />
                    <span className="text-[11px] font-bold uppercase tracking-wide">
                      {t('언어')}
                    </span>
                    <div className="flex gap-1">
                      <button
                        className="cursor-pointer rounded border-none bg-transparent px-2 py-1 text-[11px] font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        onClick={() => handleLanguageChange('ko')}
                        type="button"
                      >
                        KO
                      </button>
                      <button
                        className="cursor-pointer rounded border-none bg-transparent px-2 py-1 text-[11px] font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        onClick={() => handleLanguageChange('en')}
                        type="button"
                      >
                        EN
                      </button>
                    </div>
                  </div>

                  <div className="h-5 w-px bg-border/50" />

                  {/* 도움말 */}
                  <button
                    className="flex cursor-pointer items-center gap-2 border-none bg-transparent p-0 text-[11px] font-bold uppercase tracking-wide text-muted-foreground transition-colors duration-200 hover:text-foreground"
                    type="button"
                    onClick={handleHelp}
                  >
                    <HelpCircle className="size-3.5" />
                    {t('도움말 보기')}
                  </button>
                </div>

                <button
                  className="cursor-pointer border-none bg-transparent p-1 text-muted-foreground transition-opacity duration-200 hover:opacity-60"
                  onClick={closeSidebar}
                  type="button"
                >
                  <X className="size-4" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Header;
