import { useTranslation } from 'i18nexus';
import { Link } from 'react-router-dom';

/**
 * frontend-design A안: 미니멀 라인 + 타이포그래피 중심
 * - 두꺼운 상단 보더로 영역 분리
 * - uppercase 트래킹 라벨
 * - 링크는 밑줄 호버
 * - 모노톤 색상 (브랜드 색 최소 사용)
 */
const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="mt-8 border-t border-foreground/20">
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          {/* 좌측: 브랜드 */}
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-foreground">
              Q-Asker
            </span>
            <p className="mt-2 text-xs text-muted-foreground">© {new Date().getFullYear()}</p>
          </div>

          {/* 중앙: 링크 */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              {t('문의 및 피드백')}
            </span>
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSfibmR4WmBghb74tM0ugldhiutitTsJJx3KN5wYHINpr5GRnw/viewform?usp=dialog"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-foreground no-underline transition-colors duration-200 hover:underline"
            >
              {t('구글 폼 링크')}
            </a>
            <a
              href="mailto:inhapj01@gmail.com"
              aria-label={t('Q-Asker 이메일 문의')}
              className="text-sm text-foreground no-underline transition-colors duration-200 hover:underline"
            >
              inhapj01@gmail.com
            </a>
          </div>

          {/* 우측: 법적 */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              Legal
            </span>
            <Link
              to="/privacy-policy"
              className="text-sm text-foreground no-underline transition-colors duration-200 hover:underline"
            >
              {t('개인정보 처리방침')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

/* 쿼리 파라미터 기반 변형 스위칭 (compare/mix 페이지용) */
import React, { Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';

const FOOTER_VARIANTS: Record<string, React.LazyExoticComponent<React.ComponentType>> = {};

const FooterWithVariant = () => {
  const [searchParams] = useSearchParams();
  const variant = searchParams.get('footer');
  const VariantComponent = variant ? FOOTER_VARIANTS[variant] : null;

  if (VariantComponent) {
    return (
      <Suspense fallback={null}>
        <VariantComponent />
      </Suspense>
    );
  }
  return <Footer />;
};

export default FooterWithVariant;
