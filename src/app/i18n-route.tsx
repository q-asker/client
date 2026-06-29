import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguageSwitcher, useTranslation } from 'i18nexus';

const SUPPORTED_LANGUAGES = new Set(['ko', 'en']);

export const LanguageRouteSync = () => {
  const { changeLanguage } = useLanguageSwitcher();
  const { currentLanguage } = useTranslation('common');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === '/') {
      const userAgent = window.navigator?.userAgent ?? '';
      const isBot =
        /bot|crawler|spider|googlebot|bingbot|yandex|baiduspider|duckduckbot|slurp|facebookexternalhit|twitterbot|rogerbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest|slackbot|vkshare|w3c_validator|HeadlessChrome/i.test(
          userAgent,
        );
      if (isBot) {
        return;
      }
      const browserLang = window.navigator?.language?.toLowerCase() ?? '';
      if (browserLang.startsWith('en')) {
        navigate('/en', { replace: true });
        return;
      }
    }
    const path = location.pathname;
    const langFromPath = path === '/en' ? 'en' : path === '/ko' ? 'ko' : null;
    if (!langFromPath || !SUPPORTED_LANGUAGES.has(langFromPath)) return;
    if (currentLanguage === langFromPath) return;
    changeLanguage(langFromPath);
  }, [changeLanguage, currentLanguage, location.pathname, navigate]);

  return null;
};

export const getInitialLanguage = (): string => {
  if (typeof window === 'undefined') return 'ko';
  const path = window.location.pathname;
  const langFromPath = path === '/en' ? 'en' : path === '/ko' ? 'ko' : null;
  return langFromPath ?? 'ko';
};
