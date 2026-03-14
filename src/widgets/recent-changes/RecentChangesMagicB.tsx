import { useTranslation } from 'i18nexus';
import { useRecentChanges } from './model/useRecentChanges';
import { BlurFade } from '@/shared/ui/components/blur-fade';
import { Clock } from 'lucide-react';

/** MagicB — DesignB 타임라인 + BlurFade + gradient accent */
const RecentChangesMagicB = () => {
  const { t } = useTranslation();
  const {
    state: { changes },
    actions: { formatDate },
  } = useRecentChanges();

  return (
    <BlurFade delay={0.1}>
      <div className="mt-7 rounded-2xl border border-border bg-gradient-to-r from-primary/[0.02] to-transparent p-6 shadow-lg shadow-primary/5">
        <h3 className="mb-5 flex items-center gap-2 text-lg font-semibold text-foreground">
          <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5">
            <Clock className="size-4 text-primary" />
          </div>
          {t('최근 변경사항')}
        </h3>
        <div className="relative ml-3 border-l-2 border-primary/30 pl-6">
          {changes.map((log, index) => (
            <BlurFade key={log.id || index} delay={0.15 + index * 0.05}>
              <div className="relative pb-5 last:pb-0">
                {/* 타임라인 도트 — gradient */}
                <div className="absolute -left-[31px] top-1 size-3 rounded-full border-2 border-primary bg-gradient-to-br from-primary/30 to-primary/10" />
                <div className="text-xs font-medium text-primary/70">
                  {formatDate(log.dateTime)}
                </div>
                <div className="mt-1 text-sm font-medium text-foreground">{t(log.updateText)}</div>
              </div>
            </BlurFade>
          ))}
        </div>
      </div>
    </BlurFade>
  );
};

export default RecentChangesMagicB;
