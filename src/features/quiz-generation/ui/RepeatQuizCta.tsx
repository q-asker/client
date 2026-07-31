import { useTranslation } from 'i18nexus';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/shared/ui/components/button';
import { useRepeatGeneration } from '../model/useRepeatGeneration';

interface RepeatQuizCtaProps {
  problemSetId: string;
  /** 버튼 스타일 (결과=outline 보조 / 해설 사이드바=default) */
  variant?: 'default' | 'outline' | 'secondary';
  className?: string;
}

/**
 * "이 조건으로 더 풀기" 진입 수단 — 결과·해설 확인 지점에서 방금과 같은 조건으로 새 세트를 잇는다.
 * 클릭 시 최초 생성과 동일한 경로로 태워 make-quiz "생성 중" 화면으로 진입하므로, 이 컴포넌트는
 * 조건 조회 중(loading) 버튼 표시만 담당한다(진행 오버레이 없음).
 */
export const RepeatQuizCta = ({
  problemSetId,
  variant = 'outline',
  className,
}: RepeatQuizCtaProps) => {
  const { t } = useTranslation('make-quiz');
  const { startRepeat, phase } = useRepeatGeneration();

  return (
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
  );
};
