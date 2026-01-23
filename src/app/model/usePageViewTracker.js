import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { logPageView } from "#shared/lib/analytics";
import { getPageTitle } from "./pageTitles";
import { writeLastEndpoint } from "#shared/lib/lastEndpointStorage";

export const usePageViewTracker = () => {
  const location = useLocation();

  useEffect(() => {
    const pageTitle = getPageTitle(location.pathname);
    const pathWithSearch = location.pathname + location.search;
    logPageView(pathWithSearch, pageTitle);

    if (!location.pathname.startsWith("/login")) {
      writeLastEndpoint(pathWithSearch);
    }
  }, [location]);
};
