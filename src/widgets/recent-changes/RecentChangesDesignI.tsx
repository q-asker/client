import { useTranslation } from 'i18nexus';
import { useRecentChanges } from './model/useRecentChanges';
import { Calendar } from 'lucide-react';

/** DesignI — 2열 그리드 컴팩트 카드 */
const RecentChangesDesignI = () => {
  const { t } = useTranslation();
  const {
    state: { changes },
    actions: { formatDate },
  } = useRecentChanges();

  return (
    <div className="mt-7 rounded-2xl border border-border bg-card p-6">
      <h3 className="mb-5 flex items-center gap-2 text-lg font-semibold text-foreground">
        <Calendar className="size-5 text-primary" />
        {t('최근 변경사항')}
      </h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2">
        {changes.map((log) => (
          <div
            key={log.id}
            className="flex flex-col gap-2 rounded-lg border border-border/50 bg-muted/40 p-4 transition-all hover:border-border hover:bg-muted/60"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-primary/80">
                {formatDate(log.dateTime)}
              </span>
            </div>
            <p className="line-clamp-2 text-sm font-medium text-foreground">{t(log.updateText)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentChangesDesignI;
