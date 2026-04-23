import React, { Suspense, lazy } from 'react';

const SolveQuizDesign = lazy(() => import('./SolveQuizDesign'));

/** 퀴즈 풀이 페이지: 단일 디자인으로 통합 */
const SolveQuizPage: React.FC = () => {
  return (
    <Suspense fallback={null}>
      <SolveQuizDesign />
    </Suspense>
  );
};

export default SolveQuizPage;
