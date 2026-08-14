import { useEffect, useMemo, useRef } from 'react';
import axiosInstance from '#shared/api';
import { useAuthStore } from '#entities/auth';
import { trackQuizEvents, trackResultEvents } from '#shared/lib/analytics';
import type { Quiz } from '#features/quiz-generation';
import type { GradeResultItem } from '#shared/lib/realBlankGrading';

// ── 타입 정의 ──

interface UseQuizResultParams {
  navigate: (to: string, options?: { state?: unknown; replace?: boolean }) => void;
  problemSetId: string;
  quizzes: Quiz[];
  totalTime: string;
  title: string;
  /** REAL_BLANK 세트의 서버 채점 결과(문항 번호 → 판정). 로딩 중이면 undefined */
  realBlankGrades?: Map<number, GradeResultItem>;
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
  realBlankGrades,
}: UseQuizResultParams): UseQuizResultReturn => {
  const isEssay = useMemo(() => {
    return quizzes.length > 0 && quizzes[0]?.type === 'ESSAY';
  }, [quizzes]);

  const isRealBlank = useMemo(() => {
    return quizzes.length > 0 && quizzes[0]?.type === 'REAL_BLANK';
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
    if (isRealBlank) {
      // 서버 SSOT 판정. 로딩 전이면 0(화면은 grade 준비 후 렌더).
      if (!realBlankGrades) return 0;
      return quizzes.reduce((c, q) => c + (realBlankGrades.get(q.number)?.isCorrect ? 1 : 0), 0);
    }
    return quizzes.reduce((count, q) => {
      const selected = q.selections.find((s) => String(s.id) === String(q.userAnswer));
      return count + (selected?.correct ? 1 : 0);
    }, 0);
  }, [quizzes, isEssay, essayScore, isRealBlank, realBlankGrades]);

  const scorePercent = useMemo(() => {
    if (isEssay && essayScore) {
      return essayScore.maxScore > 0
        ? Math.round((essayScore.totalScore / essayScore.maxScore) * 100)
        : 0;
    }
    return quizzes.length ? Math.round((correctCount / quizzes.length) * 100) : 0;
  }, [quizzes.length, correctCount, isEssay, essayScore]);

  const accessToken = useAuthStore((state) => state.accessToken);

  const historySavedRef = useRef(false);
  useEffect(() => {
    if (!problemSetId || quizzes.length === 0 || historySavedRef.current) return;
    // REAL_BLANK는 서버 판정이 준비된 뒤에 저장한다(score 정합·중복 저장 방지).
    if (isRealBlank && !realBlankGrades) return;
    historySavedRef.current = true;

    trackResultEvents.viewResult(problemSetId, correctCount, quizzes.length, totalTime);
    trackQuizEvents.completeQuiz(problemSetId, correctCount, quizzes.length, totalTime);

    // 비회원 히스토리는 서버가 지원하지 않는다(401). 요청 자체를 보내지 않는다.
    if (!accessToken) return;

    const userAnswers = quizzes.map((q) => {
      const isRealBlank = q.type === 'REAL_BLANK';
      const isTextMode = isEssay || isRealBlank;
      return {
        number: q.number,
        userAnswer: isTextMode ? 0 : q.userAnswer != null ? Number(q.userAnswer) : 0,
        textAnswer: isEssay
          ? q.userAnswer && String(q.userAnswer) !== '0'
            ? String(q.userAnswer)
            : ''
          : isRealBlank
            ? q.userAnswer && String(q.userAnswer) !== '0'
              ? String(q.userAnswer)
              : ''
            : null,
        inReview: q.inReview ?? false,
      };
    });

    // ESSAY: 획득 총점, 선택형: 정답 수
    const score = isEssay ? (essayScore?.totalScore ?? 0) : correctCount;

    axiosInstance
      .post('/history', { problemSetId, title, userAnswers, score, totalTime })
      .catch((err) => console.error('Failed to save quiz history:', err));
  }, [
    problemSetId,
    quizzes,
    correctCount,
    totalTime,
    title,
    isEssay,
    isRealBlank,
    realBlankGrades,
    accessToken,
  ]);

  const getQuizExplanation = async (): Promise<void> => {
    trackResultEvents.clickExplanation(problemSetId);

    navigate(`/explanation/${problemSetId}`);
  };

  return {
    state: { correctCount, scorePercent, isEssay, essayScore },
    actions: { getQuizExplanation },
  };
};
