import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { LogIn, LogOut, X, Globe, HelpCircle } from 'lucide-react';
import { useHeader } from './model/useHeader';
import { useClickOutside } from '#shared/lib/useClickOutside';
import Logo from '#shared/ui/logo';
import { Badge } from '@/shared/ui/components/badge';
import { Card, CardContent } from '@/shared/ui/components/card';
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

// 깜빡이는 커서 애니메이션
const cursorBlink = {
  animate: {
    opacity: [1, 0, 1],
    transition: { duration: 1, repeat: Infinity, ease: 'steps(2)' },
  },
};

// 터미널 그린 색상 상수
const TERM_GREEN = 'oklch(0.8 0.15 145)';
const TERM_BG = 'oklch(0.1 0.01 160)';
const TERM_BG_DARK = 'oklch(0.08 0.01 160)';
const TERM_BORDER = 'oklch(0.25 0.05 145)';
const TERM_BORDER_DIM = 'oklch(0.3 0.05 145)';

const HeaderDesignB_ConceptMax = ({
  isSidebarOpen,
  toggleSidebar,
  setIsSidebarOpen,
  setShowHelp,
}: HeaderProps) => {
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

  // 일일 툴팁 로직: 미인증 사용자에게 하루에 한 번 표시
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
    <>
      {/* ── 터미널 헤더 바 ── */}
      <div
        className="relative font-mono"
        style={{
          backgroundColor: TERM_BG,
          borderBottom: `1px solid ${TERM_BORDER_DIM}`,
        }}
      >
        {/* 스캔라인 오버레이 */}
        <div
          className="pointer-events-none absolute inset-0 z-[1] opacity-[0.03]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
          }}
        />

        <div className="relative z-[2] mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3 md:px-6">
          {/* 좌측: 메뉴 버튼 + 프롬프트 로고 + 네비 명령어 */}
          <div className="flex items-center gap-4 md:gap-6">
            {/* 메뉴 토글 — 터미널 스타일 */}
            <button
              id="menuButton"
              className="cursor-pointer rounded border-none p-1.5 transition-colors duration-200"
              style={{
                backgroundColor: 'transparent',
                color: TERM_GREEN,
              }}
              onClick={toggleSidebar}
            >
              <span className="text-sm font-bold">☰</span>
            </button>

            {/* 로고: 프롬프트 + 로고 + 블링킹 커서 */}
            <Link to="/" className="flex items-center gap-1.5 no-underline">
              <span className="text-sm font-bold" style={{ color: TERM_GREEN }}>
                {'> '}
              </span>
              <Logo />
              <motion.span
                className="ml-0.5 inline-block text-sm font-bold"
                style={{ color: TERM_GREEN }}
                {...cursorBlink}
              >
                █
              </motion.span>
            </Link>

            {/* 네비게이션 — 명령어 형태 */}
            <BlurFade delay={0.05}>
              <Link
                to="/boards"
                className={cn(
                  'inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-sm no-underline transition-all duration-200',
                )}
                style={{
                  color: isActive('/boards') ? TERM_BG : TERM_GREEN,
                  backgroundColor: isActive('/boards') ? TERM_GREEN : 'transparent',
                  fontFamily: 'monospace',
                }}
              >
                <span>./boards</span>
                {isActive('/boards') && (
                  <Badge
                    className="ml-1 rounded px-1.5 py-0 text-[10px] font-bold"
                    style={{
                      backgroundColor: TERM_BG,
                      color: TERM_GREEN,
                      border: 'none',
                    }}
                  >
                    ACTIVE
                  </Badge>
                )}
              </Link>
            </BlurFade>
          </div>

          {/* 우측: 퀴즈 기록 + 로그인/프로필 */}
          <div className="flex items-center gap-2">
            <BlurFade delay={0.1}>
              <div className="relative inline-flex items-center">
                <Link
                  to="/history"
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-sm no-underline transition-all duration-200',
                  )}
                  style={{
                    color: isActive('/history') ? TERM_BG : TERM_GREEN,
                    backgroundColor: isActive('/history') ? TERM_GREEN : 'transparent',
                    fontFamily: 'monospace',
                  }}
                  onClick={handleQuizManagement}
                >
                  <span>./history</span>
                  {isActive('/history') && (
                    <Badge
                      className="ml-1 rounded px-1.5 py-0 text-[10px] font-bold"
                      style={{
                        backgroundColor: TERM_BG,
                        color: TERM_GREEN,
                        border: 'none',
                      }}
                    >
                      ACTIVE
                    </Badge>
                  )}
                </Link>

                {/* 툴팁: 터미널 스타일 — [INFO] 프리픽스 */}
                {!isAuthenticated && showNavTooltip && (
                  <span
                    className="absolute left-1/2 top-[calc(100%+6px)] z-[2] inline-flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded px-2.5 py-1.5 text-xs font-bold shadow-lg max-sm:hidden"
                    style={{
                      backgroundColor: TERM_GREEN,
                      color: TERM_BG,
                      fontFamily: 'monospace',
                    }}
                    role="status"
                  >
                    <span>[INFO]</span>
                    {t('로그인하고, 퀴즈기록을 저장해보세요')}
                    <button
                      type="button"
                      className="cursor-pointer border-none bg-transparent p-0.5 px-1 text-xs font-bold leading-none hover:opacity-80"
                      style={{ color: TERM_BG }}
                      aria-label={t('닫기')}
                      onClick={handleNavTooltipClose}
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                )}
              </div>
            </BlurFade>

            {/* 로그인 버튼 (미인증 시) — 터미널 명령어 */}
            {!isAuthenticated && (
              <BlurFade delay={0.15}>
                <Link
                  to="/login"
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-sm no-underline transition-all duration-200',
                  )}
                  style={{
                    color: isActive('/login') ? TERM_BG : TERM_GREEN,
                    backgroundColor: isActive('/login') ? TERM_GREEN : 'transparent',
                    fontFamily: 'monospace',
                  }}
                >
                  <LogIn className="size-4" />
                  <span>./login</span>
                </Link>
              </BlurFade>
            )}

            {/* 프로필 버튼 (인증 시) — 터미널 프롬프트 스타일 */}
            {isAuthenticated && (
              <div className="relative ml-1">
                <button
                  id="profileButton"
                  className="inline-flex size-8 cursor-pointer items-center justify-center rounded border p-0 text-sm font-bold transition-all duration-200 hover:brightness-110 md:size-9 md:text-base"
                  style={{
                    backgroundColor: 'transparent',
                    borderColor: TERM_GREEN,
                    color: TERM_GREEN,
                    fontFamily: 'monospace',
                  }}
                  onClick={() => setIsProfileOpen((prev) => !prev)}
                  aria-expanded={isProfileOpen}
                  aria-haspopup="true"
                  title={displayName}
                  type="button"
                >
                  {profileInitial}
                </button>

                {/* 프로필 드롭다운 — 터미널 윈도우 */}
                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      id="profileDropdown"
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                      className="absolute right-0 top-[calc(100%+8px)] z-[1001] min-w-[220px] overflow-hidden rounded border p-0 shadow-lg"
                      style={{
                        backgroundColor: TERM_BG_DARK,
                        borderColor: TERM_BORDER,
                        fontFamily: 'monospace',
                      }}
                    >
                      {/* 터미널 타이틀 바 */}
                      <div
                        className="border-b px-3 py-2 text-xs font-bold"
                        style={{
                          borderColor: TERM_BORDER,
                          color: TERM_GREEN,
                          backgroundColor: TERM_BG,
                        }}
                      >
                        user@q-asker:~$
                      </div>

                      <div className="p-3">
                        <motion.span
                          className="mb-3 block text-sm font-bold"
                          style={{ color: TERM_GREEN }}
                          custom={0}
                          variants={dropdownItemVariants}
                          initial="hidden"
                          animate="visible"
                        >
                          {displayName}
                        </motion.span>
                        <motion.button
                          className="flex w-full cursor-pointer items-center gap-2 rounded border-none px-2 py-2 text-left text-sm transition-colors duration-200"
                          style={{
                            backgroundColor: 'transparent',
                            color: TERM_GREEN,
                            fontFamily: 'monospace',
                          }}
                          type="button"
                          custom={1}
                          variants={dropdownItemVariants}
                          initial="hidden"
                          animate="visible"
                          onClick={() => {
                            setIsProfileOpen(false);
                            handleLogout();
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = `color-mix(in oklch, ${TERM_GREEN} 15%, transparent)`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <LogOut className="size-4" />
                          <span>$ logout</span>
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 사이드바 + 오버레이 — 터미널 패널 ── */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* 오버레이 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[999]"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
              onClick={closeSidebar}
            />

            {/* 사이드바 패널 */}
            <motion.aside
              id="sidebar"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed left-0 top-0 z-[1000] flex h-full w-[300px] flex-col font-mono"
              style={{ backgroundColor: TERM_BG_DARK }}
            >
              {/* 사이드바 헤더 — 터미널 프롬프트 */}
              <div
                className="flex items-center justify-between border-b px-5 py-4"
                style={{ borderColor: TERM_BORDER }}
              >
                <motion.h2
                  className="text-xs font-bold"
                  style={{ color: TERM_GREEN, fontFamily: 'monospace' }}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05, type: 'spring', stiffness: 300, damping: 25 }}
                >
                  $ q-asker --menu
                </motion.h2>
                <button
                  className="cursor-pointer rounded border-none bg-transparent p-1.5 text-sm font-bold transition-colors duration-200"
                  style={{ color: TERM_GREEN, fontFamily: 'monospace' }}
                  onClick={closeSidebar}
                >
                  <span className="flex items-center gap-1">
                    $ exit <X className="size-4" />
                  </span>
                </button>
              </div>

              {/* 메뉴 항목 — Card 컴포넌트 사용 */}
              <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
                {/* 언어 선택 카드 */}
                <Card
                  className="border bg-transparent shadow-none"
                  style={{ borderColor: TERM_BORDER }}
                >
                  <CardContent className="p-4">
                    <motion.div
                      className="flex flex-col gap-3"
                      custom={0}
                      variants={sidebarItemVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      <span
                        className="flex items-center gap-2 text-xs font-bold"
                        style={{ color: TERM_GREEN }}
                      >
                        <Globe className="size-4" />
                        {t('언어')}
                      </span>
                      <div className="flex gap-2">
                        <button
                          className="cursor-pointer rounded border px-3 py-1.5 text-xs font-bold transition-all duration-200 hover:brightness-125"
                          style={{
                            backgroundColor: 'transparent',
                            borderColor: TERM_BORDER,
                            color: TERM_GREEN,
                            fontFamily: 'monospace',
                          }}
                          onClick={() => handleLanguageChange('ko')}
                        >
                          $ export LANG=ko
                        </button>
                        <button
                          className="cursor-pointer rounded border px-3 py-1.5 text-xs font-bold transition-all duration-200 hover:brightness-125"
                          style={{
                            backgroundColor: 'transparent',
                            borderColor: TERM_BORDER,
                            color: TERM_GREEN,
                            fontFamily: 'monospace',
                          }}
                          onClick={() => handleLanguageChange('en')}
                        >
                          $ export LANG=en
                        </button>
                      </div>
                    </motion.div>
                  </CardContent>
                </Card>

                {/* 도움말 카드 */}
                <Card
                  className="border bg-transparent shadow-none"
                  style={{ borderColor: TERM_BORDER }}
                >
                  <CardContent className="p-0">
                    <motion.button
                      className="flex w-full cursor-pointer items-center gap-2 rounded border-none bg-transparent px-4 py-3 text-left text-xs font-bold transition-all duration-200 hover:brightness-125"
                      style={{
                        color: TERM_GREEN,
                        fontFamily: 'monospace',
                      }}
                      type="button"
                      custom={1}
                      variants={sidebarItemVariants}
                      initial="hidden"
                      animate="visible"
                      onClick={handleHelp}
                    >
                      <HelpCircle className="size-4" />
                      <span>$ man help</span>
                    </motion.button>
                  </CardContent>
                </Card>
              </div>

              {/* 사이드바 하단 — 터미널 상태 표시줄 */}
              <div
                className="border-t px-5 py-3 text-[10px]"
                style={{
                  borderColor: TERM_BORDER,
                  color: `color-mix(in oklch, ${TERM_GREEN} 50%, transparent)`,
                  fontFamily: 'monospace',
                }}
              >
                q-asker v1.0 — ready
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default HeaderDesignB_ConceptMax;
