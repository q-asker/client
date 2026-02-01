import { useTranslation } from "i18nexus";
import React from "react";
import "./index.css";
import Logo from "#shared/ui/logo";

const LoginSelect = () => {
  const { t } = useTranslation();
  const baseUrl = import.meta.env.VITE_BASE_URL || "";
  const kakaoLoginUrl = `${baseUrl}/oauth2/authorization/kakao`;
  const googleLoginUrl = `${baseUrl}/oauth2/authorization/google`;

  return (
    <div className="login-page">
      <div className="login-card">
        <Logo />
        <div className="login-actions">
          <a className="login-button login-button--kakao" href={kakaoLoginUrl}>
            {t("카카오 로그인")}
          </a>
          <a
            className="login-button login-button--google"
            href={googleLoginUrl}
          >
            {t("구글 로그인")}
          </a>
        </div>
      </div>
    </div>
  );
};

export default LoginSelect;
