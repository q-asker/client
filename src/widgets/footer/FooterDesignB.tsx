import { useTranslation } from 'i18nexus';
import { Link } from 'react-router-dom';

/**
 * frontend-design B안: 다크 Footer + 그라데이션 링크
 * - 다크 배경으로 본문과 명확한 영역 분리
 * - 브랜드 그라데이션 링크 텍스트
 * - 컴팩트한 1행 레이아웃 (데스크탑)
 */
const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="mt-8 bg-primary">
      <div className="mx-auto max-w-5xl px-4 py-6 md:px-6">
        <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
          {/* 좌측: 저작권 + 개인정보 */}
          <div className="flex items-center gap-3 text-sm text-primary-foreground/50">
            <span>© {new Date().getFullYear()} Q-Asker</span>
            <span className="text-primary-foreground/20">|</span>
            <Link
              to="/privacy-policy"
              className="text-primary-foreground/50 no-underline transition-colors duration-200 hover:text-primary-foreground/80"
            >
              {t('개인정보 처리방침')}
            </Link>
          </div>

          {/* 우측: 피드백 링크 */}
          <div className="flex items-center gap-3 text-sm">
            <span className="text-primary-foreground/30">{t('문의 및 피드백')}</span>
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSfibmR4WmBghb74tM0ugldhiutitTsJJx3KN5wYHINpr5GRnw/viewform?usp=dialog"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary-foreground/70 no-underline transition-opacity duration-200 hover:opacity-80"
            >
              {t('구글 폼 링크')}
            </a>
            <a
              href="mailto:inhapj01@gmail.com"
              aria-label={t('Q-Asker 이메일 문의')}
              className="font-medium text-primary-foreground/70 no-underline transition-opacity duration-200 hover:opacity-80"
            >
              inhapj01@gmail.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
