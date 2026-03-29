import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  MessageSquare,
  ClipboardList,
  LogIn,
  Menu,
  X,
  Globe,
  HelpCircle,
  LogOut,
  User,
  Sun,
  Moon,
  Monitor,
  Check,
  Palette,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useHeader } from './model/useHeader';
import { useClickOutside } from '#shared/lib/useClickOutside';
import { useThemePreset } from '#shared/themes';
import { logEvent } from '#shared/lib/analytics';
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

const THEME_OPTIONS = [
  { value: 'light', icon: Sun, label: '라이트' },
  { value: 'dark', icon: Moon, label: '다크' },
  { value: 'system', icon: Monitor, label: '시스템' },
] as const;

const Header = ({ isSidebarOpen, toggleSidebar, setIsSidebarOpen, setShowHelp }: HeaderProps) => {
  const {
    state: { t, isAuthenticated, user, currentLanguage },
    actions: { handleQuizManagement, handleHelp, handleLogout, handleLanguageChange, closeSidebar },
  } = useHeader({ setIsSidebarOpen, setShowHelp });
  const { theme, setTheme } = useTheme();
  const { presets, currentPresetId, applyPreset } = useThemePreset();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const profileInitial = useMemo(
    () => displayName?.trim().slice(0, 1).toUpperCase() || '?',
    [displayName],
  );

  useClickOutside({
    containerId: ['profileDropdown', 'mobileProfileDropdown'],
    triggerId: ['profileButton', 'mobileProfileButton'],
    onOutsideClick: () => setIsProfileOpen(false),
    isEnabled: isProfileOpen,
  });

  useClickOutside({
    containerId: ['themeDropdown', 'mobileThemeDropdown'],
    triggerId: ['themeButton', 'mobileThemeButton'],
    onOutsideClick: () => setIsThemeOpen(false),
    isEnabled: isThemeOpen,
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
    <>
      <div className="relative bg-background shadow-sm">
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

          {/* 모바일 프로필/로그인 버튼 */}
          <div className="flex items-center md:hidden">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  id="mobileProfileButton"
                  className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full border border-primary/30 bg-primary/10 p-0 text-sm font-bold text-primary transition-colors duration-200 hover:bg-primary/20"
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
                      id="mobileProfileDropdown"
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className="absolute right-0 top-[calc(100%+8px)] z-[1001] min-w-[240px] overflow-hidden rounded-xl border border-border bg-card shadow-lg"
                    >
                      {/* 프로필 정보 */}
                      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                          {profileInitial}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {displayName}
                          </p>
                          {user?.email && (
                            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                          )}
                        </div>
                      </div>
                      {/* 로그아웃 */}
                      <div className="p-1.5">
                        <button
                          className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg border-none bg-transparent px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          type="button"
                          onClick={() => {
                            setIsProfileOpen(false);
                            handleLogout();
                          }}
                        >
                          <LogOut className="size-4" />
                          {t('로그아웃')}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                className="inline-flex items-center whitespace-nowrap rounded px-2.5 py-1.5 text-sm text-primary no-underline transition-all duration-200 hover:bg-primary/5"
                to="/login"
              >
                <LogIn className="mr-1 size-4" />
                <strong>{t('로그인')}</strong>
              </Link>
            )}
          </div>

          {/* 네비게이션 링크 - 데스크톱에서만 표시 */}
          <div className="hidden items-center gap-1 md:flex md:gap-3">
            <Link
              to="/boards"
              className="inline-flex items-center whitespace-nowrap px-3 py-2 text-foreground no-underline transition-all duration-200 hover:bg-primary/5 hover:text-primary text-sm md:text-base"
            >
              <MessageSquare className="mr-1.5 size-4" />
              <strong>{t('문의하기')}</strong>
            </Link>

            {/* 구분선 */}
            <div className="h-5 w-px bg-border mx-1" />

            {/* 테마 버튼 */}
            <div className="relative">
              <button
                id="themeButton"
                type="button"
                className="inline-flex cursor-pointer items-center whitespace-nowrap border-none bg-transparent px-3 py-2 text-sm text-foreground transition-all duration-200 hover:bg-primary/5 hover:text-primary md:text-base"
                onClick={() => setIsThemeOpen((prev) => !prev)}
                aria-expanded={isThemeOpen}
                aria-haspopup="true"
                title={t('테마 설정')}
              >
                <Palette className="mr-1.5 size-4" />
                <strong>{t('테마 설정')}</strong>
              </button>
              <AnimatePresence>
                {isThemeOpen && (
                  <motion.div
                    id="themeDropdown"
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute right-0 top-[calc(100%+8px)] z-[1001] min-w-[220px] overflow-hidden rounded-xl border border-border bg-card shadow-lg"
                  >
                    {/* 모드 토글 */}
                    <div className="border-b border-border px-3 py-2">
                      <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                        {t('모드')}
                      </p>
                      <div className="flex gap-0.5 rounded-full bg-muted p-0.5">
                        {THEME_OPTIONS.map(({ value, icon: Icon, label }) => (
                          <button
                            key={value}
                            type="button"
                            className={cn(
                              'flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-full border-none px-2 py-1 text-xs font-medium transition-colors',
                              theme === value
                                ? 'bg-background text-foreground shadow-sm'
                                : 'bg-transparent text-muted-foreground hover:text-foreground',
                            )}
                            onClick={() => {
                              setTheme(value);
                              logEvent('theme_mode_change', { mode: value });
                            }}
                          >
                            <Icon className="size-3" />
                            {t(label)}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* 테마 프리셋 */}
                    <div className="px-3 py-2">
                      <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                        {t('테마')}
                      </p>
                      <div className="grid grid-cols-1 gap-1">
                        {presets.map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            className={cn(
                              'flex w-full cursor-pointer items-center gap-2 rounded-lg border-none px-2 py-1.5 text-left text-xs transition-colors',
                              currentPresetId === preset.id
                                ? 'bg-primary/10 text-primary font-medium'
                                : 'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground',
                            )}
                            onClick={() => {
                              applyPreset(preset);
                              logEvent('theme_preset_change', { preset: preset.id });
                            }}
                          >
                            <div className="flex shrink-0 gap-0.5">
                              <span
                                className="inline-block size-3 rounded-full border border-border/40"
                                style={{ background: preset.colors.primary }}
                              />
                              <span
                                className="inline-block size-3 rounded-full border border-border/40"
                                style={{ background: preset.colors.background }}
                              />
                              <span
                                className="inline-block size-3 rounded-full border border-border/40"
                                style={{ background: preset.colors.accent }}
                              />
                            </div>
                            <span className="flex-1 truncate">{preset.name}</span>
                            {currentPresetId === preset.id && <Check className="size-3 shrink-0" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 구분선 */}
            <div className="h-5 w-px bg-border mx-1" />

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
                  className="absolute left-1/2 top-[calc(100%+8px)] z-[2] inline-flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-1.5 pl-2.5 text-xs shadow-lg max-sm:hidden before:absolute before:left-1/2 before:top-[-6px] before:-translate-x-1/2 before:border-x-[8px] before:border-b-[8px] before:border-t-0 before:border-solid before:border-transparent before:border-b-primary before:content-['']"
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                    borderColor: 'var(--primary)',
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
                    <X className="size-3" />
                  </button>
                </span>
              )}
            </div>

            {/* 구분선 */}
            <div className="h-5 w-px bg-border mx-1" />

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
                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div
                        id="profileDropdown"
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute right-0 top-[calc(100%+8px)] z-[1001] min-w-[240px] overflow-hidden rounded-xl border border-border bg-card shadow-lg dark:bg-card"
                      >
                        {/* 프로필 정보 */}
                        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                            {profileInitial}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {displayName}
                            </p>
                            {user?.email && (
                              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                            )}
                          </div>
                        </div>
                        {/* 메뉴 */}
                        <div className="border-b border-border p-1.5">
                          <button
                            className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg border-none bg-transparent px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                            type="button"
                            onClick={() => {
                              setIsProfileOpen(false);
                              handleLogout();
                            }}
                          >
                            <LogOut className="size-4" />
                            {t('로그아웃')}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
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
                        className={cn(
                          'cursor-pointer rounded-full border-none px-2.5 py-1 text-xs font-bold transition-colors',
                          currentLanguage === 'ko'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'bg-transparent text-muted-foreground hover:bg-background/50 hover:text-foreground',
                        )}
                        onClick={() => handleLanguageChange('ko')}
                      >
                        KO
                      </button>
                      <button
                        className={cn(
                          'cursor-pointer rounded-full border-none px-2.5 py-1 text-xs font-bold transition-colors',
                          currentLanguage === 'en'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'bg-transparent text-muted-foreground hover:bg-background/50 hover:text-foreground',
                        )}
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

      {/* 모바일 고정 하단 네비게이션 */}
      <nav className="fixed inset-x-0 bottom-0 z-[998] flex border-t border-border bg-background md:hidden">
        <Link
          to="/boards"
          className="flex flex-1 flex-col items-center justify-center gap-0.5 border-r border-border py-2.5 text-muted-foreground no-underline transition-colors active:text-primary"
        >
          <MessageSquare className="size-5" />
          <span className="text-[10px] font-semibold">{t('문의하기')}</span>
        </Link>

        <div className="relative flex flex-1 border-r border-border">
          <Link
            to="/history"
            className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-muted-foreground no-underline transition-colors active:text-primary"
            onClick={handleQuizManagement}
          >
            <ClipboardList className="size-5" />
            <span className="text-[10px] font-semibold">{t('퀴즈 기록')}</span>
          </Link>
          {!isAuthenticated && showNavTooltip && (
            <span
              className="absolute bottom-full left-1/2 z-[2] mb-2.5 inline-flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1.5 text-[11px] shadow-lg before:absolute before:left-1/2 before:top-full before:-translate-x-1/2 before:border-x-[8px] before:border-t-[8px] before:border-b-0 before:border-solid before:border-transparent before:border-t-primary before:content-['']"
              style={{
                backgroundColor: 'var(--primary)',
                color: 'var(--primary-foreground)',
                borderColor: 'var(--primary)',
              }}
              role="status"
            >
              {t('로그인하고, 퀴즈기록을 저장해보세요')}
              <button
                type="button"
                className="cursor-pointer border-none bg-transparent p-0.5 px-1 text-[11px] leading-none text-inherit hover:opacity-80"
                aria-label={t('닫기')}
                onClick={handleNavTooltipClose}
              >
                <X className="size-3" />
              </button>
            </span>
          )}
        </div>

        {/* 모바일 테마 버튼 */}
        <div className="relative flex flex-1">
          <button
            id="mobileThemeButton"
            type="button"
            className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 border-r border-border border-none bg-transparent py-2.5 text-muted-foreground transition-colors active:text-primary"
            onClick={() => setIsThemeOpen((prev) => !prev)}
          >
            <Palette className="size-5" />
            <span className="text-[10px] font-semibold">{t('테마')}</span>
          </button>
          <AnimatePresence>
            {isThemeOpen && (
              <motion.div
                id="mobileThemeDropdown"
                initial={{ opacity: 0, scale: 0.95, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 4 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute bottom-full right-0 z-[1001] mb-2 min-w-[220px] overflow-hidden rounded-xl border border-border bg-card shadow-lg"
              >
                {/* 모드 토글 */}
                <div className="border-b border-border px-3 py-2">
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">{t('모드')}</p>
                  <div className="flex gap-0.5 rounded-full bg-muted p-0.5">
                    {THEME_OPTIONS.map(({ value, icon: Icon, label }) => (
                      <button
                        key={value}
                        type="button"
                        className={cn(
                          'flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-full border-none px-2 py-1 text-xs font-medium transition-colors',
                          theme === value
                            ? 'bg-background text-foreground shadow-sm'
                            : 'bg-transparent text-muted-foreground hover:text-foreground',
                        )}
                        onClick={() => {
                          setTheme(value);
                          logEvent('theme_mode_change', { mode: value });
                        }}
                      >
                        <Icon className="size-3" />
                        {t(label)}
                      </button>
                    ))}
                  </div>
                </div>
                {/* 테마 프리셋 */}
                <div className="px-3 py-2">
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">{t('테마')}</p>
                  <div className="grid grid-cols-1 gap-1">
                    {presets.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        className={cn(
                          'flex w-full cursor-pointer items-center gap-2 rounded-lg border-none px-2 py-1.5 text-left text-xs transition-colors',
                          currentPresetId === preset.id
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground',
                        )}
                        onClick={() => {
                          applyPreset(preset);
                          logEvent('theme_preset_change', { preset: preset.id });
                        }}
                      >
                        <div className="flex shrink-0 gap-0.5">
                          <span
                            className="inline-block size-3 rounded-full border border-border/40"
                            style={{ background: preset.colors.primary }}
                          />
                          <span
                            className="inline-block size-3 rounded-full border border-border/40"
                            style={{ background: preset.colors.background }}
                          />
                          <span
                            className="inline-block size-3 rounded-full border border-border/40"
                            style={{ background: preset.colors.accent }}
                          />
                        </div>
                        <span className="flex-1 truncate">{preset.name}</span>
                        {currentPresetId === preset.id && <Check className="size-3 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>
    </>
  );
};
export { extractRoleFromToken } from './model/useHeader';

export default Header;
