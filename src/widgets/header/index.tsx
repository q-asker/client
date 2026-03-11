import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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
    <div className="relative bg-white shadow-sm">
      <div className="mx-auto flex w-[70%] items-center justify-between p-4 max-md:w-auto max-md:p-2.5 max-sm:gap-2 max-sm:px-2.5 max-sm:py-2">
        {/* 로고 영역 */}
        <div className="flex items-center">
          <button
            id="menuButton"
            className="mr-3 cursor-pointer border-none bg-none text-2xl max-sm:mr-2 max-sm:text-xl"
            onClick={toggleSidebar}
          >
            ☰
          </button>
          <Link to="/" className="text-inherit no-underline">
            <Logo />
          </Link>
        </div>

        {/* 네비게이션 링크 */}
        <div className="flex items-center gap-3 max-sm:gap-1.5">
          <Link
            to="/boards"
            className="inline-flex items-center whitespace-nowrap px-3 py-2 text-gray-700 no-underline transition-all duration-200 hover:bg-indigo-50 hover:text-indigo-500 max-sm:px-2 max-sm:py-1.5 max-sm:text-sm"
          >
            <span className="mr-1.5 inline-flex items-center">💬</span>
            <strong>{t('문의하기')}</strong>
          </Link>

          <div className="relative inline-flex items-center">
            <Link
              to="/history"
              className="inline-flex items-center whitespace-nowrap px-3 py-2 text-gray-700 no-underline transition-all duration-200 hover:bg-indigo-50 hover:text-indigo-500 max-sm:px-2 max-sm:py-1.5 max-sm:text-sm"
              onClick={handleQuizManagement}
            >
              <span className="mr-1.5 inline-flex items-center">📋</span>
              <strong>{t('퀴즈 기록')}</strong>
            </Link>
            {!isAuthenticated && showNavTooltip && (
              <span
                className="absolute left-1/2 top-[calc(100%+6px)] z-[2] inline-flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-gray-900 px-2 py-1.5 pl-2.5 text-xs text-white shadow-lg before:absolute before:left-1/2 before:top-[-4px] before:-translate-x-1/2 before:border-x-[6px] before:border-b-[6px] before:border-t-0 before:border-solid before:border-transparent before:border-b-gray-900 before:content-[''] max-sm:hidden"
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

          {/* 인증 버튼 */}
          <div className="flex items-center">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  id="profileButton"
                  className="inline-flex size-9 cursor-pointer items-center justify-center rounded-full border border-indigo-100 bg-indigo-50 p-0 font-bold text-indigo-600 hover:bg-indigo-100 max-sm:size-8 max-sm:text-sm"
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
                    className="absolute right-0 top-[calc(100%+8px)] z-[1001] min-w-[180px] rounded-xl border border-gray-200 bg-white p-3 shadow-lg"
                  >
                    <span className="mb-2.5 block font-semibold text-gray-900">{displayName}</span>
                    <button
                      className="w-full cursor-pointer border-none bg-transparent px-1 py-1.5 text-left text-indigo-500 hover:text-indigo-600"
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
                className="block whitespace-nowrap text-indigo-500 no-underline max-sm:text-sm"
                to="/login"
              >
                <span className="mr-1.5 inline-flex items-center">🔐</span>
                <strong>{t('로그인')}</strong>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 사이드바 */}
      <aside
        id="sidebar"
        className={cn(
          'fixed left-0 top-0 z-[1000] h-full w-64 bg-white shadow-[2px_0_8px_rgba(0,0,0,0.1)] transition-transform duration-300 ease-in-out',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between p-4">
          <h2>{t('메뉴')}</h2>
          <button
            className="mr-3 cursor-pointer border-none bg-none text-2xl"
            onClick={closeSidebar}
          >
            ✕
          </button>
        </div>
        <nav className="w-full">
          <div className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-base text-gray-700 transition-all duration-200 hover:bg-indigo-50 hover:text-indigo-500">
            {t('언어')}
            <div>
              <button
                className="cursor-pointer border-none bg-transparent text-base text-gray-700"
                onClick={() => handleLanguageChange('ko')}
              >
                🇰🇷
              </button>
              <button
                className="cursor-pointer border-none bg-transparent text-base text-gray-700"
                onClick={() => handleLanguageChange('en')}
              >
                🇬🇧
              </button>
            </div>
          </div>
          <button
            className="block w-full cursor-pointer border-none bg-transparent px-4 py-3 text-left text-base text-gray-700 transition-all duration-200 hover:bg-indigo-50 hover:text-indigo-500"
            type="button"
            onClick={handleHelp}
          >
            {t('도움말 보기')}
          </button>
        </nav>
      </aside>
    </div>
  );
};
export { extractRoleFromToken } from './model/useHeader';

export default Header;
