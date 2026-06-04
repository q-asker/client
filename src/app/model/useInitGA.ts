import { useEffect } from 'react';
import { initGA } from '#shared/lib/analytics';

const isPrerender = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return /HeadlessChrome|Prerender|Puppeteer/i.test(navigator.userAgent);
};

export const useInitGA = (measurementId: string | undefined): void => {
  useEffect(() => {
    if (!measurementId) return;
    if (isPrerender()) return;
    initGA(measurementId);
  }, [measurementId]);
};
