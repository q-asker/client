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
  Sparkles,
  Zap,
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

/* ── 네온 글로우 펄스 애니메이션 (인라인 keyframes) ── */
const glowPulse = {
  animate: {
    boxShadow: [
      '0 0 8px oklch(0.7 0.25 330 / 0.4), 0 0 20px oklch(0.7 0.25 330 / 0.15)',
      '0 0 12px oklch(0.7 0.25 330 / 0.6), 0 0 30px oklch(0.7 0.25 330 / 0.25)',
      '0 0 8px oklch(0.7 0.25 330 / 0.4), 0 0 20px oklch(0.7 0.25 330 / 0.15)',
    ],
  },
  transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
};

const HeaderAnime = ({
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
    <>
      {/* ══════════════════════════════════════════════════════════
          ★ ANIME HEADER — 네온 + 사선 컷 + 스피드라인 + 임팩트 타이포
          ══════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden bg-[oklch(0.13_0.02_280)]">
        {/* ── 스피드 라인 배경 (대각선) ── */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(135deg, transparent, transparent 8px, oklch(0.7 0.25 330) 8px, oklch(0.7 0.25 330) 9px)',
          }}
        />
        {/* ── 하단 네온 엣지 (핑크→시안 그라디언트) ── */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[2px]"
          style={{
            background:
              'linear-gradient(90deg, oklch(0.7 0.25 330), oklch(0.75 0.15 200), oklch(0.7 0.25 330))',
          }}
        />
        {/* ── 사선 컷 데코 (좌하단) ── */}
        <div
          className="absolute -bottom-2 -left-4 h-12 w-24 rotate-[-20deg]"
          style={{
            background: 'linear-gradient(90deg, oklch(0.7 0.25 330 / 0.5), transparent)',
          }}
        />

        {/* ── 메인 헤더 바 ── */}
        <div className="relative mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-2.5 md:px-6">
          {/* 좌측: 메뉴 + 로고 */}
          <div className="flex items-center gap-3">
            <motion.button
              id="menuButton"
              className="relative cursor-pointer border-none bg-transparent p-1.5"
              onClick={toggleSidebar}
              whileHover={{ scale: 1.15, rotate: -8 }}
              whileTap={{ scale: 0.9 }}
            >
              <Menu className="size-5 text-[oklch(0.9_0.05_330)]" />
              {/* 메뉴 아이콘 네온 도트 */}
              <span className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-[oklch(0.7_0.25_330)]" />
            </motion.button>

            <Link to="/" className="group flex items-center gap-2 text-inherit no-underline">
              <Logo />
              {/* 로고 옆 임팩트 마크 */}
              <motion.span
                className="hidden text-[10px] font-black uppercase tracking-[0.2em] sm:inline-block"
                style={{
                  background: 'linear-gradient(135deg, oklch(0.7 0.25 330), oklch(0.75 0.15 200))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              >
                ★ QUIZ
              </motion.span>
            </Link>
          </div>

          {/* 우측: 네비게이션 */}
          <div className="flex items-center gap-2">
            <nav className="flex items-center gap-1">
              {/* ── 문의하기 ── */}
              <motion.div whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 400 }}>
                <Link
                  to="/boards"
                  className={cn(
                    'group relative inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider no-underline transition-all',
                    isActive('/boards')
                      ? 'text-[oklch(0.9_0.05_330)]'
                      : 'text-[oklch(0.65_0.03_280)] hover:text-[oklch(0.85_0.05_330)]',
                  )}
                >
                  <MessageSquare className="size-3.5 sm:hidden" />
                  <span className="max-sm:hidden">{t('문의하기')}</span>
                  {/* 활성 네온 언더바 */}
                  {isActive('/boards') && (
                    <motion.span
                      className="absolute -bottom-0.5 left-1 right-1 h-[2px] rounded-full"
                      style={{
                        background:
                          'linear-gradient(90deg, oklch(0.7 0.25 330), oklch(0.75 0.15 200))',
                      }}
                      layoutId="anime-nav-indicator"
                    />
                  )}
                </Link>
              </motion.div>

              {/* ── 퀴즈 기록 ── */}
              <motion.div
                className="relative"
                whileHover={{ y: -2 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                <Link
                  to="/history"
                  className={cn(
                    'group relative inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider no-underline transition-all',
                    isActive('/history')
                      ? 'text-[oklch(0.9_0.05_330)]'
                      : 'text-[oklch(0.65_0.03_280)] hover:text-[oklch(0.85_0.05_330)]',
                  )}
                  onClick={handleQuizManagement}
                >
                  <ClipboardList className="size-3.5 sm:hidden" />
                  <span className="max-sm:hidden">{t('퀴즈 기록')}</span>
                  {isActive('/history') && (
                    <motion.span
                      className="absolute -bottom-0.5 left-1 right-1 h-[2px] rounded-full"
                      style={{
                        background:
                          'linear-gradient(90deg, oklch(0.7 0.25 330), oklch(0.75 0.15 200))',
                      }}
                      layoutId="anime-nav-indicator"
                    />
                  )}
                </Link>
                {/* 애니메 스타일 툴팁 — 말풍선 */}
                {!isAuthenticated && showNavTooltip && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="absolute left-1/2 top-[calc(100%+8px)] z-[2] inline-flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-lg border-2 border-[oklch(0.7_0.25_330)] px-3 py-1.5 text-[10px] font-bold tracking-wide max-sm:hidden"
                    style={{
                      background: 'oklch(0.15 0.03 300)',
                      color: 'oklch(0.9 0.05 330)',
                      boxShadow: '0 0 12px oklch(0.7 0.25 330 / 0.3)',
                    }}
                    role="status"
                  >
                    <Sparkles className="size-3 text-[oklch(0.8_0.2_80)]" />
                    {t('로그인하고, 퀴즈기록을 저장해보세요')}
                    <button
                      type="button"
                      className="ml-1 cursor-pointer border-none bg-transparent p-0 text-[10px] leading-none text-[oklch(0.7_0.25_330)] hover:text-[oklch(0.9_0.2_330)]"
                      aria-label={t('닫기')}
                      onClick={handleNavTooltipClose}
                    >
                      ✕
                    </button>
                    {/* 말풍선 삼각형 */}
                    <span
                      className="absolute -top-[7px] left-1/2 -translate-x-1/2"
                      style={{
                        width: 0,
                        height: 0,
                        borderLeft: '6px solid transparent',
                        borderRight: '6px solid transparent',
                        borderBottom: '7px solid oklch(0.7 0.25 330)',
                      }}
                    />
                  </motion.span>
                )}
              </motion.div>

              {/* ── 로그인 ── */}
              {!isAuthenticated && (
                <motion.div whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 400 }}>
                  <Link
                    to="/login"
                    className="group relative inline-flex items-center gap-1.5 overflow-hidden rounded-md px-3 py-1.5 text-xs font-black uppercase tracking-wider no-underline"
                    style={{
                      border: '1.5px solid oklch(0.7 0.25 330)',
                      color: 'oklch(0.9 0.05 330)',
                      background: 'oklch(0.7 0.25 330 / 0.1)',
                    }}
                  >
                    <LogIn className="size-3.5 sm:hidden" />
                    <span className="max-sm:hidden">{t('로그인')}</span>
                    {/* 호버 시 스캔라인 효과 */}
                    <span
                      className="absolute inset-0 translate-x-[-100%] transition-transform duration-300 group-hover:translate-x-[100%]"
                      style={{
                        background:
                          'linear-gradient(90deg, transparent, oklch(0.7 0.25 330 / 0.2), transparent)',
                      }}
                    />
                  </Link>
                </motion.div>
              )}
            </nav>

            {/* ── 프로필 (인증) — 네온 보더 원형 ── */}
            {isAuthenticated && (
              <div className="relative ml-1">
                <motion.button
                  id="profileButton"
                  className="relative inline-flex size-8 cursor-pointer items-center justify-center rounded-full border-2 bg-transparent p-0 text-sm font-black md:size-9"
                  style={{
                    borderColor: 'oklch(0.7 0.25 330)',
                    color: 'oklch(0.9 0.05 330)',
                    boxShadow: '0 0 10px oklch(0.7 0.25 330 / 0.3)',
                  }}
                  onClick={() => setIsProfileOpen((prev) => !prev)}
                  aria-expanded={isProfileOpen}
                  aria-haspopup="true"
                  title={displayName}
                  type="button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  {...glowPulse}
                >
                  {profileInitial}
                </motion.button>

                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      id="profileDropdown"
                      initial={{ opacity: 0, scale: 0.9, y: -8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -8 }}
                      transition={{ type: 'spring', damping: 20, stiffness: 350 }}
                      className="absolute right-0 top-[calc(100%+10px)] z-[1001] min-w-[180px] overflow-hidden rounded-lg border-2 p-3"
                      style={{
                        borderColor: 'oklch(0.7 0.25 330 / 0.5)',
                        background: 'oklch(0.13 0.03 280 / 0.95)',
                        backdropFilter: 'blur(12px)',
                        boxShadow:
                          '0 0 20px oklch(0.7 0.25 330 / 0.2), 0 8px 32px oklch(0 0 0 / 0.5)',
                      }}
                    >
                      {/* 드롭다운 내부 스피드라인 */}
                      <div
                        className="pointer-events-none absolute inset-0 opacity-[0.04]"
                        style={{
                          backgroundImage:
                            'repeating-linear-gradient(135deg, transparent, transparent 4px, oklch(0.7 0.25 330) 4px, oklch(0.7 0.25 330) 5px)',
                        }}
                      />
                      <span
                        className="relative mb-2 block text-sm font-black tracking-wide"
                        style={{ color: 'oklch(0.9 0.05 330)' }}
                      >
                        <Zap
                          className="mr-1 inline-block size-3"
                          style={{ color: 'oklch(0.8 0.2 80)' }}
                        />
                        {displayName}
                      </span>
                      <div
                        className="mb-2 h-[1.5px]"
                        style={{
                          background: 'linear-gradient(90deg, oklch(0.7 0.25 330), transparent)',
                        }}
                      />
                      <button
                        className="relative flex w-full cursor-pointer items-center gap-2 rounded border-none bg-transparent px-1 py-1.5 text-left text-xs font-bold tracking-wide transition-all hover:translate-x-1"
                        type="button"
                        style={{ color: 'oklch(0.65 0.03 280)' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'oklch(0.9 0.15 330)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'oklch(0.65 0.03 280)';
                        }}
                        onClick={() => {
                          setIsProfileOpen(false);
                          handleLogout();
                        }}
                      >
                        <LogOut className="size-3.5" />
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

      {/* ══════════════════════════════════════════════════════════
          ★ 사이드바 — 풀스크린 애니메 오버레이
          ══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* 배경 오버레이 — 어둡고 블러 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-[999]"
              style={{ background: 'oklch(0.08 0.02 280 / 0.85)', backdropFilter: 'blur(4px)' }}
              onClick={closeSidebar}
            />

            {/* 사이드바 패널 */}
            <motion.aside
              id="sidebar"
              initial={{ x: '-100%', skewX: -3 }}
              animate={{ x: 0, skewX: 0 }}
              exit={{ x: '-100%', skewX: -3 }}
              transition={{ type: 'spring', damping: 22, stiffness: 260 }}
              className="fixed left-0 top-0 z-[1000] flex h-full w-[280px] flex-col overflow-hidden"
              style={{
                background: 'oklch(0.11 0.03 280)',
                borderRight: '2px solid oklch(0.7 0.25 330 / 0.4)',
                boxShadow: '4px 0 30px oklch(0.7 0.25 330 / 0.15)',
              }}
            >
              {/* 사이드바 내부 스피드라인 */}
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(135deg, transparent, transparent 12px, oklch(0.7 0.25 330) 12px, oklch(0.7 0.25 330) 13px)',
                }}
              />

              {/* ── 사이드바 헤더 — 임팩트 타이틀 ── */}
              <div className="relative flex items-center justify-between px-5 py-5">
                <motion.h2
                  className="text-lg font-black uppercase tracking-[0.15em]"
                  style={{
                    background:
                      'linear-gradient(135deg, oklch(0.7 0.25 330), oklch(0.75 0.15 200))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                  initial={{ opacity: 0, x: -20, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
                >
                  ★ {t('메뉴')}
                </motion.h2>
                <motion.button
                  className="cursor-pointer rounded-md border-2 bg-transparent p-1.5"
                  style={{
                    borderColor: 'oklch(0.7 0.25 330 / 0.4)',
                    color: 'oklch(0.7 0.25 330)',
                  }}
                  onClick={closeSidebar}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="size-4" />
                </motion.button>
              </div>

              {/* 네온 디바이더 */}
              <div
                className="mx-5 h-[1.5px]"
                style={{
                  background:
                    'linear-gradient(90deg, oklch(0.7 0.25 330), oklch(0.75 0.15 200), transparent)',
                }}
              />

              {/* ── 메뉴 항목 ── */}
              <nav className="relative flex flex-col gap-3 px-4 py-5">
                {/* 언어 선택 — 전투 선택 UI 스타일 */}
                <motion.div
                  className="group overflow-hidden rounded-lg border-2 p-3"
                  style={{
                    borderColor: 'oklch(0.7 0.25 330 / 0.2)',
                    background: 'oklch(0.14 0.03 280)',
                  }}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15, type: 'spring', stiffness: 280 }}
                  whileHover={{
                    borderColor: 'oklch(0.7 0.25 330 / 0.5)',
                    boxShadow: '0 0 15px oklch(0.7 0.25 330 / 0.15)',
                  }}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <Globe className="size-4" style={{ color: 'oklch(0.75 0.15 200)' }} />
                    <span
                      className="text-[10px] font-black uppercase tracking-[0.2em]"
                      style={{ color: 'oklch(0.65 0.03 280)' }}
                    >
                      {t('언어')}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {['ko', 'en'].map((lang) => (
                      <motion.button
                        key={lang}
                        className="flex-1 cursor-pointer rounded-md border-2 py-2 text-center text-xs font-black uppercase tracking-widest"
                        style={{
                          borderColor: 'oklch(0.7 0.25 330 / 0.3)',
                          background: 'oklch(0.7 0.25 330 / 0.05)',
                          color: 'oklch(0.8 0.05 330)',
                        }}
                        whileHover={{
                          background: 'oklch(0.7 0.25 330 / 0.2)',
                          borderColor: 'oklch(0.7 0.25 330 / 0.7)',
                          boxShadow: '0 0 10px oklch(0.7 0.25 330 / 0.3)',
                        }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleLanguageChange(lang)}
                      >
                        {lang.toUpperCase()}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>

                {/* 도움말 — 미션 버튼 스타일 */}
                <motion.button
                  className="group flex w-full cursor-pointer items-center gap-3 overflow-hidden rounded-lg border-2 p-3 text-left"
                  style={{
                    borderColor: 'oklch(0.75 0.15 200 / 0.2)',
                    background: 'oklch(0.14 0.03 280)',
                    color: 'oklch(0.8 0.05 330)',
                  }}
                  type="button"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25, type: 'spring', stiffness: 280 }}
                  whileHover={{
                    borderColor: 'oklch(0.75 0.15 200 / 0.5)',
                    boxShadow: '0 0 15px oklch(0.75 0.15 200 / 0.15)',
                    x: 4,
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleHelp}
                >
                  <HelpCircle className="size-4" style={{ color: 'oklch(0.75 0.15 200)' }} />
                  <span className="text-xs font-black uppercase tracking-[0.15em]">
                    {t('도움말 보기')}
                  </span>
                  {/* 화살표 인디케이터 */}
                  <span
                    className="ml-auto text-sm font-black transition-transform duration-200 group-hover:translate-x-1"
                    style={{ color: 'oklch(0.75 0.15 200 / 0.5)' }}
                  >
                    ▸
                  </span>
                </motion.button>
              </nav>

              {/* ── 하단 데코 — 사선 컷 패턴 ── */}
              <div className="mt-auto px-5 pb-6">
                <div
                  className="h-[1.5px]"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent, oklch(0.7 0.25 330 / 0.3), transparent)',
                  }}
                />
                <motion.p
                  className="mt-3 text-center text-[9px] font-bold uppercase tracking-[0.3em]"
                  style={{ color: 'oklch(0.4 0.02 280)' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  ✦ Q-Asker ✦
                </motion.p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default HeaderAnime;
