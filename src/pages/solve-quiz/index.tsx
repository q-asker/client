import React, { lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';

const DesignB = lazy(() => import('./SolveQuizDesignB'));
const DesignC = lazy(() => import('./SolveQuizDesignC'));
const DesignD = lazy(() => import('./SolveQuizDesignD'));
const DesignE = lazy(() => import('./SolveQuizDesignE'));
const DesignF = lazy(() => import('./SolveQuizDesignF'));

const designMap: Record<string, React.LazyExoticComponent<React.FC>> = {
  B: DesignB,
  C: DesignC,
  D: DesignD,
  E: DesignE,
  F: DesignF,
};

/** ?design=C|D|E|F 쿼리 파라미터로 디자인 변형 전환 */
const SolveQuizPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const designKey = (searchParams.get('design') ?? 'D').toUpperCase();
  const Design = designMap[designKey] ?? DesignD;

  return (
    <Suspense fallback={null}>
      <Design />
    </Suspense>
  );
};

export default SolveQuizPage;
