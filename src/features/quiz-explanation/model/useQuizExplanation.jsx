import { useEffect, useMemo, useRef, useState } from 'react';
import { pdfjs } from 'react-pdf';
import CustomToast from '#shared/toast';
import { trackQuizEvents } from '#shared/lib/analytics';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const PDF_OPTIONS = {
  cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
  cMapPacked: true,
  standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
};

export const useQuizExplanation = ({
  t,
  navigate,
  problemSetId,
  initialQuizzes,
  rawExplanation,
  uploadedUrl,
}) => {
  const [showPdf, setShowPdf] = useState(false);
  const [pdfWidth, setPdfWidth] = useState(600);
  const pdfContainerRef = useRef(null);
  const [currentPdfPage, setCurrentPdfPage] = useState(0);
  const [showWrongOnly, setShowWrongOnly] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const pdfOptions = PDF_OPTIONS;

  const totalQuestions = initialQuizzes.length;
  const allExplanation = Array.isArray(rawExplanation.results) ? rawExplanation.results : [];

  const filteredQuizzes = useMemo(() => {
    if (!showWrongOnly) return initialQuizzes;

    return initialQuizzes.filter((q) => {
      if (q.userAnswer === undefined || q.userAnswer === null) return false;

      const correctOption = q.selections.find((opt) => opt.correct === true);
      if (!correctOption) return false;

      return Number(q.userAnswer) !== Number(correctOption.id);
    });
  }, [initialQuizzes, showWrongOnly]);

  const filteredTotalQuestions = filteredQuizzes.length;

  const currentQuiz = useMemo(() => {
    return showWrongOnly
      ? filteredQuizzes[currentQuestion - 1] || {
          selections: [],
          userAnswer: null,
        }
      : initialQuizzes[currentQuestion - 1] || {
          selections: [],
          userAnswer: null,
        };
  }, [showWrongOnly, filteredQuizzes, initialQuizzes, currentQuestion]);

  const thisExplanationObj = useMemo(() => {
    return allExplanation.find((e) => e.number === currentQuiz.number) || {};
  }, [allExplanation, currentQuiz.number]);

  const thisExplanationText = thisExplanationObj.explanation || t('해설이 없습니다.');

  const handleExit = (targetPath = '/') => {
    navigate(targetPath);
  };

  useEffect(() => {
    if (!problemSetId || initialQuizzes.length === 0) {
      CustomToast.error(t('유효한 퀴즈 정보가 없습니다. 홈으로 이동합니다.'));
      navigate('/');
    } else {
      setIsLoading(false);
      trackQuizEvents.viewExplanation(problemSetId, currentQuestion);
    }
  }, [problemSetId, initialQuizzes.length, navigate, currentQuestion, t]);

  useEffect(() => {
    const calculatePdfWidth = () => {
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
  }, [showWrongOnly, filteredTotalQuestions, currentQuestion, t]);

  const handlePrev = () => {
    if (currentQuestion > 1) {
      const prevQuestion = currentQuestion - 1;
      trackQuizEvents.navigateQuestion(problemSetId, currentQuestion, prevQuestion);
      setCurrentQuestion(prevQuestion);
    }
  };

  const handleNext = () => {
    const maxQuestions = showWrongOnly ? filteredTotalQuestions : totalQuestions;
    if (currentQuestion < maxQuestions) {
      const nextQuestion = currentQuestion + 1;
      trackQuizEvents.navigateQuestion(problemSetId, currentQuestion, nextQuestion);
      setCurrentQuestion(nextQuestion);
    }
  };

  const handleQuestionClick = (questionNumber) => {
    if (questionNumber !== currentQuestion) {
      trackQuizEvents.navigateQuestion(problemSetId, currentQuestion, questionNumber);
      setCurrentQuestion(questionNumber);
    }
  };

  const handlePdfToggle = () => {
    const newShowPdf = !showPdf;
    setShowPdf(newShowPdf);
    trackQuizEvents.togglePdfSlide(problemSetId, newShowPdf);
  };

  const handleWrongOnlyToggle = () => {
    const newShowWrongOnly = !showWrongOnly;
    setShowWrongOnly(newShowWrongOnly);
    setCurrentQuestion(1);
  };

  const handlePrevPdfPage = () => {
    if (currentPdfPage > 0) {
      setCurrentPdfPage(currentPdfPage - 1);
    }
  };

  const handleNextPdfPage = () => {
    const currentPages = thisExplanationObj?.referencedPages || [];
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
        uploadedUrl,
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
