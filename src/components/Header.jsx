import React, { useEffect } from "react";
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
          <span className="logo-icon">❓</span>
          <h1 className="logo-text">Q-Asker</h1>
        </div>
        <div className="auth-buttons">
          <button className="text-button">로그인</button>
          <button className="primary-button">회원가입</button>
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
          <a href="#">➕ 문제 만들기</a>
          <a href="#">📋 문제 관리</a>
          <a href="#">📊 통계</a>
          <a href="#">❓ 도움말</a>
        </nav>
      </aside>
    </header>
  );
};

export default Header;
