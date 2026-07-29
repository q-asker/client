import { useTranslation } from 'i18nexus';
import { createPortal } from 'react-dom';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/shared/ui/components/button';
import { useRepeatGeneration } from '../model/useRepeatGeneration';

interface RepeatQuizCtaProps {
  problemSetId: string;
  /** 버튼 스타일 (결과=outline 보조 / 해설 사이드바=default) */
  variant?: 'default' | 'outline' | 'secondary';
  className?: string;
}

/** 생성 진행 중 전체 화면 오버레이 — 완료 시 곧바로 풀이로 이동한다 (FR-004) */
const RepeatGenerationOverlay = ({ t }: { t: (key: string) => string }) =>
  createPortal(
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/90 px-6 text-center backdrop-blur-sm">
      <div className="mb-5 size-14 animate-spin rounded-full border-4 border-muted-foreground/20 border-t-primary" />
      <p className="text-base font-semibold text-foreground">
        {t('같은 조건으로 새 문제를 만들고 있어요...')}
      </p>
      <p className="mt-2 text-xs text-muted-foreground/70">{t('완료되면 바로 풀이로 이동해요.')}</p>
    </div>,
    document.body,
  );

/**
 * "이 조건으로 더 풀기" 진입 수단 — 결과·해설 확인 지점에서 방금과 같은 조건으로 새 세트를 잇는다.
 * 자기완결형: 버튼 + 생성 진행 오버레이를 함께 렌더한다.
 */
export const RepeatQuizCta = ({
  problemSetId,
  variant = 'outline',
  className,
}: RepeatQuizCtaProps) => {
  const { t } = useTranslation('make-quiz');
  const { startRepeat, phase } = useRepeatGeneration();

  return (
    <>
      <Button
        variant={variant}
        size="lg"
        className={className}
        disabled={phase !== 'idle'}
        onClick={() => startRepeat(problemSetId, t)}
      >
        <RefreshCw className={phase === 'loading' ? 'animate-spin' : ''} />
        {t('이 조건으로 더 풀기')}
      </Button>
      {phase === 'generating' && <RepeatGenerationOverlay t={t} />}
    </>
  );
};
