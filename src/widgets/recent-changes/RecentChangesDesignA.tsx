import { useTranslation } from 'i18nexus';
import { useRecentChanges } from './model/useRecentChanges';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/components/card';
import { Badge } from '@/shared/ui/components/badge';
import { CalendarDays, Sparkles } from 'lucide-react';

/** DesignA — Shadcn Card + Badge + 아이콘 */
const RecentChangesDesignA = () => {
  const { t } = useTranslation();
  const {
    state: { changes },
    actions: { formatDate },
  } = useRecentChanges();

  return (
    <Card className="mt-7">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="size-5 text-primary" />
          {t('최근 변경사항')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {changes.map((log, index) => (
          <div
            key={log.id || index}
            className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3 transition-colors hover:bg-muted/50"
          >
            <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
            <Badge variant="secondary" className="shrink-0 font-mono text-xs">
              {formatDate(log.dateTime)}
            </Badge>
            <span className="text-sm text-foreground">{t(log.updateText)}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default RecentChangesDesignA;
