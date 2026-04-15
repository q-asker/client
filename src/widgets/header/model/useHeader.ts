import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation, useLanguageSwitcher } from 'i18nexus';
import CustomToast from '#shared/toast';
import { authService, useAuthStore } from '#entities/auth';
import type { User } from '#entities/auth';

interface UseHeaderReturn {
  state: {
    t: (key: string, variables?: Record<string, string | number>) => string;
    isAuthenticated: boolean;
    hasHydrated: boolean;
    user: User | null;
    currentLanguage: string;
  };
  actions: {
    handleQuizManagement: () => void;
    handleLogout: () => Promise<void>;
    handleLanguageChange: (lang: string) => void;
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

export const useHeader = (): UseHeaderReturn => {
  const { changeLanguage } = useLanguageSwitcher();
  const { t, currentLanguage } = useTranslation('common');
  const location = useLocation();
  const navigate = useNavigate();
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const isAuthenticated = hasHydrated && Boolean(accessToken);
  const nicknameFromToken = useMemo(() => extractNicknameFromToken(accessToken), [accessToken]);
  const resolvedUser = useMemo((): User | null => {
    if (!nicknameFromToken) return user;
    return { ...(user || { id: '' }), nickname: nicknameFromToken };
  }, [nicknameFromToken, user]);

  const handleQuizManagement = () => {
    // 퀴즈 기록 클릭 시 추가 동작 없음
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      CustomToast.info(t('로그아웃되었습니다.'));
    } catch {
      // 인터셉터에서 에러 토스트 처리
    }
  };

  const handleLanguageChange = (lang: string) => {
    // 언어 경로에서는 navigate만 수행 — LanguageRouteSync가 changeLanguage 처리
    // 동시 호출 시 LanguageRouteSync가 중간에 개입하여 플래싱 발생 방지
    if (location.pathname === '/' || location.pathname === '/ko' || location.pathname === '/en') {
      const targetPath = lang === 'en' ? '/en' : '/ko';
      if (location.pathname !== targetPath) {
        navigate(targetPath, { replace: true });
        return;
      }
    }
    changeLanguage(lang);
  };

  return {
    state: { t, isAuthenticated, hasHydrated, user: resolvedUser, currentLanguage },
    actions: {
      handleQuizManagement,
      handleLogout,
      handleLanguageChange,
    },
  };
};
