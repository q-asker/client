import { useTranslation } from 'i18nexus';
import { FileText } from 'lucide-react';
import { cn } from '@/shared/ui/lib/utils';

interface MockPageGridProps {
  numPages: number;
  selectedPages: number[];
  onPageClick: (pageNumber: number) => void;
}

/** mock 모드에서 PDF 뷰어 대신 표시할 페이지 그리드 */
const MockPageGrid = ({ numPages, selectedPages, onPageClick }: MockPageGridProps) => {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3 p-1.5">
      {Array.from({ length: numPages }, (_, index) => {
        const pageNumber = index + 1;
        const isSelected = selectedPages.includes(pageNumber);
        return (
          <div
            key={`mock_page_${pageNumber}`}
            className={cn(
              'flex h-[200px] cursor-pointer items-center justify-center rounded-md border bg-muted text-center transition-all duration-200 hover:scale-[1.02]',
              isSelected ? 'border-primary bg-primary/10' : 'border-border',
            )}
            onClick={() => onPageClick(pageNumber)}
          >
            <div className="flex flex-col items-center gap-2">
              <FileText className="size-8 text-muted-foreground/50" />
              <span className="text-sm font-medium text-muted-foreground">
                {t('페이지')} {pageNumber}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MockPageGrid;
