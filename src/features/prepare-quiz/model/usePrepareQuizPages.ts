import type { CSSProperties, RefObject } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import CustomToast from '#shared/toast';
import { trackMakeQuizEvents as trackPrepareQuizEvents } from '#shared/lib/analytics';
import { MAX_SELECT_PAGES, pageCountToLoad } from './constants';

const PAGES_STORAGE_KEY = 'makeQuizPages';
const EXPIRATION_MS = 24 * 60 * 60 * 1000;

/** 페이지 모드: 전체 선택 또는 커스텀 선택 */
export type PageMode = 'ALL' | 'CUSTOM';

/** 호버된 페이지 정보 */
export interface HoveredPage {
  pageNumber: number;
  style: CSSProperties;
}

/** localStorage에 저장되는 페이지 상태 */
interface SavedPagesState {
  pageMode?: PageMode;
  isPreviewVisible?: boolean;
  savedAt?: number;
}

export interface PrepareQuizPagesState {
  pageMode: PageMode;
  numPages: number | null;
  selectedPages: number[];
  hoveredPage: HoveredPage | null;
  visiblePageCount: number;
  pageRangeStart: string;
  pageRangeEnd: string;
  isPreviewVisible: boolean;
  pdfPreviewRef: RefObject<HTMLDivElement | null>;
}

export interface PrepareQuizPagesActions {
  onDocumentLoadSuccess: (result: { numPages: number }) => void;
  onPageRenderSuccess: (pageNumber: number) => void;
  handlePageSelection: (pageNumber: number) => void;
  handleSelectAllPages: () => void;
  handleClearAllPages: () => void;
  handleApplyPageRange: () => void;
  setPageRangeStart: React.Dispatch<React.SetStateAction<string>>;
  setPageRangeEnd: React.Dispatch<React.SetStateAction<string>>;
  setIsPreviewVisible: React.Dispatch<React.SetStateAction<boolean>>;
  handlePageMouseEnter: (e: React.MouseEvent<HTMLElement>, pageNumber: number) => void;
  handlePageMouseLeave: () => void;
  handlePageModeChange: (mode: PageMode) => void;
  resetPagesState: () => void;
  resetPagesForRecreate: () => void;
}

export interface PrepareQuizPagesReturn {
  state: PrepareQuizPagesState;
  actions: PrepareQuizPagesActions;
}

interface UsePrepareQuizPagesParams {
  t: (key: string) => string;
  uploadedUrl: string | null;
}

const readSavedPagesState = (): SavedPagesState | null => {
  try {
    const saved = localStorage.getItem(PAGES_STORAGE_KEY);
    if (!saved) return null;
    const parsed: SavedPagesState = JSON.parse(saved);
    const savedAt = Number(parsed?.savedAt);
    if (!savedAt || Date.now() - savedAt > EXPIRATION_MS) {
      localStorage.removeItem(PAGES_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

const MOCK_NUM_PAGES = 10;

export const usePrepareQuizPages = ({
  t,
  uploadedUrl: _uploadedUrl,
}: UsePrepareQuizPagesParams): PrepareQuizPagesReturn => {
  const [searchParams] = useSearchParams();
  const isMock = searchParams.get('mock') === 'true';

  const savedStateRef = useRef(readSavedPagesState());
  const [pageMode, setPageMode] = useState<PageMode>(savedStateRef.current?.pageMode || 'CUSTOM');
  const [numPages, setNumPages] = useState<number | null>(isMock ? MOCK_NUM_PAGES : null);
  const [selectedPages, setSelectedPages] = useState<number[]>(
    isMock ? Array.from({ length: MOCK_NUM_PAGES }, (_, i) => i + 1) : [],
  );
  const [hoveredPage, setHoveredPage] = useState<HoveredPage | null>(null);
  const [visiblePageCount, setVisiblePageCount] = useState(pageCountToLoad);
  const visiblePageCountRef = useRef(pageCountToLoad);
  const [pageRangeStart, setPageRangeStart] = useState('');
  const [pageRangeEnd, setPageRangeEnd] = useState('');
  const [isPreviewVisible, setIsPreviewVisible] = useState<boolean>(() => {
    const savedValue = savedStateRef.current?.isPreviewVisible;
    return typeof savedValue === 'boolean' ? savedValue : true;
  });
  const pdfPreviewRef = useRef<HTMLDivElement | null>(null);

  const getSelectablePageCount = useCallback(
    (totalPages: number) => Math.min(totalPages, MAX_SELECT_PAGES),
    [],
  );

  const applyAllPagesSelection = useCallback(
    (totalPages: number) => {
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

  const renderedPagesRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!numPages) return;
    const initialCount = Math.min(numPages, pageCountToLoad);
    visiblePageCountRef.current = initialCount;
    setVisiblePageCount(initialCount);
  }, [numPages]);

  const onDocumentLoadSuccess = useCallback(
    ({ numPages: nextNumPages }: { numPages: number }) => {
      setNumPages(nextNumPages);
      applyAllPagesSelection(nextNumPages);
    },
    [applyAllPagesSelection],
  );

  /** 페이지 렌더링 완료 시 호출 — 현재 배치가 모두 완료되면 다음 배치 확장 */
  const onPageRenderSuccess = useCallback(
    (pageNumber: number) => {
      renderedPagesRef.current.add(pageNumber);
      const currentVisible = visiblePageCountRef.current;
      const total = numPages ?? 0;
      if (currentVisible >= total) return;

      // 현재 배치의 모든 페이지가 렌더링 완료되었는지 확인
      let batchComplete = true;
      for (let i = currentVisible - pageCountToLoad + 1; i <= currentVisible; i++) {
        if (i > 0 && !renderedPagesRef.current.has(i)) {
          batchComplete = false;
          break;
        }
      }
      if (batchComplete) {
        const nextCount = Math.min(currentVisible + pageCountToLoad, total);
        visiblePageCountRef.current = nextCount;
        setVisiblePageCount(nextCount);
      }
    },
    [numPages],
  );

  const handlePageSelection = useCallback((pageNumber: number) => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numPages, pageMode, pageRangeEnd, pageRangeStart]);

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

  const handlePageMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLElement>, pageNumber: number) => {
      if (window.innerWidth <= 768) return;

      if (!pdfPreviewRef.current) return;

      const containerRect = pdfPreviewRef.current.getBoundingClientRect();

      const PREVIEW_WIDTH = 660;
      const GAP = 10;

      const style: CSSProperties = {
        bottom: '0px',
        left: `${containerRect.width + GAP}px`,
        width: `${PREVIEW_WIDTH}px`,
      };

      setHoveredPage({ pageNumber, style });
    },
    [],
  );

  const handlePageMouseLeave = useCallback(() => {
    setHoveredPage(null);
  }, []);

  const handlePageModeChange = useCallback(
    (mode: PageMode) => {
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
    setVisiblePageCount(pageCountToLoad);
    setPageRangeStart('');
    setPageRangeEnd('');
    setIsPreviewVisible(true);
    renderedPagesRef.current.clear();
    localStorage.removeItem(PAGES_STORAGE_KEY);
  }, []);

  const resetPagesForRecreate = useCallback(() => {
    setPageMode('ALL');
    setNumPages(null);
    setSelectedPages([]);
    setHoveredPage(null);
    setVisiblePageCount(pageCountToLoad);
    setPageRangeStart('1');
    setPageRangeEnd(String(Math.min(numPages ?? 1, MAX_SELECT_PAGES)));
    setIsPreviewVisible(true);
    renderedPagesRef.current.clear();
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
      onPageRenderSuccess,
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
