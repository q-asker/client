import CustomToast from "#shared/toast";
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Header.css";

const Header = ({ isSidebarOpen, toggleSidebar, setIsSidebarOpen }) => {
  const navigate = useNavigate();

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
  }, [setIsSidebarOpen]);

  // 네비게이션 핸들러들
  const handleMakeQuiz = () => {
    setIsSidebarOpen(false);
    navigate("/");
  };

  const handleQuizManagement = () => {
    setIsSidebarOpen(false);
    navigate("/history");
  };

  const handleStatistics = () => {
    setIsSidebarOpen(false);
    CustomToast.info("개발중입니다!");
  };

  const handleHelp = () => {
    setIsSidebarOpen(false);
    navigate("/help?source=header");
  };

  const handleLogoClick = () => {
    navigate("/");
  };

  return (
    <header className="header">
      <div className="header-inner">
        <div className="logo-area">
          <button
            id="menuButton"
            className="icon-button"
            onClick={toggleSidebar}
          >
            ☰
          </button>
          <div className="logo-area-inner" onClick={handleLogoClick}>
            <span className="logo-icon">❓</span>
            <h1 className="logo-text">Q-Asker</h1>
          </div>
        </div>
        <div className="nav-link-area">
          <button className="nav-link" onClick={handleQuizManagement}>
            📋 퀴즈 기록
          </button>
        </div>
      </div>
      <aside
        id="sidebar"
        className={isSidebarOpen ? "sidebar open" : "sidebar"}
      >
        <div className="sidebar-header">
          <h2>메뉴</h2>
          <button
            className="icon-button"
            onClick={() => setIsSidebarOpen(false)}
          >
            ✕
          </button>
        </div>
        <nav>
          <button className="nav-link" onClick={handleMakeQuiz}>
            ➕ 문제 만들기
          </button>
          <button className="nav-link" onClick={handleQuizManagement}>
            📋 퀴즈 기록
          </button>
          <button className="nav-link" onClick={handleHelp}>
            ❓ 도움말
          </button>
          <button className="nav-link" onClick={handleStatistics}>
            📊 통계
          </button>
        </nav>
      </aside>
    </header>
  );
};

export default Header;
