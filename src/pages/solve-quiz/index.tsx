import React, { Suspense, lazy, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { QuizType } from '#features/quiz-generation';
import type { ProblemSetResponse } from '#features/solve-quiz';
import axiosInstance from '#shared/api';

const SolveQuizDesign = lazy(() => import('./SolveQuizDesign'));
const EssaySolveQuiz = lazy(() => import('./EssaySolveQuiz'));

/** 퀴즈 타입을 감지하여 ESSAY / 선택형 컴포넌트를 분기 렌더 */
const SolveQuizPage: React.FC = () => {
  const { problemSetId } = useParams<{ problemSetId: string }>();
  const [quizType, setQuizType] = useState<QuizType | null>(null);
  const [prefetchedData, setPrefetchedData] = useState<ProblemSetResponse | null>(null);

  useEffect(() => {
    axiosInstance
      .get<ProblemSetResponse>(`/problem-set/${problemSetId}`)
      .then((res) => {
        setPrefetchedData(res.data);
        setQuizType(res.data.quizType ?? res.data.quiz?.[0]?.type ?? 'MULTIPLE');
      })
      .catch(() => setQuizType('MULTIPLE'));
  }, [problemSetId]);

  if (!quizType) return null;

  return (
    <Suspense fallback={null}>
      {quizType === 'ESSAY' ? (
        <EssaySolveQuiz prefetchedData={prefetchedData} />
      ) : (
        <SolveQuizDesign prefetchedData={prefetchedData} />
      )}
    </Suspense>
  );
};

export default SolveQuizPage;
