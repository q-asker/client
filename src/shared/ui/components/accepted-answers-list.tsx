import { useTranslation } from 'i18nexus';
import { cn } from '@/shared/ui/lib/utils';

interface AcceptedAnswersListProps {
  /** 빈칸별 허용 정답 (바깥 index = 빈칸 등장순서, index 0 = 모범답, 1..n = 통용 변형). */
  acceptedAnswers: string[][];
  className?: string;
}

/**
 * 채점 후 각 빈칸의 허용 정답 목록을 표시한다(US3, FR-006·008·009).
 * index 0을 모범답으로 강조하고 나머지를 "함께 인정된 표현"으로 나열한다.
 * 빈칸이 여럿이면 빈칸별로 구분해 보여 준다(FR-008). 표시할 값이 없으면 렌더하지 않는다(FR-009).
 */
export const AcceptedAnswersList = ({ acceptedAnswers, className }: AcceptedAnswersListProps) => {
  const { t } = useTranslation('common');

  // 값이 하나라도 있는 빈칸만 남긴다(과거 세트의 빈 배열·공백 방어 — FR-009).
  const blanks = acceptedAnswers
    .map((answers) => answers.filter((a) => a.trim() !== ''))
    .filter((answers) => answers.length > 0);

  if (blanks.length === 0) return null;
  const isMultiBlank = blanks.length > 1;

  return (
    <div
      className={cn(
        'rounded-md border border-primary/20 bg-primary/5 px-3 py-2 max-md:py-2.5',
        className,
      )}
    >
      <div className="mb-1.5 text-[0.7rem] font-semibold text-primary max-md:text-xs">
        {t('인정된 답')}
      </div>
      <div className="flex flex-col gap-1.5">
        {blanks.map((answers, blankIndex) => (
          <div key={blankIndex} className="flex flex-wrap items-center gap-1.5">
            {isMultiBlank && (
              <span className="shrink-0 text-[0.7rem] font-medium text-muted-foreground max-md:text-xs">
                {t('빈칸')} {blankIndex + 1}
              </span>
            )}
            {answers.map((answer, answerIndex) => (
              <span
                key={answerIndex}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs max-md:text-[0.8rem]',
                  answerIndex === 0
                    ? 'bg-primary/15 font-semibold text-foreground'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {answer}
                {answerIndex === 0 && (
                  <span className="text-[0.6rem] font-medium text-primary max-md:text-[0.65rem]">
                    {t('모범답')}
                  </span>
                )}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AcceptedAnswersList;
