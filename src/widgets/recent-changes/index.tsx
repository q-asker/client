import { useTranslation } from 'i18nexus';
import { useRecentChanges } from './model/useRecentChanges';
import { Sparkles } from 'lucide-react';

/** DesignK — 3열 그리드 미니멀 칩 스타일 */
const RecentChanges = () => {
  const { t } = useTranslation('make-quiz');
  const {
    state: { changes, isLoading },
    actions: { formatDate },
  } = useRecentChanges();

  return (
    <div className="mt-7 rounded-2xl border border-border bg-card p-6">
      <h3 className="mb-5 flex items-center gap-2 text-xl font-semibold text-foreground">
        <Sparkles className="size-5 text-primary" />
        {t('최근 변경사항')}
      </h3>
      <div className="flex flex-wrap gap-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="mt-1 size-2 shrink-0 rounded-full bg-muted" />
                <div className="flex flex-col gap-1 rounded-full border border-border bg-muted/30 px-4 py-2.5">
                  <span className="h-3 w-20 animate-pulse rounded bg-muted" />
                  <span className="h-3 w-36 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))
          : changes.map((log, i) => (
              <div key={log.id ?? i} className="flex gap-2 items-start">
                <div className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                <div className="group flex flex-col items-start gap-1 rounded-full border border-primary/20 bg-primary/5 px-4 py-2.5 transition-all hover:border-primary/40 hover:bg-primary/10">
                  <span className="text-xs font-medium text-primary/70">
                    {formatDate(log.dateTime)}
                  </span>
                  <p className="line-clamp-1 text-xs text-foreground/80 group-hover:text-foreground">
                    {t(log.updateText)}
                  </p>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
};

export default RecentChanges;
