import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { MessageSquare, ClipboardList, LogIn, Menu, X, Globe, HelpCircle } from 'lucide-react';
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

// 사이드바 메뉴 항목 stagger 애니메이션
const sidebarItemVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.08, type: 'spring', damping: 20, stiffness: 300 },
  }),
};

const Header = ({ isSidebarOpen, toggleSidebar, setIsSidebarOpen, setShowHelp }: HeaderProps) => {
  const {
    state: { t, isAuthenticated, user },
    actions: { handleQuizManagement, handleHelp, handleLogout, handleLanguageChange, closeSidebar },
  } = useHeader({ setIsSidebarOpen, setShowHelp });
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showNavTooltip, setShowNavTooltip] = useState(false);

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
      // 스토리지 에러 무시
    }
    setShowNavTooltip(false);
  };

  return (
    <div className="relative bg-white dark:bg-slate-950 shadow-sm">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3 md:px-6">
        {/* 로고 영역 */}
        <div className="flex items-center">
          <button
            id="menuButton"
            className="mr-3 cursor-pointer rounded-lg border-none bg-transparent p-1.5 text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
            onClick={toggleSidebar}
          >
            <Menu className="size-5" />
          </button>
          <Link to="/" className="text-inherit no-underline">
            <Logo />
          </Link>
        </div>

        {/* 네비게이션 링크 - 구분선 포함 */}
        <div className="flex items-center gap-1 md:gap-3">
          <Link
            to="/boards"
            className="inline-flex items-center whitespace-nowrap px-3 py-2 text-foreground no-underline transition-all duration-200 hover:bg-primary/5 hover:text-primary text-sm md:text-base"
          >
            <MessageSquare className="mr-1.5 size-4" />
            <strong>{t('문의하기')}</strong>
          </Link>

          {/* 구분선 */}
          <div className="h-5 w-px bg-muted mx-1" />

          <div className="relative inline-flex items-center">
            <Link
              to="/history"
              className="inline-flex items-center whitespace-nowrap px-3 py-2 text-foreground no-underline transition-all duration-200 hover:bg-primary/5 hover:text-primary text-sm md:text-base"
              onClick={handleQuizManagement}
            >
              <ClipboardList className="mr-1.5 size-4" />
              <strong>{t('퀴즈 기록')}</strong>
            </Link>
            {!isAuthenticated && showNavTooltip && (
              <span
                className="absolute left-1/2 top-[calc(100%+6px)] z-[2] inline-flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-1.5 pl-2.5 text-xs text-foreground shadow-lg max-sm:hidden"
                style={{
                  backgroundColor: 'oklch(0.9222 0.0013 286.3737) !important',
                  borderColor: 'oklch(0.8901 0.0073 248.0338) !important',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  color: 'oklch(0.2236 0.0108 248.5103) !important',
                }}
                role="status"
              >
                {t('로그인하고, 퀴즈기록을 저장해보세요')}
                <button
                  type="button"
                  className="cursor-pointer border-none bg-transparent p-0.5 px-1 text-xs leading-none text-inherit hover:opacity-80"
                  aria-label={t('닫기')}
                  onClick={handleNavTooltipClose}
                >
                  ✕
                </button>
              </span>
            )}
          </div>

          {/* 구분선 */}
          <div className="h-5 w-px bg-muted mx-1" />

          {/* 인증 버튼 */}
          <div className="flex items-center">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  id="profileButton"
                  className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full border border-primary/30 bg-primary/10 p-0 text-sm font-bold text-primary transition-colors duration-200 hover:bg-primary/20 md:size-9 md:text-base"
                  onClick={() => setIsProfileOpen((prev) => !prev)}
                  aria-expanded={isProfileOpen}
                  aria-haspopup="true"
                  title={displayName}
                  type="button"
                >
                  {profileInitial}
                </button>
                {isProfileOpen && (
                  <div
                    id="profileDropdown"
                    className="absolute right-0 top-[calc(100%+8px)] z-[1001] min-w-[180px] rounded-xl border border-border bg-card p-3 shadow-lg dark:bg-card/50"
                  >
                    <span className="mb-2.5 block font-semibold text-foreground">
                      {displayName}
                    </span>
                    <button
                      className="w-full cursor-pointer border-none bg-transparent px-1 py-1.5 text-left text-primary hover:text-primary"
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        handleLogout();
                      }}
                    >
                      <span className="mr-1.5 inline-flex items-center">🚪</span>
                      <strong>{t('로그아웃')}</strong>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                className="inline-flex items-center whitespace-nowrap text-sm text-primary no-underline transition-all duration-200 hover:bg-primary/5 hover:text-primary px-3 py-2 rounded md:text-base"
                to="/login"
              >
                <LogIn className="mr-1.5 size-4" />
                <strong>{t('로그인')}</strong>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 사이드바 + 오버레이 — 아이콘별 그룹, 소제목+구분선 */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[999] bg-foreground/20"
              onClick={closeSidebar}
            />
            <motion.aside
              id="sidebar"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed left-0 top-0 z-[1000] flex h-full w-[280px] flex-col border-r border-border bg-background"
            >
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <motion.h2
                  className="text-xs font-bold uppercase tracking-[0.2em] text-foreground"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05, type: 'spring', stiffness: 300, damping: 25 }}
                >
                  {t('메뉴')}
                </motion.h2>
                <button
                  className="cursor-pointer border-none bg-transparent p-1.5 text-muted-foreground transition-colors duration-200 hover:text-foreground"
                  onClick={closeSidebar}
                >
                  <X className="size-5" />
                </button>
              </div>

              <nav className="flex flex-col gap-0 p-2">
                {/* 설정 그룹 소제목 */}
                <div className="px-4 pb-1 pt-3">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">
                    {t('설정')}
                  </span>
                </div>

                {/* 언어 전환 토글 */}
                <motion.div
                  className="flex cursor-pointer items-center justify-between rounded-lg px-4 py-3.5 text-sm text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05, type: 'spring', damping: 20, stiffness: 300 }}
                >
                  <span className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.15em]">
                    <Globe className="size-4" />
                    {t('언어')}
                  </span>
                  <div className="flex gap-0.5 rounded-full bg-muted p-0.5">
                    <button
                      className="cursor-pointer rounded-full border-none bg-transparent px-2.5 py-1 text-xs font-bold text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                      onClick={() => handleLanguageChange('ko')}
                    >
                      KO
                    </button>
                    <button
                      className="cursor-pointer rounded-full border-none bg-transparent px-2.5 py-1 text-xs font-bold text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                      onClick={() => handleLanguageChange('en')}
                    >
                      EN
                    </button>
                  </div>
                </motion.div>

                {/* 구분선 + 지원 그룹 소제목 */}
                <div className="mx-4 my-1 border-t border-border/60" />
                <div className="px-4 pb-1 pt-3">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">
                    {t('지원')}
                  </span>
                </div>

                <motion.button
                  className="flex w-full cursor-pointer items-center gap-3 rounded-lg border-none bg-transparent px-4 py-3.5 text-left text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
                  type="button"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.08, type: 'spring', damping: 20, stiffness: 300 }}
                  onClick={handleHelp}
                >
                  <HelpCircle className="size-4" />
                  {t('도움말 보기')}
                </motion.button>
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Header;
