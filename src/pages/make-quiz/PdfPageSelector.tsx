import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { cn } from '@/shared/ui/lib/utils';

/** 뷰포트 밖 미리 다운로드할 페이지 수 (앞뒤 각각) */
const PREFETCH_BUFFER = 10;
/** 동시에 canvas 렌더링할 페이지 수 */
const CONCURRENT_RENDERS = 6;

interface PdfPageSelectorProps {
  uploadedUrl: string | null;
  pdfOptions: object;
  numPages: number | null;
  visiblePageCount: number;
  selectedPages: number[];
  hoveredPage: { pageNumber: number; style: React.CSSProperties } | null;
  isPreviewVisible: boolean;
  t: (key: string) => string;
  onDocumentLoadSuccess: (pdf: { numPages: number }) => void;
  onLoadError: (error: Error & { status?: number }) => void;
  onPageRenderSuccess: (pageNumber: number) => void;
  onPageClick: (pageNumber: number) => void;
  onPageMouseEnter: (e: React.MouseEvent<HTMLDivElement>, pageNumber: number) => void;
  onPageMouseLeave: () => void;
}

const PdfPageSelector: React.FC<PdfPageSelectorProps> = ({
  uploadedUrl,
  pdfOptions,
  numPages,
  visiblePageCount,
  selectedPages,
  hoveredPage,
  isPreviewVisible,
  t,
  onDocumentLoadSuccess,
  onLoadError,
  onPageRenderSuccess,
  onPageClick,
  onPageMouseEnter,
  onPageMouseLeave,
}) => {
  const [thumbnails, setThumbnails] = useState<Map<number, string>>(new Map());
  const [renderingSet, setRenderingSet] = useState<Set<number>>(new Set());
  const [visibleInViewport, setVisibleInViewport] = useState<Set<number>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const observedRef = useRef<Set<Element>>(new Set());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfDocRef = useRef<any>(null);
  const prefetchedRef = useRef<Set<number>>(new Set());

  const maxPage = Math.min(visiblePageCount, numPages ?? 0);

  // 스크롤 컨테이너 ref callback — observer를 여기서 생성
  const scrollContainerRef = useCallback((container: HTMLDivElement | null) => {
    // 이전 observer 정리
    observerRef.current?.disconnect();
    observedRef.current.clear();
    if (!container) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        setVisibleInViewport((prev) => {
          const next = new Set(prev);
          for (const entry of entries) {
            const page = Number((entry.target as HTMLElement).dataset.page);
            if (entry.isIntersecting) {
              next.add(page);
            } else {
              next.delete(page);
            }
          }
          if (next.size === prev.size && [...next].every((p) => prev.has(p))) return prev;
          return next;
        });
      },
      { root: container, rootMargin: '300px 0px' },
    );

    // 이미 존재하는 요소 등록
    container.querySelectorAll<HTMLElement>('[data-page]').forEach((el) => {
      observerRef.current!.observe(el);
      observedRef.current.add(el);
    });
  }, []);

  // 페이지 요소를 observer에 등록
  const registerRef = useCallback((el: HTMLDivElement | null) => {
    if (el && observerRef.current && !observedRef.current.has(el)) {
      observerRef.current.observe(el);
      observedRef.current.add(el);
    }
  }, []);

  const handleDocumentLoadSuccess = useCallback(
    (pdf: { numPages: number }) => {
      pdfDocRef.current = pdf;
      onDocumentLoadSuccess(pdf);
    },
    [onDocumentLoadSuccess],
  );

  // 뷰포트 근처 페이지만 렌더링 슬롯에 채우기
  useEffect(() => {
    setRenderingSet((prev) => {
      const next = new Set<number>();
      // 아직 렌더링 중인 페이지 유지
      for (const p of prev) {
        if (!thumbnails.has(p)) next.add(p);
      }
      // 뷰포트에 보이는 페이지 중 캡처 안 된 것만 추가
      // 작은 번호부터 우선
      const sorted = [...visibleInViewport].sort((a, b) => a - b);
      for (const p of sorted) {
        if (next.size >= CONCURRENT_RENDERS) break;
        if (!thumbnails.has(p) && !next.has(p) && p <= maxPage) {
          next.add(p);
        }
      }
      if (next.size === prev.size && [...next].every((p) => prev.has(p))) return prev;
      return next;
    });
  }, [thumbnails, visibleInViewport, maxPage]);

  // Page 렌더링 완료 → canvas 캡처
  const handlePageRenderSuccess = useCallback(
    (pageNumber: number) => {
      const container = document.querySelector(`[data-page="${pageNumber}"]`);
      const canvas = container?.querySelector('canvas');
      if (canvas) {
        const dataUrl = canvas.toDataURL('image/png');
        setThumbnails((prev) => new Map(prev).set(pageNumber, dataUrl));
      }
      onPageRenderSuccess(pageNumber);
    },
    [onPageRenderSuccess],
  );

  // 뷰포트 기준 앞뒤 10페이지 데이터 미리 다운로드
  useEffect(() => {
    const pdfDoc = pdfDocRef.current;
    if (!pdfDoc || !numPages || visibleInViewport.size === 0) return;

    let minVisible = Infinity;
    let maxVisible = 0;
    for (const p of visibleInViewport) {
      if (p < minVisible) minVisible = p;
      if (p > maxVisible) maxVisible = p;
    }

    const prefetchStart = Math.max(1, minVisible - PREFETCH_BUFFER);
    const prefetchEnd = Math.min(numPages, maxVisible + PREFETCH_BUFFER);

    for (let i = prefetchStart; i <= prefetchEnd; i++) {
      if (prefetchedRef.current.has(i)) continue;
      prefetchedRef.current.add(i);
      pdfDoc.getPage(i).catch(() => {
        prefetchedRef.current.delete(i);
      });
    }
  }, [visibleInViewport, numPages]);

  return (
    <Document
      file={uploadedUrl?.replace(/^https?:\/\/files\.q-asker\.com\//, '/files/')}
      onLoadSuccess={handleDocumentLoadSuccess}
      onLoadError={onLoadError}
      options={pdfOptions}
      loading={
        <div className="flex flex-col items-center justify-center py-12">
          <div className="mb-3 size-8 animate-spin rounded-full border-3 border-muted-foreground/20 border-t-primary" />
          <p className="text-sm font-medium text-muted-foreground">{t('PDF 로딩 중...')}</p>
        </div>
      }
    >
      <div className="relative">
        <div
          ref={scrollContainerRef}
          className="grid max-h-[360px] grid-cols-2 gap-2 overflow-y-auto p-1 sm:grid-cols-3 sm:gap-3 sm:p-1.5"
          onMouseLeave={onPageMouseLeave}
        >
          {Array.from(new Array(maxPage), (_el: undefined, index: number) => {
            const pageNumber: number = index + 1;
            const isSelected: boolean = selectedPages.includes(pageNumber);
            const isHovered: boolean = hoveredPage?.pageNumber === pageNumber;
            const thumbnail = thumbnails.get(pageNumber);
            const isRendering = renderingSet.has(pageNumber);

            return (
              <div
                key={`page_${pageNumber}`}
                data-page={pageNumber}
                ref={registerRef}
                className={cn(
                  'relative cursor-pointer overflow-hidden rounded-none border-2 border-transparent bg-muted text-center transition-all duration-200 hover:z-10 hover:scale-[1.02] hover:shadow-md',
                  isSelected && 'border-primary',
                  isHovered && 'border-muted-foreground',
                )}
                onClick={() => {
                  onPageClick(pageNumber);
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                  onPageMouseEnter(e, pageNumber);
                }}
              >
                {isRendering ? (
                  <Page
                    pageNumber={pageNumber}
                    width={300}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    className="[&_canvas]:!h-auto [&_canvas]:!w-full"
                    onRenderSuccess={() => handlePageRenderSuccess(pageNumber)}
                  />
                ) : thumbnail ? (
                  <img
                    src={thumbnail}
                    alt={`${t('페이지')}${pageNumber}`}
                    className="h-auto w-full"
                    draggable={false}
                  />
                ) : (
                  <div className="flex aspect-[3/4] items-center justify-center">
                    <div className="size-5 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-primary" />
                  </div>
                )}

                <p
                  className={cn(
                    'mt-2 flex items-center justify-center pb-2 text-sm text-muted-foreground',
                    "before:mr-2 before:inline-block before:size-4 before:rounded-full before:border before:border-border before:bg-background before:content-['']",
                    isSelected &&
                      "font-semibold text-foreground before:border-primary before:bg-primary before:bg-[url(\"data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2016%2016'%3e%3cpath%20fill='none'%20stroke='white'%20stroke-linecap='round'%20stroke-linejoin='round'%20stroke-width='2'%20d='M4%208l3%203%205-5'/%3e%3c/svg%3e\")]",
                  )}
                >
                  {t('페이지')}
                  {pageNumber}
                </p>
              </div>
            );
          })}
          {visiblePageCount < (numPages ?? 0) && (
            <div className="col-span-full mt-4 flex flex-col items-center justify-center rounded-xl bg-muted p-5 text-muted-foreground">
              <div className="mb-2 size-6 animate-spin rounded-full border-2 border-border border-t-primary" />
              <p className="m-0 text-sm font-medium">
                {t('더 많은 페이지 로딩 중... (')}
                {visiblePageCount}/{numPages})
              </p>
            </div>
          )}
        </div>

        {/* 페이지 호버 미리보기 */}
        {isPreviewVisible && hoveredPage && (
          <div
            className="pointer-events-none absolute z-30 rounded-2xl bg-background p-3 shadow-lg transition-[opacity,top] duration-200"
            style={hoveredPage.style}
          >
            <Page
              pageNumber={hoveredPage.pageNumber}
              width={640}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </div>
        )}
      </div>
    </Document>
  );
};

export default PdfPageSelector;
