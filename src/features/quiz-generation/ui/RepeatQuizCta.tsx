import { useTranslation } from 'i18nexus';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/shared/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/components/dialog';
import { useRepeatGeneration } from '../model/useRepeatGeneration';
import type { QuizType } from '../model/useQuizGenerationStore';

interface RepeatQuizCtaProps {
  problemSetId: string;
  /** 버튼 스타일 (결과=outline 보조 / 해설 사이드바=default) */
  variant?: 'default' | 'outline' | 'secondary';
  className?: string;
}

/** 연속된 페이지 번호를 "1–3, 5"처럼 범위로 압축해 표시한다. */
const formatPages = (pages: number[]): string => {
  const sorted = [...pages].sort((a, b) => a - b);
  const ranges: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];
  for (let i = 1; i <= sorted.length; i++) {
    if (i < sorted.length && sorted[i] === prev + 1) {
      prev = sorted[i];
      continue;
    }
    ranges.push(start === prev ? `${start}` : `${start}–${prev}`);
    start = sorted[i];
    prev = sorted[i];
  }
  return ranges.join(', ');
};

/**
 * "이 조건으로 더 풀기" 진입 수단 — 결과·해설 확인 지점에서 방금과 같은 조건으로 새 세트를 잇는다.
 * 클릭 시 서버에서 생성 조건을 조회해 확인 모달로 보여주고, 사용자가 한 번 더 확인하면 최초 생성과 동일한
 * 경로로 태워 make-quiz "생성 중" 화면으로 진입한다.
 */
export const RepeatQuizCta = ({
  problemSetId,
  variant = 'outline',
  className,
}: RepeatQuizCtaProps) => {
  const { t } = useTranslation('make-quiz');
  const { openRepeat, confirmRepeat, cancelRepeat, phase, condition } = useRepeatGeneration();

  const typeLabels: Record<QuizType, string> = {
    ESSAY: t('서술형'),
    MULTIPLE: t('객관식'),
    OX: t('OX 퀴즈'),
    BLANK: t('빈칸 넣기'),
    REAL_BLANK: t('빈칸 직접입력'),
  };

  return (
    <>
      <Button
        variant={variant}
        size="lg"
        className={className}
        disabled={phase !== 'idle'}
        onClick={() => openRepeat(problemSetId, t)}
      >
        <RefreshCw className={phase === 'loading' ? 'animate-spin' : ''} />
        {t('이 조건으로 더 풀기')}
      </Button>

      <Dialog open={phase === 'confirming'} onOpenChange={(open) => !open && cancelRepeat()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('아래 조건으로 문제를 더 만들까요?')}</DialogTitle>
            <DialogDescription>
              {t('방금 푼 세트와 같은 조건으로 새 문제를 이어서 생성합니다.')}
            </DialogDescription>
          </DialogHeader>

          {condition && (
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 py-2 text-sm">
              <dt className="font-medium text-muted-foreground">{t('자료')}</dt>
              <dd className="truncate font-medium text-foreground">{condition.title}</dd>

              <dt className="font-medium text-muted-foreground">{t('퀴즈 유형')}</dt>
              <dd className="text-foreground">{typeLabels[condition.quizType]}</dd>

              <dt className="font-medium text-muted-foreground">{t('문제 수')}</dt>
              <dd className="text-foreground">{condition.quizCount}</dd>

              {condition.pageNumbers?.length ? (
                <>
                  <dt className="font-medium text-muted-foreground">{t('페이지')}</dt>
                  <dd className="text-foreground">{formatPages(condition.pageNumbers)}</dd>
                </>
              ) : null}

              {condition.language && (
                <>
                  <dt className="font-medium text-muted-foreground">{t('언어')}</dt>
                  <dd className="text-foreground">
                    {condition.language === 'EN' ? t('영어') : t('한국어')}
                  </dd>
                </>
              )}

              {condition.customInstruction?.trim() && (
                <>
                  <dt className="font-medium text-muted-foreground">{t('추가 지시')}</dt>
                  <dd className="whitespace-pre-wrap text-foreground">
                    {condition.customInstruction.trim()}
                  </dd>
                </>
              )}
            </dl>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={cancelRepeat}>
              {t('취소')}
            </Button>
            <Button onClick={() => confirmRepeat(t)}>{t('이 조건으로 만들기')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
