import { useTranslation } from 'i18nexus';
import { Link } from 'react-router-dom';

/** DesignB: 좌우 분할 — sticky 목차 + 본문 스크롤 */
const PrivacyPolicy = () => {
  const { t } = useTranslation('privacy-policy');

  /** 목차 데이터 */
  const tocItems = [
    { id: 'section-1', label: t('1. 수집하는 개인정보') },
    { id: 'section-2', label: t('2. 개인정보의 이용 목적') },
    { id: 'section-3', label: t('3. 보관 및 이용 기간') },
    { id: 'section-4', label: t('4. 제3자 제공') },
    { id: 'section-5', label: t('5. 개인정보 처리 위탁') },
    { id: 'section-6', label: t('6. 이용자 권리') },
    { id: 'section-7', label: t('7. 문의처') },
  ];

  return (
    <div className="min-h-screen bg-background px-4 pb-12 pt-8 max-md:px-3 max-md:pb-9 max-md:pt-6">
      <div className="mx-auto max-w-[1080px] leading-[1.7] text-foreground">
        {/* 홈 링크 */}
        <div className="mb-4 flex justify-start">
          <Link to="/" className="font-semibold text-primary no-underline hover:underline">
            ← {t('홈으로')}
          </Link>
        </div>

        {/* 헤더 */}
        <header className="mb-8 border-b border-border pb-6">
          <h1 className="mb-2 text-[28px] font-bold max-md:text-[22px]">
            {t('개인정보 처리방침')}
          </h1>
          <p className="mb-3 text-[0.95rem] text-muted-foreground">{t('시행일: 2026-01-30')}</p>
          <p className="text-muted-foreground">
            {t(
              'Q-Asker(이하 "서비스")는 이용자의 개인정보를 소중히 보호하며 관련 법령을 준수합니다.',
            )}
          </p>
        </header>

        {/* 좌우 분할 레이아웃 */}
        <div className="flex gap-8 max-lg:flex-col max-lg:gap-6">
          {/* 목차 (lg 이상: sticky 사이드바, 모바일: 상단 블록) */}
          <nav className="w-56 shrink-0 max-lg:w-full">
            <div className="top-8 max-lg:static lg:sticky">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {t('목차')}
              </h2>
              <ul className="m-0 flex list-none flex-col gap-1 p-0 max-lg:flex-row max-lg:flex-wrap max-lg:gap-2">
                {tocItems.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="block rounded-md px-3 py-1.5 text-sm text-muted-foreground no-underline transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          {/* 본문 */}
          <main className="min-w-0 flex-1">
            {/* 섹션 1 */}
            <section id="section-1" className="mb-8 scroll-mt-8">
              <h2 className="mb-3 text-lg font-semibold text-foreground max-md:text-base">
                {t('1. 수집하는 개인정보')}
              </h2>
              <ul className="m-0 pl-5 text-muted-foreground">
                <li className="mb-2">{t('문의 시: 이메일 주소, 문의 내용')}</li>
                <li className="mb-2">
                  {t('서비스 이용 시 자동 수집: IP 주소, 브라우저 정보, 접속 로그')}
                </li>
                <li className="mb-2">
                  {t('업로드한 파일: 퀴즈 생성 목적의 처리 과정에서 일시적으로 저장')}
                </li>
              </ul>
            </section>

            {/* 섹션 2 */}
            <section id="section-2" className="mb-8 scroll-mt-8">
              <h2 className="mb-3 text-lg font-semibold text-foreground max-md:text-base">
                {t('2. 개인정보의 이용 목적')}
              </h2>
              <ul className="m-0 pl-5 text-muted-foreground">
                <li className="mb-2">{t('문의 및 고객지원 대응')}</li>
                <li className="mb-2">{t('서비스 제공 및 기능 개선')}</li>
                <li className="mb-2">{t('보안 및 부정 이용 방지')}</li>
              </ul>
            </section>

            {/* 섹션 3 */}
            <section id="section-3" className="mb-8 scroll-mt-8">
              <h2 className="mb-3 text-lg font-semibold text-foreground max-md:text-base">
                {t('3. 보관 및 이용 기간')}
              </h2>
              <ul className="m-0 pl-5 text-muted-foreground">
                <li className="mb-2">
                  {t('업로드한 파일은 처리 후 24시간 이내 자동 삭제됩니다.')}
                </li>
                <li className="mb-2">{t('그 외 정보는 목적 달성 시 지체 없이 파기합니다.')}</li>
              </ul>
            </section>

            {/* 섹션 4 */}
            <section id="section-4" className="mb-8 scroll-mt-8">
              <h2 className="mb-3 text-lg font-semibold text-foreground max-md:text-base">
                {t('4. 제3자 제공')}
              </h2>
              <ul className="m-0 pl-5 text-muted-foreground">
                <li className="mb-2">{t('원칙적으로 제3자에게 제공하지 않습니다.')}</li>
                <li className="mb-2">{t('다만, 법령에 따라 요청되는 경우 제공될 수 있습니다.')}</li>
              </ul>
            </section>

            {/* 섹션 5 */}
            <section id="section-5" className="mb-8 scroll-mt-8">
              <h2 className="mb-3 text-lg font-semibold text-foreground max-md:text-base">
                {t('5. 개인정보 처리 위탁')}
              </h2>
              <ul className="m-0 pl-5 text-muted-foreground">
                <li className="mb-2">
                  {t('서비스 운영에 필요한 범위 내에서 일부 업무를 위탁할 수 있습니다.')}
                </li>
                <li className="mb-2">{t('위탁 시 관련 법령에 따라 관리·감독합니다.')}</li>
              </ul>
            </section>

            {/* 섹션 6 */}
            <section id="section-6" className="mb-8 scroll-mt-8">
              <h2 className="mb-3 text-lg font-semibold text-foreground max-md:text-base">
                {t('6. 이용자 권리')}
              </h2>
              <ul className="m-0 pl-5 text-muted-foreground">
                <li className="mb-2">{t('개인정보 열람, 정정, 삭제를 요청할 수 있습니다.')}</li>
                <li className="mb-2">{t('문의는 아래 연락처로 접수됩니다.')}</li>
              </ul>
            </section>

            {/* 섹션 7 */}
            <section id="section-7" className="mb-8 scroll-mt-8">
              <h2 className="mb-3 text-lg font-semibold text-foreground max-md:text-base">
                {t('7. 문의처')}
              </h2>
              <p className="text-muted-foreground">{t('이메일: inhapj01@gmail.com')}</p>
            </section>

            {/* 푸터 */}
            <p className="mt-6 border-t border-border pt-6 text-muted-foreground">
              {t('본 방침은 서비스 개선에 따라 변경될 수 있으며, 변경 시 공지합니다.')}
            </p>
          </main>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
