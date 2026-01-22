import { useTranslation } from "i18nexus";
import Header from "#components/header";
import React, { useState } from "react";
import "./index.css";

const apiBaseUrl = import.meta.env.VITE_BASE_URL ?? "";

const Login = () => {
  const { t } = useTranslation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const oauthLinks = {
    google: `${apiBaseUrl}/oauth2/authorization/google`,
    kakao: `${apiBaseUrl}/oauth2/authorization/kakao`,
  };

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  return (
    <div className="page-wrapper login-page">
      <Header
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        setIsSidebarOpen={setIsSidebarOpen}
        setShowHelp={setShowHelp}
      />
      <main className="login-content">
        <h1>{t("로그인")}</h1>
        <p>{t("로그인 방법을 선택하세요.")}</p>
        <div className="login-buttons">
          <a className="oauth-button google" href={oauthLinks.google}>
            {t("구글로 계속하기")}
          </a>
          <a className="oauth-button kakao" href={oauthLinks.kakao}>
            {t("카카오로 계속하기")}
          </a>
        </div>
      </main>
    </div>
  );
};

export default Login;
