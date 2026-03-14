import { useTranslation } from 'i18nexus';
import { Link } from 'react-router-dom';
import { BlurFade } from '@/shared/ui/components/blur-fade';
import { TextAnimate } from '@/shared/ui/components/text-animate';

/** MagicB: TextAnimate 제목 + BlurFade 내용 + 카드 스타일 섹션 + 배경 그래디언트 */
const PrivacyPolicyMagicB = () => {
  const { t } = useTranslation();

  /** 섹션 데이터 (원본 t() 키 그대로 유지) */
  const sections = [
    {
      title: t('1. 수집하는 개인정보'),
      items: [
        t('문의 시: 이메일 주소, 문의 내용'),
        t('서비스 이용 시 자동 수집: IP 주소, 브라우저 정보, 접속 로그'),
        t('업로드한 파일: 퀴즈 생성 목적의 처리 과정에서 일시적으로 저장'),
      ],
    },
    {
      title: t('2. 개인정보의 이용 목적'),
      items: [
        t('문의 및 고객지원 대응'),
        t('서비스 제공 및 기능 개선'),
        t('보안 및 부정 이용 방지'),
      ],
    },
    {
      title: t('3. 보관 및 이용 기간'),
      items: [
        t('업로드한 파일은 처리 후 24시간 이내 자동 삭제됩니다.'),
        t('그 외 정보는 목적 달성 시 지체 없이 파기합니다.'),
      ],
    },
    {
      title: t('4. 제3자 제공'),
      items: [
        t('원칙적으로 제3자에게 제공하지 않습니다.'),
        t('다만, 법령에 따라 요청되는 경우 제공될 수 있습니다.'),
      ],
    },
    {
      title: t('5. 개인정보 처리 위탁'),
      items: [
        t('서비스 운영에 필요한 범위 내에서 일부 업무를 위탁할 수 있습니다.'),
        t('위탁 시 관련 법령에 따라 관리·감독합니다.'),
      ],
    },
    {
      title: t('6. 이용자 권리'),
      items: [
        t('개인정보 열람, 정정, 삭제를 요청할 수 있습니다.'),
        t('문의는 아래 연락처로 접수됩니다.'),
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-accent/20 px-4 pb-12 pt-8 max-md:px-3 max-md:pb-9 max-md:pt-6">
      <div className="mx-auto max-w-[820px] leading-[1.7] text-foreground">
        {/* 홈 링크 */}
        <BlurFade delay={0.05}>
          <div className="mb-4 flex justify-start">
            <Link to="/" className="font-semibold text-primary no-underline hover:underline">
              ← {t('홈으로')}
            </Link>
          </div>
        </BlurFade>

        {/* 헤더 */}
        <BlurFade delay={0.1}>
          <header className="mb-8 rounded-xl border border-border bg-card p-8 shadow-sm max-md:p-6">
            <TextAnimate
              as="h1"
              by="character"
              animation="blurInUp"
              className="mb-2 text-[28px] font-bold text-card-foreground max-md:text-[22px]"
            >
              {String(t('개인정보 처리방침'))}
            </TextAnimate>
            <p className="mb-3 text-[0.95rem] text-muted-foreground">{t('시행일: 2026-01-30')}</p>
            <p className="text-muted-foreground">
              {t(
                'Q-Asker(이하 "서비스")는 이용자의 개인정보를 소중히 보호하며 관련 법령을 준수합니다.',
              )}
            </p>
          </header>
        </BlurFade>

        {/* 섹션 1~6 (카드 스타일) */}
        <div className="flex flex-col gap-4">
          {sections.map((section, index) => (
            <BlurFade key={index} delay={0.15 + index * 0.1}>
              <div className="rounded-xl border border-border bg-card/80 p-6 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md max-md:p-4">
                <TextAnimate
                  as="h2"
                  by="word"
                  animation="slideUp"
                  delay={0.05}
                  className="mb-3 text-lg font-semibold text-card-foreground max-md:text-base"
                >
                  {String(section.title)}
                </TextAnimate>
                <ul className="m-0 pl-5 text-muted-foreground">
                  {section.items.map((item, itemIndex) => (
                    <BlurFade key={itemIndex} delay={0.2 + index * 0.1 + itemIndex * 0.05}>
                      <li className="mb-2">{item}</li>
                    </BlurFade>
                  ))}
                </ul>
              </div>
            </BlurFade>
          ))}

          {/* 섹션 7: 문의처 (별도 처리 — li 대신 p 사용) */}
          <BlurFade delay={0.15 + 6 * 0.1}>
            <div className="rounded-xl border border-border bg-card/80 p-6 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md max-md:p-4">
              <TextAnimate
                as="h2"
                by="word"
                animation="slideUp"
                delay={0.05}
                className="mb-3 text-lg font-semibold text-card-foreground max-md:text-base"
              >
                {String(t('7. 문의처'))}
              </TextAnimate>
              <p className="text-muted-foreground">{t('이메일: inhapj01@gmail.com')}</p>
            </div>
          </BlurFade>
        </div>

        {/* 푸터 */}
        <BlurFade delay={0.95}>
          <p className="mt-6 text-muted-foreground">
            {t('본 방침은 서비스 개선에 따라 변경될 수 있으며, 변경 시 공지합니다.')}
          </p>
        </BlurFade>
      </div>
    </div>
  );
};

export default PrivacyPolicyMagicB;
