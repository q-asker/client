import React, { useState } from 'react';
import { useTranslation, useLanguageSwitcher } from 'i18nexus';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Globe, ChevronUp, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/shared/ui/lib/utils';
import { useClickOutside } from '#shared/lib/useClickOutside';

/**
 * frontend-design A안: 미니멀 라인 + 타이포그래피 중심
 */
const Footer = () => {
  const { t, currentLanguage } = useTranslation('common');
  const { changeLanguage } = useLanguageSwitcher();
  const location = useLocation();
  const navigate = useNavigate();
  const [isLangOpen, setIsLangOpen] = useState(false);

  const handleLanguageChange = (lang: string) => {
    if (location.pathname === '/' || location.pathname === '/ko' || location.pathname === '/en') {
      const targetPath = lang === 'en' ? '/en' : '/ko';
      if (location.pathname !== targetPath) {
        navigate(targetPath, { replace: true });
        return;
      }
    }
    changeLanguage(lang);
    setIsLangOpen(false);
  };

  useClickOutside({
    containerId: ['footerLangDropdown'],
    triggerId: ['footerLangButton'],
    onOutsideClick: () => setIsLangOpen(false),
    isEnabled: isLangOpen,
  });

  return (
    <footer className="mt-8 border-t border-foreground/20 pb-16 md:pb-0">
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          {/* 좌측: 브랜드 및 언어 선택 */}
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-foreground">
              Q-Asker
            </span>
            <p className="mt-2 text-xs text-muted-foreground">© {new Date().getFullYear()}</p>

            {/* 언어 선택 드롭다운 */}
            <div className="relative mt-4">
              <button
                id="footerLangButton"
                type="button"
                onClick={() => setIsLangOpen((prev) => !prev)}
                className="flex cursor-pointer items-center gap-2 rounded-md border border-border/50 bg-transparent px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground"
              >
                <Globe className="size-3.5" />
                <span>{currentLanguage === 'ko' ? '한국어' : 'English'}</span>
                <ChevronUp
                  className={cn(
                    'size-3 transition-transform duration-200',
                    isLangOpen ? 'rotate-0' : 'rotate-180',
                  )}
                />
              </button>

              <AnimatePresence>
                {isLangOpen && (
                  <motion.div
                    id="footerLangDropdown"
                    initial={{ opacity: 0, scale: 0.96, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 8 }}
                    transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute bottom-full left-0 z-[1001] mb-2 min-w-[120px] overflow-hidden rounded-lg border border-border bg-card shadow-xl"
                  >
                    <div className="p-1">
                      {(['ko', 'en'] as const).map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => handleLanguageChange(lang)}
                          className={cn(
                            'flex w-full cursor-pointer items-center justify-between rounded-md border-none bg-transparent px-2.5 py-2 text-left text-xs font-medium transition-colors',
                            currentLanguage === lang
                              ? 'bg-primary/10 text-primary'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                          )}
                        >
                          {lang === 'ko' ? '한국어' : 'English'}
                          {currentLanguage === lang && <Check className="size-3" />}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* 중앙: 문의 및 피드백 */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              {t('문의 및 피드백')}
            </span>
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSfibmR4WmBghb74tM0ugldhiutitTsJJx3KN5wYHINpr5GRnw/viewform?usp=dialog"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-foreground no-underline transition-colors duration-200 hover:underline"
            >
              {t('구글 폼 링크')}
            </a>
            <a
              href="mailto:contact@q-asker.com"
              aria-label={t('Q-Asker 이메일 문의')}
              className="text-sm text-foreground no-underline transition-colors duration-200 hover:underline"
            >
              contact@q-asker.com
            </a>
          </div>

          {/* 우측: 법적 */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              Legal
            </span>
            <Link
              to="/terms-of-service"
              className="text-sm text-foreground no-underline transition-colors duration-200 hover:underline"
            >
              {t('서비스 이용약관')}
            </Link>
            <Link
              to="/privacy-policy"
              className="text-sm text-foreground no-underline transition-colors duration-200 hover:underline"
            >
              {t('개인정보 처리방침')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
