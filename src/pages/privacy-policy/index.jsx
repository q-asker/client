import React from 'react';
import { useTranslation } from 'i18nexus';
import { Link } from 'react-router-dom';
import './index.css';

const PrivacyPolicy = () => {
  const { t } = useTranslation();

  return (
    <div className="policy-page">
      <div className="policy-container">
        <div className="policy-actions">
          <Link to="/" className="policy-back-link">
            ← {t('홈으로')}
          </Link>
        </div>
        <header className="policy-header">
          <h1>{t('개인정보 처리방침')}</h1>
          <p className="policy-effective-date">{t('시행일: 2026-01-30')}</p>
          <p className="policy-intro">
            {t(
              'Q-Asker(이하 "서비스")는 이용자의 개인정보를 소중히 보호하며 관련 법령을 준수합니다.',
            )}
          </p>
        </header>

        <section className="policy-section">
          <h2>{t('1. 수집하는 개인정보')}</h2>
          <ul>
            <li>{t('문의 시: 이메일 주소, 문의 내용')}</li>
            <li>{t('서비스 이용 시 자동 수집: IP 주소, 브라우저 정보, 접속 로그')}</li>
            <li>{t('업로드한 파일: 퀴즈 생성 목적의 처리 과정에서 일시적으로 저장')}</li>
          </ul>
        </section>

        <section className="policy-section">
          <h2>{t('2. 개인정보의 이용 목적')}</h2>
          <ul>
            <li>{t('문의 및 고객지원 대응')}</li>
            <li>{t('서비스 제공 및 기능 개선')}</li>
            <li>{t('보안 및 부정 이용 방지')}</li>
          </ul>
        </section>

        <section className="policy-section">
          <h2>{t('3. 보관 및 이용 기간')}</h2>
          <ul>
            <li>{t('업로드한 파일은 처리 후 24시간 이내 자동 삭제됩니다.')}</li>
            <li>{t('그 외 정보는 목적 달성 시 지체 없이 파기합니다.')}</li>
          </ul>
        </section>

        <section className="policy-section">
          <h2>{t('4. 제3자 제공')}</h2>
          <ul>
            <li>{t('원칙적으로 제3자에게 제공하지 않습니다.')}</li>
            <li>{t('다만, 법령에 따라 요청되는 경우 제공될 수 있습니다.')}</li>
          </ul>
        </section>

        <section className="policy-section">
          <h2>{t('5. 개인정보 처리 위탁')}</h2>
          <ul>
            <li>{t('서비스 운영에 필요한 범위 내에서 일부 업무를 위탁할 수 있습니다.')}</li>
            <li>{t('위탁 시 관련 법령에 따라 관리·감독합니다.')}</li>
          </ul>
        </section>

        <section className="policy-section">
          <h2>{t('6. 이용자 권리')}</h2>
          <ul>
            <li>{t('개인정보 열람, 정정, 삭제를 요청할 수 있습니다.')}</li>
            <li>{t('문의는 아래 연락처로 접수됩니다.')}</li>
          </ul>
        </section>

        <section className="policy-section">
          <h2>{t('7. 문의처')}</h2>
          <p>{t('이메일: inhapj01@gmail.com')}</p>
        </section>

        <p className="policy-notice">
          {t('본 방침은 서비스 개선에 따라 변경될 수 있으며, 변경 시 공지합니다.')}
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
