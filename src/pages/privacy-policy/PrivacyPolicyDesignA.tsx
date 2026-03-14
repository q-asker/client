import { useTranslation } from 'i18nexus';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/components/card';
import { Badge } from '@/shared/ui/components/badge';

/** DesignA: Shadcn Card + Badge 섹션 번호 카드 그리드 레이아웃 */
const PrivacyPolicyDesignA = () => {
  const { t } = useTranslation();

  /** 섹션 데이터 (원본 t() 키 그대로 유지) */
  const sections = [
    {
      num: 1,
      title: t('1. 수집하는 개인정보'),
      items: [
        t('문의 시: 이메일 주소, 문의 내용'),
        t('서비스 이용 시 자동 수집: IP 주소, 브라우저 정보, 접속 로그'),
        t('업로드한 파일: 퀴즈 생성 목적의 처리 과정에서 일시적으로 저장'),
      ],
    },
    {
      num: 2,
      title: t('2. 개인정보의 이용 목적'),
      items: [
        t('문의 및 고객지원 대응'),
        t('서비스 제공 및 기능 개선'),
        t('보안 및 부정 이용 방지'),
      ],
    },
    {
      num: 3,
      title: t('3. 보관 및 이용 기간'),
      items: [
        t('업로드한 파일은 처리 후 24시간 이내 자동 삭제됩니다.'),
        t('그 외 정보는 목적 달성 시 지체 없이 파기합니다.'),
      ],
    },
    {
      num: 4,
      title: t('4. 제3자 제공'),
      items: [
        t('원칙적으로 제3자에게 제공하지 않습니다.'),
        t('다만, 법령에 따라 요청되는 경우 제공될 수 있습니다.'),
      ],
    },
    {
      num: 5,
      title: t('5. 개인정보 처리 위탁'),
      items: [
        t('서비스 운영에 필요한 범위 내에서 일부 업무를 위탁할 수 있습니다.'),
        t('위탁 시 관련 법령에 따라 관리·감독합니다.'),
      ],
    },
    {
      num: 6,
      title: t('6. 이용자 권리'),
      items: [
        t('개인정보 열람, 정정, 삭제를 요청할 수 있습니다.'),
        t('문의는 아래 연락처로 접수됩니다.'),
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background px-4 pb-12 pt-8 max-md:px-3 max-md:pb-9 max-md:pt-6">
      <div className="mx-auto max-w-[900px] leading-[1.7] text-foreground">
        {/* 홈 링크 */}
        <div className="mb-4 flex justify-start">
          <Link to="/" className="font-semibold text-primary no-underline hover:underline">
            ← {t('홈으로')}
          </Link>
        </div>

        {/* 헤더 카드 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-[28px] max-md:text-[22px]">
              {t('개인정보 처리방침')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-[0.95rem] text-muted-foreground">{t('시행일: 2026-01-30')}</p>
            <p className="text-muted-foreground">
              {t(
                'Q-Asker(이하 "서비스")는 이용자의 개인정보를 소중히 보호하며 관련 법령을 준수합니다.',
              )}
            </p>
          </CardContent>
        </Card>

        {/* 섹션 카드 그리드 */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {sections.map((section) => (
            <Card key={section.num}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="default">{section.num}</Badge>
                  <CardTitle className="text-base">{section.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="m-0 pl-5 text-muted-foreground">
                  {section.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="mb-2">
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}

          {/* 섹션 7: 문의처 */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge variant="default">7</Badge>
                <CardTitle className="text-base">{t('7. 문의처')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{t('이메일: inhapj01@gmail.com')}</p>
            </CardContent>
          </Card>
        </div>

        {/* 푸터 */}
        <p className="mt-6 text-muted-foreground">
          {t('본 방침은 서비스 개선에 따라 변경될 수 있으며, 변경 시 공지합니다.')}
        </p>
      </div>
    </div>
  );
};

export default PrivacyPolicyDesignA;
