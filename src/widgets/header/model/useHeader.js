import { useTranslation, useLanguageSwitcher } from "i18nexus";
import CustomToast from "#shared/toast";
import { authService, useAuthStore } from "#entities/auth";
import { useClickOutside } from "#shared/lib/useClickOutside";

export const useHeader = ({ setIsSidebarOpen, setShowHelp }) => {
  const { changeLanguage } = useLanguageSwitcher();
  const { t } = useTranslation();
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = Boolean(accessToken);

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
      CustomToast.info("로그아웃되었습니다.");
    } catch (error) {
      CustomToast.error("로그아웃에 실패했습니다.");
    }
  };

  const handleLanguageChange = (lang) => {
    changeLanguage(lang);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return {
    state: { t, isAuthenticated },
    actions: {
      handleQuizManagement,
      handleHelp,
      handleLogout,
      handleLanguageChange,
      closeSidebar,
    },
  };
};
