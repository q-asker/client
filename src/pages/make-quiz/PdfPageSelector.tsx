import React from 'react';
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { cn } from '@/shared/ui/lib/utils';
import type { TFunction } from 'i18nexus';

interface PdfPageSelectorProps {
  uploadedUrl: string | null;
  pdfOptions: object;
  numPages: number | null;
  visiblePageCount: number;
  selectedPages: number[];
  hoveredPage: { pageNumber: number; style: React.CSSProperties } | null;
  isPreviewVisible: boolean;
  t: TFunction;
  onDocumentLoadSuccess: (pdf: { numPages: number }) => void;
  onLoadError: (error: Error & { status?: number }) => void;
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
  onPageClick,
  onPageMouseEnter,
  onPageMouseLeave,
}) => {
  return (
    <Document
      file={uploadedUrl?.replace(/^https?:\/\/files\.q-asker\.com\//, '/files/')}
      onLoadSuccess={onDocumentLoadSuccess}
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
          {Array.from(
            new Array(Math.min(visiblePageCount, numPages ?? 0)),
            (_el: undefined, index: number) => {
              const pageNumber: number = index + 1;
              const isSelected: boolean = selectedPages.includes(pageNumber);
              const isHovered: boolean = hoveredPage?.pageNumber === pageNumber;

              return (
                <div
                  key={`page_${pageNumber}`}
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
                  <Page
                    pageNumber={pageNumber}
                    width={300}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    className="[&_canvas]:!h-auto [&_canvas]:!w-full"
                  />

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
            },
          )}
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
