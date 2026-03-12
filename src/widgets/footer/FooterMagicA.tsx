import { useTranslation } from 'i18nexus';
import { Link } from 'react-router-dom';
import { TextAnimate } from '@/shared/ui/components/text-animate';
import { BlurFade } from '@/shared/ui/components/blur-fade';

/**
 * MagicUI A안: 그라데이션 악센트 + TextAnimate + BlurFade 순차 등장
 * - 상단 그라데이션 라인으로 Footer 영역 강조
 * - 2단 레이아웃 (좌: 브랜드, 우: 링크)
 * - TextAnimate로 링크 텍스트 등장 애니메이션
 */
const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="mt-8 border-t border-border">
      {/* 상단 그라데이션 악센트 라인 */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
        <div className="flex flex-col items-center gap-4 md:flex-row md:items-start md:justify-between">
          {/* 좌측: 브랜드 + 저작권 */}
          <BlurFade delay={0.05}>
            <div className="text-center md:text-left">
              <TextAnimate
                as="span"
                by="word"
                animation="blurIn"
                delay={0.1}
                className="text-sm font-semibold text-foreground"
              >
                {`© ${new Date().getFullYear()} Q-Asker`}
              </TextAnimate>
              <p className="mt-1 text-xs text-muted-foreground">{t('AI 기반 퀴즈 생성 플랫폼')}</p>
            </div>
          </BlurFade>

          {/* 우측: 링크들 */}
          <BlurFade delay={0.15}>
            <div className="flex flex-col items-center gap-2 text-sm md:items-end">
              <Link
                to="/privacy-policy"
                className="text-muted-foreground no-underline transition-colors duration-200 hover:text-foreground"
              >
                {t('개인정보 처리방침')}
              </Link>
              <div className="flex items-center gap-3 text-muted-foreground">
                <a
                  href="https://docs.google.com/forms/d/e/1FAIpQLSfibmR4WmBghb74tM0ugldhiutitTsJJx3KN5wYHINpr5GRnw/viewform?usp=dialog"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary no-underline transition-colors duration-200 hover:text-primary/80"
                >
                  {t('구글 폼 링크')}
                </a>
                <span className="text-border">·</span>
                <a
                  href="mailto:inhapj01@gmail.com"
                  aria-label={t('Q-Asker 이메일 문의')}
                  className="font-medium text-primary no-underline transition-colors duration-200 hover:text-primary/80"
                >
                  inhapj01@gmail.com
                </a>
              </div>
            </div>
          </BlurFade>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
