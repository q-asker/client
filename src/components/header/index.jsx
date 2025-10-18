import { useTranslation, useLanguageSwitcher} from "i18nexus";
import CustomToast from "#shared/toast";
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import "./index.css";


const Header = ({ isSidebarOpen, toggleSidebar, setIsSidebarOpen }) => {
  
  const { changeLanguage} = useLanguageSwitcher();
  const { t } = useTranslation();
  useEffect(() => {
    const handleClickOutside = (e) => {
      const sidebar = document.getElementById("sidebar");
      const menuBtn = document.getElementById("menuButton");
      if (
      sidebar &&
      !sidebar.contains(e.target) &&
      menuBtn &&
      !menuBtn.contains(e.target))
      {
        setIsSidebarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setIsSidebarOpen]);

  // 네비게이션 핸들러들
  const handleMakeQuiz = () => {
    setIsSidebarOpen(false);
  };

  const handleQuizManagement = () => {
    setIsSidebarOpen(false);
  };

  const handleStatistics = () => {
    setIsSidebarOpen(false);
    CustomToast.info(t("개발중입니다!"));
  };

  const handleHelp = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="header">
      <div className="header-inner">
        <div className="logo-area">
          <button
            id="menuButton"
            className="icon-button"
            onClick={toggleSidebar}>

            ☰
          </button>
          <Link to="/" className="logo-link">
            <img
              src="/favicon-256x256.png"
              alt="Q-Asker"
              className="logo-icon" />

            <div className="logo-text">Q-Asker</div>
          </Link>
        </div>
        <div className="nav-link-area">
          <Link
            to="/history"
            className="nav-link"
            onClick={handleQuizManagement}>

            📋 <strong>{t("퀴즈 기록")}</strong>
          </Link>
          <button onClick={() => {
            changeLanguage("en");
          }}>English</button>
          <button onClick={() => {
            changeLanguage("ko");
          }}>Korean</button>
        </div>
      </div>
      <aside
        id="sidebar"
        className={isSidebarOpen ? "sidebar open" : "sidebar"}>

        <div className="sidebar-header">
          <h2>{t("메뉴")}</h2>
          <button
            className="icon-button"
            onClick={() => setIsSidebarOpen(false)}>

            ✕
          </button>
        </div>
        <nav>
          <Link to="/" className="nav-link" onClick={handleMakeQuiz}>{t("➕ 문제 만들기")}

          </Link>
          <Link
            to="/history"
            className="nav-link"
            onClick={handleQuizManagement}>{t("📋 퀴즈 기록")}


          </Link>
          <button className="nav-link" onClick={handleStatistics}>{t("📊 통계")}

          </button>
        </nav>
      </aside>
    </div>);

};

export default Header;