import { useTranslation } from 'i18nexus';
import { useRecentChanges } from './model/useRecentChanges';
import { Sparkles } from 'lucide-react';

/** DesignK — 3열 그리드 미니멀 칩 스타일 */
const RecentChangesDesignK = () => {
  const { t } = useTranslation();
  const {
    state: { changes },
    actions: { formatDate },
  } = useRecentChanges();

  return (
    <div className="mt-7 rounded-2xl border border-border bg-card p-6">
      <h3 className="mb-5 flex items-center gap-2 text-lg font-semibold text-foreground">
        <Sparkles className="size-5 text-primary" />
        {t('최근 변경사항')}
      </h3>
      <div className="flex flex-wrap gap-3">
        {changes.map((log) => (
          <div
            key={log.id}
            className="group flex flex-col items-start gap-1 rounded-full border border-primary/20 bg-primary/5 px-4 py-2.5 transition-all hover:border-primary/40 hover:bg-primary/10"
          >
            <span className="text-xs font-medium text-primary/70">{formatDate(log.dateTime)}</span>
            <p className="line-clamp-1 text-xs text-foreground/80 group-hover:text-foreground">
              {t(log.updateText)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentChangesDesignK;
