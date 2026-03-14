import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, ClipboardList, LogIn, Menu, X } from 'lucide-react';
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
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3 md:px-6">
        {/* 로고 영역 */}
        <div className="flex items-center">
          <button
            id="menuButton"
            className="mr-3 cursor-pointer rounded-lg border-none bg-transparent p-1.5 text-gray-600 transition-colors duration-200 hover:bg-gray-100 hover:text-gray-900"
            onClick={toggleSidebar}
          >
            <Menu className="size-5" />
          </button>
          <Link to="/" className="text-inherit no-underline">
            <Logo />
          </Link>
        </div>

        {/* 네비게이션 링크 */}
        <div className="flex items-center gap-1 md:gap-3">
          <Link
            to="/boards"
            className="inline-flex items-center whitespace-nowrap px-3 py-2 text-gray-700 no-underline transition-all duration-200 hover:bg-indigo-50 hover:text-indigo-600 text-sm md:text-base"
          >
            <MessageSquare className="mr-1.5 size-4" />
            <strong>{t('문의하기')}</strong>
          </Link>

          <div className="relative inline-flex items-center">
            <Link
              to="/history"
              className="inline-flex items-center whitespace-nowrap px-3 py-2 text-gray-700 no-underline transition-all duration-200 hover:bg-indigo-50 hover:text-indigo-600 text-sm md:text-base"
              onClick={handleQuizManagement}
            >
              <ClipboardList className="mr-1.5 size-4" />
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
                  className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full border border-indigo-100 bg-indigo-50 p-0 text-sm font-bold text-indigo-600 transition-colors duration-200 hover:bg-indigo-100 md:size-9 md:text-base"
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
                      className="w-full cursor-pointer border-none bg-transparent px-1 py-1.5 text-left text-indigo-600 hover:text-indigo-600"
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
                className="inline-flex items-center whitespace-nowrap text-sm text-indigo-600 no-underline transition-all duration-200 hover:bg-indigo-50 hover:text-indigo-700 px-3 py-2 rounded md:text-base"
                to="/login"
              >
                <LogIn className="mr-1.5 size-4" />
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
          'fixed left-0 top-0 z-[9999] h-full w-64 bg-white shadow-[2px_0_8px_rgba(0,0,0,0.1)] transition-transform duration-300 ease-in-out',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between p-4">
          <h2>{t('메뉴')}</h2>
          <button
            className="cursor-pointer rounded-lg border-none bg-transparent p-1.5 text-gray-600 transition-colors duration-200 hover:bg-gray-100 hover:text-gray-900"
            onClick={closeSidebar}
          >
            <X className="size-5" />
          </button>
        </div>
        <nav className="w-full">
          <div className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-base text-gray-700 transition-all duration-200 hover:bg-indigo-50 hover:text-indigo-600">
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
            className="block w-full cursor-pointer border-none bg-transparent px-4 py-3 text-left text-base text-gray-700 transition-all duration-200 hover:bg-indigo-50 hover:text-indigo-600"
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

/* 쿼리 파라미터 기반 변형 스위칭 (compare/mix 페이지용) */
import { lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';

const HeaderMagicA = lazy(() => import('./HeaderMagicA'));
const HeaderMagicB = lazy(() => import('./HeaderMagicB'));
const HeaderDesignA = lazy(() => import('./HeaderDesignA'));
const HeaderDesignB = lazy(() => import('./HeaderDesignB'));
const HeaderDesignA_ConceptMid = lazy(() => import('./HeaderDesignA_ConceptMid'));
const HeaderDesignA_ConceptMax = lazy(() => import('./HeaderDesignA_ConceptMax'));
const HeaderDesignA_PolishMid = lazy(() => import('./HeaderDesignA_PolishMid'));
const HeaderDesignA_PolishMax = lazy(() => import('./HeaderDesignA_PolishMax'));
const HeaderDesignB_ConceptMid = lazy(() => import('./HeaderDesignB_ConceptMid'));
const HeaderDesignB_ConceptMax = lazy(() => import('./HeaderDesignB_ConceptMax'));
const HeaderDesignB_PolishMid = lazy(() => import('./HeaderDesignB_PolishMid'));
const HeaderDesignB_PolishMax = lazy(() => import('./HeaderDesignB_PolishMax'));
const HeaderMagicA_ConceptMid = lazy(() => import('./HeaderMagicA_ConceptMid'));
const HeaderMagicA_ConceptMax = lazy(() => import('./HeaderMagicA_ConceptMax'));
const HeaderMagicA_PolishMid = lazy(() => import('./HeaderMagicA_PolishMid'));
const HeaderMagicA_PolishMax = lazy(() => import('./HeaderMagicA_PolishMax'));
const HeaderMagicB_ConceptMid = lazy(() => import('./HeaderMagicB_ConceptMid'));
const HeaderMagicB_ConceptMax = lazy(() => import('./HeaderMagicB_ConceptMax'));
const HeaderMagicB_PolishMid = lazy(() => import('./HeaderMagicB_PolishMid'));
const HeaderMagicB_PolishMax = lazy(() => import('./HeaderMagicB_PolishMax'));
const HeaderAnime = lazy(() => import('./HeaderAnime'));
const HeaderDesignC = lazy(() => import('./HeaderDesignC'));
const HeaderDesignC_ConceptMid = lazy(() => import('./HeaderDesignC_ConceptMid'));
const HeaderDesignC_ConceptMax = lazy(() => import('./HeaderDesignC_ConceptMax'));
const HeaderDesignC_PolishMid = lazy(() => import('./HeaderDesignC_PolishMid'));
const HeaderDesignC_PolishMax = lazy(() => import('./HeaderDesignC_PolishMax'));
const HeaderMagicC = lazy(() => import('./HeaderMagicC'));
const HeaderMagicC_ConceptMid = lazy(() => import('./HeaderMagicC_ConceptMid'));
const HeaderMagicC_ConceptMax = lazy(() => import('./HeaderMagicC_ConceptMax'));
const HeaderMagicC_PolishMid = lazy(() => import('./HeaderMagicC_PolishMid'));
const HeaderMagicC_PolishMax = lazy(() => import('./HeaderMagicC_PolishMax'));
const HeaderDesignD = lazy(() => import('./HeaderDesignD'));
const HeaderDesignE = lazy(() => import('./HeaderDesignE'));
const HeaderDesignF = lazy(() => import('./HeaderDesignF'));
const HeaderDesignG = lazy(() => import('./HeaderDesignG'));

const HEADER_VARIANTS: Record<
  string,
  React.LazyExoticComponent<React.ComponentType<HeaderProps>>
> = {
  '1': HeaderMagicA,
  '2': HeaderMagicB,
  '3': HeaderDesignA,
  '4': HeaderDesignB,
  '5': HeaderDesignA_ConceptMid,
  '6': HeaderDesignA_ConceptMax,
  '7': HeaderDesignA_PolishMid,
  '8': HeaderDesignA_PolishMax,
  '9': HeaderDesignB_ConceptMid,
  '10': HeaderDesignB_ConceptMax,
  '11': HeaderDesignB_PolishMid,
  '12': HeaderDesignB_PolishMax,
  '13': HeaderMagicA_ConceptMid,
  '14': HeaderMagicA_ConceptMax,
  '15': HeaderMagicA_PolishMid,
  '16': HeaderMagicA_PolishMax,
  '17': HeaderMagicB_ConceptMid,
  '18': HeaderMagicB_ConceptMax,
  '19': HeaderMagicB_PolishMid,
  '20': HeaderMagicB_PolishMax,
  '21': HeaderAnime,
  '22': HeaderDesignC,
  '23': HeaderDesignC_ConceptMid,
  '24': HeaderDesignC_ConceptMax,
  '25': HeaderDesignC_PolishMid,
  '26': HeaderDesignC_PolishMax,
  '27': HeaderMagicC,
  '28': HeaderMagicC_ConceptMid,
  '29': HeaderMagicC_ConceptMax,
  '30': HeaderMagicC_PolishMid,
  '31': HeaderMagicC_PolishMax,
  '32': HeaderDesignD,
  '33': HeaderDesignE,
  '34': HeaderDesignF,
  '35': HeaderDesignG,
};

const HeaderWithVariant = (props: HeaderProps) => {
  const [searchParams] = useSearchParams();
  const variant = searchParams.get('header');
  const VariantComponent = variant ? HEADER_VARIANTS[variant] : null;

  if (VariantComponent) {
    return (
      <Suspense fallback={null}>
        <VariantComponent {...props} />
      </Suspense>
    );
  }
  return <Header {...props} />;
};

export default HeaderWithVariant;
