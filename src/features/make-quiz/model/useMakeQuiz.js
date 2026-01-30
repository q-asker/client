import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { pdfjs } from "react-pdf";
import { authService } from "#entities/auth";
import CustomToast from "#shared/toast";
import { trackMakeQuizEvents } from "#shared/lib/analytics";
import Timer from "#shared/lib/timer";
import { useClickOutside } from "#shared/lib/useClickOutside";
import { getLatestQuizRecord, upsertQuizHistoryRecord } from "#shared/lib/quizHistoryStorage";
import { useQuizGenerationStore } from "#features/quiz-generation";
import { uploadFileToServer } from "../file-uploader";
import {
  defaultType,
  levelMapping,
  loadInterval,
  MAX_FILE_SIZE,
  MAX_SELECT_PAGES,
  SUPPORTED_EXTENSIONS,
  pageCountToLoad } from
"./constants";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export const useMakeQuiz = ({ t, navigate }) => {
  const [file, setFile] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [questionType, setQuestionType] = useState(() => {
    const savedType = localStorage.getItem("questionType");
    return savedType || defaultType;
  });
  const [questionCount, setQuestionCount] = useState(10);
  const [isProcessing, setIsProcessing] = useState(false);
  const [version, setVersion] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [problemSetId, setProblemSetId] = useState(null);
  const [quizLevel, setQuizLevel] = useState(() => {
    const savedType = localStorage.getItem("questionType");
    return levelMapping[savedType || defaultType];
  });
  const [pageMode, setPageMode] = useState("CUSTOM");
  const [numPages, setNumPages] = useState(null);
  const [selectedPages, setSelectedPages] = useState([]);
  const [hoveredPage, setHoveredPage] = useState(null);
  const [visiblePageCount, setVisiblePageCount] = useState(50);
  const [pageRangeStart, setPageRangeStart] = useState("");
  const [pageRangeEnd, setPageRangeEnd] = useState("");
  const [isPreviewVisible, setIsPreviewVisible] = useState(true);
  const pdfPreviewRef = useRef(null);
  const [showWaitMessage, setShowWaitMessage] = useState(false);
  const [uploadElapsedTime, setUploadElapsedTime] = useState(0);
  const [generationElapsedTime, setGenerationElapsedTime] = useState(0);
  const [fileExtension, setFileExtension] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const uploadTimerRef = useRef(null);
  const generationTimerRef = useRef(null);
  const startGeneration = useQuizGenerationStore((state) => state.startGeneration);

  const pdfOptions = useMemo(
    () => ({
      cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
      cMapPacked: true,
      standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`
    }),
    []
  );

  const getSelectablePageCount = useCallback(
    (totalPages) => Math.min(totalPages, MAX_SELECT_PAGES),
    []
  );

  const applyAllPagesSelection = useCallback(
    (totalPages) => {
      const selectablePages = getSelectablePageCount(totalPages);
      setNumPages(totalPages);
      setSelectedPages(
        Array.from({ length: selectablePages }, (_, i) => i + 1)
      );
    },
    [getSelectablePageCount]
  );

  useEffect(() => {
    setQuizLevel(levelMapping[questionType]);
    localStorage.setItem("questionType", questionType);
  }, [questionType]);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  useClickOutside({
    containerId: "sidebar",
    triggerId: "menuButton",
    onOutsideClick: () => setIsSidebarOpen(false)
  });

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      selectFile(e.dataTransfer.files[0], "drag_drop");
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files.length > 0) selectFile(e.target.files[0], "click");
  };

  const selectFile = async (nextFile, method = "click") => {
    const ext = nextFile.name.split(".").pop().toLowerCase();

    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      CustomToast.error(t("지원하지 않는 파일 형식입니다"));
      return;
    }

    if (nextFile.size > MAX_FILE_SIZE) {
      CustomToast.error(
        `파일 크기는 ${MAX_FILE_SIZE / 1024 / 1024}MB를 초과할 수 없습니다.`
      );
      return;
    }

    if (method === "drag_drop") {
      trackMakeQuizEvents.dragDropFileUpload(nextFile.name, nextFile.size, ext);
    } else {
      trackMakeQuizEvents.startFileUpload(nextFile.name, nextFile.size, ext);
    }

    uploadTimerRef.current = new Timer((elapsed) => {
      setUploadElapsedTime(elapsed);
    });
    uploadTimerRef.current.start();

    setFileExtension(ext);
    setIsProcessing(true);
    try {
      const uploaded = await uploadFileToServer(nextFile);
      setUploadedUrl(uploaded);
      setFile(nextFile);

      const uploadTime = uploadTimerRef.current.stop();
      trackMakeQuizEvents.completeFileUpload(nextFile.name, uploadTime);
    } catch (error) {
      if (uploadTimerRef.current) {
        uploadTimerRef.current.stop();
      }

      const message =
      error?.message === t("변환 시간 초과") ?
      t("파일 변환이 지연되고 있어요. 잠시 후 다시 시도해주세요.") :
      error?.response?.data?.message ||
      error?.message ||
      t("파일 업로드 중 오류가 발생했습니다. 다시 시도해주세요.");

      CustomToast.error(message);
      console.error(t("파일 업로드 실패:"), error);
      return;
    } finally {
      setFileExtension(null);
      setIsProcessing(false);
      setUploadElapsedTime(0);
    }
  };

  const generateQuestions = async () => {
    if (!uploadedUrl) {
      CustomToast.error(t("파일을 먼저 업로드해주세요."));
      return;
    }
    if (!selectedPages.length) {
      CustomToast.error(t("페이지를 선택해주세요."));
      return;
    }

    const apiQuizType = questionType;

    setIsProcessing(true);
    try {
      try {
        await authService.refresh();
      } catch (refreshError) {

        // ignore refresh error and continue with generation
      }
      generationTimerRef.current = new Timer((elapsed) => {
        setGenerationElapsedTime(elapsed);
      });
      generationTimerRef.current.start();

      startGeneration({
        requestData: {
          uploadedUrl: uploadedUrl,
          quizCount: questionCount,
          quizType: apiQuizType,
          difficultyType: quizLevel,
          pageNumbers: selectedPages
        },
        onFirstChunk: ({ problemSetId: nextProblemSetId }) => {
          setProblemSetId(nextProblemSetId);
          setVersion((prev) => prev + 1);
          saveQuizToHistory(nextProblemSetId, file.name);
        },
        onComplete: (nextProblemSetId) => {
          if (generationTimerRef.current) {
            const generationTime = generationTimerRef.current.stop();
            trackMakeQuizEvents.completeQuizGeneration(
              nextProblemSetId,
              generationTime
            );
          }
          setIsProcessing(false);
        },
        onError: (error) => {
          if (generationTimerRef.current) {
            generationTimerRef.current.stop();
          }
          const message =
          error?.message || t("문제 생성 중 오류가 발생했습니다.");
          CustomToast.error(message);
          setIsProcessing(false);
          setGenerationElapsedTime(0);
        }
      });
    } catch (error) {
      if (generationTimerRef.current) {
        generationTimerRef.current.stop();
      }
      setIsProcessing(false);
      setGenerationElapsedTime(0);
    }
  };

  const saveQuizToHistory = (nextProblemSetId, fileName) => {
    try {
      const newQuizRecord = {
        problemSetId: nextProblemSetId,
        fileName,
        fileSize: file.size,
        questionCount,
        quizLevel,
        createdAt: new Date().toISOString(),
        uploadedUrl,
        status: "created",
        score: null,
        correctCount: null,
        totalTime: null
      };

      upsertQuizHistoryRecord(newQuizRecord, { max: 20 });
    } catch (error) {
      console.error(t("퀴즈 기록 저장 실패:"), error);
    }
  };

  const loadLatestQuiz = () => {
    try {
      const latest = getLatestQuizRecord();
      if (!latest || uploadedUrl) return;

      setProblemSetId(latest.problemSetId);
      const virtualFile = {
        name: latest.fileName,
        size: latest.fileSize
      };
      setFile(virtualFile);
      setUploadedUrl(latest.uploadedUrl);
    } catch (error) {
      console.error(t("최신 퀴즈 로딩 실패:"), error);
    }
  };

  useEffect(() => {
    let timer;
    if (isProcessing && uploadedUrl && !problemSetId) {
      timer = setTimeout(() => {
        setShowWaitMessage(true);
      }, 5000);
    } else {
      setShowWaitMessage(false);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isProcessing, uploadedUrl, problemSetId]);

  useEffect(() => {
    loadLatestQuiz();
    trackMakeQuizEvents.viewMakeQuiz();
  }, []);

  useEffect(() => {
    if (!uploadedUrl) return;

    let cancelled = false;
    const loadPdfMetadata = async () => {
      try {
        const loadingTask = pdfjs.getDocument(uploadedUrl);
        const pdf = await loadingTask.promise;
        if (cancelled) {
          if (loadingTask?.destroy) {
            loadingTask.destroy();
          }
          return;
        }
        applyAllPagesSelection(pdf.numPages);
        if (pdf?.destroy) {
          pdf.destroy();
        }
      } catch (error) {
        console.error(t("PDF 메타데이터 로드 실패:"), error);
      }
    };

    loadPdfMetadata();

    return () => {
      cancelled = true;
    };
  }, [uploadedUrl, applyAllPagesSelection]);

  useEffect(() => {
    if (!numPages) return;
    setPageRangeStart("1");
    setPageRangeEnd(String(Math.min(numPages, MAX_SELECT_PAGES)));
  }, [numPages]);

  useEffect(() => {
    if (!numPages || numPages <= pageCountToLoad) return;

    setVisiblePageCount(pageCountToLoad);

    const interval = setInterval(() => {
      setVisiblePageCount((prev) => {
        const nextCount = prev + pageCountToLoad;
        if (nextCount >= numPages) {
          clearInterval(interval);
          return numPages;
        }
        return nextCount;
      });
    }, loadInterval);

    return () => clearInterval(interval);
  }, [numPages]);

  const resetAllStates = () => {
    if (uploadTimerRef.current) {
      uploadTimerRef.current.reset();
      uploadTimerRef.current = null;
    }

    setFile(null);
    setUploadedUrl(null);
    setIsDragging(false);
    setQuestionType(defaultType);
    setQuestionCount(15);
    setIsProcessing(false);
    setVersion(0);
    setIsSidebarOpen(false);
    setProblemSetId(null);
    setQuizLevel(levelMapping[defaultType]);
    setPageMode("CUSTOM");
    setNumPages(null);
    setSelectedPages([]);
    setHoveredPage(null);
    setVisiblePageCount(100);
    setPageRangeStart("");
    setPageRangeEnd("");
    setIsPreviewVisible(true);
    setShowWaitMessage(false);
    setUploadElapsedTime(0);
    setGenerationElapsedTime(0);
    setFileExtension(null);
  };

  const handleRemoveFile = () => {
    if (file) {
      trackMakeQuizEvents.deleteFile(file.name);
    }
    resetAllStates();
  };

  const handleReCreate = () => {
    setProblemSetId(null);
    setPageMode("ALL");
    setNumPages(null);
    setSelectedPages([]);
    setHoveredPage(null);
    setVisiblePageCount(100);
    setPageRangeStart("1");
    setPageRangeEnd(String(Math.min(numPages ?? 1, MAX_SELECT_PAGES)));
    setIsPreviewVisible(true);
    setShowWaitMessage(false);
    setUploadElapsedTime(0);
    setGenerationElapsedTime(0);
  };

  const handleNavigateToQuiz = () => {
    trackMakeQuizEvents.navigateToQuiz(problemSetId);
    navigate(`/quiz/${problemSetId}`, {
      state: { uploadedUrl }
    });
  };

  const onDocumentLoadSuccess = ({ numPages: nextNumPages }) => {
    applyAllPagesSelection(nextNumPages);
  };

  const handlePageSelection = (pageNumber) => {
    setSelectedPages((prevSelectedPages) => {
      if (prevSelectedPages.includes(pageNumber)) {
        return prevSelectedPages.filter((p) => p !== pageNumber);
      }
      if (prevSelectedPages.length >= MAX_SELECT_PAGES) {
        return prevSelectedPages;
      }
      return [...prevSelectedPages, pageNumber].sort((a, b) => a - b);
    });
  };

  const handleSelectAllPages = () => {
    if (!numPages) {
      return;
    }
    const selectablePages = getSelectablePageCount(numPages);
    if (selectedPages.length === selectablePages) {
      setSelectedPages([]);
    } else {
      setSelectedPages(
        Array.from({ length: selectablePages }, (_, i) => i + 1)
      );
    }
  };

  const handleClearAllPages = () => {
    setSelectedPages([]);
  };

  const handleApplyPageRange = () => {
    if (pageMode !== "CUSTOM" || !numPages) return;

    const startValue = pageRangeStart === "" ? "1" : pageRangeStart;
    const endValue =
    pageRangeEnd === "" ? String(numPages) : pageRangeEnd;
    const parsedStart = parseInt(startValue, 10);
    const parsedEnd = parseInt(endValue, 10);

    if (!Number.isFinite(parsedStart) || !Number.isFinite(parsedEnd)) {
      CustomToast.error(t("페이지 범위를 올바르게 입력해주세요."));
      return;
    }

    let start = Math.max(1, Math.min(parsedStart, numPages));
    let end = Math.max(1, Math.min(parsedEnd, numPages));

    if (start > end) {
      [start, end] = [end, start];
    }

    if (end - start + 1 > MAX_SELECT_PAGES) {
      end = start + MAX_SELECT_PAGES - 1;
      if (end > numPages) {
        end = numPages;
        start = Math.max(1, end - MAX_SELECT_PAGES + 1);
      }
      CustomToast.error(
        t(`최대 ${MAX_SELECT_PAGES} 페이지 선택할 수 있어요`)
      );
    }

    setPageRangeStart(String(start));
    setPageRangeEnd(String(end));
    setSelectedPages(
      Array.from({ length: end - start + 1 }, (_, i) => start + i)
    );
  };

  const handlePageMouseEnter = (e, pageNumber) => {
    if (window.innerWidth <= 768) return;

    if (!pdfPreviewRef.current) return;

    const containerRect = pdfPreviewRef.current.getBoundingClientRect();
    const itemRect = e.currentTarget.getBoundingClientRect();
    const itemWidth = itemRect.width;
    const midpoint = containerRect.left + containerRect.width / 2;

    const PREVIEW_WIDTH = 660;
    const GAP = 10;

    let top = itemRect.top - containerRect.top - 100;
    if (top < 0) {
      top = 0;
    }

    const style = {
      top: `${top}px`,
      width: `${PREVIEW_WIDTH}px`
    };

    if (itemRect.left < midpoint) {
      style.left = `${itemRect.left - containerRect.left + itemWidth + GAP}px`;
    } else {
      style.left = `${
      itemRect.left - containerRect.left - PREVIEW_WIDTH - GAP}px`;

    }

    setHoveredPage({ pageNumber, style });
  };

  const handlePageMouseLeave = () => {
    setHoveredPage(null);
  };

  const handleQuestionTypeChange = (nextType, label) => {
    if (questionType !== nextType) {
      trackMakeQuizEvents.changeQuizOption("question_type", label);
      setQuestionType(nextType);
      setQuizLevel(levelMapping[nextType]);
    }
  };

  const handleQuestionCountChange = (nextCount) => {
    if (questionCount !== nextCount) {
      trackMakeQuizEvents.changeQuizOption("question_count", nextCount);
      setQuestionCount(nextCount);
    }
  };

  const handlePageModeChange = (mode) => {
    setPageMode(mode);
    if (mode === "ALL") {
      const selectablePages = getSelectablePageCount(numPages ?? 0);
      setSelectedPages(
        Array.from({ length: selectablePages }, (_, i) => i + 1)
      );
    } else {
      setSelectedPages([]);
    }
    trackMakeQuizEvents.changeQuizOption("page_mode", mode);
  };

  return {
    state: {
      file,
      uploadedUrl,
      isDragging,
      questionType,
      questionCount,
      isProcessing,
      version,
      isSidebarOpen,
      problemSetId,
      quizLevel,
      pageMode,
      numPages,
      selectedPages,
      hoveredPage,
      visiblePageCount,
      pageRangeStart,
      pageRangeEnd,
      isPreviewVisible,
      pdfPreviewRef,
      showWaitMessage,
      uploadElapsedTime,
      generationElapsedTime,
      fileExtension,
      showHelp,
      pdfOptions
    },
    actions: {
      toggleSidebar,
      setIsSidebarOpen,
      setShowHelp,
      handleDragOver,
      handleDragEnter,
      handleDragLeave,
      handleDrop,
      handleFileInput,
      handleRemoveFile,
      handleReCreate,
      handleNavigateToQuiz,
      onDocumentLoadSuccess,
      handlePageSelection,
      handleSelectAllPages,
      handleClearAllPages,
      handleApplyPageRange,
      setPageRangeStart,
      setPageRangeEnd,
      setIsPreviewVisible,
      handlePageMouseEnter,
      handlePageMouseLeave,
      generateQuestions,
      handleQuestionTypeChange,
      handleQuestionCountChange,
      handlePageModeChange
    }
  };
};