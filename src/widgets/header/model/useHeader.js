import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation, useLanguageSwitcher } from "i18nexus";
import CustomToast from "#shared/toast";
import { authService, useAuthStore } from "#entities/auth";
import { useClickOutside } from "#shared/lib/useClickOutside";

const decodeBase64ToUtf8 = (value) => {
  if (typeof value !== "string" || !value) return null;
  const cleaned = value.replace(/\s+/g, "");
  if (!/^[A-Za-z0-9+/=_-]+$/.test(cleaned)) return null;
  const normalized = cleaned.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4;
  const padded = padding
    ? normalized.padEnd(normalized.length + (4 - padding), "=")
    : normalized;
  try {
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder("utf-8").decode(bytes);
  } catch (error) {
    return null;
  }
};

const decodeBase64Json = (value) => {
  const decoded = decodeBase64ToUtf8(value);
  if (!decoded) return null;
  try {
    return JSON.parse(decoded);
  } catch (error) {
    return null;
  }
};

const extractNicknameFromToken = (token) => {
  if (typeof token !== "string" || !token) return null;
  const segments = token.split(".");
  if (segments.length < 2) return null;
  const payload = decodeBase64Json(segments[1]);
  return payload?.nickname ?? null;
};

export const useHeader = ({ setIsSidebarOpen, setShowHelp }) => {
  const { changeLanguage } = useLanguageSwitcher();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = Boolean(accessToken);
  const nicknameFromToken = useMemo(
    () => extractNicknameFromToken(accessToken),
    [accessToken],
  );
  const resolvedUser = useMemo(() => {
    if (!nicknameFromToken) return user;
    return { ...(user || {}), nickname: nicknameFromToken };
  }, [nicknameFromToken, user]);

  useClickOutside({
    containerId: "sidebar",
    triggerId: "menuButton",
    onOutsideClick: () => setIsSidebarOpen(false),
  });

  const handleQuizManagement = () => {
    setIsSidebarOpen(false);
  };

  const handleHelp = () => {
    if (typeof setShowHelp !== "function") {
      setIsSidebarOpen(false);
      return;
    }

    setIsSidebarOpen(false);
    setShowHelp((prev) => {
      if (!prev) {
        setTimeout(() => {
          const helpElement = document.getElementById("help-section");
          if (helpElement) {
            helpElement.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 100);
      }
      return !prev;
    });
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      CustomToast.info(t("로그아웃되었습니다."));
    } catch (error) {
      CustomToast.error(t("로그아웃에 실패했습니다."));
    }
  };

  const handleLanguageChange = (lang) => {
    changeLanguage(lang);
    if (
      location.pathname === "/" ||
      location.pathname === "/ko" ||
      location.pathname === "/en"
    ) {
      const targetPath = lang === "en" ? "/en" : "/ko";
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
