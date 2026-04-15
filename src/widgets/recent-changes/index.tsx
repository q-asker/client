import { useTranslation } from 'i18nexus';
import { Link } from 'react-router-dom';
import { useRecentChanges } from './model/useRecentChanges';
import { cn } from '@/shared/ui/lib/utils';
import { Skeleton } from '@/shared/ui/components/skeleton';
import { Sparkles, ArrowRight } from 'lucide-react';

/** 메인 페이지용 최근 변경사항 미니 목록 — 문의 게시판 테이블 스타일 */
const RecentChanges = () => {
  const { t } = useTranslation('board');
  const {
    state: { posts, isLoading },
    actions: { formatDate },
  } = useRecentChanges();

  return (
    <div className="mt-7 rounded-2xl border border-border bg-card p-6 max-md:p-4">
      {/* 헤더 */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
          <Sparkles className="size-4 text-primary" />
          {t('최근 변경사항')}
        </h3>
        <Link
          to="/updates"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          {t('전체보기')}
          <ArrowRight className="size-3.5" />
        </Link>
      </div>

      {/* 테이블 헤더 */}
      <div className="flex items-center border-b-2 border-border px-3 py-2 text-xs font-semibold text-muted-foreground max-md:hidden">
        <span className="flex-1 pl-1">{t('제목')}</span>
        <span className="w-[15%] text-center">{t('작성일')}</span>
      </div>

      {/* 로딩 */}
      {isLoading ? (
        Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center border-b border-border px-3 py-3">
            <Skeleton className="h-4 flex-1 rounded" />
            <Skeleton className="ml-4 h-4 w-20 rounded max-md:hidden" />
          </div>
        ))
      ) : posts.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          {t('아직 등록된 변경사항이 없습니다')}
        </div>
      ) : (
        posts.map((post) => (
          <div
            key={post.boardId}
            className={cn(
              'flex items-center border-b border-border px-3 py-2.5 text-sm transition-colors hover:bg-muted/50',
              'max-md:flex-col max-md:items-start max-md:gap-1 max-md:py-2.5',
            )}
          >
            <span className="flex-1 truncate pl-1 max-md:w-full max-md:pl-0">
              <Link
                to={`/updates/${post.boardId}`}
                className="font-medium text-foreground no-underline transition-colors hover:text-primary"
              >
                {post.title}
              </Link>
            </span>
            <span className="w-[15%] text-center text-xs text-muted-foreground max-md:hidden">
              {formatDate(post.createdAt)}
            </span>
          </div>
        ))
      )}
    </div>
  );
};

export default RecentChanges;
