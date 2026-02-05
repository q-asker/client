import { useCallback, useEffect, useRef, useState } from 'react';
import CustomToast from '#shared/toast';
import { trackMakeQuizEvents as trackPrepareQuizEvents } from '#shared/lib/analytics';
import { loadInterval, MAX_SELECT_PAGES, pageCountToLoad } from './constants';

const PAGES_STORAGE_KEY = 'makeQuizPages';
const EXPIRATION_MS = 24 * 60 * 60 * 1000;

const readSavedPagesState = () => {
  try {
    const saved = localStorage.getItem(PAGES_STORAGE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    const savedAt = Number(parsed?.savedAt);
    if (!savedAt || Date.now() - savedAt > EXPIRATION_MS) {
      localStorage.removeItem(PAGES_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch (error) {
    return null;
  }
};

export const usePrepareQuizPages = ({ t, uploadedUrl }) => {
  const savedStateRef = useRef(readSavedPagesState());
  const [pageMode, setPageMode] = useState(savedStateRef.current?.pageMode || 'CUSTOM');
  const [numPages, setNumPages] = useState(null);
  const [selectedPages, setSelectedPages] = useState([]);
  const [hoveredPage, setHoveredPage] = useState(null);
  const [visiblePageCount, setVisiblePageCount] = useState(50);
  const [pageRangeStart, setPageRangeStart] = useState('');
  const [pageRangeEnd, setPageRangeEnd] = useState('');
  const [isPreviewVisible, setIsPreviewVisible] = useState(() => {
    const savedValue = savedStateRef.current?.isPreviewVisible;
    return typeof savedValue === 'boolean' ? savedValue : true;
  });
  const pdfPreviewRef = useRef(null);

  const getSelectablePageCount = useCallback(
    (totalPages) => Math.min(totalPages, MAX_SELECT_PAGES),
    [],
  );

  const applyAllPagesSelection = useCallback(
    (totalPages) => {
      const selectablePages = getSelectablePageCount(totalPages);
      setNumPages(totalPages);
      setSelectedPages(Array.from({ length: selectablePages }, (_, i) => i + 1));
    },
    [getSelectablePageCount],
  );

  useEffect(() => {
    if (!numPages) return;
    setPageRangeStart('1');
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
      setNumPages(nextNumPages);

      applyAllPagesSelection(nextNumPages);
    },
    [applyAllPagesSelection],
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
      setSelectedPages(Array.from({ length: selectablePages }, (_, i) => i + 1));
    }
  }, [getSelectablePageCount, numPages, selectedPages.length]);

  const handleClearAllPages = useCallback(() => {
    setSelectedPages([]);
  }, []);

  const handleApplyPageRange = useCallback(() => {
    if (pageMode !== 'CUSTOM' || !numPages) return;

    const startValue = pageRangeStart === '' ? '1' : pageRangeStart;
    const endValue = pageRangeEnd === '' ? String(numPages) : pageRangeEnd;
    const parsedStart = parseInt(startValue, 10);
    const parsedEnd = parseInt(endValue, 10);

    if (!Number.isFinite(parsedStart) || !Number.isFinite(parsedEnd)) {
      CustomToast.error(t('페이지 범위를 올바르게 입력해주세요.'));
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
    setSelectedPages(Array.from({ length: end - start + 1 }, (_, i) => start + i));
  }, [numPages, pageMode, pageRangeEnd, pageRangeStart, t]);

  useEffect(() => {
    localStorage.setItem(
      PAGES_STORAGE_KEY,
      JSON.stringify({
        pageMode,
        isPreviewVisible,
        savedAt: Date.now(),
      }),
    );
  }, [isPreviewVisible, pageMode]);

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
      width: `${PREVIEW_WIDTH}px`,
    };

    if (itemRect.left < midpoint) {
      style.left = `${itemRect.left - containerRect.left + itemWidth + GAP}px`;
    } else {
      style.left = `${itemRect.left - containerRect.left - PREVIEW_WIDTH - GAP}px`;
    }

    setHoveredPage({ pageNumber, style });
  }, []);

  const handlePageMouseLeave = useCallback(() => {
    setHoveredPage(null);
  }, []);

  const handlePageModeChange = useCallback(
    (mode) => {
      setPageMode(mode);
      if (mode === 'ALL') {
        const selectablePages = getSelectablePageCount(numPages ?? 0);
        setSelectedPages(Array.from({ length: selectablePages }, (_, i) => i + 1));
      } else {
        setSelectedPages([]);
      }
      trackPrepareQuizEvents.changeQuizOption('page_mode', mode);
    },
    [getSelectablePageCount, numPages],
  );

  const resetPagesState = useCallback(() => {
    setPageMode('CUSTOM');
    setNumPages(null);
    setSelectedPages([]);
    setHoveredPage(null);
    setVisiblePageCount(100);
    setPageRangeStart('');
    setPageRangeEnd('');
    setIsPreviewVisible(true);
    localStorage.removeItem(PAGES_STORAGE_KEY);
  }, []);

  const resetPagesForRecreate = useCallback(() => {
    setPageMode('ALL');
    setNumPages(null);
    setSelectedPages([]);
    setHoveredPage(null);
    setVisiblePageCount(100);
    setPageRangeStart('1');
    setPageRangeEnd(String(Math.min(numPages ?? 1, MAX_SELECT_PAGES)));
    setIsPreviewVisible(true);
    localStorage.removeItem(PAGES_STORAGE_KEY);
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
      pdfPreviewRef,
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
      resetPagesForRecreate,
    },
  };
};
