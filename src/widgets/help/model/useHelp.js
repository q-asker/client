import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackHelpEvents } from "#shared/lib/analytics";

export const useHelp = () => {
  const location = useLocation();
  const startTimeRef = useRef(Date.now());
  const scrollTrackingRef = useRef({
    25: false,
    50: false,
    75: false,
    100: false,
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const source =
      urlParams.get("source") ||
      (document.referrer.includes("/") ? "header" : "direct");
    trackHelpEvents.viewHelp(source);
  }, [location]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const scrollPercent = Math.round((scrollTop / docHeight) * 100);

      Object.keys(scrollTrackingRef.current).forEach((threshold) => {
        if (
          scrollPercent >= parseInt(threshold) &&
          !scrollTrackingRef.current[threshold]
        ) {
          scrollTrackingRef.current[threshold] = true;
          trackHelpEvents.trackScrollDepth(parseInt(threshold));
        }
      });
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    return () => {
      const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
      if (timeSpent > 5) {
        trackHelpEvents.trackTimeSpent(timeSpent);
      }
    };
  }, []);

  const handleSectionHover = (sectionName) => {
    trackHelpEvents.interactWithSection(sectionName);
  };

  return {
    state: {},
    actions: { handleSectionHover },
  };
};
