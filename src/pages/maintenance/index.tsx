import React, { lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';

const Maintenance = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-8 text-center">
      <div className="mb-6 text-6xl">🔧</div>
      <h1 className="mb-3 text-[1.75rem] font-bold text-gray-900">서비스 점검 중입니다</h1>
      <p className="max-w-[480px] leading-relaxed text-gray-500">
        더 나은 서비스를 위해 시스템을 점검하고 있습니다.
        <br />
        빠른 시일 내에 다시 찾아뵙겠습니다.
      </p>
    </div>
  );
};

/* 쿼리 파라미터 기반 변형 스위칭 (compare/mix 페이지용) */
const MaintenanceMagicA = lazy(() => import('./MaintenanceMagicA'));
const MaintenanceMagicB = lazy(() => import('./MaintenanceMagicB'));
const MaintenanceDesignA = lazy(() => import('./MaintenanceDesignA'));
const MaintenanceDesignB = lazy(() => import('./MaintenanceDesignB'));

const MT_VARIANTS: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  '1': MaintenanceMagicA,
  '2': MaintenanceMagicB,
  '3': MaintenanceDesignA,
  '4': MaintenanceDesignB,
};

const MaintenanceWithVariant = () => {
  const [searchParams] = useSearchParams();
  const variant = searchParams.get('mt');
  const VariantComponent = variant ? MT_VARIANTS[variant] : null;

  if (VariantComponent) {
    return (
      <Suspense fallback={null}>
        <VariantComponent />
      </Suspense>
    );
  }
  return <Maintenance />;
};

export default MaintenanceWithVariant;
