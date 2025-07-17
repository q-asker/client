import CustomToast from "#shared/toast";
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import "./index.css";

const Header = ({ isSidebarOpen, toggleSidebar, setIsSidebarOpen }) => {
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
  };

  const handleQuizManagement = () => {
    setIsSidebarOpen(false);
  };

  const handleStatistics = () => {
    setIsSidebarOpen(false);
    CustomToast.info("개발중입니다!");
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
            onClick={toggleSidebar}
          >
            ☰
          </button>
          <div className="logo-area-inner">
            <Link to="/" className="logo-link">
              <span className="logo-icon">❓</span>
              <span className="logo-text">Q-Asker</span>
            </Link>
          </div>
        </div>
        <div className="nav-link-area">
          <Link
            to="/history"
            className="nav-link"
            onClick={handleQuizManagement}
          >
            📋 <strong>퀴즈 기록</strong>
          </Link>
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
          <Link to="/" className="nav-link" onClick={handleMakeQuiz}>
            ➕ 문제 만들기
          </Link>
          <Link
            to="/history"
            className="nav-link"
            onClick={handleQuizManagement}
          >
            📋 퀴즈 기록
          </Link>
          <button className="nav-link" onClick={handleStatistics}>
            📊 통계
          </button>
        </nav>
      </aside>
    </div>
  );
};

export default Header;
