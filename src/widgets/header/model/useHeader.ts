import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation, useLanguageSwitcher } from 'i18nexus';
import CustomToast from '#shared/toast';
import { authService, useAuthStore } from '#entities/auth';
import { useClickOutside } from '#shared/lib/useClickOutside';
import type { User } from '#entities/auth';

interface UseHeaderParams {
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setShowHelp?: React.Dispatch<React.SetStateAction<boolean>>;
}

interface UseHeaderReturn {
  state: {
    t: (key: string) => string;
    isAuthenticated: boolean;
    user: User | null;
  };
  actions: {
    handleQuizManagement: () => void;
    handleHelp: () => void;
    handleLogout: () => Promise<void>;
    handleLanguageChange: (lang: string) => void;
    closeSidebar: () => void;
  };
}

const decodeBase64ToUtf8 = (value: unknown): string | null => {
  if (typeof value !== 'string' || !value) return null;
  const cleaned = value.replace(/\s+/g, '');
  if (!/^[A-Za-z0-9+/=_-]+$/.test(cleaned)) return null;
  const normalized = cleaned.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4;
  const padded = padding ? normalized.padEnd(normalized.length + (4 - padding), '=') : normalized;
  try {
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder('utf-8').decode(bytes);
  } catch {
    return null;
  }
};

const decodeBase64Json = (value: unknown): Record<string, unknown> | null => {
  const decoded = decodeBase64ToUtf8(value);
  if (!decoded) return null;
  try {
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
};

export const extractRoleFromToken = (token: string | null): string | null => {
  if (typeof token !== 'string' || !token) return null;
  const segments = token.split('.');
  if (segments.length < 2) return null;
  const payload = decodeBase64Json(segments[1]);
  return (payload?.role as string) ?? null;
};

const extractNicknameFromToken = (token: string | null): string | null => {
  if (typeof token !== 'string' || !token) return null;
  const segments = token.split('.');
  if (segments.length < 2) return null;
  const payload = decodeBase64Json(segments[1]);
  return (payload?.nickname as string) ?? null;
};

export const useHeader = ({ setIsSidebarOpen, setShowHelp }: UseHeaderParams): UseHeaderReturn => {
  const { changeLanguage } = useLanguageSwitcher();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = Boolean(accessToken);
  const nicknameFromToken = useMemo(() => extractNicknameFromToken(accessToken), [accessToken]);
  const resolvedUser = useMemo((): User | null => {
    if (!nicknameFromToken) return user;
    return { ...(user || { id: '' }), nickname: nicknameFromToken };
  }, [nicknameFromToken, user]);

  useClickOutside({
    containerId: 'sidebar',
    triggerId: 'menuButton',
    onOutsideClick: () => setIsSidebarOpen(false),
  });

  const handleQuizManagement = () => {
    setIsSidebarOpen(false);
  };

  const handleHelp = () => {
    if (typeof setShowHelp !== 'function') {
      setIsSidebarOpen(false);
      return;
    }

    setIsSidebarOpen(false);
    setShowHelp((prev) => {
      if (!prev) {
        setTimeout(() => {
          const helpElement = document.getElementById('help-section');
          if (helpElement) {
            helpElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
      return !prev;
    });
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      CustomToast.info(t('로그아웃되었습니다.'));
    } catch {
      CustomToast.error(t('로그아웃에 실패했습니다.'));
    }
  };

  const handleLanguageChange = (lang: string) => {
    changeLanguage(lang);
    if (location.pathname === '/' || location.pathname === '/ko' || location.pathname === '/en') {
      const targetPath = lang === 'en' ? '/en' : '/ko';
      if (location.pathname !== targetPath) {
        navigate(targetPath, { replace: true });
      }
    }
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return {
    state: { t, isAuthenticated, user: resolvedUser },
    actions: {
      handleQuizManagement,
      handleHelp,
      handleLogout,
      handleLanguageChange,
      closeSidebar,
    },
  };
};
