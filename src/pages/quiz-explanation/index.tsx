import React, { Suspense, lazy, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { QuizType } from '#features/quiz-generation';
import axiosInstance from '#shared/api';

const QuizExplanation = lazy(() => import('./QuizExplanation'));
const EssayQuizExplanation = lazy(() => import('./EssayQuizExplanation'));

/** 퀴즈 타입을 감지하여 ESSAY / 선택형 해설 페이지를 분기 렌더 */
const QuizExplanationPage: React.FC = () => {
  const { problemSetId } = useParams<{ problemSetId: string }>();
  const [quizType, setQuizType] = useState<QuizType | null>(null);

  useEffect(() => {
    axiosInstance
      .get<{ quizType?: QuizType; quiz?: { type?: QuizType }[] }>(`/problem-set/${problemSetId}`)
      .then((res) => {
        setQuizType(res.data.quizType ?? res.data.quiz?.[0]?.type ?? 'MULTIPLE');
      })
      .catch(() => setQuizType('MULTIPLE'));
  }, [problemSetId]);

  if (!quizType) return null;

  return (
    <Suspense fallback={null}>
      {quizType === 'ESSAY' ? <EssayQuizExplanation /> : <QuizExplanation />}
    </Suspense>
  );
};

export default QuizExplanationPage;
