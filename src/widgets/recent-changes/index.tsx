import React, { lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'i18nexus';
import { useRecentChanges } from './model/useRecentChanges';
import { Sparkles } from 'lucide-react';

/** DesignK — 3열 그리드 미니멀 칩 스타일 */
const RecentChanges = () => {
  const { t } = useTranslation();
  const {
    state: { changes },
    actions: { formatDate },
  } = useRecentChanges();

  return (
    <div className="mt-7 rounded-2xl border border-border bg-card p-6">
      <h3 className="mb-5 flex items-center gap-2 text-lg font-semibold text-foreground">
        <Sparkles className="size-5 text-primary" />
        {t('최근 변경사항')}
      </h3>
      <div className="flex flex-wrap gap-3">
        {changes.map((log) => (
          <div key={log.id} className="flex gap-2 items-start">
            <div className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
            <div className="group flex flex-col items-start gap-1 rounded-full border border-primary/20 bg-primary/5 px-4 py-2.5 transition-all hover:border-primary/40 hover:bg-primary/10">
              <span className="text-xs font-medium text-primary/70">
                {formatDate(log.dateTime)}
              </span>
              <p className="line-clamp-1 text-xs text-foreground/80 group-hover:text-foreground">
                {t(log.updateText)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* 쿼리 파라미터 기반 변형 스위칭 */
const RecentChangesMagicA = lazy(() => import('./RecentChangesMagicA'));
const RecentChangesMagicB = lazy(() => import('./RecentChangesMagicB'));
const RecentChangesDesignA = lazy(() => import('./RecentChangesDesignA'));
const RecentChangesDesignB = lazy(() => import('./RecentChangesDesignB'));
const RecentChangesDesignI = lazy(() => import('./RecentChangesDesignI'));
const RecentChangesDesignJ = lazy(() => import('./RecentChangesDesignJ'));
const RecentChangesDesignK = lazy(() => import('./RecentChangesDesignK'));

const RC_VARIANTS: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  '1': RecentChangesMagicA,
  '2': RecentChangesMagicB,
  '3': RecentChangesDesignA,
  '4': RecentChangesDesignB,
  '5': RecentChangesDesignI,
  '6': RecentChangesDesignJ,
  '7': RecentChangesDesignK,
};

const RecentChangesWithVariant = () => {
  const [searchParams] = useSearchParams();
  const variant = searchParams.get('rc');
  const VariantComponent = variant ? RC_VARIANTS[variant] : null;

  if (VariantComponent) {
    return (
      <Suspense fallback={null}>
        <VariantComponent />
      </Suspense>
    );
  }
  return <RecentChanges />;
};

export default RecentChangesWithVariant;
