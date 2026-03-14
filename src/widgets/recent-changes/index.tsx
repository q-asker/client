import React, { lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'i18nexus';
import { useRecentChanges } from './model/useRecentChanges';

const RecentChanges = () => {
  const { t } = useTranslation();
  const {
    state: { changes },
    actions: { formatDate },
  } = useRecentChanges();

  return (
    <div className="mt-7 rounded-2xl border border-gray-200 bg-gray-50 p-5">
      <h3 className="mb-4 text-lg font-semibold text-gray-800">{t('최근 변경사항')}</h3>
      <ul className="m-0 list-none p-0">
        {changes.map((log, index) => (
          <li
            key={log.id || index}
            className="flex items-start gap-4 border-b border-gray-200 py-2.5 last:border-b-0"
          >
            <span className="min-w-[80px] text-sm font-medium text-gray-500">
              {formatDate(log.dateTime)}
            </span>
            <span className="flex-1 text-sm text-gray-800">{t(log.updateText)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

/* 쿼리 파라미터 기반 변형 스위칭 */
const RecentChangesMagicA = lazy(() => import('./RecentChangesMagicA'));
const RecentChangesMagicB = lazy(() => import('./RecentChangesMagicB'));
const RecentChangesDesignA = lazy(() => import('./RecentChangesDesignA'));
const RecentChangesDesignB = lazy(() => import('./RecentChangesDesignB'));

const RC_VARIANTS: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  '1': RecentChangesMagicA,
  '2': RecentChangesMagicB,
  '3': RecentChangesDesignA,
  '4': RecentChangesDesignB,
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
