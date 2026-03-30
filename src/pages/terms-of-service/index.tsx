import { useTranslation } from 'i18nexus';
import { Link } from 'react-router-dom';

/** 서비스 이용약관 — privacy-policy와 동일한 좌우 분할 레이아웃 */
const TermsOfService = () => {
  const { t } = useTranslation('terms-of-service');

  const tocItems = [
    { id: 'section-1', label: t('1. 서비스 소개') },
    { id: 'section-2', label: t('2. 이용자의 의무') },
    { id: 'section-3', label: t('3. 파일 및 콘텐츠') },
    { id: 'section-4', label: t('4. 서비스 변경 및 중단') },
    { id: 'section-5', label: t('5. 면책 조항') },
    { id: 'section-6', label: t('6. 약관 변경') },
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
          <h1 className="mb-2 text-[28px] font-bold max-md:text-[22px]">{t('서비스 이용약관')}</h1>
          <p className="mb-3 text-[0.95rem] text-muted-foreground">{t('시행일: 2026-01-30')}</p>
          <p className="text-muted-foreground">
            {t(
              'Q-Asker(이하 "서비스")를 이용해 주셔서 감사합니다. 본 약관은 서비스 이용에 관한 조건을 규정합니다.',
            )}
          </p>
        </header>

        {/* 좌우 분할 레이아웃 */}
        <div className="flex gap-8 max-lg:flex-col max-lg:gap-6">
          {/* 목차 */}
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
            <section id="section-1" className="mb-8 scroll-mt-8">
              <h2 className="mb-3 text-lg font-semibold text-foreground max-md:text-base">
                {t('1. 서비스 소개')}
              </h2>
              <ul className="m-0 pl-5 text-muted-foreground">
                <li className="mb-2">
                  {t(
                    'Q-Asker는 PDF, PPT, Word 파일을 업로드하면 AI가 자동으로 퀴즈를 생성해주는 무료 웹 서비스입니다.',
                  )}
                </li>
                <li className="mb-2">
                  {t('객관식, OX, 빈칸 채우기 등 다양한 유형의 퀴즈를 지원합니다.')}
                </li>
                <li className="mb-2">
                  {t('회원가입 없이 이용 가능하며, 로그인 시 퀴즈 기록 저장 기능이 제공됩니다.')}
                </li>
              </ul>
            </section>

            <section id="section-2" className="mb-8 scroll-mt-8">
              <h2 className="mb-3 text-lg font-semibold text-foreground max-md:text-base">
                {t('2. 이용자의 의무')}
              </h2>
              <ul className="m-0 pl-5 text-muted-foreground">
                <li className="mb-2">{t('서비스를 불법적 목적으로 사용하지 않아야 합니다.')}</li>
                <li className="mb-2">
                  {t('타인의 저작권을 침해하는 파일을 업로드하지 않아야 합니다.')}
                </li>
                <li className="mb-2">
                  {t('서비스의 정상적인 운영을 방해하는 행위를 하지 않아야 합니다.')}
                </li>
                <li className="mb-2">
                  {t('자동화된 수단으로 서비스에 접근하거나 데이터를 수집하지 않아야 합니다.')}
                </li>
              </ul>
            </section>

            <section id="section-3" className="mb-8 scroll-mt-8">
              <h2 className="mb-3 text-lg font-semibold text-foreground max-md:text-base">
                {t('3. 파일 및 콘텐츠')}
              </h2>
              <ul className="m-0 pl-5 text-muted-foreground">
                <li className="mb-2">{t('업로드한 파일은 퀴즈 생성 목적으로만 처리됩니다.')}</li>
                <li className="mb-2">{t('파일은 처리 후 24시간 이내 자동 삭제됩니다.')}</li>
                <li className="mb-2">
                  {t('업로드한 파일은 상업적 목적이나 AI 학습에 사용되지 않습니다.')}
                </li>
                <li className="mb-2">
                  {t(
                    '파일의 저작권은 이용자에게 있으며, 서비스는 퀴즈 생성을 위한 일시적 이용 권한만 갖습니다.',
                  )}
                </li>
              </ul>
            </section>

            <section id="section-4" className="mb-8 scroll-mt-8">
              <h2 className="mb-3 text-lg font-semibold text-foreground max-md:text-base">
                {t('4. 서비스 변경 및 중단')}
              </h2>
              <ul className="m-0 pl-5 text-muted-foreground">
                <li className="mb-2">
                  {t('서비스는 사전 고지 없이 기능을 변경하거나 중단할 수 있습니다.')}
                </li>
                <li className="mb-2">
                  {t(
                    '천재지변, 시스템 장애 등 불가항력으로 인한 서비스 중단에 대해 책임지지 않습니다.',
                  )}
                </li>
              </ul>
            </section>

            <section id="section-5" className="mb-8 scroll-mt-8">
              <h2 className="mb-3 text-lg font-semibold text-foreground max-md:text-base">
                {t('5. 면책 조항')}
              </h2>
              <ul className="m-0 pl-5 text-muted-foreground">
                <li className="mb-2">
                  {t(
                    'AI가 생성한 퀴즈의 정확성을 보장하지 않습니다. 학습 보조 도구로 활용해 주세요.',
                  )}
                </li>
                <li className="mb-2">
                  {t('서비스 이용으로 인한 간접적, 부수적 손해에 대해 책임지지 않습니다.')}
                </li>
              </ul>
            </section>

            <section id="section-6" className="mb-8 scroll-mt-8">
              <h2 className="mb-3 text-lg font-semibold text-foreground max-md:text-base">
                {t('6. 약관 변경')}
              </h2>
              <ul className="m-0 pl-5 text-muted-foreground">
                <li className="mb-2">
                  {t(
                    '본 약관은 서비스 개선에 따라 변경될 수 있으며, 변경 시 서비스 내 공지합니다.',
                  )}
                </li>
                <li className="mb-2">
                  {t('변경된 약관에 동의하지 않을 경우 서비스 이용을 중단할 수 있습니다.')}
                </li>
              </ul>
            </section>

            <section id="section-7" className="mb-8 scroll-mt-8">
              <h2 className="mb-3 text-lg font-semibold text-foreground max-md:text-base">
                {t('7. 문의처')}
              </h2>
              <p className="text-muted-foreground">{t('이메일: inhapj01@gmail.com')}</p>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
