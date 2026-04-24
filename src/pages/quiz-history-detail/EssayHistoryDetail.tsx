import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'i18nexus';
import { saveResult, saveEssayGradeResults } from '#features/solve-quiz';
import type { GradeResult } from '#features/quiz-generation';
import { Button } from '@/shared/ui/components/button';
import { Card, CardContent } from '@/shared/ui/components/card';
import { ArrowLeft, Calendar, Trophy, Clock, Hash, ChevronDown, CheckCircle2 } from 'lucide-react';
import { cn } from '@/shared/ui/lib/utils';
import MarkdownText from '@/shared/ui/components/markdown-text';
import type { EssayHistoryDetailData } from './types';

// ── 유틸 ──

/** 점수 비율에 따른 색상 */
const getScoreColor = (ratio: number) => {
  if (ratio >= 0.8)
    return {
      text: 'text-green-600',
      bg: 'bg-green-500/10',
      border: 'border-green-500/20',
      dot: 'bg-green-500',
    };
  if (ratio > 0)
    return {
      text: 'text-yellow-600',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/20',
      dot: 'bg-yellow-500',
    };
  return {
    text: 'text-red-600',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    dot: 'bg-red-500',
  };
};

// ── 컴포넌트 ──

interface EssayHistoryDetailProps {
  detail: EssayHistoryDetailData;
}

const EssayHistoryDetail = ({ detail }: EssayHistoryDetailProps) => {
  const { t, currentLanguage } = useTranslation('quiz-history-detail');
  const navigate = useNavigate();

  // 모든 문항을 기본 펼침 상태로 초기화
  const [openSet, setOpenSet] = useState<Set<number>>(
    () => new Set(detail.problems.map((p) => p.number)),
  );

  const formatDate = (dateString: string) => {
    const locale = currentLanguage?.startsWith('en') ? 'en-US' : 'ko-KR';
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 점수 집계
  let totalScore = 0;
  let maxScore = 0;
  let correctCount = 0;
  let partialCount = 0;

  for (const p of detail.problems) {
    const gr = p.gradeResult ?? null;
    if (gr) {
      totalScore += gr.totalScore;
      maxScore += gr.maxScore;
      const ratio = gr.maxScore > 0 ? gr.totalScore / gr.maxScore : 0;
      if (ratio >= 0.8) correctCount++;
      else if (ratio > 0) partialCount++;
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* 히어로 섹션 */}
      <div className="bg-primary px-6 pb-20 pt-10 max-md:px-4 max-md:pb-16 max-md:pt-8">
        <div className="mx-auto max-w-5xl text-center">
          <Trophy className="mx-auto mb-3 size-10 text-primary-foreground/70" />
          <div className="text-6xl font-black tabular-nums text-primary-foreground max-md:text-4xl">
            {totalScore}
            <span className="text-2xl max-md:text-lg">
              /{maxScore}
              {t('점')}
            </span>
          </div>
          <div className="mt-1.5 flex items-center justify-center gap-1.5 text-sm text-primary-foreground/60">
            <Calendar className="size-3.5" />
            {formatDate(detail.takenAt)}
          </div>
        </div>
      </div>

      {/* 플로팅 스탯 카드 */}
      <div className="mx-auto max-w-3xl px-6 max-md:px-4">
        <Card className="-mt-12 border-0 shadow-lg max-md:-mt-10">
          <CardContent className="grid grid-cols-4 gap-0 divide-x divide-border py-5 max-md:grid-cols-2 max-md:gap-y-4 max-md:divide-x-0">
            <div className="flex flex-col items-center gap-1">
              <Hash className="size-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{t('총점')}</span>
              <span className="text-xl font-bold tabular-nums text-foreground">
                {totalScore}/{maxScore}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <CheckCircle2 className="size-4 text-green-600" />
              <span className="text-xs text-green-600">{t('정답')}</span>
              <span className="text-xl font-bold tabular-nums text-green-600">{correctCount}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="size-4 text-center text-sm text-yellow-600">~</span>
              <span className="text-xs text-yellow-600">{t('부분 정답')}</span>
              <span className="text-xl font-bold tabular-nums text-yellow-600">{partialCount}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Clock className="size-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Time</span>
              <span className="text-xl font-bold tabular-nums text-foreground">
                {detail.totalTime || '--:--'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 액션 버튼 + 문항 리스트 */}
      <div className="mx-auto max-w-3xl px-6 py-6 max-md:px-4">
        {/* 액션 버튼 */}
        <div className="mb-4">
          <div className="flex flex-col gap-2">
            <Button
              size="lg"
              className="w-full text-base"
              onClick={() => {
                const answers: Record<number, string | null> = {};
                const inReview: Record<number, boolean> = {};
                const gradeResults: Record<number, GradeResult> = {};
                detail.problems.forEach((p) => {
                  answers[p.number] = p.textAnswer;
                  inReview[p.number] = p.inReview ?? false;
                  if (p.gradeResult) gradeResults[p.number] = p.gradeResult;
                });
                saveResult(detail.problemSetId, {
                  answers,
                  inReview,
                  totalTime: detail.totalTime,
                  title: '',
                  savedAt: Date.now(),
                });
                saveEssayGradeResults(detail.problemSetId, gradeResults);
                navigate(`/explanation/${detail.problemSetId}`);
              }}
            >
              {t('해설 보기')}
            </Button>
            <button
              type="button"
              className="group mx-auto flex items-center gap-1.5 pt-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => navigate('/history')}
            >
              <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
              {t('목록으로')}
            </button>
          </div>
        </div>

        {/* 문항별 점수 리스트 */}
        <div className="space-y-1.5 max-md:space-y-2">
          {detail.problems.map((p) => {
            const gr = p.gradeResult ?? null;
            const ratio = gr && gr.maxScore > 0 ? gr.totalScore / gr.maxScore : 0;
            const colors = getScoreColor(ratio);
            const isOpen = openSet.has(p.number);

            return (
              <div
                key={p.number}
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
                      if (next.has(p.number)) next.delete(p.number);
                      else next.add(p.number);
                      return next;
                    })
                  }
                  className={cn(
                    'w-full text-left transition-colors hover:bg-muted/20',
                    'md:flex md:items-center md:gap-3 md:px-4 md:py-2.5',
                    'max-md:px-3.5 max-md:py-2.5',
                  )}
                >
                  <div className="flex items-center gap-2 max-md:mb-1.5 md:contents">
                    <span className={cn('size-2 shrink-0 rounded-full', colors.dot)} />
                    <span className="shrink-0 text-xs font-bold tabular-nums text-muted-foreground">
                      {String(p.number).padStart(2, '0')}
                    </span>
                    <span
                      className={cn(
                        'min-w-0 flex-1 text-sm font-medium text-foreground',
                        !isOpen && 'md:truncate',
                        'max-md:hidden',
                      )}
                    >
                      {isOpen ? <MarkdownText>{p.title}</MarkdownText> : p.title.split('\n')[0]}
                    </span>
                    <div className="flex shrink-0 items-center gap-2">
                      {gr ? (
                        <span
                          className={cn(
                            'rounded-md px-2 py-0.5 text-xs font-bold',
                            colors.bg,
                            colors.text,
                          )}
                        >
                          {gr.totalScore}/{gr.maxScore}
                          {t('점')}
                        </span>
                      ) : (
                        <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground">
                          -
                        </span>
                      )}
                    </div>
                    <ChevronDown
                      className={cn(
                        'size-4 shrink-0 text-muted-foreground transition-transform duration-300',
                        isOpen && 'rotate-180',
                      )}
                    />
                  </div>
                  <div
                    className={cn(
                      'overflow-x-auto text-sm font-medium text-foreground md:hidden',
                      !isOpen && 'line-clamp-2',
                    )}
                  >
                    {isOpen ? <MarkdownText>{p.title}</MarkdownText> : p.title.split('\n')[0]}
                  </div>
                </button>

                {/* 펼침 영역: 내 답변 + 요소별 점수 */}
                <div
                  className={cn(
                    'grid transition-all duration-300 ease-in-out',
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="space-y-2 px-4 pb-3 pt-0.5 max-md:px-3.5 max-md:pb-3.5">
                      {/* 내 답변 */}
                      <div className="rounded-md bg-muted/40 px-3 py-2 max-md:py-2.5">
                        <span className="text-[0.7rem] text-muted-foreground max-md:text-xs">
                          {t('내 답변')}
                        </span>
                        <div className="mt-0.5 text-sm text-foreground">
                          {p.textAnswer && p.textAnswer.trim() && p.textAnswer !== '0' ? (
                            <span className="line-clamp-3">{p.textAnswer}</span>
                          ) : (
                            <span className="italic text-muted-foreground">-</span>
                          )}
                        </div>
                      </div>

                      {/* 모범답안 */}
                      {p.selections?.[0]?.content && (
                        <div className="rounded-md border border-green-500/20 bg-green-500/5 px-3 py-2 max-md:py-2.5">
                          <span className="text-[0.7rem] text-green-600 max-md:text-xs">
                            {t('모범답안')}
                          </span>
                          <div className="mt-0.5 text-sm text-foreground">
                            <MarkdownText>{p.selections[0].content}</MarkdownText>
                          </div>
                        </div>
                      )}

                      {/* 요소별 점수 */}
                      {gr && (
                        <div className="flex flex-wrap gap-1.5">
                          {gr.elementScores.map((el, idx) => {
                            const elRatio = el.maxPoints > 0 ? el.earnedPoints / el.maxPoints : 0;
                            const elColors = getScoreColor(elRatio);
                            return (
                              <span
                                key={idx}
                                className={cn(
                                  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.65rem] font-medium',
                                  elColors.border,
                                  elColors.bg,
                                  elColors.text,
                                )}
                              >
                                {el.element.split('—')[0].trim()}
                                <span className="font-bold">
                                  {el.earnedPoints}/{el.maxPoints}
                                </span>
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* 종합 피드백 */}
                      {gr?.overallFeedback && (
                        <p className="m-0 text-sm leading-relaxed text-foreground/80">
                          {gr.overallFeedback}
                        </p>
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

export default EssayHistoryDetail;
