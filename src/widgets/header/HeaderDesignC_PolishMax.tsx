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
import { cn } from '@/shared/ui/lib/utils';

interface HeaderProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setShowHelp?: React.Dispatch<React.SetStateAction<boolean>>;
}

/** PolishMax — 아이콘 subtle glow + 리본 배경 그라디언트 */
const Header = ({ isSidebarOpen, toggleSidebar, setIsSidebarOpen, setShowHelp }: HeaderProps) => {
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
    <div className="relative">
      {/* 그라디언트 리본 배경 */}
      <div className="bg-gradient-to-r from-background via-muted/20 to-background">
        <div className="border-b border-border/60">
          <div className="mx-auto flex h-10 w-full max-w-5xl items-center justify-between px-3 md:px-5">
            {/* 좌측 */}
            <div className="flex items-center gap-2">
              <button
                id="menuButton"
                className="group relative flex size-7 cursor-pointer items-center justify-center rounded border-none bg-transparent p-0 text-muted-foreground transition-all duration-200 hover:scale-110 hover:text-foreground"
                onClick={toggleSidebar}
                type="button"
              >
                <Menu className="size-4" />
                <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-2 py-0.5 text-[10px] font-medium text-background opacity-0 shadow-sm transition-opacity duration-200 group-hover:opacity-100">
                  {t('메뉴')}
                </span>
              </button>

              <div className="h-4 w-px bg-border/50" />

              <Link to="/" className="flex items-center text-inherit no-underline">
                <Logo />
              </Link>
            </div>

            {/* 우측: glow 아이콘 */}
            <div className="flex items-center gap-0.5">
              <Link
                to="/boards"
                className={cn(
                  'group relative flex size-7 items-center justify-center rounded no-underline transition-all duration-200 hover:scale-110',
                  isActive('/boards')
                    ? 'text-primary drop-shadow-[0_0_6px_oklch(var(--primary))]'
                    : 'text-muted-foreground hover:text-foreground hover:drop-shadow-[0_0_4px_oklch(var(--primary))]',
                )}
              >
                <MessageSquare className="size-3.5" />
                <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-2 py-0.5 text-[10px] font-medium text-background opacity-0 shadow-sm transition-opacity duration-200 group-hover:opacity-100">
                  {t('문의하기')}
                </span>
              </Link>

              <div className="relative">
                <Link
                  to="/history"
                  className={cn(
                    'group relative flex size-7 items-center justify-center rounded no-underline transition-all duration-200 hover:scale-110',
                    isActive('/history')
                      ? 'text-primary drop-shadow-[0_0_6px_oklch(var(--primary))]'
                      : 'text-muted-foreground hover:text-foreground hover:drop-shadow-[0_0_4px_oklch(var(--primary))]',
                  )}
                  onClick={handleQuizManagement}
                >
                  <ClipboardList className="size-3.5" />
                  <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-2 py-0.5 text-[10px] font-medium text-background opacity-0 shadow-sm transition-opacity duration-200 group-hover:opacity-100">
                    {t('퀴즈 기록')}
                  </span>
                </Link>

                {!isAuthenticated && showNavTooltip && (
                  <span
                    className="absolute left-1/2 top-[calc(100%+6px)] z-[2] inline-flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded bg-foreground px-2 py-1 text-xs text-background shadow-sm before:absolute before:left-1/2 before:top-[-4px] before:-translate-x-1/2 before:border-x-[5px] before:border-b-[5px] before:border-t-0 before:border-solid before:border-transparent before:border-b-foreground before:content-[''] max-sm:hidden"
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

              <div className="mx-0.5 h-4 w-px bg-border/50" />

              {!isAuthenticated ? (
                <Link
                  to="/login"
                  className={cn(
                    'group relative flex size-7 items-center justify-center rounded no-underline transition-all duration-200 hover:scale-110',
                    isActive('/login')
                      ? 'text-primary drop-shadow-[0_0_6px_oklch(var(--primary))]'
                      : 'text-muted-foreground hover:text-foreground hover:drop-shadow-[0_0_4px_oklch(var(--primary))]',
                  )}
                >
                  <LogIn className="size-3.5" />
                  <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-2 py-0.5 text-[10px] font-medium text-background opacity-0 shadow-sm transition-opacity duration-200 group-hover:opacity-100">
                    {t('로그인')}
                  </span>
                </Link>
              ) : (
                <div className="relative">
                  <button
                    id="profileButton"
                    className="flex size-7 cursor-pointer items-center justify-center rounded-full border border-primary/30 bg-primary/5 p-0 text-[10px] font-bold text-foreground shadow-[0_0_8px_oklch(var(--primary)_/_0.15)] transition-all duration-200 hover:scale-110 hover:shadow-[0_0_12px_oklch(var(--primary)_/_0.25)]"
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
                        initial={{ opacity: 0, scale: 0.95, y: -2 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -2 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute right-0 top-[calc(100%+6px)] z-[1001] min-w-[150px] rounded-md border border-border bg-background p-1.5 shadow-lg"
                      >
                        <span className="block px-2 py-1 text-xs font-semibold text-foreground">
                          {displayName}
                        </span>
                        <div className="my-1 h-px bg-border" />
                        <button
                          className="flex w-full cursor-pointer items-center gap-2 rounded-sm border-none bg-transparent px-2 py-1 text-left text-xs text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground"
                          type="button"
                          onClick={() => {
                            setIsProfileOpen(false);
                            handleLogout();
                          }}
                        >
                          <LogOut className="size-3" />
                          {t('로그아웃')}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 풀스크린 오버레이 메뉴 */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            id="sidebar"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm"
          >
            {/* 닫기 버튼 */}
            <button
              className="absolute right-5 top-5 flex size-10 cursor-pointer items-center justify-center rounded-full border-none bg-muted/50 p-0 text-muted-foreground transition-all duration-200 hover:scale-110 hover:bg-muted hover:text-foreground"
              onClick={closeSidebar}
              type="button"
            >
              <X className="size-5" />
            </button>

            {/* 메뉴 아이템 */}
            <nav className="flex flex-col items-center gap-10">
              <div className="flex flex-col items-center gap-4">
                <span className="flex items-center gap-3 text-lg font-bold text-foreground">
                  <Globe className="size-5" />
                  {t('언어')}
                </span>
                <div className="flex gap-3">
                  <button
                    className="cursor-pointer rounded-lg border border-border bg-transparent px-5 py-2 text-base font-bold text-muted-foreground transition-all duration-200 hover:border-primary hover:bg-primary/10 hover:text-foreground"
                    onClick={() => handleLanguageChange('ko')}
                    type="button"
                  >
                    KO
                  </button>
                  <button
                    className="cursor-pointer rounded-lg border border-border bg-transparent px-5 py-2 text-base font-bold text-muted-foreground transition-all duration-200 hover:border-primary hover:bg-primary/10 hover:text-foreground"
                    onClick={() => handleLanguageChange('en')}
                    type="button"
                  >
                    EN
                  </button>
                </div>
              </div>

              <button
                className="flex cursor-pointer items-center gap-3 border-none bg-transparent p-0 text-lg font-bold text-muted-foreground transition-all duration-200 hover:scale-105 hover:text-foreground"
                type="button"
                onClick={handleHelp}
              >
                <HelpCircle className="size-5" />
                {t('도움말 보기')}
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Header;
