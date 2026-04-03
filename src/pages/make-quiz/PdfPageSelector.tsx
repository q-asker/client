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
  // 캡처된 썸네일 이미지 URL (pageNumber → dataURL)
  const [thumbnails, setThumbnails] = useState<Map<number, string>>(new Map());
  // 현재 렌더링 중인 페이지 Set (최대 CONCURRENT_RENDERS개)
  const [renderingSet, setRenderingSet] = useState<Set<number>>(new Set());
  // 다음에 렌더링할 페이지 번호 커서
  const nextPageRef = useRef<number>(1);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfDocRef = useRef<any>(null);
  const prefetchedRef = useRef<Set<number>>(new Set());

  const maxPage = Math.min(visiblePageCount, numPages ?? 0);

  const handleDocumentLoadSuccess = useCallback(
    (pdf: { numPages: number }) => {
      pdfDocRef.current = pdf;
      onDocumentLoadSuccess(pdf);
    },
    [onDocumentLoadSuccess],
  );

  // 빈 슬롯을 채울 다음 페이지들을 계산
  const fillRenderSlots = useCallback(
    (currentThumbnails: Map<number, string>, currentRendering: Set<number>) => {
      const max = Math.min(visiblePageCount, numPages ?? 0);
      const next = new Set(currentRendering);
      let cursor = nextPageRef.current;

      while (next.size < CONCURRENT_RENDERS && cursor <= max) {
        if (!currentThumbnails.has(cursor) && !next.has(cursor)) {
          next.add(cursor);
        }
        cursor++;
      }
      nextPageRef.current = cursor;

      // Set 내용이 같으면 업데이트 안 함
      if (next.size !== currentRendering.size || [...next].some((p) => !currentRendering.has(p))) {
        setRenderingSet(next);
      }
    },
    [visiblePageCount, numPages],
  );

  // 초기 슬롯 채우기 + visiblePageCount 확장 시 재개
  useEffect(() => {
    // 커서를 아직 캡처 안 된 첫 페이지로 리셋
    const max = Math.min(visiblePageCount, numPages ?? 0);
    for (let i = 1; i <= max; i++) {
      if (!thumbnails.has(i)) {
        nextPageRef.current = i;
        break;
      }
    }
    fillRenderSlots(thumbnails, renderingSet);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visiblePageCount, numPages]);

  // Page 렌더링 완료 → canvas 캡처 → 슬롯 해제 → 다음 페이지 채우기
  const handlePageRenderSuccess = useCallback(
    (pageNumber: number) => {
      const container = document.querySelector(`[data-page="${pageNumber}"]`);
      const canvas = container?.querySelector('canvas');
      if (canvas) {
        const dataUrl = canvas.toDataURL('image/png');
        setThumbnails((prev) => {
          const next = new Map(prev).set(pageNumber, dataUrl);
          // 슬롯에서 제거하고 다음 페이지 채우기
          setRenderingSet((prevSet) => {
            const nextSet = new Set(prevSet);
            nextSet.delete(pageNumber);
            // 다음 틱에서 슬롯 채우기 (state 업데이트 배칭)
            requestAnimationFrame(() => fillRenderSlots(next, nextSet));
            return nextSet;
          });
          return next;
        });
      }

      onPageRenderSuccess(pageNumber);
    },
    [onPageRenderSuccess, fillRenderSlots],
  );

  // 현재 렌더링 중인 페이지 기준으로 앞뒤 10페이지 데이터 미리 다운로드
  useEffect(() => {
    const pdfDoc = pdfDocRef.current;
    if (!pdfDoc || !numPages) return;

    // renderingSet 중 최소/최대 페이지 기준
    let minPage = nextPageRef.current;
    let maxP = nextPageRef.current;
    for (const p of renderingSet) {
      if (p < minPage) minPage = p;
      if (p > maxP) maxP = p;
    }

    const prefetchStart = Math.max(1, minPage - PREFETCH_BUFFER);
    const prefetchEnd = Math.min(numPages, maxP + PREFETCH_BUFFER);

    for (let i = prefetchStart; i <= prefetchEnd; i++) {
      if (prefetchedRef.current.has(i)) continue;
      prefetchedRef.current.add(i);
      pdfDoc.getPage(i).catch(() => {
        prefetchedRef.current.delete(i);
      });
    }
  }, [renderingSet, numPages]);

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
