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

/** 최적화된 spring Dock 아이콘 */
const DockIcon = ({
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
    if (!rect) return 150;
    return val - rect.x - rect.width / 2;
  });
  const scale = useTransform(distance, [-80, 0, 80], [1, 1.3, 1]);
  /* PolishMid: spring stiffness 400, damping 30 최적화 */
  const springScale = useSpring(scale, { stiffness: 400, damping: 30 });

  return (
    <motion.div
      ref={ref}
      style={{ scale: springScale }}
      className="group relative flex size-8 items-center justify-center"
    >
      {children}
      <span className="pointer-events-none absolute bottom-full z-50 mb-1.5 whitespace-nowrap rounded bg-foreground px-2 py-0.5 text-[10px] font-medium text-background opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100">
        {label}
      </span>
    </motion.div>
  );
};

/** PolishMid — spring 최적화 + 그림자 미세 조정 */
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
      <div className="border-b border-border shadow-sm">
        <div className="mx-auto flex h-12 w-full max-w-5xl items-center justify-between px-4 md:px-6">
          {/* 좌측 */}
          <div className="flex items-center gap-3">
            <BlurFade delay={0.05}>
              <button
                id="menuButton"
                className="flex size-8 cursor-pointer items-center justify-center rounded-lg border-none bg-transparent p-0 text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
                onClick={toggleSidebar}
                type="button"
              >
                <Menu className="size-4" />
              </button>
            </BlurFade>
            <Link to="/" className="flex items-center text-inherit no-underline">
              <Logo />
            </Link>
          </div>

          {/* 우측: Dock — 정교한 shadow + gap */}
          <div
            className="flex items-center gap-1.5 rounded-xl bg-muted/25 px-2.5 py-1 shadow-[0_1px_3px_0_var(--color-border)]"
            onMouseMove={(e) => mouseX.set(e.pageX)}
            onMouseLeave={() => mouseX.set(Infinity)}
          >
            <DockIcon mouseX={mouseX} label={t('문의하기')}>
              <Link
                to="/boards"
                className={cn(
                  'flex size-8 items-center justify-center rounded-lg no-underline transition-colors duration-150',
                  isActive('/boards')
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <MessageSquare className="size-4" />
              </Link>
            </DockIcon>

            <DockIcon mouseX={mouseX} label={t('퀴즈 기록')}>
              <div className="relative">
                <Link
                  to="/history"
                  className={cn(
                    'flex size-8 items-center justify-center rounded-lg no-underline transition-colors duration-150',
                    isActive('/history')
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
            </DockIcon>

            <div className="mx-0.5 h-5 w-px bg-border/40" />

            {!isAuthenticated ? (
              <DockIcon mouseX={mouseX} label={t('로그인')}>
                <Link
                  to="/login"
                  className={cn(
                    'flex size-8 items-center justify-center rounded-lg no-underline transition-colors duration-150',
                    isActive('/login')
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <LogIn className="size-4" />
                </Link>
              </DockIcon>
            ) : (
              <div className="relative">
                <DockIcon mouseX={mouseX} label={displayName}>
                  <button
                    id="profileButton"
                    className="flex size-8 cursor-pointer items-center justify-center rounded-full border border-border bg-background p-0 text-xs font-bold text-foreground shadow-sm transition-colors duration-150 hover:border-primary/50"
                    onClick={() => setIsProfileOpen((prev) => !prev)}
                    aria-expanded={isProfileOpen}
                    aria-haspopup="true"
                    title={displayName}
                    type="button"
                  >
                    {profileInitial}
                  </button>
                </DockIcon>

                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      id="profileDropdown"
                      initial={{ opacity: 0, y: -4, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.96 }}
                      transition={{ type: 'spring', damping: 30, stiffness: 350 }}
                      className="absolute right-0 top-[calc(100%+8px)] z-[1001] min-w-[160px] rounded-lg border border-border bg-background p-2 shadow-md"
                    >
                      <BlurFade delay={0.02}>
                        <span className="block px-2 py-1 text-sm font-semibold text-foreground">
                          {displayName}
                        </span>
                      </BlurFade>
                      <div className="my-1 h-px bg-border" />
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
        </div>
      </div>

      {/* 커맨드 팔레트 */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[999] bg-foreground/20"
              onClick={closeSidebar}
            />
            <motion.div
              id="sidebar"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              className="fixed left-1/2 top-20 z-[1000] w-full max-w-sm -translate-x-1/2 rounded-xl border border-border bg-background shadow-xl"
            >
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-xs font-semibold text-muted-foreground">{t('메뉴')}</span>
                <button
                  className="cursor-pointer rounded-md border-none bg-transparent p-1 text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
                  onClick={closeSidebar}
                  type="button"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="mx-4 h-px bg-border" />
              <nav className="flex flex-col gap-1 p-2">
                <div className="flex items-center justify-between rounded-lg px-3 py-2.5 text-muted-foreground transition-colors hover:bg-muted">
                  <span className="flex items-center gap-3 text-sm">
                    <Globe className="size-4" />
                    {t('언어')}
                  </span>
                  <div className="flex gap-1">
                    <button
                      className="cursor-pointer rounded-md border-none bg-transparent px-2.5 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                      onClick={() => handleLanguageChange('ko')}
                      type="button"
                    >
                      KO
                    </button>
                    <button
                      className="cursor-pointer rounded-md border-none bg-transparent px-2.5 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                      onClick={() => handleLanguageChange('en')}
                      type="button"
                    >
                      EN
                    </button>
                  </div>
                </div>
                <button
                  className="flex w-full cursor-pointer items-center gap-3 rounded-lg border-none bg-transparent px-3 py-2.5 text-left text-sm text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
                  type="button"
                  onClick={handleHelp}
                >
                  <HelpCircle className="size-4" />
                  {t('도움말 보기')}
                </button>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Header;
