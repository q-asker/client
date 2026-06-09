import { useTranslation } from 'i18nexus';
import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { NavigateFunction } from 'react-router';
import { useSearchParams } from 'react-router-dom';
import axiosInstance from '#shared/api';
import { trackQuizEvents } from '#shared/lib/analytics';
import { useQuizGenerationStore } from '#features/quiz-generation';
import type { Quiz } from '#features/quiz-generation';
import { useAuthStore } from '#entities/auth';
import { clearEssayGradeResults, clearEssayAttempts } from './solveQuizProgress';

/** API 응답 데이터 타입 */
export interface ProblemSetResponse {
  generationStatus: 'COMPLETED' | 'GENERATING';
  quizType?: 'BLANK' | 'MULTIPLE' | 'OX' | 'ESSAY' | 'REAL_BLANK';
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
  /** index.tsx에서 미리 받아온 응답 — 있으면 중복 fetch를 건너뜀 */
  prefetchedData?: ProblemSetResponse | null;
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

/** quizType을 각 quiz 항목에 전파 */
const applyQuizType = (
  quizzes: Quiz[],
  quizType?: 'BLANK' | 'MULTIPLE' | 'OX' | 'ESSAY' | 'REAL_BLANK',
): Quiz[] => {
  if (!quizType) return quizzes;
  return quizzes.map((q) => (q.type ? q : { ...q, type: quizType }));
};

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
  return serverQuizzes.map((q) => {
    const savedAnswer = progress.answers[q.number];
    // localStorage 복원 시 string으로 변환된 답안을 서버 selection ID 원본 타입에 맞춤.
    // REAL_BLANK는 직접 입력 텍스트가 답이므로 selection ID 매칭을 우회한다.
    let restoredAnswer: string | null | undefined = savedAnswer ?? q.userAnswer;
    if (savedAnswer != null && q.type !== 'REAL_BLANK' && q.selections?.length > 0) {
      const matched = q.selections.find((s) => String(s.id) === String(savedAnswer));
      if (matched) {
        restoredAnswer = matched.id;
      }
    }
    return {
      ...q,
      userAnswer: restoredAnswer,
      inReview: progress.checks[q.number] ?? q.inReview,
    };
  });
};

export const useSolveQuizData = ({
  problemSetId,
  quizzes,
  navigate,
  savedProgress,
  prefetchedData,
}: UseSolveQuizDataParams): UseSolveQuizDataReturn => {
  const { t } = useTranslation('common');
  const [localQuizzes, setLocalQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [title, setTitle] = useState<string>('');
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [quizType, setQuizType] = useState<
    'BLANK' | 'MULTIPLE' | 'OX' | 'ESSAY' | 'REAL_BLANK' | undefined
  >();
  const [searchParams] = useSearchParams();
  const isMock = searchParams.get('mock') === 'true';
  const isMockBlank = searchParams.get('blank') === 'true';
  const isMockEssay = searchParams.get('essay') === 'true';
  const isMockRealBlank = searchParams.get('real_blank') === 'true';
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
      import('../../../pages/solve-quiz/mockQuizData').then((mod) => {
        const data = isMockRealBlank
          ? mod.MOCK_REAL_BLANK_QUIZZES
          : isMockEssay
            ? mod.MOCK_ESSAY_QUIZZES
            : isMockBlank
              ? mod.MOCK_BLANK_QUIZZES
              : mod.MOCK_QUIZZES;
        setLocalQuizzes(mergeWithProgress(data, savedProgress));
        setTitle(
          isMockRealBlank
            ? t('REAL_BLANK Mock 퀴즈')
            : isMockEssay
              ? t('ESSAY Mock 퀴즈')
              : isMockBlank
                ? t('BLANK Mock 퀴즈')
                : t('Mock 퀴즈'),
        );
        setIsLoading(false);
      });
      return;
    }

    const fetchQuiz = async (): Promise<void> => {
      try {
        trackQuizEvents.startQuiz(problemSetId);
        const data =
          prefetchedData ??
          (await axiosInstance.get<ProblemSetResponse>(`/problem-set/${problemSetId}`)).data;
        const status = data.generationStatus;

        // Shadow Copy 확인: 로그인 사용자면 히스토리 제목 우선, 없으면 problemSet 제목
        let quizTitle = data.title;
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
          } // 히스토리가 없으면 초기화
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

        if (data.quizType) {
          setQuizType(data.quizType);
        }
        const typedQuizzes = applyQuizType(data.quiz, data.quizType);

        if (status === 'COMPLETED') {
          if (data.quizType === 'ESSAY') {
            // 서술형: savedProgress가 있으면 새로고침이므로 채점 결과 유지
            const hasEssayProgress =
              savedProgress && Object.values(savedProgress.answers).some((a) => a != null);
            if (!hasEssayProgress) {
              clearEssayGradeResults(problemSetId);
              clearEssayAttempts(problemSetId);
            }
            const quizzesToLoad = typedQuizzes.map((q) => ({
              ...q,
              userAnswer: null,
              gradeResult: null,
            }));
            setLocalQuizzes(mergeWithProgress(quizzesToLoad, savedProgress));
          } else {
            setLocalQuizzes(mergeWithProgress(typedQuizzes, savedProgress));
          }
          setIsLoading(false);
        }
        if (status === 'GENERATING') {
          setProblemSetInfo({
            problemSetId,
            totalCount: data.totalCount,
            isStreaming: true,
          });
          if (Array.isArray(typedQuizzes) && typedQuizzes.length > 0) {
            setLocalQuizzes(mergeWithProgress(typedQuizzes, savedProgress));
          }
          const sessionId = data.sessionId;
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
      if (next.length === 0) return prev;
      const typedNext = applyQuizType(next, quizType);
      return [...prev, ...typedNext];
    });
  }, [quizzes, quizType]);

  return {
    quizzes: localQuizzes,
    setQuizzes: setLocalQuizzes,
    isLoading,
    title,
    historyId,
    changeTitle,
  };
};
