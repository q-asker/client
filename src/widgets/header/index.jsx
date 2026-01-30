import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useHeader } from "./model/useHeader";
import { useClickOutside } from "#shared/lib/useClickOutside";
import Logo from "#shared/ui/logo";
import "./index.css";

const Header = ({
  isSidebarOpen,
  toggleSidebar,
  setIsSidebarOpen,
  setShowHelp,
}) => {
  const {
    state: { t, isAuthenticated, user },
    actions: {
      handleQuizManagement,
      handleHelp,
      handleLogout,
      handleLanguageChange,
      closeSidebar,
    },
  } = useHeader({ setIsSidebarOpen, setShowHelp });
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showNavTooltip, setShowNavTooltip] = useState(false);

  const displayName = useMemo(() => {
    const name =
      user?.nickname || user?.name || user?.username || user?.email || "";
    return name.trim() || t("사용자");
  }, [t, user]);
  const profileInitial = useMemo(
    () => displayName?.trim().slice(0, 1).toUpperCase() || "?",
    [displayName],
  );

  useClickOutside({
    containerId: "profileDropdown",
    triggerId: "profileButton",
    onOutsideClick: () => setIsProfileOpen(false),
    isEnabled: isProfileOpen,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const dismissedDate = localStorage.getItem(
          "headerNavTooltipDismissedDate",
        );
        setShowNavTooltip(dismissedDate !== today);
      } catch (error) {
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
      localStorage.setItem("headerNavTooltipDismissedDate", today);
    } catch (error) {
      // ignore storage errors
    }
    setShowNavTooltip(false);
  };

  return (
    <div className="header">
      <div className="header-inner">
        <div className="logo-area">
          <button
            id="menuButton"
            className="icon-button"
            onClick={toggleSidebar}
          >
            ☰
          </button>
          <Link to="/" className="logo-link">
            <Logo />
          </Link>
        </div>
        <div className="nav-link-area">
          <div className="nav-link-wrapper">
            <Link
              to="/history"
              className="nav-link"
              onClick={handleQuizManagement}
            >
              <span className="emoji-label">📋</span>
              <strong>{t("퀴즈 기록")}</strong>
            </Link>
            {!isAuthenticated && showNavTooltip && (
              <span className="nav-tooltip" role="status">
                {t("로그인하고, 퀴즈기록을 저장해보세요")}
                <button
                  type="button"
                  className="nav-tooltip-close"
                  aria-label={t("닫기")}
                  onClick={handleNavTooltipClose}
                >
                  ✕
                </button>
              </span>
            )}
          </div>
          <div className="auth-buttons">
            {isAuthenticated ? (
              <div className="profile-area">
                <button
                  id="profileButton"
                  className="profile-button"
                  onClick={() => setIsProfileOpen((prev) => !prev)}
                  aria-expanded={isProfileOpen}
                  aria-haspopup="true"
                  title={displayName}
                  type="button"
                >
                  {profileInitial}
                </button>
                {isProfileOpen && (
                  <div id="profileDropdown" className="profile-dropdown">
                    <span className="profile-name">{displayName}</span>
                    <button
                      className="profile-logout"
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        handleLogout();
                      }}
                    >
                      <span className="emoji-label">🚪</span>
                      <strong>{t("로그아웃")}</strong>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link className="text-button" to="/login">
                <span className="emoji-label">🔐</span>
                <strong>{t("로그인")}</strong>
              </Link>
            )}
          </div>
        </div>
      </div>
      <aside
        id="sidebar"
        className={isSidebarOpen ? "sidebar open" : "sidebar"}
      >
        <div className="sidebar-header">
          <h2>{t("메뉴")}</h2>
          <button className="icon-button" onClick={closeSidebar}>
            ✕
          </button>
        </div>
        <nav>
          <div className="nav-link language-selector">
            {t("언어")}
            <div>
              <button
                className="language-button"
                onClick={() => handleLanguageChange("ko")}
              >
                🇰🇷
              </button>
              <button
                className="language-button"
                onClick={() => handleLanguageChange("en")}
              >
                🇬🇧
              </button>
            </div>
          </div>
          <div className="nav-link" onClick={handleHelp}>
            {t("도움말 보기")}
          </div>
        </nav>
      </aside>
    </div>
  );
};

export default Header;
