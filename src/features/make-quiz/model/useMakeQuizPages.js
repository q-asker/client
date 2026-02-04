import { useCallback, useEffect, useRef, useState } from "react";
import { pdfjs } from "react-pdf";
import CustomToast from "#shared/toast";
import { trackMakeQuizEvents } from "#shared/lib/analytics";
import { loadInterval, MAX_SELECT_PAGES, pageCountToLoad } from "./constants";

export const useMakeQuizPages = ({ t, uploadedUrl }) => {
  const [pageMode, setPageMode] = useState("CUSTOM");
  const [numPages, setNumPages] = useState(null);
  const [selectedPages, setSelectedPages] = useState([]);
  const [hoveredPage, setHoveredPage] = useState(null);
  const [visiblePageCount, setVisiblePageCount] = useState(50);
  const [pageRangeStart, setPageRangeStart] = useState("");
  const [pageRangeEnd, setPageRangeEnd] = useState("");
  const [isPreviewVisible, setIsPreviewVisible] = useState(true);
  const pdfPreviewRef = useRef(null);

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
  }, [uploadedUrl, applyAllPagesSelection, t]);

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

  const onDocumentLoadSuccess = useCallback(
    ({ numPages: nextNumPages }) => {
      applyAllPagesSelection(nextNumPages);
    },
    [applyAllPagesSelection]
  );

  const handlePageSelection = useCallback((pageNumber) => {
    setSelectedPages((prevSelectedPages) => {
      if (prevSelectedPages.includes(pageNumber)) {
        return prevSelectedPages.filter((p) => p !== pageNumber);
      }
      if (prevSelectedPages.length >= MAX_SELECT_PAGES) {
        return prevSelectedPages;
      }
      return [...prevSelectedPages, pageNumber].sort((a, b) => a - b);
    });
  }, []);

  const handleSelectAllPages = useCallback(() => {
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
  }, [getSelectablePageCount, numPages, selectedPages.length]);

  const handleClearAllPages = useCallback(() => {
    setSelectedPages([]);
  }, []);

  const handleApplyPageRange = useCallback(() => {
    if (pageMode !== "CUSTOM" || !numPages) return;

    const startValue = pageRangeStart === "" ? "1" : pageRangeStart;
    const endValue = pageRangeEnd === "" ? String(numPages) : pageRangeEnd;
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
      CustomToast.error(t(`최대 ${MAX_SELECT_PAGES} 페이지 선택할 수 있어요`));
    }

    setPageRangeStart(String(start));
    setPageRangeEnd(String(end));
    setSelectedPages(
      Array.from({ length: end - start + 1 }, (_, i) => start + i)
    );
  }, [numPages, pageMode, pageRangeEnd, pageRangeStart, t]);

  const handlePageMouseEnter = useCallback((e, pageNumber) => {
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
        itemRect.left - containerRect.left - PREVIEW_WIDTH - GAP
      }px`;
    }

    setHoveredPage({ pageNumber, style });
  }, []);

  const handlePageMouseLeave = useCallback(() => {
    setHoveredPage(null);
  }, []);

  const handlePageModeChange = useCallback(
    (mode) => {
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
    },
    [getSelectablePageCount, numPages]
  );

  const resetPagesState = useCallback(() => {
    setPageMode("CUSTOM");
    setNumPages(null);
    setSelectedPages([]);
    setHoveredPage(null);
    setVisiblePageCount(100);
    setPageRangeStart("");
    setPageRangeEnd("");
    setIsPreviewVisible(true);
  }, []);

  const resetPagesForRecreate = useCallback(() => {
    setPageMode("ALL");
    setNumPages(null);
    setSelectedPages([]);
    setHoveredPage(null);
    setVisiblePageCount(100);
    setPageRangeStart("1");
    setPageRangeEnd(String(Math.min(numPages ?? 1, MAX_SELECT_PAGES)));
    setIsPreviewVisible(true);
  }, [numPages]);

  return {
    state: {
      pageMode,
      numPages,
      selectedPages,
      hoveredPage,
      visiblePageCount,
      pageRangeStart,
      pageRangeEnd,
      isPreviewVisible,
      pdfPreviewRef
    },
    actions: {
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
      handlePageModeChange,
      resetPagesState,
      resetPagesForRecreate
    }
  };
};
