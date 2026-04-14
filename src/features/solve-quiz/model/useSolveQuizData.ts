import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { NavigateFunction } from 'react-router';
import { useSearchParams } from 'react-router-dom';
import axiosInstance from '#shared/api';
import { trackQuizEvents } from '#shared/lib/analytics';
import { useQuizGenerationStore } from '#features/quiz-generation';
import type { Quiz } from '#features/quiz-generation';
import { useAuthStore } from '#entities/auth';

/** API 응답 데이터 타입 */
interface ProblemSetResponse {
  generationStatus: 'COMPLETED' | 'GENERATING';
  quiz: Quiz[];
  totalCount: number;
  sessionId: string;
  title: string;
  isStreaming?: boolean;
}

interface UseSolveQuizDataParams {
  problemSetId: string;
  quizzes: Quiz[];
  navigate: NavigateFunction;
  savedProgress?: {
    answers: Record<number, string | null>;
    checks: Record<number, boolean>;
  } | null;
}

/** Shadow Copy 확인 응답 */
interface HistoryCheckResponse {
  exists: boolean;
  historyId: string;
  title: string;
}

interface UseSolveQuizDataReturn {
  quizzes: Quiz[];
  setQuizzes: Dispatch<SetStateAction<Quiz[]>>;
  isLoading: boolean;
  title: string;
  historyId: string | null;
  changeTitle: (newTitle: string) => Promise<void>;
}

/** 퀴즈 데이터를 서버에서 불러오고 스트리밍 상태를 관리하는 훅 */
/** 서버 데이터에 저장된 진행 상태를 병합 */
const mergeWithProgress = (
  serverQuizzes: Quiz[],
  progress:
    | { answers: Record<number, string | null>; checks: Record<number, boolean> }
    | null
    | undefined,
): Quiz[] => {
  if (!progress) return serverQuizzes;
  return serverQuizzes.map((q) => ({
    ...q,
    userAnswer: progress.answers[q.number] ?? q.userAnswer,
    check: progress.checks[q.number] ?? q.check,
  }));
};

export const useSolveQuizData = ({
  problemSetId,
  quizzes,
  navigate,
  savedProgress,
}: UseSolveQuizDataParams): UseSolveQuizDataReturn => {
  const [localQuizzes, setLocalQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [title, setTitle] = useState<string>('');
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const isMock = searchParams.get('mock') === 'true';
  const reconnectStream = useQuizGenerationStore((state) => state.reconnectStream);
  const setProblemSetInfo = useQuizGenerationStore((state) => state.setProblemSetInfo);
  const accessToken = useAuthStore((state) => state.accessToken);

  /** 퀴즈 제목 수정 */
  const changeTitle = async (newTitle: string): Promise<void> => {
    if (!historyId) return;
    await axiosInstance.patch(`/history/${historyId}/title`, { title: newTitle });
    setTitle(newTitle);
  };

  useEffect(() => {
    /* mock 모드: API 호출 없이 mock 데이터 사용 */
    if (isMock) {
      import('../../../pages/solve-quiz/mockQuizData').then(({ MOCK_QUIZZES }) => {
        setLocalQuizzes(mergeWithProgress(MOCK_QUIZZES, savedProgress));
        setIsLoading(false);
      });
      return;
    }

    const fetchQuiz = async (): Promise<void> => {
      try {
        trackQuizEvents.startQuiz(problemSetId);
        const res = await axiosInstance.get<ProblemSetResponse>(`/problem-set/${problemSetId}`);
        const status = res.data.generationStatus;

        // Shadow Copy 확인: 로그인 사용자면 히스토리 제목 우선, 없으면 problemSet 제목
        let quizTitle = res.data.title;
        let resolvedHistoryId: string | null = null;
        if (accessToken) {
          try {
            const { data } = await axiosInstance.get<HistoryCheckResponse>(
              `/history/check/${problemSetId}`,
            );
            if (data.exists) {
              resolvedHistoryId = data.historyId;
              if (data.title) {
                quizTitle = data.title;
              }
            }
          } catch {
            // 히스토리 확인 실패 시 problemSet 제목 사용
          }
          // 히스토리가 없으면 초기화
          if (!resolvedHistoryId) {
            try {
              const { data } = await axiosInstance.post<{ historyId: string }>('/history/init', {
                problemSetId,
                title: quizTitle,
              });
              resolvedHistoryId = data.historyId;
            } catch {
              // 히스토리 초기화 실패 시 무시
            }
          }
          setHistoryId(resolvedHistoryId);
        }
        setTitle(quizTitle);

        if (status === 'COMPLETED') {
          setLocalQuizzes(mergeWithProgress(res.data.quiz, savedProgress));
          setIsLoading(false);
        }
        if (status === 'GENERATING') {
          setProblemSetInfo({
            problemSetId,
            totalCount: res.data.totalCount,
            isStreaming: true,
          });
          if (Array.isArray(res.data.quiz) && res.data.quiz.length > 0) {
            setLocalQuizzes(mergeWithProgress(res.data.quiz, savedProgress));
          }
          const sessionId = res.data.sessionId;
          reconnectStream(sessionId);
          setIsLoading(false);
        }
      } catch {
        setIsLoading(false);
        navigate('/');
      }
    };
    fetchQuiz();
  }, [problemSetId, navigate, reconnectStream, setProblemSetInfo, isMock]);

  useEffect(() => {
    if (!Array.isArray(quizzes) || quizzes.length === 0) {
      return;
    }
    setLocalQuizzes((prev) => {
      const existingNumbers = new Set(prev.map((q) => q.number));
      const next = quizzes.filter((q) => !existingNumbers.has(q.number));
      return next.length > 0 ? [...prev, ...next] : prev;
    });
  }, [quizzes]);

  return {
    quizzes: localQuizzes,
    setQuizzes: setLocalQuizzes,
    isLoading,
    title,
    historyId,
    changeTitle,
  };
};
