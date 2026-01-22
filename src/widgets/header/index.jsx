import { useTranslation, useLanguageSwitcher } from "i18nexus";
import CustomToast from "#shared/toast";
import { authService, useAuthStore } from "#shared/auth";
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import "./index.css";

const Header = ({
  isSidebarOpen,
  toggleSidebar,
  setIsSidebarOpen,
  setShowHelp,
}) => {
  const { changeLanguage } = useLanguageSwitcher();
  const { t } = useTranslation();
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = Boolean(accessToken);
  useEffect(() => {
    const handleClickOutside = (e) => {
      const sidebar = document.getElementById("sidebar");
      const menuBtn = document.getElementById("menuButton");
      if (
        sidebar &&
        !sidebar.contains(e.target) &&
        menuBtn &&
        !menuBtn.contains(e.target)
      ) {
        setIsSidebarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setIsSidebarOpen, setShowHelp]);

  const handleQuizManagement = () => {
    setIsSidebarOpen(false);
  };

  const handleHelp = () => {
    setIsSidebarOpen(false); // 메뉴창 닫기
    setShowHelp((prev) => {
      if (!prev) {
        // 도움말을 열 때만 스크롤
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
            <img
              src="/favicon-256x256.png"
              alt="Q-Asker"
              className="logo-icon"
            />

            <div className="logo-text">Q-Asker</div>
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
              <button className="text-button" onClick={handleLogout}>
                {t("로그아웃")}
              </button>
            ) : (
              <Link className="text-button" to="/login">
                {t("로그인")}
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
          <button
            className="icon-button"
            onClick={() => setIsSidebarOpen(false)}
          >
            ✕
          </button>
        </div>
        <nav>
          <div className="nav-link language-selector">
            {t("언어")}
            <div>
              <button
                className="language-button"
                onClick={() => {
                  changeLanguage("ko");
                }}
              >
                🇰🇷
              </button>
              <button
                className="language-button"
                onClick={() => {
                  changeLanguage("en");
                }}
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
