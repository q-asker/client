import { useTranslation } from 'i18nexus';
import { Link } from 'react-router-dom';

/** DesignB: 좌우 분할 — sticky 목차 + 본문 스크롤 */
const PrivacyPolicy = () => {
  const { t } = useTranslation('privacy-policy');

  const tocItems = [
    { id: 'section-1', label: t('1. 수집하는 개인정보 항목') },
    { id: 'section-2', label: t('2. 개인정보의 이용 목적') },
    { id: 'section-3', label: t('3. 보관·이용 기간') },
    { id: 'section-4', label: t('4. 회원 탈퇴 및 삭제 요청') },
    { id: 'section-5', label: t('5. 개인정보의 제3자 제공') },
    { id: 'section-6', label: t('6. 개인정보 처리의 위탁') },
    { id: 'section-7', label: t('7. 정보주체의 권리·의무 및 행사 방법') },
    { id: 'section-8', label: t('8. 개인정보의 안전성 확보 조치') },
    { id: 'section-9', label: t('9. 만 14세 미만 아동') },
    { id: 'section-10', label: t('10. 개인정보 문의') },
    { id: 'section-11', label: t('11. 권익 침해 구제') },
    { id: 'section-12', label: t('12. 처리방침 변경') },
  ];

  const collectionRows: Array<{ category: string; items: string; timing: string }> = [
    {
      category: t('회원 정보'),
      items: t('OAuth Provider ID'),
      timing: t('소셜 로그인 시'),
    },
    {
      category: t('이용자 활동'),
      items: t(
        '업로드 파일(PDF/PPT/DOCX), 커스텀 지시사항, 생성한 퀴즈, 풀이 기록, 답변, 게시글·댓글',
      ),
      timing: t('서비스 이용 시'),
    },
    {
      category: t('AI 호출 로그'),
      items: t('Provider ID, prompt, AI 응답, 모델·토큰·응답시간'),
      timing: t('AI 호출 시 자동'),
    },
    {
      category: t('자동 수집'),
      items: t('IP 주소, 접속 로그'),
      timing: t('모든 요청 시'),
    },
  ];

  const retentionRows: Array<{ item: string; period: string }> = [
    { item: t('풀이 기록, 게시글'), period: t('이용자 삭제 또는 회원 탈퇴 시까지') },
    { item: t('회원 계정, 퀴즈 세트'), period: t('회원 탈퇴 시까지') },
    { item: t('AI 호출 로그, 서술형 채점 로그'), period: t('회원 탈퇴 시까지') },
    {
      item: t('업로드 PDF (OCI), AI 처리용 임시 파일 (GCS)'),
      period: t('최대 1일'),
    },
    { item: t('IP·접속 로그'), period: t('최대 90일 (운영·보안 목적)') },
  ];

  const processorRows: Array<{ name: string; work: string; items: string }> = [
    {
      name: t('Google LLC'),
      work: t('AI 추론 (Vertex AI/Gemini), 임시 파일 저장 (GCS)'),
      items: t('업로드 PDF, prompt'),
    },
    {
      name: t('Oracle Cloud (OCI)'),
      work: t('원본 파일·이미지 저장'),
      items: t('PDF, 이미지'),
    },
    {
      name: t('Cloudflare, Inc.'),
      work: t('CDN·DDoS 보호'),
      items: t('IP 주소'),
    },
  ];

  const sectionHeading = 'mb-3 text-lg font-semibold text-foreground max-md:text-base';
  const sectionWrap = 'mb-8 scroll-mt-8';
  const bulletList = 'm-0 list-decimal pl-5 text-muted-foreground';
  const tableWrap = 'overflow-x-auto rounded-md border border-border';
  const tableClass = 'w-full border-collapse text-sm';
  const thClass =
    'border-b border-border bg-muted/40 px-3 py-2 text-left font-semibold text-foreground';
  const tdClass = 'border-b border-border px-3 py-2 align-top text-muted-foreground';

  return (
    <div className="min-h-screen bg-background px-4 pb-12 pt-8 max-md:px-3 max-md:pb-9 max-md:pt-6">
      <div className="mx-auto max-w-[1080px] leading-[1.7] text-foreground">
        <div className="mb-4 flex justify-start">
          <Link to="/" className="font-semibold text-primary no-underline hover:underline">
            ← {t('홈으로')}
          </Link>
        </div>

        <header className="mb-8 border-b border-border pb-6">
          <h1 className="mb-2 text-[28px] font-bold max-md:text-[22px]">
            {t('개인정보 처리방침')}
          </h1>
          <p className="mb-3 text-[0.95rem] text-muted-foreground">{t('시행일: 2026-05-29')}</p>
          <p className="text-muted-foreground">
            {t(
              'Q-Asker(이하 "서비스")는 「개인정보보호법」을 준수하며, 이용자의 개인정보를 안전하게 보호하기 위해 본 처리방침을 수립·공개합니다.',
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
              <h2 className={sectionHeading}>{t('1. 수집하는 개인정보 항목')}</h2>
              <div className={tableWrap}>
                <table className={tableClass}>
                  <thead>
                    <tr>
                      <th className={thClass}>{t('구분')}</th>
                      <th className={thClass}>{t('항목')}</th>
                      <th className={thClass}>{t('수집 시점')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {collectionRows.map((row) => (
                      <tr key={row.category}>
                        <td className={tdClass}>{row.category}</td>
                        <td className={tdClass}>{row.items}</td>
                        <td className={tdClass}>{row.timing}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 섹션 2 */}
            <section id="section-2" className={sectionWrap}>
              <h2 className={sectionHeading}>{t('2. 개인정보의 이용 목적')}</h2>
              <ol className={bulletList}>
                <li className="mb-2">
                  {t('회원 식별 및 서비스 제공 (OAuth 인증, 이용자별 퀴즈 기록 관리)')}
                </li>
                <li className="mb-2">{t('AI 퀴즈 생성 기능 제공')}</li>
                <li className="mb-2">{t('서비스 품질 개선·운영 (오류 추적, 성능 분석)')}</li>
                <li className="mb-2">{t('부정 이용 방지·보안 (Rate Limiting, 어뷰징 감지)')}</li>
                <li className="mb-2">{t('고객 문의 응대')}</li>
              </ol>
              <p className="mt-3 text-muted-foreground">
                {t(
                  '서비스는 위 목적 외 용도(특히 AI 모델 학습, 마케팅, 제3자 판매)로 개인정보를 이용하지 않습니다.',
                )}
              </p>
            </section>

            {/* 섹션 3 */}
            <section id="section-3" className={sectionWrap}>
              <h2 className={sectionHeading}>{t('3. 보관·이용 기간')}</h2>
              <div className={tableWrap}>
                <table className={tableClass}>
                  <thead>
                    <tr>
                      <th className={thClass}>{t('항목')}</th>
                      <th className={thClass}>{t('보관 기간')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {retentionRows.map((row) => (
                      <tr key={row.item}>
                        <td className={tdClass}>{row.item}</td>
                        <td className={tdClass}>{row.period}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-muted-foreground">
                {t('법령에 따라 보관이 요구되는 경우 해당 기간 동안 분리 보관 후 파기합니다.')}
              </p>
            </section>

            {/* 섹션 4 */}
            <section id="section-4" className={sectionWrap}>
              <h2 className={sectionHeading}>{t('4. 회원 탈퇴 및 삭제 요청')}</h2>
              <ul className="m-0 list-disc pl-5 text-muted-foreground">
                <li className="mb-2">
                  {t(
                    '회원 탈퇴는 contact@q-asker.com 으로 요청하며, 영업일 기준 7일 이내 처리됩니다.',
                  )}
                </li>
                <li className="mb-2">
                  {t('탈퇴 시 회원 계정과 콘텐츠(퀴즈 세트, 풀이 기록, 게시글)가 삭제됩니다.')}
                </li>
                <li className="mb-2">
                  {t('풀이 기록·게시글은 서비스 내에서 이용자가 직접 삭제할 수 있습니다.')}
                </li>
              </ul>
            </section>

            {/* 섹션 5 */}
            <section id="section-5" className={sectionWrap}>
              <h2 className={sectionHeading}>{t('5. 개인정보의 제3자 제공')}</h2>
              <p className="text-muted-foreground">
                {t(
                  '서비스는 원칙적으로 개인정보를 제3자에게 제공하지 않습니다. 다만 이용자가 사전 동의한 경우 또는 법령에 따른 적법한 요청이 있는 경우 예외로 합니다.',
                )}
              </p>
            </section>

            {/* 섹션 6 */}
            <section id="section-6" className={sectionWrap}>
              <h2 className={sectionHeading}>{t('6. 개인정보 처리의 위탁')}</h2>
              <div className={tableWrap}>
                <table className={tableClass}>
                  <thead>
                    <tr>
                      <th className={thClass}>{t('수탁자')}</th>
                      <th className={thClass}>{t('위탁 업무')}</th>
                      <th className={thClass}>{t('위탁 항목')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processorRows.map((row) => (
                      <tr key={row.name}>
                        <td className={tdClass}>{row.name}</td>
                        <td className={tdClass}>{row.work}</td>
                        <td className={tdClass}>{row.items}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-muted-foreground">
                {t(
                  '이용자가 Google·Kakao 소셜 로그인을 통해 가입·로그인하는 경우, 서비스는 해당 제공자로부터 Provider ID를 전달받습니다. 각 제공자의 개인정보 정책은 해당 사이트를 참고하시기 바랍니다.',
                )}
              </p>
              <p className="mt-3 text-muted-foreground">
                {t(
                  '서비스는 「개인정보보호법」 제26조에 따라 수탁자의 안전한 처리를 관리·감독합니다.',
                )}
              </p>
            </section>

            {/* 섹션 7 */}
            <section id="section-7" className={sectionWrap}>
              <h2 className={sectionHeading}>{t('7. 정보주체의 권리·의무 및 행사 방법')}</h2>
              <p className="text-muted-foreground">
                {t(
                  '이용자는 개인정보 열람·정정·삭제·처리정지·동의 철회 권리를 행사할 수 있습니다. 닉네임 변경 및 일부 데이터 삭제는 서비스 내에서 직접 수행 가능하며, 그 외 권리 행사는 contact@q-asker.com 으로 요청해 주시기 바랍니다.',
                )}
              </p>
            </section>

            {/* 섹션 8 */}
            <section id="section-8" className={sectionWrap}>
              <h2 className={sectionHeading}>{t('8. 개인정보의 안전성 확보 조치')}</h2>
              <p className="text-muted-foreground">
                {t(
                  '서비스는 HTTPS(TLS) 암호화 통신, JWT 기반 접근 제어, DB 민감 설정값 Jasypt 암호화, Bucket4j 기반 Rate Limiting, Cloudflare/OCI 방화벽을 통해 개인정보를 보호합니다. 처리 담당자는 최소화하며 접근 권한은 역할 기반으로 관리합니다.',
                )}
              </p>
            </section>

            {/* 섹션 9 */}
            <section id="section-9" className={sectionWrap}>
              <h2 className={sectionHeading}>{t('9. 만 14세 미만 아동')}</h2>
              <p className="text-muted-foreground">
                {t(
                  '서비스는 만 14세 이상을 서비스 대상으로 합니다. 만 14세 미만의 가입은 제한되며, 법정대리인 동의 없이 수집된 사실이 확인되면 즉시 삭제합니다.',
                )}
              </p>
            </section>

            {/* 섹션 10 */}
            <section id="section-10" className={sectionWrap}>
              <h2 className={sectionHeading}>{t('10. 개인정보 문의')}</h2>
              <ul className="m-0 list-disc pl-5 text-muted-foreground">
                <li className="mb-2">
                  <strong>{t('연락처')}</strong>: contact@q-asker.com
                </li>
              </ul>
            </section>

            {/* 섹션 11 */}
            <section id="section-11" className={sectionWrap}>
              <h2 className={sectionHeading}>{t('11. 권익 침해 구제')}</h2>
              <p className="mb-2 text-muted-foreground">
                {t('개인정보 침해에 대한 분쟁 조정·상담은 다음 기관에 신청할 수 있습니다.')}
              </p>
              <ul className="m-0 list-disc pl-5 text-muted-foreground">
                <li className="mb-2">{t('개인정보 분쟁조정위원회 (kopico.go.kr / 1833-6972)')}</li>
                <li className="mb-2">{t('개인정보 침해신고센터 (privacy.kisa.or.kr / 118)')}</li>
              </ul>
            </section>

            {/* 섹션 12 */}
            <section id="section-12" className={sectionWrap}>
              <h2 className={sectionHeading}>{t('12. 처리방침 변경')}</h2>
              <p className="text-muted-foreground">
                {t(
                  '본 처리방침은 법령·정책 변경에 따라 개정될 수 있으며, 변경 시 시행일 7일 전(이용자에게 불리한 변경은 30일 전) 서비스 내 공지합니다. 단, 이용자에게 편익을 주는 변경 또는 긴급한 법령·보안 대응이 필요한 경우에는 즉시 시행될 수 있습니다.',
                )}
              </p>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
