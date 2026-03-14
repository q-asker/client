import { useTranslation } from 'i18nexus';
import { useRecentChanges } from './model/useRecentChanges';
import { Zap } from 'lucide-react';

/** DesignJ — 반응형 그리드 넉넉한 카드 */
const RecentChangesDesignJ = () => {
  const { t } = useTranslation();
  const {
    state: { changes },
    actions: { formatDate },
  } = useRecentChanges();

  return (
    <div className="mt-7 rounded-2xl border border-border bg-card p-6">
      <h3 className="mb-6 flex items-center gap-2 text-lg font-semibold text-foreground">
        <Zap className="size-5 text-primary" />
        {t('최근 변경사항')}
      </h3>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
        {changes.map((log) => (
          <div
            key={log.id}
            className="flex flex-col gap-3 rounded-xl border border-primary/10 bg-gradient-to-br from-primary/5 to-primary/0 p-5 transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/10"
          >
            <div className="inline-flex w-fit rounded-full bg-primary/10 px-3 py-1">
              <span className="text-xs font-semibold text-primary">{formatDate(log.dateTime)}</span>
            </div>
            <p className="text-sm leading-relaxed text-foreground">{t(log.updateText)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentChangesDesignJ;
