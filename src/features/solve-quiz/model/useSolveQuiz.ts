import { useCallback, useEffect, useMemo } from 'react';
import type { NavigateFunction } from 'react-router';
import { useSolveQuizData } from './useSolveQuizData';
import { useSolveQuizQuestion } from './useSolveQuizQuestion';
import { isUnanswered } from '../lib/isUnanswered';
import { useSolveQuizSubmit } from './useSolveQuizSubmit';
import { useSolveQuizTimer } from './useSolveQuizTimer';
import CustomToast from '#shared/toast';
import type { Quiz } from '#features/quiz-generation';

const PROGRESS_KEY = 'quizProgress';

interface SavedProgress {
  problemSetId: string;
  answers: Record<number, string | null>;
  checks: Record<number, boolean>;
  currentQuestion: number;
  elapsedMs: number;
  savedAt: number;
}

interface UseSolveQuizParams {
  t: (key: string) => string;
  navigate: NavigateFunction;
  problemSetId: string;
  quizzes?: Quiz[];
}

interface UseSolveQuizReturn {
  state: {
    quiz: {
      quizzes: Quiz[];
      isLoading: boolean;
      currentTime: string;
      selectedOption: string | null;
      currentQuestion: number;
      showSubmitDialog: boolean;
      totalQuestions: number;
      unansweredCount: number;
      reviewCount: number;
      answeredCount: number;
      currentQuiz: Quiz;
      title: string;
    };
  };
  actions: {
    quiz: {
      handleOptionSelect: (id: string) => void;
      handlePrev: () => void;
      handleNext: () => void;
      handleSubmit: () => void;
      handleCheckToggle: () => void;
      handleJumpTo: (num: number) => void;
      handleFinish: () => void;
      handleConfirmSubmit: () => void;
      handleCancelSubmit: () => void;
      handleOverlayClick: (e: React.MouseEvent<HTMLDivElement>) => void;
      changeTitle: (newTitle: string) => Promise<void>;
      saveProgressAndLogin: () => void;
    };
  };
}

/** 로컬스토리지에서 진행 상태 읽기 */
const loadProgress = (problemSetId: string): SavedProgress | null => {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as SavedProgress;
    // 만료 또는 다른 퀴즈 → 삭제
    if (saved.problemSetId !== problemSetId || Date.now() - saved.savedAt > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(PROGRESS_KEY);
      return null;
    }
    return saved;
  } catch {
    return null;
  }
};

/** 퀴즈 풀이 페이지의 전체 상태와 액션을 통합 관리하는 훅 */
export const useSolveQuiz = ({
  t,
  navigate,
  problemSetId,
  quizzes = [],
}: UseSolveQuizParams): UseSolveQuizReturn => {
  // 저장된 진행 상태 복원
  const savedProgress = useMemo(() => loadProgress(problemSetId), [problemSetId]);
  const initialOffsetMs = savedProgress?.elapsedMs ?? 0;

  const {
    quizzes: solveQuizzes,
    setQuizzes: setSolveQuizzes,
    isLoading,
    title,
    changeTitle,
  } = useSolveQuizData({
    problemSetId,
    quizzes,
    navigate,
  });
  const { currentTime, elapsedMs } = useSolveQuizTimer(initialOffsetMs);
  const totalQuestions = solveQuizzes.length;
  const question = useSolveQuizQuestion({
    t,
    problemSetId,
    quizzes: solveQuizzes,
    setQuizzes: setSolveQuizzes,
    totalQuestions,
  });
  const submit = useSolveQuizSubmit({
    quizzes: solveQuizzes,
    problemSetId,
    currentTime,
    title,
    navigate,
  });

  useEffect(() => {
    if (!problemSetId) {
      navigate('/');
    }
  }, [problemSetId, navigate]);

  // 저장된 답안/검토 복원
  useEffect(() => {
    if (!savedProgress || solveQuizzes.length === 0) return;
    const { answers, checks, currentQuestion } = savedProgress;

    setSolveQuizzes((prev) =>
      prev.map((q) => ({
        ...q,
        userAnswer: answers[q.number] ?? q.userAnswer,
        check: checks[q.number] ?? q.check,
      })),
    );
    question.actions.handleJumpTo(currentQuestion);

    // 복원 완료 후 삭제
    localStorage.removeItem(PROGRESS_KEY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solveQuizzes.length > 0 && !!savedProgress]);

  /** 진행 상태를 localStorage에 저장 */
  const saveProgress = useCallback(() => {
    if (solveQuizzes.length === 0) return;
    const answers: Record<number, string | null> = {};
    const checks: Record<number, boolean> = {};
    solveQuizzes.forEach((q) => {
      answers[q.number] = q.userAnswer;
      checks[q.number] = q.check;
    });
    const progress: SavedProgress = {
      problemSetId,
      answers,
      checks,
      currentQuestion: question.state.currentQuestion,
      elapsedMs,
      savedAt: Date.now(),
    };
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  }, [solveQuizzes, problemSetId, question.state.currentQuestion, elapsedMs]);

  // 답안 변경 시 자동 저장
  useEffect(() => {
    if (solveQuizzes.length === 0) return;
    saveProgress();
  }, [solveQuizzes, saveProgress]);

  /** 진행 상태 저장 후 로그인 페이지 이동 */
  const saveProgressAndLogin = () => {
    saveProgress();
    CustomToast.info(t('진행 상태가 저장되었습니다. 로그인 후 자동으로 돌아옵니다.'));
    setTimeout(() => navigate('/login'), 1500);
  };

  const unansweredCount = useMemo(
    () => solveQuizzes.filter((q) => isUnanswered(q.userAnswer, q.selections)).length,
    [solveQuizzes],
  );
  const reviewCount = useMemo(() => solveQuizzes.filter((q) => q.check).length, [solveQuizzes]);
  const answeredCount = solveQuizzes.length - unansweredCount;

  return {
    state: {
      quiz: {
        quizzes: solveQuizzes,
        isLoading,
        currentTime,
        selectedOption: question.state.selectedOption,
        currentQuestion: question.state.currentQuestion,
        showSubmitDialog: submit.state.showSubmitDialog,
        totalQuestions,
        unansweredCount,
        reviewCount,
        answeredCount,
        currentQuiz: question.state.currentQuiz,
        title,
      },
    },
    actions: {
      quiz: {
        ...question.actions,
        ...submit.actions,
        changeTitle,
        saveProgressAndLogin,
      },
    },
  };
};
