import { useEffect } from "react";
import { authService } from "#entities/auth";
import CustomToast from "#shared/toast";
import {
  normalizeLastEndpoint,
  readLastEndpoint,
} from "#shared/lib/lastEndpointStorage";

export const useLoginRedirect = ({ navigate }) => {
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

      const targetEndpoint = normalizeLastEndpoint(readLastEndpoint());

      if (isMounted) {
        navigate(targetEndpoint, { replace: true });
      }
    };

    redirectAfterRefresh();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  return {
    actions: {},
    state: {},
  };
};
