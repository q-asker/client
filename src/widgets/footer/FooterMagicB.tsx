import { useTranslation } from 'i18nexus';
import { Link } from 'react-router-dom';
import { TextAnimate } from '@/shared/ui/components/text-animate';
import { BlurFade } from '@/shared/ui/components/blur-fade';

/**
 * MagicUI B안: 카드형 Footer + 중앙 정렬 스택
 * - 배경 카드로 감싼 플로팅 느낌
 * - 모든 요소 중앙 정렬
 * - TextAnimate character 단위 등장
 * - 링크 아이콘 pill 스타일
 */
const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="mt-8 px-4 pb-6 md:px-6">
      <div className="mx-auto max-w-5xl rounded-2xl bg-muted/50 px-6 py-8">
        <div className="flex flex-col items-center gap-5">
          {/* 브랜드 */}
          <BlurFade delay={0.05}>
            <TextAnimate
              as="span"
              by="character"
              animation="blurInUp"
              delay={0.05}
              className="text-lg font-bold tracking-tight text-foreground"
            >
              Q-Asker
            </TextAnimate>
          </BlurFade>

          {/* 링크 pill 그룹 */}
          <BlurFade delay={0.15}>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link
                to="/privacy-policy"
                className="rounded-full bg-background px-3.5 py-1.5 text-xs font-medium text-muted-foreground no-underline shadow-sm transition-all duration-200 hover:text-foreground hover:shadow-md"
              >
                {t('개인정보 처리방침')}
              </Link>
              <a
                href="https://docs.google.com/forms/d/e/1FAIpQLSfibmR4WmBghb74tM0ugldhiutitTsJJx3KN5wYHINpr5GRnw/viewform?usp=dialog"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-background px-3.5 py-1.5 text-xs font-medium text-primary no-underline shadow-sm transition-all duration-200 hover:shadow-md"
              >
                {t('구글 폼 링크')}
              </a>
              <a
                href="mailto:inhapj01@gmail.com"
                aria-label={t('Q-Asker 이메일 문의')}
                className="rounded-full bg-background px-3.5 py-1.5 text-xs font-medium text-primary no-underline shadow-sm transition-all duration-200 hover:shadow-md"
              >
                inhapj01@gmail.com
              </a>
            </div>
          </BlurFade>

          {/* 저작권 */}
          <BlurFade delay={0.25}>
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Q-Asker · {t('문의 및 피드백')}
            </p>
          </BlurFade>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
