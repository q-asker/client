import React from "react";
import { Link } from "react-router-dom";
import { useHeader } from "./model/useHeader";
import "./index.css";

const Header = ({
  isSidebarOpen,
  toggleSidebar,
  setIsSidebarOpen,
  setShowHelp,
}) => {
  const {
    state: { t, isAuthenticated },
    actions: {
      handleQuizManagement,
      handleHelp,
      handleLogout,
      handleLanguageChange,
      closeSidebar,
    },
  } = useHeader({ setIsSidebarOpen, setShowHelp });

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
            onClick={closeSidebar}
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
