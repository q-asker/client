import React, { Suspense, lazy, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { Quiz, QuizType } from '#features/quiz-generation';
import axiosInstance from '#shared/api';

const QuizResultDesignK = lazy(() => import('./QuizResultDesignK'));
const EssayQuizResult = lazy(() => import('./EssayQuizResult'));

/** API 응답 타입 */
interface ProblemSetResponse {
  quiz: Quiz[];
  title: string;
  quizType?: QuizType;
}

/** 퀴즈 타입을 감지하여 ESSAY / 선택형 결과 페이지를 분기 렌더 */
const QuizResultPage: React.FC = () => {
  const { problemSetId } = useParams<{ problemSetId: string }>();
  const [serverData, setServerData] = useState<ProblemSetResponse | null>(null);

  useEffect(() => {
    if (!problemSetId) return;
    axiosInstance
      .get<ProblemSetResponse>(`/problem-set/${problemSetId}`)
      .then((res) => setServerData(res.data))
      .catch(() => setServerData({ quiz: [], title: '', quizType: 'MULTIPLE' }));
  }, [problemSetId]);

  if (!serverData) return null;

  const quizType = serverData.quizType ?? serverData.quiz?.[0]?.type ?? 'MULTIPLE';

  return (
    <Suspense fallback={null}>
      {quizType === 'ESSAY' ? (
        <EssayQuizResult serverData={serverData} />
      ) : (
        <QuizResultDesignK serverData={serverData} />
      )}
    </Suspense>
  );
};

export default QuizResultPage;
