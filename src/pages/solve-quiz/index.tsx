import React, { Suspense, lazy, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuizGenerationStore } from '#features/quiz-generation';
import type { QuizType } from '#features/quiz-generation';
import axiosInstance from '#shared/api';

const SolveQuizDesign = lazy(() => import('./SolveQuizDesign'));
const EssaySolveQuiz = lazy(() => import('./EssaySolveQuiz'));

/** 퀴즈 타입을 감지하여 ESSAY / 선택형 컴포넌트를 분기 렌더 */
const SolveQuizPage: React.FC = () => {
  const { problemSetId } = useParams<{ problemSetId: string }>();
  const storeQuizzes = useQuizGenerationStore((s) => s.quizzes);
  const storeProblemSetId = useQuizGenerationStore((s) => s.problemSetId);

  const [quizType, setQuizType] = useState<QuizType | null>(() => {
    // 스토어에 동일 problemSet의 퀴즈가 있으면 타입 즉시 확인
    if (String(storeProblemSetId) === String(problemSetId) && storeQuizzes[0]?.type) {
      return storeQuizzes[0].type;
    }
    return null;
  });

  useEffect(() => {
    if (quizType) return;
    // 스토어에 없으면 API에서 타입 확인
    axiosInstance
      .get<{ quizType?: QuizType; quiz?: { type?: QuizType }[] }>(`/problem-set/${problemSetId}`)
      .then((res) => {
        setQuizType(res.data.quizType ?? res.data.quiz?.[0]?.type ?? 'MULTIPLE');
      })
      .catch(() => setQuizType('MULTIPLE'));
  }, [problemSetId, quizType]);

  if (!quizType) return null;

  return (
    <Suspense fallback={null}>
      {quizType === 'ESSAY' ? <EssaySolveQuiz /> : <SolveQuizDesign />}
    </Suspense>
  );
};

export default SolveQuizPage;
