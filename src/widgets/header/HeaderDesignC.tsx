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

/** Compact Ribbon — 극도로 컴팩트한 리본형 헤더, 아이콘 중심 */
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

  // 비인증 시 일일 tooltip
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
      {/* 컴팩트 리본 — 단일 줄 */}
      <div className="border-b border-border">
        <div className="mx-auto flex h-10 w-full max-w-5xl items-center justify-between px-3 md:px-5">
          {/* 좌측: 메뉴 + 로고 */}
          <div className="flex items-center gap-2">
            <button
              id="menuButton"
              className="group relative flex size-7 cursor-pointer items-center justify-center rounded border-none bg-transparent p-0 text-muted-foreground transition-colors duration-150 hover:text-foreground"
              onClick={toggleSidebar}
              type="button"
            >
              <Menu className="size-4" />
              {/* 아이콘 tooltip */}
              <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-2 py-0.5 text-[10px] font-medium text-background opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100">
                {t('메뉴')}
              </span>
            </button>

            <div className="h-4 w-px bg-border" />

            <Link to="/" className="flex items-center text-inherit no-underline">
              <Logo />
            </Link>
          </div>

          {/* 우측: 아이콘 네비 */}
          <div className="flex items-center gap-0.5">
            {/* 문의하기 */}
            <Link
              to="/boards"
              className={cn(
                'group relative flex size-7 items-center justify-center rounded no-underline transition-colors duration-150',
                isActive('/boards')
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <MessageSquare className="size-3.5" />
              <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-2 py-0.5 text-[10px] font-medium text-background opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100">
                {t('문의하기')}
              </span>
            </Link>

            {/* 퀴즈기록 */}
            <div className="relative">
              <Link
                to="/history"
                className={cn(
                  'group relative flex size-7 items-center justify-center rounded no-underline transition-colors duration-150',
                  isActive('/history')
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
                onClick={handleQuizManagement}
              >
                <ClipboardList className="size-3.5" />
                <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-2 py-0.5 text-[10px] font-medium text-background opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100">
                  {t('퀴즈 기록')}
                </span>
              </Link>

              {/* 일일 tooltip (비인증) */}
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

            <div className="mx-0.5 h-4 w-px bg-border" />

            {/* 로그인 / 프로필 */}
            {!isAuthenticated ? (
              <Link
                to="/login"
                className={cn(
                  'group relative flex size-7 items-center justify-center rounded no-underline transition-colors duration-150',
                  isActive('/login')
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <LogIn className="size-3.5" />
                <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-2 py-0.5 text-[10px] font-medium text-background opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100">
                  {t('로그인')}
                </span>
              </Link>
            ) : (
              <div className="relative">
                <button
                  id="profileButton"
                  className="flex size-7 cursor-pointer items-center justify-center rounded-full border border-border bg-muted/50 p-0 text-[10px] font-bold text-foreground transition-all duration-150 hover:border-primary/50 hover:bg-primary/10"
                  onClick={() => setIsProfileOpen((prev) => !prev)}
                  aria-expanded={isProfileOpen}
                  aria-haspopup="true"
                  title={displayName}
                  type="button"
                >
                  {profileInitial}
                </button>

                {/* 프로필 드롭다운 */}
                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      id="profileDropdown"
                      initial={{ opacity: 0, scale: 0.95, y: -2 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -2 }}
                      transition={{ duration: 0.12, ease: 'easeOut' }}
                      className="absolute right-0 top-[calc(100%+6px)] z-[1001] min-w-[150px] rounded-md border border-border bg-background p-1.5 shadow-md"
                    >
                      <span className="block px-2 py-1 text-xs font-semibold text-foreground">
                        {displayName}
                      </span>
                      <div className="my-1 h-px bg-border" />
                      <button
                        className="flex w-full cursor-pointer items-center gap-2 rounded-sm border-none bg-transparent px-2 py-1 text-left text-xs text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
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

      {/* 사이드바 + 오버레이 */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[999] bg-foreground/10"
              onClick={closeSidebar}
            />
            <motion.aside
              id="sidebar"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 z-[1000] flex h-full w-[220px] flex-col border-r border-border bg-background"
            >
              {/* 사이드바 헤더 */}
              <div className="flex h-10 items-center justify-between px-4">
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  {t('메뉴')}
                </span>
                <button
                  className="flex size-6 cursor-pointer items-center justify-center rounded-sm border-none bg-transparent p-0 text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
                  onClick={closeSidebar}
                  type="button"
                >
                  <X className="size-3.5" />
                </button>
              </div>

              <div className="mx-3 h-px bg-border" />

              {/* 사이드바 메뉴 */}
              <nav className="flex flex-col gap-0.5 px-2 py-2">
                {/* 언어 선택 */}
                <div className="flex items-center justify-between rounded-sm px-3 py-2 text-muted-foreground">
                  <span className="flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-wide">
                    <Globe className="size-3.5" />
                    {t('언어')}
                  </span>
                  <div className="flex overflow-hidden rounded border border-border">
                    <button
                      className="cursor-pointer border-none bg-transparent px-2 py-0.5 text-[10px] font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      onClick={() => handleLanguageChange('ko')}
                      type="button"
                    >
                      KO
                    </button>
                    <div className="w-px bg-border" />
                    <button
                      className="cursor-pointer border-none bg-transparent px-2 py-0.5 text-[10px] font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      onClick={() => handleLanguageChange('en')}
                      type="button"
                    >
                      EN
                    </button>
                  </div>
                </div>

                {/* 도움말 */}
                <button
                  className="flex w-full cursor-pointer items-center gap-2.5 rounded-sm border-none bg-transparent px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
                  type="button"
                  onClick={handleHelp}
                >
                  <HelpCircle className="size-3.5" />
                  {t('도움말 보기')}
                </button>
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Header;
