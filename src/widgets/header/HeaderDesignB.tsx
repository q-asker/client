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
  hidden: { opacity: 0, x: -16 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.08, type: 'spring', damping: 20, stiffness: 300 },
  }),
};

// 프로필 드롭다운 항목 stagger 애니메이션
const dropdownItemVariants = {
  hidden: { opacity: 0, y: -4 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, type: 'spring', damping: 20, stiffness: 300 },
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
    <div className="relative bg-background shadow-sm">
      {/* 3-column 그리드: 좌측 네비 | 중앙 로고 | 우측 네비+프로필 */}
      <div className="mx-auto grid w-full max-w-5xl grid-cols-3 items-center px-4 py-4 md:px-6">
        {/* 좌측: 메뉴 버튼 + 문의하기 */}
        <div className="flex items-center gap-1">
          <button
            id="menuButton"
            className="cursor-pointer rounded-lg border-none bg-transparent p-1.5 text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
            onClick={toggleSidebar}
          >
            <Menu className="size-5" />
          </button>

          <BlurFade delay={0.05}>
            <Link
              to="/boards"
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium no-underline transition-all duration-200',
                isActive('/boards')
                  ? 'bg-muted font-semibold text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <MessageSquare className="size-4" />
              <span className="max-sm:hidden">{t('문의하기')}</span>
            </Link>
          </BlurFade>
        </div>

        {/* 중앙: 로고 (절대 위치로 정중앙 고정) */}
        <div className="flex justify-center">
          <Link to="/" className="text-inherit no-underline">
            <Logo />
          </Link>
        </div>

        {/* 우측: 퀴즈 기록 + 로그인/프로필 */}
        <div className="flex items-center justify-end gap-1">
          <BlurFade delay={0.1}>
            <div className="relative inline-flex items-center">
              <Link
                to="/history"
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium no-underline transition-all duration-200',
                  isActive('/history')
                    ? 'bg-muted font-semibold text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
                onClick={handleQuizManagement}
              >
                <ClipboardList className="size-4" />
                <span className="max-sm:hidden">{t('퀴즈 기록')}</span>
              </Link>
              {/* 툴팁: "퀴즈 기록" 아래에 위치 */}
              {!isAuthenticated && showNavTooltip && (
                <span
                  className="absolute left-1/2 top-[calc(100%+6px)] z-[2] inline-flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-lg bg-primary px-2 py-1.5 pl-2.5 text-xs text-primary-foreground shadow-lg before:absolute before:left-1/2 before:top-[-4px] before:-translate-x-1/2 before:border-x-[6px] before:border-b-[6px] before:border-t-0 before:border-solid before:border-transparent before:border-b-primary before:content-[''] max-sm:hidden"
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

          {/* 로그인 버튼 (미인증 시) */}
          {!isAuthenticated && (
            <BlurFade delay={0.15}>
              <Link
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium no-underline transition-all duration-200',
                  isActive('/login')
                    ? 'bg-muted font-semibold text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
                to="/login"
              >
                <LogIn className="size-4" />
                <span className="max-sm:hidden">{t('로그인')}</span>
              </Link>
            </BlurFade>
          )}

          {/* 프로필 버튼 (인증 시) */}
          {isAuthenticated && (
            <div className="relative ml-1">
              <button
                id="profileButton"
                className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full border-none bg-primary p-0 text-sm font-bold text-primary-foreground transition-colors duration-200 hover:bg-primary/90 md:size-9 md:text-base"
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
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="absolute right-0 top-[calc(100%+8px)] z-[1001] min-w-[180px] rounded-xl border border-border bg-background p-3 shadow-lg"
                  >
                    <motion.span
                      className="mb-2.5 block font-semibold text-foreground"
                      custom={0}
                      variants={dropdownItemVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {displayName}
                    </motion.span>
                    <motion.button
                      className="flex w-full cursor-pointer items-center gap-1.5 rounded-lg border-none bg-transparent px-1 py-1.5 text-left text-primary transition-colors duration-200 hover:bg-muted hover:text-primary/80"
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

      {/* 사이드바 + 오버레이 */}
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
                {/* 언어 전환 토글 */}
                <motion.div
                  className="flex cursor-pointer items-center justify-between rounded-lg px-4 py-3.5 text-sm text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
                  custom={0}
                  variants={sidebarItemVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <span className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.15em]">
                    <Globe className="size-4" />
                    {t('언어')}
                  </span>
                  {/* 토글 필(pill) 스타일 언어 전환 */}
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

                <div className="mx-4 h-px bg-border/60" />

                <motion.button
                  className="flex w-full cursor-pointer items-center gap-3 rounded-lg border-none bg-transparent px-4 py-3.5 text-left text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
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
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Header;
