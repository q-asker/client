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
import { TextAnimate } from '@/shared/ui/components/text-animate';
import { Badge } from '@/shared/ui/components/badge';
import { Button } from '@/shared/ui/components/button';
import { BlurFade } from '@/shared/ui/components/blur-fade';
import { cn } from '@/shared/ui/lib/utils';

interface HeaderProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setShowHelp?: React.Dispatch<React.SetStateAction<boolean>>;
}

// 프로필 드롭다운 항목 stagger 애니메이션
const dropdownItemVariants = {
  hidden: { opacity: 0, y: -4 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, type: 'spring', damping: 20, stiffness: 300 },
  }),
};

// 사이드바 메뉴 항목 stagger 애니메이션
const sidebarItemVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: 0.1 + i * 0.08, type: 'spring', damping: 20, stiffness: 300 },
  }),
};

const HeaderMagicB_ConceptMax = ({
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

  // 일일 툴팁 표시 로직 (localStorage 기반)
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

  // 네비게이션 항목 정의
  const navItems = useMemo(() => {
    const items = [
      { path: '/boards', icon: MessageSquare, label: t('문의하기'), delay: 0.05 },
      { path: '/history', icon: ClipboardList, label: t('퀴즈 기록'), delay: 0.1 },
    ];
    if (!isAuthenticated) {
      items.push({ path: '/login', icon: LogIn, label: t('로그인'), delay: 0.15 });
    }
    return items;
  }, [t, isAuthenticated]);

  return (
    <div className="relative">
      {/* ── 헤더 바 ── */}
      <div
        className="relative overflow-hidden bg-[oklch(0.12_0.03_300)]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, oklch(0.2 0.05 300 / 0.08) 0px, transparent 1px, transparent 40px), repeating-linear-gradient(0deg, oklch(0.2 0.05 300 / 0.08) 0px, transparent 1px, transparent 40px)',
        }}
      >
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3 md:px-6">
          {/* 로고 영역 — 크롬/메탈릭 텍스트 */}
          <div className="flex items-center">
            <Button
              id="menuButton"
              variant="ghost"
              size="icon"
              className="mr-3 text-[oklch(0.7_0.1_300)] hover:bg-[oklch(0.2_0.05_300)] hover:text-[oklch(0.8_0.2_330)]"
              onClick={toggleSidebar}
            >
              <Menu className="size-5" />
            </Button>
            <Link to="/" className="no-underline">
              <span className="bg-gradient-to-r from-[oklch(0.9_0.05_300)] to-[oklch(0.7_0.1_330)] bg-clip-text text-transparent">
                <Logo />
              </span>
            </Link>
          </div>

          {/* 네온 네비게이션 */}
          <div className="flex items-center gap-2">
            <nav className="relative flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <BlurFade key={item.path} delay={item.delay}>
                    <div className="relative inline-flex flex-col items-center">
                      <Link
                        to={item.path}
                        onClick={item.path === '/history' ? handleQuizManagement : undefined}
                        className="no-underline"
                      >
                        <Button
                          variant={active ? 'secondary' : 'ghost'}
                          size="sm"
                          className={cn(
                            'gap-1.5 transition-all duration-200',
                            active
                              ? 'bg-[oklch(0.2_0.08_330)] text-[oklch(0.85_0.2_330)] shadow-[0_0_12px_oklch(0.7_0.25_330/0.25)]'
                              : 'text-[oklch(0.6_0.08_300)] hover:text-[oklch(0.8_0.2_330)] hover:bg-[oklch(0.18_0.05_300)]',
                          )}
                          asChild={false}
                        >
                          <Icon className="size-4" />
                          <span className="max-sm:hidden">{item.label}</span>
                          {/* 활성 상태 네온 뱃지 */}
                          {active && (
                            <Badge
                              variant="outline"
                              className="ml-0.5 h-4 border-[oklch(0.7_0.25_330)] px-1 text-[10px] text-[oklch(0.85_0.2_330)]"
                            >
                              ●
                            </Badge>
                          )}
                        </Button>
                      </Link>

                      {/* 퀴즈 기록 네온 툴팁 */}
                      {item.path === '/history' && !isAuthenticated && showNavTooltip && (
                        <span
                          className="absolute left-1/2 top-[calc(100%+6px)] z-[2] inline-flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-lg bg-[oklch(0.7_0.25_330)] px-2.5 py-1.5 text-xs font-medium text-white shadow-[0_0_12px_oklch(0.7_0.25_330/0.4)] before:absolute before:left-1/2 before:top-[-4px] before:-translate-x-1/2 before:border-x-[6px] before:border-b-[6px] before:border-t-0 before:border-solid before:border-transparent before:border-b-[oklch(0.7_0.25_330)] before:content-[''] max-sm:hidden"
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
                );
              })}
            </nav>

            {/* 프로필 버튼 (인증 시) */}
            {isAuthenticated && (
              <div className="relative">
                <button
                  id="profileButton"
                  className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full border-2 border-[oklch(0.5_0.15_300)] bg-[oklch(0.18_0.06_300)] p-0 text-sm font-bold text-[oklch(0.85_0.2_330)] shadow-[0_0_8px_oklch(0.7_0.25_330/0.2)] transition-all duration-200 hover:bg-[oklch(0.22_0.08_300)] hover:shadow-[0_0_14px_oklch(0.7_0.25_330/0.35)] md:size-9 md:text-base"
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
                      className="absolute right-0 top-[calc(100%+8px)] z-[1001] min-w-[180px] rounded-xl border border-[oklch(0.5_0.15_300)] bg-[oklch(0.12_0.04_300)/0.95] p-3 shadow-lg backdrop-blur-md"
                    >
                      {/* 닉네임 — 네온 핑크 */}
                      <motion.span
                        className="mb-2.5 block font-semibold text-[oklch(0.85_0.2_330)]"
                        custom={0}
                        variants={dropdownItemVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        {displayName}
                      </motion.span>
                      <motion.div
                        custom={1}
                        variants={dropdownItemVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-1.5 text-[oklch(0.7_0.2_330)] hover:bg-[oklch(0.2_0.06_300)] hover:text-[oklch(0.85_0.2_330)]"
                          onClick={() => {
                            setIsProfileOpen(false);
                            handleLogout();
                          }}
                        >
                          <LogOut className="size-4" />
                          <strong>{t('로그아웃')}</strong>
                        </Button>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 선셋 그라디언트 라인 ── */}
      <div
        className="h-[2px]"
        style={{
          background:
            'linear-gradient(90deg, oklch(0.7 0.25 330), oklch(0.8 0.2 80), oklch(0.75 0.15 200))',
        }}
      />

      {/* ── 사이드바 + 오버레이 ── */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* 어두운 오버레이 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[999] bg-[oklch(0.05_0.02_300)/0.7]"
              onClick={closeSidebar}
            />
            <motion.aside
              id="sidebar"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed left-0 top-0 z-[1000] flex h-full w-[280px] flex-col border-l-2 border-[oklch(0.7_0.25_330)] bg-[oklch(0.1_0.04_300)]"
            >
              {/* 사이드바 헤더 — TextAnimate 네온 타이틀 */}
              <div className="flex items-center justify-between border-b border-[oklch(0.3_0.1_300)] px-5 py-4">
                <TextAnimate
                  animation="blurInUp"
                  by="character"
                  className="bg-gradient-to-r from-[oklch(0.8_0.2_330)] to-[oklch(0.75_0.15_200)] bg-clip-text text-xs font-bold uppercase tracking-[0.25em] text-transparent"
                >
                  MENU
                </TextAnimate>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-[oklch(0.6_0.1_300)] hover:bg-[oklch(0.18_0.06_300)] hover:text-[oklch(0.8_0.2_330)]"
                  onClick={closeSidebar}
                >
                  <X className="size-5" />
                </Button>
              </div>

              {/* 사이드바 메뉴 */}
              <nav className="flex flex-1 flex-col gap-1 p-3">
                {/* 언어 전환 */}
                <motion.div
                  className="flex items-center justify-between rounded-lg px-4 py-3"
                  custom={0}
                  variants={sidebarItemVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <span className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.15em] text-[oklch(0.6_0.08_300)]">
                    <Globe className="size-4" />
                    {t('언어')}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="px-2 text-xs font-bold text-[oklch(0.6_0.08_300)] hover:bg-[oklch(0.18_0.06_300)] hover:text-[oklch(0.8_0.2_330)] hover:shadow-[0_0_10px_oklch(0.7_0.25_330/0.3)]"
                      onClick={() => handleLanguageChange('ko')}
                    >
                      KO
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="px-2 text-xs font-bold text-[oklch(0.6_0.08_300)] hover:bg-[oklch(0.18_0.06_300)] hover:text-[oklch(0.8_0.2_330)] hover:shadow-[0_0_10px_oklch(0.7_0.25_330/0.3)]"
                      onClick={() => handleLanguageChange('en')}
                    >
                      EN
                    </Button>
                  </div>
                </motion.div>

                {/* 구분선 — 네온 핑크 힌트 */}
                <div className="mx-4 h-px bg-gradient-to-r from-transparent via-[oklch(0.5_0.15_330/0.4)] to-transparent" />

                {/* 도움말 */}
                <motion.div
                  custom={1}
                  variants={sidebarItemVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-xs font-bold uppercase tracking-[0.15em] text-[oklch(0.6_0.08_300)] hover:bg-[oklch(0.18_0.06_300)] hover:text-[oklch(0.8_0.2_330)] hover:shadow-[0_0_10px_oklch(0.7_0.25_330/0.3)]"
                    onClick={handleHelp}
                  >
                    <HelpCircle className="size-4" />
                    {t('도움말 보기')}
                  </Button>
                </motion.div>
              </nav>

              {/* 하단 신스웨이브 시그니처 */}
              <div className="border-t border-[oklch(0.3_0.1_300)] px-5 py-3">
                <motion.p
                  className="text-center text-[10px] tracking-[0.3em] text-[oklch(0.45_0.1_300)]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  SYNTHWAVE ∞
                </motion.p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HeaderMagicB_ConceptMax;
