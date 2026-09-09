import { Button } from '@/shared/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/components/dialog';
import { cn } from '@/shared/ui/lib/utils';
import { RotateCcw, FileText } from 'lucide-react';
import type { QuizType } from '#features/quiz-generation';
import type { WrongAnswerSetResponse } from '#features/wrong-answer-set';

type T = (key: string, variables?: Record<string, string | number>) => string;

/**
 * 퀴즈 유형 표시 라벨. 옵션 화면(QuizOptionsPanel)에서 사용자가 고른 단어를 그대로 쓴다 —
 * BLANK 와 REAL_BLANK 를 한 단어로 합치면 유형별로 만들어진 오답 문제집을 구별할 수 없다
 * (확정 제품 결정 6, FR-007·FR-013).
 */
export const getQuizTypeLabels = (t: T): Record<QuizType, string> => ({
  MULTIPLE: t('객관식'),
  OX: t('OX 퀴즈'),
  BLANK: t('빈칸 넣기'),
  REAL_BLANK: t('빈칸 직접입력'),
  ESSAY: t('서술형'),
});

// ── 진입점 ──

interface WrongAnswerCtaProps {
  t: T;
  /** 특정 폴더를 보고 있는지. 전체·미분류에서는 실행할 수 없다 (FR-017) */
  folderSelected: boolean;
  submitting: boolean;
  onClick: () => void;
}

/**
 * "틀린 문제 모아풀기" 진입점 — 폴더 바에 놓인다.
 * 폴더를 고르지 않았으면 눌러본 뒤 거부당하는 게 아니라 **시도 전에** 비활성 + 사유로 드러낸다(FR-017).
 */
export const WrongAnswerCta = ({ t, folderSelected, submitting, onClick }: WrongAnswerCtaProps) => {
  const reason = t('폴더를 선택하면 그 폴더의 오답을 모을 수 있어요');
  return (
    <Button
      variant="outline"
      size="sm"
      className="shrink-0"
      disabled={!folderSelected || submitting}
      onClick={onClick}
      title={folderSelected ? undefined : String(reason)}
      aria-describedby={folderSelected ? undefined : 'wrong-answer-cta-reason'}
    >
      <RotateCcw className={cn('mr-1 size-3.5', submitting && 'animate-spin')} />
      {t('틀린 문제 모아풀기')}
    </Button>
  );
};

/** 폴더 미선택 사유 — 버튼 옆(모바일은 아래)에 상시 노출해 시도 전에 알 수 있게 한다 */
export const WrongAnswerCtaReason = ({ t }: { t: T }) => (
  <p id="wrong-answer-cta-reason" className="mt-1 text-right text-xs text-muted-foreground">
    {t('폴더를 선택하면 그 폴더의 오답을 모을 수 있어요')}
  </p>
);

// ── 안내 문구 조립 (BE는 구조화된 사실만 주고 문구는 여기서 만든다 — contract §7.3) ──

/** 서술형 제외 안내. 제외된 게 없으면 null (FR-016a) */
const essayNotice = (t: T, count: number): string | null =>
  count > 0 ? t('서술형 {{count}}문제는 아직 모아풀기 대상이 아니에요.', { count }) : null;

/** 일부 유형이 만들어지지 않은 경우의 안내 (FR-018) */
const failedNotice = (t: T, failedTypes: QuizType[]): string | null => {
  if (failedTypes.length === 0) return null;
  const labels = getQuizTypeLabels(t);
  return t('{{types}} 문제집은 만들지 못했어요.', {
    types: failedTypes.map((type) => labels[type]).join(', '),
  });
};

/**
 * 만들어진 문제집이 하나도 없을 때의 안내 (FR-011·FR-016a).
 * 서술형만 있었던 경우 "모을 오답이 없다"로 끝내지 않고 제외 사실을 함께 알린다.
 */
export const emptyResultMessage = (t: T, result: WrongAnswerSetResponse): string => {
  if (result.emptyReason === 'ESSAY_ONLY') {
    return `${t('모을 오답이 없어요.')} ${t('서술형은 아직 모아풀기를 지원하지 않아요.')}`;
  }
  if (result.emptyReason === 'SOURCE_DELETED') {
    return t('오답이 있던 문제집이 삭제되어 모을 문항이 없어요.');
  }
  const base = t('모을 오답이 없어요.');
  const essay = essayNotice(t, result.excludedEssayCount);
  return essay ? `${base} ${essay}` : base;
};

// ── 빈 결과 인라인 안내 ──

interface WrongAnswerEmptyNoticeProps {
  t: T;
  result: WrongAnswerSetResponse;
  onDismiss: () => void;
}

export const WrongAnswerEmptyNotice = ({ t, result, onDismiss }: WrongAnswerEmptyNoticeProps) => (
  <div className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
    <p className="text-sm text-muted-foreground">{emptyResultMessage(t, result)}</p>
    <Button variant="ghost" size="sm" className="h-7 shrink-0 px-2" onClick={onDismiss}>
      {t('닫기')}
    </Button>
  </div>
);

// ── 결과 선택 다이얼로그 ──

interface WrongAnswerResultDialogProps {
  t: T;
  /** null 이면 닫힘. 문제집이 1개뿐이면 이 다이얼로그를 띄우지 않고 곧바로 풀이로 보낸다 */
  result: WrongAnswerSetResponse | null;
  onOpenChange: (open: boolean) => void;
  onSelect: (problemSetId: string) => void;
}

/**
 * 유형별로 여러 개가 만들어졌을 때 무엇부터 풀지 고르게 한다 (FR-007·SC-001).
 * 상한 안내는 걸린 유형의 행에만 붙는다 (FR-012).
 */
export const WrongAnswerResultDialog = ({
  t,
  result,
  onOpenChange,
  onSelect,
}: WrongAnswerResultDialogProps) => {
  if (!result) return null;
  const labels = getQuizTypeLabels(t);
  const banners = [
    essayNotice(t, result.excludedEssayCount),
    failedNotice(t, result.failedTypes),
  ].filter((message): message is string => message !== null);

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('오답 문제집이 만들어졌어요')}</DialogTitle>
          <DialogDescription>{t('무엇부터 풀지 골라주세요.')}</DialogDescription>
        </DialogHeader>

        {banners.length > 0 && (
          <div className="space-y-1 rounded-md bg-muted/60 px-3 py-2">
            {banners.map((message) => (
              <p key={message} className="text-xs text-muted-foreground">
                {message}
              </p>
            ))}
          </div>
        )}

        <div className="max-h-72 space-y-1 overflow-y-auto">
          {result.createdSets.map((set) => (
            <button
              key={set.problemSetId}
              type="button"
              onClick={() => onSelect(set.problemSetId)}
              className="flex w-full items-center justify-between gap-3 rounded-md border border-border px-3 py-2.5 text-left transition-colors hover:bg-muted/60"
            >
              <span className="flex min-w-0 items-center gap-2">
                <FileText className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate text-sm font-medium">{labels[set.quizType]}</span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                {set.truncated && (
                  <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[0.65rem] text-warning">
                    {t('최근 100문제만 담겼어요')}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {set.questionCount}
                  {t('문제')}
                </span>
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
