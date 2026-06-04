import { useEffect } from 'react';
import { initClarity } from '#shared/lib/clarity';

const isPrerender = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return /HeadlessChrome|Prerender|Puppeteer/i.test(navigator.userAgent);
};

export const useInitClarity = (projectId: string | undefined): void => {
  useEffect(() => {
    if (!projectId) return;
    if (isPrerender()) return;
    initClarity(projectId);
  }, [projectId]);
};
