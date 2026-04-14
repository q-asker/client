import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  MessageSquare,
  ClipboardList,
  X,
  Sun,
  Moon,
  Monitor,
  Check,
  Palette,
  Globe,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useHeader } from './model/useHeader';
import { useClickOutside } from '#shared/lib/useClickOutside';
import { useThemePreset } from '#shared/themes';
import { logEvent } from '#shared/lib/analytics';
import Logo from '#shared/ui/logo';
import { cn } from '@/shared/ui/lib/utils';
import AuthButton from './ui/AuthButton';

interface HeaderProps {
  isSidebarOpen?: boolean;
  toggleSidebar?: () => void;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setShowHelp?: React.Dispatch<React.SetStateAction<boolean>>;
}

const THEME_OPTIONS = [
  { value: 'light', icon: Sun, label: '라이트' },
  { value: 'dark', icon: Moon, label: '다크' },
  { value: 'system', icon: Monitor, label: '시스템' },
] as const;

const navItemClass =
  'inline-flex items-center whitespace-nowrap px-3 py-2 text-foreground no-underline transition-all duration-200 hover:bg-primary/5 hover:text-primary text-sm md:text-base cursor-pointer border-none bg-transparent';

const Header = ({ setIsSidebarOpen, setShowHelp }: HeaderProps) => {
  const {
    state: { t, isAuthenticated, hasHydrated, currentLanguage },
    actions: { handleQuizManagement, handleLanguageChange },
  } = useHeader({ setIsSidebarOpen, setShowHelp });
  const { theme, setTheme } = useTheme();
  const { presets, currentPresetId, applyPreset } = useThemePreset();
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [showNavTooltip, setShowNavTooltip] = useState(false);

  useClickOutside({
    containerId: ['themeDropdown', 'mobileThemeDropdown'],
    triggerId: ['themeButton', 'mobileThemeButton'],
    onOutsideClick: () => setIsThemeOpen(false),
    isEnabled: isThemeOpen,
  });

  useClickOutside({
    containerId: ['langDropdown', 'mobileLangDropdown'],
    triggerId: ['langButton', 'mobileLangButton'],
    onOutsideClick: () => setIsLangOpen(false),
    isEnabled: isLangOpen,
  });

  useEffect(() => {
    if (!hasHydrated) return;
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
  }, [isAuthenticated, hasHydrated]);

  const handleNavTooltipClose = () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      localStorage.setItem('headerNavTooltipDismissedDate', today);
    } catch {
      // 스토리지 에러 무시
    }
    setShowNavTooltip(false);
  };

  const ThemeDropdownContent = ({ id }: { id: string }) => (
    <motion.div
      id={id}
      initial={{ opacity: 0, scale: 0.96, y: -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -6 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className="absolute right-0 top-[calc(100%+10px)] z-[1001] min-w-[228px] overflow-hidden rounded-lg border border-border/70 bg-card/95 shadow-lg backdrop-blur-xl"
    >
      {/* 모드 토글 */}
      <div className="border-b border-border/50 px-3 py-2.5">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
          {t('모드')}
        </p>
        <div className="flex gap-0.5 rounded-md bg-muted/70 p-0.5">
          {THEME_OPTIONS.map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              type="button"
              className={cn(
                'flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded border-none px-2 py-1.5 text-xs font-medium transition-all duration-200',
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
      <div className="px-3 py-2.5">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
          {t('테마')}
        </p>
        <div className="grid grid-cols-1 gap-0.5">
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={cn(
                'flex w-full cursor-pointer items-center gap-2.5 rounded-md border-none px-2.5 py-2 text-left text-xs font-medium transition-all duration-150',
                currentPresetId === preset.id
                  ? 'bg-primary/10 text-primary'
                  : 'bg-transparent text-muted-foreground hover:bg-muted/80 hover:text-foreground',
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
              {currentPresetId === preset.id && (
                <Check className="size-3.5 shrink-0 text-primary" />
              )}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );

  const LangDropdownContent = ({ id, dropUp = false }: { id: string; dropUp?: boolean }) => (
    <motion.div
      id={id}
      initial={{ opacity: 0, scale: 0.96, y: dropUp ? 6 : -6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: dropUp ? 6 : -6 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'absolute right-0 z-[1001] min-w-[140px] overflow-hidden rounded-lg border border-border/70 bg-card/95 shadow-lg backdrop-blur-xl',
        dropUp ? 'bottom-full mb-2' : 'top-[calc(100%+10px)]',
      )}
    >
      <div className="p-1.5">
        {(['ko', 'en'] as const).map((lang) => (
          <button
            key={lang}
            type="button"
            className={cn(
              'flex w-full cursor-pointer items-center gap-2.5 rounded-md border-none px-3 py-2 text-left text-sm font-medium transition-all duration-150',
              currentLanguage === lang
                ? 'bg-primary/10 text-primary'
                : 'bg-transparent text-muted-foreground hover:bg-muted/80 hover:text-foreground',
            )}
            onClick={() => {
              handleLanguageChange(lang);
              setIsLangOpen(false);
            }}
          >
            <span className="flex-1">{lang === 'ko' ? '한국어' : 'English'}</span>
            <span className="text-xs opacity-50">{lang.toUpperCase()}</span>
            {currentLanguage === lang && <Check className="size-3.5 shrink-0" />}
          </button>
        ))}
      </div>
    </motion.div>
  );

  return (
    <>
      <div className="relative bg-background shadow-sm">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3 md:px-6">
          {/* 로고 */}
          <div className="flex items-center">
            <Link to="/" className="text-inherit no-underline">
              <Logo />
            </Link>
          </div>

          {/* 모바일: 언어 + 프로필/로그인 */}
          <div className="flex items-center gap-2 md:hidden">
            {/* 모바일 언어 선택 */}
            <div className="relative">
              <button
                id="mobileLangButton"
                type="button"
                className="inline-flex cursor-pointer items-center gap-1 rounded-lg border-none bg-transparent px-2 py-1.5 text-muted-foreground transition-colors hover:bg-primary/8 hover:text-foreground"
                onClick={() => setIsLangOpen((prev) => !prev)}
                aria-expanded={isLangOpen}
                aria-haspopup="true"
              >
                <Globe className="size-4" />
                <span className="text-xs font-bold">{currentLanguage.toUpperCase()}</span>
              </button>
              <AnimatePresence>
                {isLangOpen && <LangDropdownContent id="mobileLangDropdown" />}
              </AnimatePresence>
            </div>

            <AuthButton variant="header-mobile" idPrefix="mobile" />
          </div>

          {/* 데스크톱 네비게이션 */}
          <div className="hidden items-center gap-1 md:flex md:gap-3">
            {/* 테마 버튼 */}
            <div className="relative">
              <button
                id="themeButton"
                type="button"
                className={navItemClass}
                onClick={() => setIsThemeOpen((prev) => !prev)}
                aria-expanded={isThemeOpen}
                aria-haspopup="true"
              >
                <Palette className="mr-1.5 size-4" />
                <strong>{t('테마 설정')}</strong>
              </button>
              <AnimatePresence>
                {isThemeOpen && <ThemeDropdownContent id="themeDropdown" />}
              </AnimatePresence>
            </div>

            {/* 구분선 */}
            <div className="mx-1 h-5 w-px bg-border" />

            <Link to="/boards" className={navItemClass}>
              <MessageSquare className="mr-1.5 size-4" />
              <strong>{t('문의하기')}</strong>
            </Link>

            {/* 구분선 */}
            <div className="mx-1 h-5 w-px bg-border" />

            {/* 퀴즈 기록 + 툴팁 */}
            <div className="relative inline-flex items-center">
              <Link to="/history" className={navItemClass} onClick={handleQuizManagement}>
                <ClipboardList className="mr-1.5 size-4" />
                <strong>{t('퀴즈 기록')}</strong>
              </Link>
              {!isAuthenticated && showNavTooltip && (
                <span
                  className="absolute left-1/2 top-[calc(100%+8px)] z-[2] inline-flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1.5 text-xs shadow-lg max-sm:hidden before:absolute before:left-1/2 before:top-[-6px] before:-translate-x-1/2 before:border-x-[8px] before:border-b-[8px] before:border-t-0 before:border-solid before:border-transparent before:border-b-primary before:content-['']"
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    color: 'var(--color-primary-foreground)',
                    borderColor: 'var(--color-primary)',
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
            <div className="mx-1 h-5 w-px bg-border" />

            {/* 인증 영역 */}
            <AuthButton variant="header" idPrefix="desktop" />

            {/* 구분선 */}
            <div className="mx-1 h-5 w-px bg-border" />

            {/* 언어 선택 */}
            <div className="relative">
              <button
                id="langButton"
                type="button"
                className={cn(navItemClass, 'gap-1')}
                onClick={() => setIsLangOpen((prev) => !prev)}
                aria-expanded={isLangOpen}
                aria-haspopup="true"
              >
                <Globe className="size-4" />
                <span className="text-xs">{currentLanguage.toUpperCase()}</span>
              </button>
              <AnimatePresence>
                {isLangOpen && <LangDropdownContent id="langDropdown" />}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* 모바일 고정 하단 네비게이션 */}
      <nav className="fixed inset-x-0 bottom-0 z-[998] flex border-t border-border/60 bg-background/90 backdrop-blur-xl md:hidden">
        <Link
          to="/boards"
          className="flex flex-1 flex-col items-center justify-center gap-0.5 border-r border-border/60 py-2.5 text-muted-foreground no-underline transition-colors active:text-primary"
        >
          <MessageSquare className="size-5" />
          <span className="text-[10px] font-semibold">{t('문의하기')}</span>
        </Link>

        <div className="relative flex flex-1 border-r border-border/60">
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
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-primary-foreground)',
                borderColor: 'var(--color-primary)',
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
            className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 border-none bg-transparent py-2.5 text-muted-foreground transition-colors active:text-primary"
            onClick={() => setIsThemeOpen((prev) => !prev)}
          >
            <Palette className="size-5" />
            <span className="text-[10px] font-semibold">{t('테마')}</span>
          </button>
          <AnimatePresence>
            {isThemeOpen && (
              <motion.div
                id="mobileThemeDropdown"
                initial={{ opacity: 0, scale: 0.96, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 6 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="absolute bottom-full right-0 z-[1001] mb-2 min-w-[228px] overflow-hidden rounded-lg border border-border/70 bg-card/95 shadow-lg backdrop-blur-xl"
              >
                {/* 모드 토글 */}
                <div className="border-b border-border/50 px-3 py-2.5">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                    {t('모드')}
                  </p>
                  <div className="flex gap-0.5 rounded-md bg-muted/70 p-0.5">
                    {THEME_OPTIONS.map(({ value, icon: Icon, label }) => (
                      <button
                        key={value}
                        type="button"
                        className={cn(
                          'flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded border-none px-2 py-1.5 text-xs font-medium transition-all duration-200',
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
                <div className="px-3 py-2.5">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                    {t('테마')}
                  </p>
                  <div className="grid grid-cols-1 gap-0.5">
                    {presets.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        className={cn(
                          'flex w-full cursor-pointer items-center gap-2.5 rounded-md border-none px-2.5 py-2 text-left text-xs font-medium transition-all duration-150',
                          currentPresetId === preset.id
                            ? 'bg-primary/10 text-primary'
                            : 'bg-transparent text-muted-foreground hover:bg-muted/80 hover:text-foreground',
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
                        {currentPresetId === preset.id && (
                          <Check className="size-3.5 shrink-0 text-primary" />
                        )}
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
export { default as AuthButton } from './ui/AuthButton';

export default Header;
