import { useTranslation } from "i18nexus";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService, useAuthStore } from "#shared/auth";
import CustomToast from "#shared/toast";
import "./index.css";

const LAST_ENDPOINT_STORAGE_KEY = "lastEndpoint";

const buildLoginUrl = () => {
  const baseUrl = import.meta.env.VITE_BASE_URL || "";
  const normalizedBaseUrl = baseUrl.endsWith("/")
    ? baseUrl.slice(0, -1)
    : baseUrl;
  return `${normalizedBaseUrl}/auth/login`;
};

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const accessToken = useAuthStore((state) => state.accessToken);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        await authService.refresh();
        if (!isMounted) return;
        const storedEndpoint =
          localStorage.getItem(LAST_ENDPOINT_STORAGE_KEY) || "/";
        const targetEndpoint = storedEndpoint.startsWith("/login")
          ? "/"
          : storedEndpoint;
        navigate(targetEndpoint, { replace: true });
      } catch (error) {
        if (isMounted) {
          setIsChecking(false);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  useEffect(() => {
    if (!accessToken) return;
    const storedEndpoint =
      localStorage.getItem(LAST_ENDPOINT_STORAGE_KEY) || "/";
    const targetEndpoint = storedEndpoint.startsWith("/login")
      ? "/"
      : storedEndpoint;
    navigate(targetEndpoint, { replace: true });
  }, [accessToken, navigate]);

  const handleLogin = () => {
    try {
      window.location.assign(buildLoginUrl());
    } catch (error) {
      CustomToast.error(t("로그인에 실패했습니다. 다시 시도해주세요."));
    }
  };

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
