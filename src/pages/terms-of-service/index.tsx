import { useTranslation } from 'i18nexus';
import { Link } from 'react-router-dom';

/** 서비스 이용약관 — privacy-policy와 동일한 좌우 분할 레이아웃 */
const TermsOfService = () => {
  const { t } = useTranslation('terms-of-service');

  const tocItems = [
    { id: 'section-1', label: t('1. 서비스 소개') },
    { id: 'section-2', label: t('2. 회원가입 및 계정') },
    { id: 'section-3', label: t('3. 회원 탈퇴') },
    { id: 'section-4', label: t('4. 이용자의 의무') },
    { id: 'section-5', label: t('5. 파일 및 콘텐츠') },
    { id: 'section-6', label: t('6. AI 생성 결과의 특성') },
    { id: 'section-7', label: t('7. 서비스 제공·변경·중단 및 면책') },
    { id: 'section-8', label: t('8. 약관 변경 및 분쟁 해결') },
    { id: 'section-9', label: t('9. 문의처') },
  ];

  const sectionHeading = 'mb-3 text-lg font-semibold text-foreground max-md:text-base';
  const sectionWrap = 'mb-8 scroll-mt-8';
  const bulletList = 'm-0 list-disc pl-5 text-muted-foreground';

  return (
    <div className="min-h-screen bg-background px-4 pb-12 pt-8 max-md:px-3 max-md:pb-9 max-md:pt-6">
      <div className="mx-auto max-w-[1080px] leading-[1.7] text-foreground">
        <div className="mb-4 flex justify-start">
          <Link to="/" className="font-semibold text-primary no-underline hover:underline">
            ← {t('홈으로')}
          </Link>
        </div>

        <header className="mb-8 border-b border-border pb-6">
          <h1 className="mb-2 text-[28px] font-bold max-md:text-[22px]">{t('서비스 이용약관')}</h1>
          <p className="mb-3 text-[0.95rem] text-muted-foreground">{t('시행일: 2026-05-29')}</p>
          <p className="text-muted-foreground">
            {t(
              'Q-Asker(이하 "서비스")를 이용해 주셔서 감사합니다. 본 약관은 서비스 이용 조건을 규정합니다.',
            )}
          </p>
        </header>

        <div className="flex gap-8 max-lg:flex-col max-lg:gap-6">
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

          <main className="min-w-0 flex-1">
            {/* 섹션 1 */}
            <section id="section-1" className={sectionWrap}>
              <h2 className={sectionHeading}>{t('1. 서비스 소개')}</h2>
              <p className="text-muted-foreground">
                {t(
                  'Q-Asker는 학습 자료를 업로드하면 AI가 자동으로 다양한 유형의 퀴즈를 생성하는 무료 웹 서비스입니다. 회원가입 없이 이용 가능하며, 로그인 시 풀이 기록 저장 등의 기능이 제공됩니다.',
                )}
              </p>
            </section>

            {/* 섹션 2 */}
            <section id="section-2" className={sectionWrap}>
              <h2 className={sectionHeading}>{t('2. 회원가입 및 계정')}</h2>
              <ul className={bulletList}>
                <li className="mb-2">{t('Q-Asker는 소셜 로그인만 지원합니다.')}</li>
                <li className="mb-2">
                  {t(
                    '닉네임은 이용자가 변경할 수 있으며, 타인 사칭·욕설·혐오 표현은 서비스가 제한·변경할 수 있습니다.',
                  )}
                </li>
                <li className="mb-2">{t('본 서비스는 만 14세 이상을 대상으로 합니다.')}</li>
              </ul>
            </section>

            {/* 섹션 3 */}
            <section id="section-3" className={sectionWrap}>
              <h2 className={sectionHeading}>{t('3. 회원 탈퇴')}</h2>
              <ul className={bulletList}>
                <li className="mb-2">
                  {t(
                    '회원 탈퇴는 contact@q-asker.com 으로 요청하며, 영업일 기준 7일 이내 처리됩니다.',
                  )}
                </li>
              </ul>
            </section>

            {/* 섹션 4 */}
            <section id="section-4" className={sectionWrap}>
              <h2 className={sectionHeading}>{t('4. 이용자의 의무')}</h2>
              <p className="mb-2 text-muted-foreground">
                {t('이용자는 다음 행위를 하지 않아야 합니다.')}
              </p>
              <ul className={bulletList}>
                <li className="mb-2">{t('서비스를 불법·비윤리적 목적으로 사용')}</li>
                <li className="mb-2">{t('타인의 저작권·초상권·상표권을 침해하는 파일 업로드')}</li>
                <li className="mb-2">{t('음란·폭력·차별·혐오 콘텐츠 생성·게시')}</li>
                <li className="mb-2">
                  {t(
                    '자동화된 수단(크롤러, 봇, 스크립트)으로 접근하거나 Rate Limit을 우회하는 행위',
                  )}
                </li>
                <li className="mb-2">{t('AI 생성 결과의 상업적 재판매·무단 대량 배포')}</li>
                <li className="mb-2">{t('타 이용자의 계정·기록을 무단 조회·변경하려는 시도')}</li>
              </ul>
              <p className="mt-3 text-muted-foreground">
                {t(
                  '위반 시 서비스는 사전 통지 없이 이용을 제한·정지하거나 계정을 삭제할 수 있습니다.',
                )}
              </p>
            </section>

            {/* 섹션 5 */}
            <section id="section-5" className={sectionWrap}>
              <h2 className={sectionHeading}>{t('5. 파일 및 콘텐츠')}</h2>
              <ul className={bulletList}>
                <li className="mb-2">
                  {t(
                    '업로드한 파일은 퀴즈 생성 목적으로만 처리되며, AI 학습 데이터로 사용되지 않습니다.',
                  )}
                </li>
                <li className="mb-2">{t('파일은 최대 1일 후 자동 삭제됩니다.')}</li>
                <li className="mb-2">
                  {t(
                    '파일의 저작권은 이용자에게 있으며, 서비스는 위 목적 범위 내 일시적 이용권만 가집니다.',
                  )}
                </li>
                <li className="mb-2">{t('저작권 침해 신고는 문의처로 접수해 주시기 바랍니다.')}</li>
              </ul>
            </section>

            {/* 섹션 6 */}
            <section id="section-6" className={sectionWrap}>
              <h2 className={sectionHeading}>{t('6. AI 생성 결과의 특성')}</h2>
              <ul className={bulletList}>
                <li className="mb-2">
                  {t(
                    '퀴즈는 Google Gemini의 추론 결과이며, 서비스는 정확성·완전성을 보장하지 않습니다.',
                  )}
                </li>
                <li className="mb-2">
                  {t(
                    '사실 오류·편향·누락이 있을 수 있으므로 학습 보조 도구로만 활용하고, 중요한 용도(시험·평가 등)에는 반드시 직접 검증해야 합니다.',
                  )}
                </li>
                <li className="mb-2">{t('동일 자료에서도 호출마다 결과가 다를 수 있습니다.')}</li>
              </ul>
            </section>

            {/* 섹션 7 */}
            <section id="section-7" className={sectionWrap}>
              <h2 className={sectionHeading}>{t('7. 서비스 제공·변경·중단 및 면책')}</h2>
              <ul className={bulletList}>
                <li className="mb-2">
                  {t(
                    '서비스는 사전 고지 없이 서비스 일부 또는 전부의 기능을 변경·중단할 수 있습니다.',
                  )}
                </li>
                <li className="mb-2">
                  {t(
                    '외부 서비스(Google Gemini, OCI, GCS, Cloudflare 등)의 장애·정책 변경, 천재지변, 시스템 장애로 인한 손해에 대해 서비스는 책임지지 않습니다.',
                  )}
                </li>
                <li className="mb-2">
                  {t(
                    '무료로 제공되는 본 서비스의 이용으로 인한 직접·간접·부수적 손해에 대해 서비스의 고의 또는 중대한 과실이 없는 한 책임을 부담하지 않습니다.',
                  )}
                </li>
              </ul>
            </section>

            {/* 섹션 8 */}
            <section id="section-8" className={sectionWrap}>
              <h2 className={sectionHeading}>{t('8. 약관 변경 및 분쟁 해결')}</h2>
              <ul className={bulletList}>
                <li className="mb-2">
                  {t(
                    '본 약관은 변경 시 시행일 7일 전(이용자에게 불리한 변경은 30일 전) 서비스 내 공지합니다. 단, 이용자에게 편익을 주는 변경 또는 긴급한 법령·보안 대응이 필요한 경우에는 즉시 시행될 수 있습니다.',
                  )}
                </li>
                <li className="mb-2">
                  {t('시행일 이후 이용을 계속하면 변경에 동의한 것으로 간주합니다.')}
                </li>
                <li className="mb-2">
                  {t(
                    '본 약관은 대한민국 법률에 따라 해석되며, 분쟁은 대한민국 법원을 관할로 합니다.',
                  )}
                </li>
              </ul>
            </section>

            {/* 섹션 9 */}
            <section id="section-9" className={sectionWrap}>
              <h2 className={sectionHeading}>{t('9. 문의처')}</h2>
              <p className="text-muted-foreground">{t('이메일: contact@q-asker.com')}</p>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
