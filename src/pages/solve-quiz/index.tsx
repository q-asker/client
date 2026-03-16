import React, { Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import SolveQuizDesignBDefault from './SolveQuizDesignB';

const SQ_VARIANTS: Record<string, React.LazyExoticComponent<React.ComponentType>> = {};

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
