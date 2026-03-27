import { useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'i18nexus';
import { cn } from '@/shared/ui/lib/utils';
import { Card, CardContent } from '@/shared/ui/components/card';
import { Badge } from '@/shared/ui/components/badge';
import { Trophy, Clock, CheckCircle2, XCircle, Hash, ChevronDown } from 'lucide-react';
import MarkdownText from '@/shared/ui/components/markdown-text';

// ── 타입 ──

export interface ScoreBoardSelection {
  id: string | number;
  content: string;
  correct?: boolean;
}

export interface ScoreBoardProblem {
  number: number;
  title: string;
  correct: boolean;
  userAnswer: string | number;
  selections: ScoreBoardSelection[];
}

export interface QuizScoreBoardProps {
  scorePercent: number;
  totalCount: number;
  correctCount: number;
  totalTime: string;
  /** 히어로 섹션 하단 부제 (예: 날짜) */
  heroSubtitle?: ReactNode;
  /** 문항 리스트 위 액션 버튼 영역 */
  actionButton: ReactNode;
  problems: ScoreBoardProblem[];
}

// ── 컴포넌트 ──

const QuizScoreBoard = ({
  scorePercent,
  totalCount,
  correctCount,
  totalTime,
  heroSubtitle,
  actionButton,
  problems,
}: QuizScoreBoardProps) => {
  const { t } = useTranslation();
  const wrongCount = totalCount - correctCount;
  const [openSet, setOpenSet] = useState<Set<number>>(() => new Set(problems.map((p) => p.number)));

  return (
    <div className="min-h-screen bg-muted/30">
      {/* 히어로 섹션 */}
      <div className="bg-primary px-6 pb-20 pt-10 max-md:px-4 max-md:pb-16 max-md:pt-8">
        <div className="mx-auto max-w-5xl text-center">
          <Trophy className="mx-auto mb-3 size-10 text-primary-foreground/70" />
          <div className="text-6xl font-black tabular-nums text-primary-foreground max-md:text-4xl">
            {scorePercent}
            <span className="text-2xl max-md:text-lg">{t('점')}</span>
          </div>
          {heroSubtitle && <div className="mt-2">{heroSubtitle}</div>}
        </div>
      </div>

      {/* 플로팅 스탯 카드 */}
      <div className="mx-auto max-w-3xl px-6 max-md:px-4">
        <Card className="-mt-12 border-0 shadow-lg max-md:-mt-10">
          <CardContent className="grid grid-cols-4 gap-0 divide-x divide-border py-5 max-md:grid-cols-2 max-md:gap-y-4 max-md:divide-x-0">
            <div className="flex flex-col items-center gap-1">
              <Hash className="size-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{t('문제 수')}</span>
              <span className="text-xl font-bold tabular-nums text-foreground">
                {totalCount}
                {t('개')}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <CheckCircle2 className="size-4 text-success" />
              <span className="text-xs text-success">{t('정답')}</span>
              <span className="text-xl font-bold tabular-nums text-success">{correctCount}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <XCircle className="size-4 text-destructive" />
              <span className="text-xs text-destructive">{t('오답')}</span>
              <span className="text-xl font-bold tabular-nums text-destructive">{wrongCount}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Clock className="size-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{t('걸린 시간')}</span>
              <span className="text-xl font-bold tabular-nums text-foreground">
                {totalTime || '--:--'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 액션 버튼 + 문항 리스트 */}
      <div className="mx-auto max-w-3xl px-6 py-6 max-md:px-4">
        <div className="mb-4">{actionButton}</div>

        {/* 아코디언 문항 리스트 */}
        <div className="space-y-1.5 max-md:space-y-2">
          {problems.map((problem) => {
            const userSelection = problem.selections.find((s) => s.id === problem.userAnswer);
            const correctSelection = problem.selections.find((s) => s.correct === true);
            const isOpen = openSet.has(problem.number);

            return (
              <div
                key={problem.number}
                className={cn(
                  'overflow-hidden rounded-lg border bg-card transition-all duration-200',
                  isOpen ? 'border-border shadow-sm' : 'border-transparent hover:border-border/50',
                )}
              >
                <button
                  type="button"
                  onClick={() =>
                    setOpenSet((prev) => {
                      const next = new Set(prev);
                      next.has(problem.number)
                        ? next.delete(problem.number)
                        : next.add(problem.number);
                      return next;
                    })
                  }
                  className={cn(
                    'w-full text-left transition-colors hover:bg-muted/20',
                    // 데스크톱: 한 줄 레이아웃
                    'md:flex md:items-center md:gap-3 md:px-4 md:py-2.5',
                    // 모바일: 2줄 레이아웃
                    'max-md:px-3.5 max-md:py-2.5',
                  )}
                >
                  {/* 모바일 상단 행: 번호 + 뱃지 + 화살표 */}
                  <div className="flex items-center gap-2 max-md:mb-1.5 md:contents">
                    <span
                      className={cn(
                        'size-2 shrink-0 rounded-full',
                        problem.correct ? 'bg-success' : 'bg-destructive',
                      )}
                    />
                    <span className="shrink-0 text-xs font-bold tabular-nums text-muted-foreground">
                      {String(problem.number).padStart(2, '0')}
                    </span>
                    {/* 데스크톱에서는 제목이 이 위치 (md:contents로 플랫하게) */}
                    <span
                      className={cn(
                        'min-w-0 flex-1 text-sm font-medium text-foreground',
                        // 데스크톱: 접힌 상태에서 한 줄 말줄임
                        !isOpen && 'md:truncate',
                        // 모바일: 헤더 행에서 숨김 (아래 별도 표시)
                        'max-md:hidden',
                      )}
                    >
                      {isOpen ? (
                        <MarkdownText>{problem.title}</MarkdownText>
                      ) : (
                        problem.title.split('\n')[0]
                      )}
                    </span>
                    <Badge
                      variant={problem.correct ? 'default' : 'destructive'}
                      className="shrink-0 text-[0.65rem]"
                    >
                      {problem.correct ? t('정답') : t('오답')}
                    </Badge>
                    <ChevronDown
                      className={cn(
                        'size-4 shrink-0 text-muted-foreground transition-transform duration-300',
                        isOpen && 'rotate-180',
                      )}
                    />
                  </div>
                  {/* 모바일 하단 행: 제목 전체 너비 사용 */}
                  <div
                    className={cn(
                      'overflow-x-auto text-sm font-medium text-foreground md:hidden',
                      !isOpen && 'line-clamp-2',
                    )}
                  >
                    {isOpen ? (
                      <MarkdownText>{problem.title}</MarkdownText>
                    ) : (
                      problem.title.split('\n')[0]
                    )}
                  </div>
                </button>

                <div
                  className={cn(
                    'grid transition-all duration-300 ease-in-out',
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="space-y-2 px-4 pb-3 pt-0.5 max-md:px-3.5 max-md:pb-3.5">
                      <div className="rounded-md bg-muted/40 px-3 py-2 max-md:py-2.5">
                        <span className="text-[0.7rem] text-muted-foreground max-md:text-xs">
                          {t('선택한 답:')}
                        </span>
                        <div
                          className={cn(
                            'mt-0.5 overflow-x-auto text-sm font-semibold max-md:text-[0.9rem] max-md:leading-relaxed',
                            problem.correct ? 'text-success' : 'text-destructive',
                          )}
                        >
                          {problem.userAnswer === 0 ? (
                            t('입력 X')
                          ) : (
                            <MarkdownText>{userSelection?.content ?? ''}</MarkdownText>
                          )}
                        </div>
                      </div>
                      {!problem.correct && correctSelection && (
                        <div className="rounded-md border border-success/20 bg-success/5 px-3 py-2 max-md:py-2.5">
                          <span className="text-[0.7rem] text-success max-md:text-xs">
                            {t('정답 답안:')}
                          </span>
                          <div className="mt-0.5 overflow-x-auto text-sm font-semibold text-foreground max-md:text-[0.9rem] max-md:leading-relaxed">
                            <MarkdownText>{correctSelection.content}</MarkdownText>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QuizScoreBoard;
