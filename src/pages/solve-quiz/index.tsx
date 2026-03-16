import React, { lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import SolveQuizDesignBDefault from './SolveQuizDesignB';

/* 쿼리 파라미터 기반 변형 스위칭 (compare/mix 페이지용) */
const SolveQuizMagicA = lazy(() => import('./SolveQuizMagicA'));
const SolveQuizMagicB = lazy(() => import('./SolveQuizMagicB'));
const SolveQuizMagicC = lazy(() => import('./SolveQuizMagicC'));
const SolveQuizMagicD = lazy(() => import('./SolveQuizMagicD'));
const SolveQuizDesignA = lazy(() => import('./SolveQuizDesignA'));
const SolveQuizDesignB = lazy(() => import('./SolveQuizDesignB'));
const SolveQuizDesignC = lazy(() => import('./SolveQuizDesignC'));
const SolveQuizDesignD = lazy(() => import('./SolveQuizDesignD'));
const SolveQuizDesignE = lazy(() => import('./SolveQuizDesignE'));
const SolveQuizDesignF = lazy(() => import('./SolveQuizDesignF'));
const SolveQuizDesignG = lazy(() => import('./SolveQuizDesignG'));
const SolveQuizDesignH = lazy(() => import('./SolveQuizDesignH'));
const SolveQuizMagicE = lazy(() => import('./SolveQuizMagicE'));
const SolveQuizMagicF = lazy(() => import('./SolveQuizMagicF'));
const SolveQuizMagicG = lazy(() => import('./SolveQuizMagicG'));
const SolveQuizMagicH = lazy(() => import('./SolveQuizMagicH'));
const SolveQuizDesignB_v1 = lazy(() => import('./SolveQuizDesignB_v1'));
const SolveQuizDesignB_v2 = lazy(() => import('./SolveQuizDesignB_v2'));
const SolveQuizDesignB_v3 = lazy(() => import('./SolveQuizDesignB_v3'));
const SolveQuizDesignB_v4 = lazy(() => import('./SolveQuizDesignB_v4'));

const SQ_VARIANTS: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  '1': SolveQuizMagicA,
  '2': SolveQuizMagicB,
  '3': SolveQuizDesignA,
  '4': SolveQuizDesignB,
  '5': SolveQuizMagicC,
  '6': SolveQuizMagicD,
  '7': SolveQuizDesignC,
  '8': SolveQuizDesignD,
  '9': SolveQuizDesignE,
  '10': SolveQuizDesignF,
  '11': SolveQuizDesignG,
  '12': SolveQuizDesignH,
  '13': SolveQuizMagicE,
  '14': SolveQuizMagicF,
  '15': SolveQuizMagicG,
  '16': SolveQuizMagicH,
  '17': SolveQuizDesignB_v1,
  '18': SolveQuizDesignB_v2,
  '19': SolveQuizDesignB_v3,
  '20': SolveQuizDesignB_v4,
};

const SolveQuizWithVariant = () => {
  const [searchParams] = useSearchParams();
  const variant = searchParams.get('sq');
  const VariantComponent = variant ? SQ_VARIANTS[variant] : null;

  if (VariantComponent) {
    return (
      <Suspense fallback={null}>
        <VariantComponent />
      </Suspense>
    );
  }
  return <SolveQuizDesignBDefault />;
};

export default SolveQuizWithVariant;
