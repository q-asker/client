import { useEffect, useMemo, useRef } from 'react';
import axiosInstance from '#shared/api';
import { trackQuizEvents, trackResultEvents } from '#shared/lib/analytics';
import type { Quiz } from '#features/quiz-generation';

// ── 타입 정의 ──

interface UseQuizResultParams {
  navigate: (to: string, options?: { state?: unknown; replace?: boolean }) => void;
  problemSetId: string;
  quizzes: Quiz[];
  totalTime: string;
  title: string;
}

interface EssayScoreSummary {
  totalScore: number;
  maxScore: number;
  correctCount: number;
  partialCount: number;
  incorrectCount: number;
}

interface UseQuizResultReturn {
  state: {
    correctCount: number;
    scorePercent: number;
    isEssay: boolean;
    essayScore: EssayScoreSummary | null;
  };
  actions: {
    getQuizExplanation: () => Promise<void>;
  };
}

// ── 퀴즈 결과 훅 ──

export const useQuizResult = ({
  navigate,
  problemSetId,
  quizzes,
  totalTime,
  title,
}: UseQuizResultParams): UseQuizResultReturn => {
  const isEssay = useMemo(() => {
    return quizzes.length > 0 && quizzes[0]?.type === 'ESSAY';
  }, [quizzes]);

  const essayScore = useMemo((): EssayScoreSummary | null => {
    if (!isEssay) return null;
    let totalScore = 0;
    let maxScore = 0;
    let correctCount = 0;
    let partialCount = 0;
    let incorrectCount = 0;

    for (const q of quizzes) {
      const gr = q.gradeResult;
      if (gr) {
        totalScore += gr.totalScore;
        maxScore += gr.maxScore;
        const ratio = gr.maxScore > 0 ? gr.totalScore / gr.maxScore : 0;
        if (ratio >= 0.8) correctCount++;
        else if (ratio > 0) partialCount++;
        else incorrectCount++;
      } else {
        incorrectCount++;
      }
    }
    return { totalScore, maxScore, correctCount, partialCount, incorrectCount };
  }, [isEssay, quizzes]);

  const correctCount = useMemo(() => {
    if (isEssay) return essayScore?.correctCount ?? 0;
    return quizzes.reduce((count, q) => {
      const selected = q.selections.find((s) => String(s.id) === String(q.userAnswer));
      return count + (selected?.correct ? 1 : 0);
    }, 0);
  }, [quizzes, isEssay, essayScore]);

  const scorePercent = useMemo(() => {
    if (isEssay && essayScore) {
      return essayScore.maxScore > 0
        ? Math.round((essayScore.totalScore / essayScore.maxScore) * 100)
        : 0;
    }
    return quizzes.length ? Math.round((correctCount / quizzes.length) * 100) : 0;
  }, [quizzes.length, correctCount, isEssay, essayScore]);

  const historySavedRef = useRef(false);
  useEffect(() => {
    if (!problemSetId || quizzes.length === 0 || historySavedRef.current) return;
    historySavedRef.current = true;

    trackResultEvents.viewResult(problemSetId, correctCount, quizzes.length, totalTime);
    trackQuizEvents.completeQuiz(problemSetId, correctCount, quizzes.length, totalTime);

    const userAnswers = quizzes.map((q) => ({
      number: q.number,
      userAnswer: isEssay ? 0 : q.userAnswer != null ? Number(q.userAnswer) : 0,
      textAnswer: isEssay
        ? q.userAnswer && String(q.userAnswer) !== '0'
          ? String(q.userAnswer)
          : ''
        : null,
      inReview: q.inReview ?? false,
    }));

    // ESSAY: 획득 총점, 선택형: 정답 수
    const score = isEssay ? (essayScore?.totalScore ?? 0) : correctCount;

    axiosInstance
      .post('/history', { problemSetId, title, userAnswers, score, totalTime })
      .catch((err) => console.error('Failed to save quiz history:', err));
  }, [problemSetId, quizzes, correctCount, totalTime, title, isEssay]);

  const getQuizExplanation = async (): Promise<void> => {
    trackResultEvents.clickExplanation(problemSetId);

    navigate(`/explanation/${problemSetId}`);
  };

  return {
    state: { correctCount, scorePercent, isEssay, essayScore },
    actions: { getQuizExplanation },
  };
};
