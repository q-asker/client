import { useEffect, useState } from "react";
import { authService, useAuthStore } from "#entities/auth";
import CustomToast from "#shared/toast";
import {
  normalizeLastEndpoint,
  readLastEndpoint,
} from "#shared/lib/lastEndpointStorage";

const buildLoginUrl = () => {
  const baseUrl = import.meta.env.VITE_BASE_URL || "";
  const normalizedBaseUrl = baseUrl.endsWith("/")
    ? baseUrl.slice(0, -1)
    : baseUrl;
  return `${normalizedBaseUrl}/auth/login`;
};

export const useLogin = ({ t, navigate }) => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        await authService.refresh();
        if (!isMounted) return;
        const targetEndpoint = normalizeLastEndpoint(readLastEndpoint());
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
    const targetEndpoint = normalizeLastEndpoint(readLastEndpoint());
    navigate(targetEndpoint, { replace: true });
  }, [accessToken, navigate]);

  const handleLogin = () => {
    try {
      window.location.assign(buildLoginUrl());
    } catch (error) {
      CustomToast.error(t("로그인에 실패했습니다. 다시 시도해주세요."));
    }
  };

  return {
    state: { isChecking },
    actions: { handleLogin },
  };
};
