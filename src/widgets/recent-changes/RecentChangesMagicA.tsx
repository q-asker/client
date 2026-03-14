import { useTranslation } from 'i18nexus';
import { useRecentChanges } from './model/useRecentChanges';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/components/card';
import { Badge } from '@/shared/ui/components/badge';
import { BlurFade } from '@/shared/ui/components/blur-fade';
import { CalendarDays, Sparkles } from 'lucide-react';

/** MagicA — DesignA + BlurFade 순차 등장 + gradient accent */
const RecentChangesMagicA = () => {
  const { t } = useTranslation();
  const {
    state: { changes },
    actions: { formatDate },
  } = useRecentChanges();

  return (
    <BlurFade delay={0.1}>
      <Card className="mt-7 border-t-4 border-t-primary/30 shadow-lg shadow-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5">
              <Sparkles className="size-4 text-primary" />
            </div>
            {t('최근 변경사항')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {changes.map((log, index) => (
            <BlurFade key={log.id || index} delay={0.15 + index * 0.05}>
              <div className="flex items-center gap-3 rounded-lg border border-primary/10 bg-gradient-to-r from-primary/[0.03] to-transparent px-4 py-3 transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/10">
                <CalendarDays className="size-4 shrink-0 text-primary/60" />
                <Badge variant="secondary" className="shrink-0 font-mono text-xs">
                  {formatDate(log.dateTime)}
                </Badge>
                <span className="text-sm text-foreground">{t(log.updateText)}</span>
              </div>
            </BlurFade>
          ))}
        </CardContent>
      </Card>
    </BlurFade>
  );
};

export default RecentChangesMagicA;
