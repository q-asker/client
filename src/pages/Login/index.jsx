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
    actions: { handleLogin },
  } = useLogin({ t, navigate });

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">Q-Asker</h1>
        <p className="login-subtitle">
          {t("로그인이 필요합니다.")}
        </p>
        <button
          className="login-button"
          onClick={handleLogin}
          disabled={isChecking}
        >
          {isChecking ? t("로그인 상태 확인 중...") : t("로그인")}
        </button>
      </div>
    </div>
  );
};

export default Login;
