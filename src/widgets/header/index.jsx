import React, { useMemo, useState } from "react";
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
          <Link
            to="/history"
            className="nav-link"
            onClick={handleQuizManagement}
          >
            📋 <strong>{t("퀴즈 기록")}</strong>
          </Link>
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
                      🚪 <strong>{t("로그아웃")}</strong>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link className="text-button" to="/login">
                🔐 <strong>{t("로그인")}</strong>
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
