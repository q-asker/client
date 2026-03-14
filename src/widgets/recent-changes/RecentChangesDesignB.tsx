import { useTranslation } from 'i18nexus';
import { useRecentChanges } from './model/useRecentChanges';
import { Clock } from 'lucide-react';

/** DesignB — 타임라인 스타일 */
const RecentChangesDesignB = () => {
  const { t } = useTranslation();
  const {
    state: { changes },
    actions: { formatDate },
  } = useRecentChanges();

  return (
    <div className="mt-7 rounded-2xl border border-border bg-card p-6">
      <h3 className="mb-5 flex items-center gap-2 text-lg font-semibold text-foreground">
        <Clock className="size-5 text-primary" />
        {t('최근 변경사항')}
      </h3>
      <div className="relative ml-3 border-l-2 border-primary/20 pl-6">
        {changes.map((log, index) => (
          <div key={log.id || index} className="relative pb-5 last:pb-0">
            {/* 타임라인 도트 */}
            <div className="absolute -left-[31px] top-1 size-3 rounded-full border-2 border-primary bg-background" />
            <div className="text-xs font-medium text-muted-foreground">
              {formatDate(log.dateTime)}
            </div>
            <div className="mt-1 text-sm font-medium text-foreground">{t(log.updateText)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentChangesDesignB;
