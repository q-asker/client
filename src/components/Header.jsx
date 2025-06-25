import CustomToast from "#shared/toast";
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import "./Header.css";

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
          <h1 className="logo-area-inner">
            <Link to="/" className="logo-link">
              <span className="logo-icon">❓</span>
              <span className="logo-text">Q-Asker</span>
            </Link>
          </h1>
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
          <Link
            to="/help?source=header"
            className="nav-link"
            onClick={handleHelp}
          >
            ❓ 도움말
          </Link>
        </nav>
      </aside>
    </header>
  );
};

export default Header;
