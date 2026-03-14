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
  hidden: { opacity: 0, x: -12 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.07, type: 'spring', damping: 22, stiffness: 300 },
  }),
};

// 프로필 드롭다운 항목 stagger 애니메이션
const dropdownItemVariants = {
  hidden: { opacity: 0, y: -4 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, type: 'spring', damping: 22, stiffness: 300 },
  }),
};

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
      // 스토리지 에러 무시
    }
    setShowNavTooltip(false);
  };

  // 활성 경로 판별
  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div className="relative bg-white dark:bg-slate-950">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3 md:px-6">
        {/* 로고 영역 */}
        <div className="flex items-center">
          <button
            id="menuButton"
            className="mr-3 cursor-pointer border-none bg-transparent p-1.5 text-gray-700 transition-colors duration-200 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
            onClick={toggleSidebar}
          >
            <Menu className="size-5" />
          </button>
          <Link to="/" className="text-inherit no-underline">
            <Logo />
          </Link>
        </div>

        {/* 네비게이션 링크 - 컬러풀한 호버 배경 */}
        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-3">
            <BlurFade delay={0.05}>
              <Link
                to="/boards"
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium no-underline transition-all duration-200 sm:text-base',
                  isActive('/boards')
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                    : 'text-gray-700 hover:bg-amber-50 dark:text-gray-300 dark:hover:bg-amber-900/20',
                )}
              >
                <MessageSquare className="size-4 sm:hidden" />
                <span className="max-sm:hidden">{t('문의하기')}</span>
              </Link>
            </BlurFade>

            <BlurFade delay={0.1}>
              <div className="relative inline-flex items-center">
                <Link
                  to="/history"
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium no-underline transition-all duration-200 sm:text-base',
                    isActive('/history')
                      ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-400'
                      : 'text-gray-700 hover:bg-cyan-50 dark:text-gray-300 dark:hover:bg-cyan-900/20',
                  )}
                  onClick={handleQuizManagement}
                >
                  <ClipboardList className="size-4 sm:hidden" />
                  <span className="max-sm:hidden">{t('퀴즈 기록')}</span>
                </Link>
                {!isAuthenticated && showNavTooltip && (
                  <span
                    className="absolute left-1/2 top-[calc(100%+6px)] z-[2] inline-flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-gray-900 px-2.5 py-1.5 text-xs text-white shadow-lg before:absolute before:left-1/2 before:top-[-4px] before:-translate-x-1/2 before:border-x-[6px] before:border-b-[6px] before:border-t-0 before:border-solid before:border-transparent before:border-b-gray-900 before:content-[''] dark:bg-gray-800 dark:before:border-b-gray-800 max-sm:hidden"
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

            {!isAuthenticated && (
              <BlurFade delay={0.15}>
                <Link
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium no-underline transition-all duration-200 sm:text-base',
                    isActive('/login')
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400'
                      : 'text-gray-700 hover:bg-rose-50 dark:text-gray-300 dark:hover:bg-rose-900/20',
                  )}
                  to="/login"
                >
                  <LogIn className="size-4 sm:hidden" />
                  <span className="max-sm:hidden">{t('로그인')}</span>
                </Link>
              </BlurFade>
            )}
          </nav>

          {/* 프로필 버튼 (인증 시) */}
          {isAuthenticated && (
            <div className="relative">
              <button
                id="profileButton"
                className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 p-0 text-sm font-bold text-white transition-transform duration-200 hover:scale-110 md:size-9 md:text-base"
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
                    initial={{ opacity: 0, scale: 0.96, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: -4 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="absolute right-0 top-[calc(100%+8px)] z-[1001] min-w-[170px] rounded-lg border border-gray-200 bg-white p-2.5 shadow-md dark:border-gray-700 dark:bg-gray-900"
                  >
                    <motion.span
                      className="mb-2 block px-1 text-sm font-semibold text-gray-900 dark:text-white"
                      custom={0}
                      variants={dropdownItemVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {displayName}
                    </motion.span>
                    <div className="mb-1.5 h-px bg-gray-200 dark:bg-gray-700" />
                    <motion.button
                      className="flex w-full cursor-pointer items-center gap-2 rounded px-1 py-1.5 text-left text-sm text-gray-700 transition-colors duration-200 hover:bg-rose-50 hover:text-rose-600 dark:text-gray-300 dark:hover:bg-rose-900/20 dark:hover:text-rose-400"
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

      {/* 사이드바 + 오버레이 */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[999] bg-black/20 dark:bg-black/40"
              onClick={closeSidebar}
            />
            <motion.aside
              id="sidebar"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed left-0 top-0 z-[1000] flex h-full w-[260px] flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950"
            >
              {/* 사이드바 헤더 */}
              <div className="flex items-center justify-between px-5 py-4">
                <motion.h2
                  className="text-[10px] font-bold uppercase tracking-widest text-gray-600 dark:text-gray-400"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05, type: 'spring', stiffness: 300, damping: 25 }}
                >
                  {t('메뉴')}
                </motion.h2>
                <button
                  className="cursor-pointer border-none bg-transparent p-1 text-gray-600 transition-colors duration-200 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                  onClick={closeSidebar}
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="mx-5 h-px bg-gray-200 dark:bg-gray-800" />

              {/* 사이드바 네비게이션 */}
              <nav className="flex flex-col gap-0 px-3 py-2">
                <motion.div
                  className="flex cursor-pointer items-center justify-between rounded px-4 py-3 text-gray-700 transition-colors duration-200 hover:bg-indigo-50 hover:text-indigo-600 dark:text-gray-300 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400"
                  custom={0}
                  variants={sidebarItemVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <span className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-wide">
                    <Globe className="size-3.5" />
                    {t('언어')}
                  </span>
                  <div className="flex gap-1">
                    <button
                      className="cursor-pointer border-none bg-transparent px-2 py-1 text-[11px] font-bold text-gray-700 transition-colors hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
                      onClick={() => handleLanguageChange('ko')}
                    >
                      KO
                    </button>
                    <button
                      className="cursor-pointer border-none bg-transparent px-2 py-1 text-[11px] font-bold text-gray-700 transition-colors hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
                      onClick={() => handleLanguageChange('en')}
                    >
                      EN
                    </button>
                  </div>
                </motion.div>

                <motion.button
                  className="flex w-full cursor-pointer items-center gap-3 rounded bg-transparent px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-gray-700 transition-colors duration-200 hover:bg-indigo-50 hover:text-indigo-600 dark:text-gray-300 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400"
                  type="button"
                  custom={1}
                  variants={sidebarItemVariants}
                  initial="hidden"
                  animate="visible"
                  onClick={handleHelp}
                >
                  <HelpCircle className="size-3.5" />
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
