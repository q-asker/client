import React, { Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import QuizResult from './QuizResultDesignK';

const QR_VARIANTS: Record<string, React.LazyExoticComponent<React.ComponentType>> = {};

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
