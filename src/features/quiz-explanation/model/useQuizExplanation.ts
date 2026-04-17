import { useEffect, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { pdfjs } from 'react-pdf';
import CustomToast from '#shared/toast';
import axiosInstance from '#shared/api';
import { trackQuizEvents } from '#shared/lib/analytics';
import { loadResult } from '#features/solve-quiz';
import type { Quiz } from '#features/quiz-generation';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

// ── 타입 정의 ──

/** API에서 반환되는 해설 결과 항목 */
interface ExplanationResult {
  number: number;
  explanation: string;
  referencedPages?: number[];
}

/** API에서 반환되는 해설 응답 */
interface RawExplanation {
  results?: ExplanationResult[];
  fileUrl?: string;
}

/** PDF 옵션 */
interface PdfOptions {
  cMapUrl: string;
  cMapPacked: boolean;
  standardFontDataUrl: string;
}

/** 퀴즈 문제 API 응답 */
interface ProblemSetResponse {
  quiz: Quiz[];
  title: string;
}

interface UseQuizExplanationParams {
  t: (key: string) => string;
  navigate: (to: string, options?: { state?: unknown; replace?: boolean }) => void;
  problemSetId: string;
}

interface QuizState {
  currentQuestion: number;
  totalQuestions: number;
  filteredQuizzes: Quiz[];
  filteredTotalQuestions: number;
  currentQuiz: Quiz;
  showWrongOnly: boolean;
}

interface PdfState {
  showPdf: boolean;
  pdfWidth: number;
  pdfContainerRef: RefObject<HTMLDivElement | null>;
  currentPdfPage: number;
  pdfOptions: PdfOptions;
}

interface ExplanationState {
  thisExplanationText: string;
  thisExplanationObj: ExplanationResult | Record<string, never>;
}

interface UiState {
  isLoading: boolean;
  uploadedUrl: string;
}

interface QuizActions {
  handlePrev: () => void;
  handleNext: () => void;
  handleQuestionClick: (questionNumber: number) => void;
  handleWrongOnlyToggle: () => void;
}

interface PdfActions {
  handlePdfToggle: () => void;
  handlePrevPdfPage: () => void;
  handleNextPdfPage: () => void;
  setCurrentPdfPage: React.Dispatch<React.SetStateAction<number>>;
}

interface CommonActions {
  handleExit: (targetPath?: string) => void;
}

interface UseQuizExplanationReturn {
  state: {
    quiz: QuizState;
    pdf: PdfState;
    explanation: ExplanationState;
    ui: UiState;
  };
  actions: {
    quiz: QuizActions;
    pdf: PdfActions;
    common: CommonActions;
  };
}

// ── 상수 ──

const PDF_OPTIONS: PdfOptions = {
  cMapUrl: '/cmaps/',
  cMapPacked: true,
  standardFontDataUrl: '/standard_fonts/',
};

// ── 퀴즈 해설 훅 ──

export const useQuizExplanation = ({
  t,
  navigate,
  problemSetId,
}: UseQuizExplanationParams): UseQuizExplanationReturn => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [explanationData, setExplanationData] = useState<RawExplanation>({});
  const [showPdf, setShowPdf] = useState(false);
  const [pdfWidth, setPdfWidth] = useState(600);
  const pdfContainerRef = useRef<HTMLDivElement | null>(null);
  const [currentPdfPage, setCurrentPdfPage] = useState(0);
  const [showWrongOnly, setShowWrongOnly] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const pdfOptions = PDF_OPTIONS;

  // 서버에서 퀴즈 + 해설 데이터 fetch
  useEffect(() => {
    if (!problemSetId) return;

    const fetchData = async () => {
      try {
        const [quizRes, explanationRes] = await Promise.all([
          axiosInstance.get<ProblemSetResponse>(`/problem-set/${problemSetId}`),
          axiosInstance.get<RawExplanation>(`/explanation/${problemSetId}`),
        ]);

        const serverQuizzes = quizRes.data.quiz;

        // localStorage 채점 결과에서 답안 병합
        const savedResult = loadResult(problemSetId);
        const merged = savedResult
          ? serverQuizzes.map((q) => ({
              ...q,
              userAnswer: savedResult.answers[q.number] ?? q.userAnswer,
              inReview: savedResult.inReview?.[q.number] ?? false,
            }))
          : serverQuizzes;

        setQuizzes(merged);
        setExplanationData(explanationRes.data);
        setIsLoading(false);
      } catch {
        CustomToast.error(t('해설 정보를 불러오지 못했습니다.'));
        navigate('/');
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problemSetId]);

  const totalQuestions = quizzes.length;
  const allExplanation: ExplanationResult[] = Array.isArray(explanationData.results)
    ? explanationData.results
    : [];

  const filteredQuizzes = useMemo(() => {
    if (!showWrongOnly) return quizzes;

    return quizzes.filter((q) => {
      if (q.userAnswer === undefined || q.userAnswer === null) return false;

      const correctOption = q.selections.find(
        (opt) => (opt as unknown as { correct: boolean }).correct === true,
      );
      if (!correctOption) return false;

      return Number(q.userAnswer) !== Number(correctOption.id);
    });
  }, [quizzes, showWrongOnly]);

  const filteredTotalQuestions = filteredQuizzes.length;

  /** 기본 퀴즈 객체 (현재 문제 없을 때 폴백) */
  const defaultQuiz: Quiz = {
    number: 0,
    title: '',
    selections: [],
    userAnswer: null,
  };

  const currentQuiz = useMemo(() => {
    return showWrongOnly
      ? filteredQuizzes[currentQuestion - 1] || defaultQuiz
      : quizzes[currentQuestion - 1] || defaultQuiz;
  }, [showWrongOnly, filteredQuizzes, quizzes, currentQuestion]);

  const thisExplanationObj = useMemo(() => {
    return allExplanation.find((e) => e.number === currentQuiz.number) || {};
  }, [allExplanation, currentQuiz.number]);

  const thisExplanationText =
    'explanation' in thisExplanationObj
      ? (thisExplanationObj as ExplanationResult).explanation
      : t('해설이 없습니다.');

  const handleExit = (targetPath = '/'): void => {
    navigate(targetPath);
  };

  useEffect(() => {
    if (!isLoading && quizzes.length > 0) {
      trackQuizEvents.viewExplanation(problemSetId, currentQuestion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, currentQuestion]);

  useEffect(() => {
    const calculatePdfWidth = (): void => {
      if (pdfContainerRef.current) {
        const containerWidth = pdfContainerRef.current.offsetWidth;
        const isMobile = window.innerWidth <= 768;
        const padding = isMobile ? 20 : 40;
        const maxWidth = isMobile
          ? containerWidth - padding
          : Math.min(containerWidth - padding, 1200);
        setPdfWidth(maxWidth);
      }
    };

    calculatePdfWidth();
    window.addEventListener('resize', calculatePdfWidth);
    window.addEventListener('orientationchange', calculatePdfWidth);

    return () => {
      window.removeEventListener('resize', calculatePdfWidth);
      window.removeEventListener('orientationchange', calculatePdfWidth);
    };
  }, [showPdf]);

  useEffect(() => {
    setCurrentPdfPage(0);
  }, [currentQuestion]);

  useEffect(() => {
    if (showWrongOnly) {
      if (filteredTotalQuestions === 0) {
        setShowWrongOnly(false);
        CustomToast.error(t('오답이 없습니다!'));
        return;
      }

      if (currentQuestion > filteredTotalQuestions) {
        setCurrentQuestion(1);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showWrongOnly, filteredTotalQuestions, currentQuestion]);

  const handlePrev = (): void => {
    if (currentQuestion > 1) {
      const prevQuestion = currentQuestion - 1;
      trackQuizEvents.navigateQuestion(problemSetId, currentQuestion, prevQuestion);
      setCurrentQuestion(prevQuestion);
    }
  };

  const handleNext = (): void => {
    const maxQuestions = showWrongOnly ? filteredTotalQuestions : totalQuestions;
    if (currentQuestion < maxQuestions) {
      const nextQuestion = currentQuestion + 1;
      trackQuizEvents.navigateQuestion(problemSetId, currentQuestion, nextQuestion);
      setCurrentQuestion(nextQuestion);
    }
  };

  const handleQuestionClick = (questionNumber: number): void => {
    if (questionNumber !== currentQuestion) {
      trackQuizEvents.navigateQuestion(problemSetId, currentQuestion, questionNumber);
      setCurrentQuestion(questionNumber);
    }
  };

  const handlePdfToggle = (): void => {
    const newShowPdf = !showPdf;
    setShowPdf(newShowPdf);
    trackQuizEvents.togglePdfSlide(problemSetId, newShowPdf);
  };

  const handleWrongOnlyToggle = (): void => {
    const newShowWrongOnly = !showWrongOnly;
    setShowWrongOnly(newShowWrongOnly);
    setCurrentQuestion(1);
  };

  const handlePrevPdfPage = (): void => {
    if (currentPdfPage > 0) {
      setCurrentPdfPage(currentPdfPage - 1);
    }
  };

  const handleNextPdfPage = (): void => {
    const currentPages =
      'referencedPages' in thisExplanationObj
        ? (thisExplanationObj as ExplanationResult).referencedPages || []
        : [];
    if (currentPdfPage < currentPages.length - 1) {
      setCurrentPdfPage(currentPdfPage + 1);
    }
  };

  return {
    state: {
      quiz: {
        currentQuestion,
        totalQuestions,
        filteredQuizzes,
        filteredTotalQuestions,
        currentQuiz,
        showWrongOnly,
      },
      pdf: {
        showPdf,
        pdfWidth,
        pdfContainerRef,
        currentPdfPage,
        pdfOptions,
      },
      explanation: {
        thisExplanationText,
        thisExplanationObj,
      },
      ui: {
        isLoading,
        uploadedUrl: explanationData.fileUrl ?? '',
      },
    },
    actions: {
      quiz: {
        handlePrev,
        handleNext,
        handleQuestionClick,
        handleWrongOnlyToggle,
      },
      pdf: {
        handlePdfToggle,
        handlePrevPdfPage,
        handleNextPdfPage,
        setCurrentPdfPage,
      },
      common: {
        handleExit,
      },
    },
  };
};
