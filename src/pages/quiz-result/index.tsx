import React, { lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import QuizResult from './QuizResultDesignK';

/* 쿼리 파라미터 기반 변형 스위칭 (compare/mix 페이지용) */
const QuizResultMagicA = lazy(() => import('./QuizResultMagicA'));
const QuizResultMagicB = lazy(() => import('./QuizResultMagicB'));
const QuizResultMagicC = lazy(() => import('./QuizResultMagicC'));
const QuizResultMagicD = lazy(() => import('./QuizResultMagicD'));
const QuizResultDesignA = lazy(() => import('./QuizResultDesignA'));
const QuizResultDesignB = lazy(() => import('./QuizResultDesignB'));
const QuizResultDesignC = lazy(() => import('./QuizResultDesignC'));
const QuizResultDesignD = lazy(() => import('./QuizResultDesignD'));
const QuizResultDesignE = lazy(() => import('./QuizResultDesignE'));
const QuizResultDesignF = lazy(() => import('./QuizResultDesignF'));
const QuizResultDesignG = lazy(() => import('./QuizResultDesignG'));
const QuizResultDesignH = lazy(() => import('./QuizResultDesignH'));
const QuizResultDesignI = lazy(() => import('./QuizResultDesignI'));
const QuizResultDesignJ = lazy(() => import('./QuizResultDesignJ'));
const QuizResultMagicE = lazy(() => import('./QuizResultMagicE'));
const QuizResultMagicF = lazy(() => import('./QuizResultMagicF'));
const QuizResultDesignK = lazy(() => import('./QuizResultDesignK'));

const QR_VARIANTS: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  '1': QuizResultMagicA,
  '2': QuizResultMagicB,
  '3': QuizResultDesignA,
  '4': QuizResultDesignB,
  '5': QuizResultDesignC,
  '6': QuizResultDesignD,
  '7': QuizResultDesignE,
  '8': QuizResultDesignF,
  '9': QuizResultDesignG,
  '10': QuizResultDesignH,
  '11': QuizResultMagicC,
  '12': QuizResultMagicD,
  '13': QuizResultDesignI,
  '14': QuizResultDesignJ,
  '15': QuizResultMagicE,
  '16': QuizResultMagicF,
  '17': QuizResultDesignK,
};

const QuizResultWithVariant = () => {
  const [searchParams] = useSearchParams();
  const variant = searchParams.get('qr');
  const VariantComponent = variant ? QR_VARIANTS[variant] : null;

  if (VariantComponent) {
    return (
      <Suspense fallback={null}>
        <VariantComponent />
      </Suspense>
    );
  }
  return <QuizResult />;
};

export default QuizResultWithVariant;
