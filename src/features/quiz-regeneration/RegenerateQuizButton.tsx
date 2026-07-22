import { useTranslation } from 'i18nexus';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/shared/ui/components/button';
import { cn } from '@/shared/ui/lib/utils';
import { useRegenerateQuiz } from './useRegenerateQuiz';

interface RegenerateQuizButtonProps {
  problemSetId: string | undefined;
  size?: 'sm' | 'lg' | 'default';
  className?: string;
}

/** 결과·해설 화면 하단의 "이 조건으로 문제 더 만들기" 버튼(동일 재현). 생성 중에는 비활성(중복 클릭 방지). */
export function RegenerateQuizButton({
  problemSetId,
  size = 'lg',
  className,
}: RegenerateQuizButtonProps) {
  const { t } = useTranslation<'make-quiz'>('make-quiz');
  const { regenerate, isRegenerating } = useRegenerateQuiz(problemSetId);

  return (
    <Button
      variant="outline"
      size={size}
      className={cn('w-full', className)}
      onClick={regenerate}
      disabled={isRegenerating}
      data-testid="regenerate-quiz-button"
    >
      <RefreshCw className={cn('size-4', isRegenerating && 'animate-spin')} />
      {t('이 조건으로 문제 더 만들기')}
    </Button>
  );
}
