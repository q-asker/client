import { useTranslation } from 'i18nexus';
import { useEffect } from 'react';
import type { AxiosResponse } from 'axios';
import { authService } from '#entities/auth';
import { normalizeLastEndpoint, readLastEndpoint } from '#shared/lib/lastEndpointStorage';

interface UseLoginRedirectParams {
  navigate: (to: string, options?: { replace?: boolean }) => void;
}

let refreshPromise: Promise<AxiosResponse> | null = null;

const refreshOnce = async (): Promise<AxiosResponse> => {
  if (!refreshPromise) {
    refreshPromise = authService.refresh().catch((error: unknown) => {
      refreshPromise = null;
      throw error;
    });
  }

  return refreshPromise;
};

export const useLoginRedirect = ({ navigate }: UseLoginRedirectParams) => {
  const { t } = useTranslation('login-redirect');
  useEffect(() => {
    let isMounted = true;

    const redirectAfterRefresh = async () => {
      let refreshSucceeded = true;
      try {
        await refreshOnce();
      } catch (error) {
        refreshSucceeded = false;
        console.error(t('로그인 리다이렉트 실패:'), error);
      }

      if (!refreshSucceeded) {
        if (isMounted) {
          navigate('/login', { replace: true });
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
  }, [navigate, t]);

  return {
    actions: {},
    state: {},
  };
};
