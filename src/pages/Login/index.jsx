import { useTranslation } from "i18nexus";
import React from "react";
import { useNavigate } from "react-router-dom";
import { useLogin } from "#features/auth";
import "./index.css";

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    state: { isChecking },
  } = useLogin({ t, navigate });
  const baseUrl = import.meta.env.VITE_BASE_URL || "";
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const kakaoLoginUrl = `${normalizedBaseUrl}/oauth2/authorization/kakao`;
  const googleLoginUrl = `${normalizedBaseUrl}/oauth2/authorization/google`;

  const handlePreventIfChecking = (event) => {
    if (isChecking) {
      event.preventDefault();
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">Q-Asker</h1>
        <p className="login-subtitle">
          {t("로그인이 필요합니다.")}
        </p>
        {isChecking && (
          <p className="login-status">{t("로그인 상태 확인 중...")}</p>
        )}
        <div className="login-actions">
          <a
            className={`login-button login-button--kakao ${isChecking ? "login-button--disabled" : ""}`}
            href={kakaoLoginUrl}
            onClick={handlePreventIfChecking}
            aria-disabled={isChecking}
          >
            {t("카카오 로그인")}
          </a>
          <a
            className={`login-button login-button--google ${isChecking ? "login-button--disabled" : ""}`}
            href={googleLoginUrl}
            onClick={handlePreventIfChecking}
            aria-disabled={isChecking}
          >
            {t("구글 로그인")}
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;
