import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "#shared/auth";
import CustomToast from "#shared/toast";

const LAST_ENDPOINT_STORAGE_KEY = "lastEndpoint";

const LoginRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const redirectAfterRefresh = async () => {
      let refreshSucceeded = true;
      try {
        await authService.refresh();
      } catch (error) {
        refreshSucceeded = false;
        console.error("로그인 리다이렉트 실패:", error);
      }

      if (!refreshSucceeded) {
        if (isMounted) {
          CustomToast.error("로그인에 실패했습니다. 다시 로그인해주세요.");
          navigate("/login", { replace: true });
        }
        return;
      }

      const storedEndpoint = localStorage.getItem(LAST_ENDPOINT_STORAGE_KEY);
      const isInvalidEndpoint =
        !storedEndpoint ||
        storedEndpoint.startsWith("/login") ||
        storedEndpoint === "/login/redirect";
      const targetEndpoint = isInvalidEndpoint ? "/" : storedEndpoint;

      if (isMounted) {
        navigate(targetEndpoint, { replace: true });
      }
    };

    redirectAfterRefresh();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  return <div>로그인 처리 중...</div>;
};

export default LoginRedirect;
