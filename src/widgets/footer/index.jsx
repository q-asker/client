import { useTranslation } from 'i18nexus';
import { Link } from 'react-router-dom';
import './index.css';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <div className="footer">
      © {new Date().getFullYear()} Q-Asker{' | '}
      <Link to="/privacy-policy" className="policy-link">
        {t('개인정보 처리방침')}
      </Link>
      <br></br>
      {t('문의 및 피드백')}
      <span>: </span>
      <a
        href="https://docs.google.com/forms/d/e/1FAIpQLSfibmR4WmBghb74tM0ugldhiutitTsJJx3KN5wYHINpr5GRnw/viewform?usp=dialog"
        target="_blank"
        rel="noopener noreferrer"
      >
        {t('구글 폼 링크')}
      </a>
      <span>, </span>
      <a href="mailto:inhapj01@gmail.com" aria-label={t('Q-Asker 이메일 문의')}>
        inhapj01@gmail.com
      </a>
    </div>
  );
};

export default Footer;
