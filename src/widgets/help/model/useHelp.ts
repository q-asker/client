import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { trackHelpEvents } from '#shared/lib/analytics';

interface ScrollTracking {
  25: boolean;
  50: boolean;
  75: boolean;
  100: boolean;
}

interface UseHelpReturn {
  state: Record<string, never>;
  actions: {
    handleSectionHover: (sectionName: string) => void;
  };
}

export const useHelp = (): UseHelpReturn => {
  const location = useLocation();
  const startTimeRef = useRef(Date.now());
  const scrollTrackingRef = useRef<ScrollTracking>({
    25: false,
    50: false,
    75: false,
    100: false,
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const source =
      urlParams.get('source') || (document.referrer.includes('/') ? 'header' : 'direct');
    trackHelpEvents.viewHelp(source);
  }, [location]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const scrollPercent = Math.round((scrollTop / docHeight) * 100);

      (Object.keys(scrollTrackingRef.current) as Array<keyof ScrollTracking>).forEach(
        (threshold) => {
          const numThreshold = Number(threshold);
          if (scrollPercent >= numThreshold && !scrollTrackingRef.current[threshold]) {
            scrollTrackingRef.current[threshold] = true;
            trackHelpEvents.trackScrollDepth(numThreshold);
          }
        },
      );
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    return () => {
      const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
      if (timeSpent > 5) {
        trackHelpEvents.trackTimeSpent(timeSpent);
      }
    };
  }, []);

  const handleSectionHover = (sectionName: string) => {
    trackHelpEvents.interactWithSection(sectionName);
  };

  return {
    state: {},
    actions: { handleSectionHover },
  };
};
