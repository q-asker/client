import { useTranslation } from 'i18nexus';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuizResult } from '#features/quiz-result';
import { loadResult, loadEssayGradeResults } from '#features/solve-quiz';
import { MOCK_RESULT_QUIZZES, MOCK_TOTAL_TIME } from './mockResultData';
import { Button } from '@/shared/ui/components/button';
import { Card, CardContent } from '@/shared/ui/components/card';
import { Home, Trophy, Clock, Hash, ChevronDown, CheckCircle2 } from 'lucide-react';
import { cn } from '@/shared/ui/lib/utils';
import MarkdownText from '@/shared/ui/components/markdown-text';
import type { Quiz, GradeResult } from '#features/quiz-generation';

/** 부모에서 전달받는 서버 데이터 */
interface ServerData {
  quiz: Quiz[];
  title: string;
  quizType?: string;
}

interface EssayQuizResultProps {
  serverData: ServerData;
}

/** 점수 비율에 따른 색상 결정 */
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

/** ESSAY 전용 독립 결과 페이지 */
const EssayQuizResult = ({ serverData }: EssayQuizResultProps) => {
  const { t } = useTranslation('quiz-result');
  const navigate = useNavigate();
  const { problemSetId } = useParams<{ problemSetId: string }>();
  const [searchParams] = useSearchParams();
  const isMock = searchParams.get('mock') === 'true';

  // localStorage에서 저장된 결과 로드
  const savedResult = useMemo(
    () => (problemSetId ? loadResult(problemSetId) : null),
    [problemSetId],
  );

  // ESSAY 채점 결과 로드
  const essayGradeResults = useMemo<Record<number, GradeResult>>(
    () => (problemSetId ? loadEssayGradeResults(problemSetId) : {}),
    [problemSetId],
  );

  // 서버 데이터와 localStorage 결과를 병합
  const mergedQuizzes = useMemo(() => {
    if (isMock) return MOCK_RESULT_QUIZZES as Quiz[];
    const serverQuizzes = serverData.quiz;
    if (savedResult) {
      return serverQuizzes.map((q) => ({
        ...q,
        type: (q.type ?? serverData.quizType ?? 'ESSAY') as Quiz['type'],
        userAnswer: savedResult.answers[q.number] ?? q.userAnswer,
        inReview: savedResult.inReview?.[q.number] ?? false,
        gradeResult: essayGradeResults[q.number] ?? q.gradeResult ?? null,
      }));
    }
    return serverQuizzes.map((q) => ({
      ...q,
      type: (q.type ?? serverData.quizType ?? 'ESSAY') as Quiz['type'],
      gradeResult: essayGradeResults[q.number] ?? q.gradeResult ?? null,
    }));
  }, [isMock, serverData, savedResult, essayGradeResults]);

  const [quizzes] = useState<Quiz[]>(mergedQuizzes);
  const totalTime = isMock ? MOCK_TOTAL_TIME : (savedResult?.totalTime ?? '00:00:00');
  const title = savedResult?.title || serverData.title;

  // 점수 계산
  const {
    state: { scorePercent, essayScore },
    actions: { getQuizExplanation },
  } = useQuizResult({
    navigate,
    problemSetId: problemSetId ?? '',
    quizzes,
    totalTime,
    title,
  });

  // 모든 문항을 기본 펼침 상태로 초기화
  const [openSet, setOpenSet] = useState<Set<number>>(() => new Set(quizzes.map((q) => q.number)));

  const totalScore = essayScore?.totalScore ?? 0;
  const maxScore = essayScore?.maxScore ?? 0;
  const correctCount = essayScore?.correctCount ?? 0;
  const partialCount = essayScore?.partialCount ?? 0;
  const ungradedCount = quizzes.filter(
    (q) => !essayGradeResults[q.number] && !q.gradeResult,
  ).length;
  const allUngraded = ungradedCount === quizzes.length;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* 히어로 섹션 */}
      <div className="bg-primary px-6 pb-20 pt-10 max-md:px-4 max-md:pb-16 max-md:pt-8">
        <div className="mx-auto max-w-5xl text-center">
          <Trophy className="mx-auto mb-3 size-10 text-primary-foreground/70" />
          {allUngraded ? (
            <>
              <div className="text-3xl font-bold text-primary-foreground/80 max-md:text-2xl">
                {t('미채점')}
              </div>
              <div className="mt-2 text-sm text-primary-foreground/70">
                {t('채점하지 않고 제출되었습니다')}
              </div>
            </>
          ) : (
            <>
              <div className="text-6xl font-black tabular-nums text-primary-foreground max-md:text-4xl">
                {totalScore}
                <span className="text-2xl max-md:text-lg">
                  /{maxScore}
                  {t('점')}
                </span>
              </div>
              {ungradedCount > 0 && (
                <div className="mt-2 text-sm text-primary-foreground/70">
                  {ungradedCount}
                  {t('문제 미채점')}
                </div>
              )}
            </>
          )}
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
                {allUngraded ? '-' : `${totalScore}/${maxScore}`}
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
                {totalTime || '--:--'}
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
            <Button size="lg" className="w-full text-base" onClick={getQuizExplanation}>
              {t('해설 보기')}
            </Button>
            <button
              type="button"
              className="group mx-auto flex items-center gap-1.5 pt-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => navigate('/')}
            >
              <Home className="size-3.5 transition-transform group-hover:-translate-y-0.5" />
              {t('홈으로')}
            </button>
          </div>
        </div>

        {/* 문항별 점수 리스트 */}
        <div className="space-y-1.5 max-md:space-y-2">
          {quizzes.map((q) => {
            const gr = essayGradeResults[q.number] ?? q.gradeResult;
            const isUngraded = !gr;
            const ratio = gr && gr.maxScore > 0 ? gr.totalScore / gr.maxScore : 0;
            const colors = isUngraded
              ? {
                  text: 'text-muted-foreground',
                  bg: 'bg-muted',
                  border: 'border-border',
                  dot: 'bg-muted-foreground/40',
                }
              : getScoreColor(ratio);
            const isOpen = openSet.has(q.number);
            const textAnswer = (q as Quiz & { textAnswer?: string }).textAnswer ?? q.userAnswer;
            const modelAnswer = q.modelAnswer ?? q.selections?.[0]?.content ?? null;

            return (
              <div
                key={q.number}
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
                      if (next.has(q.number)) next.delete(q.number);
                      else next.add(q.number);
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
                    {/* 상태 점 */}
                    <span className={cn('size-2 shrink-0 rounded-full', colors.dot)} />
                    {/* 문항 번호 */}
                    <span className="shrink-0 text-xs font-bold tabular-nums text-muted-foreground">
                      {String(q.number).padStart(2, '0')}
                    </span>
                    {/* 데스크톱 제목 */}
                    <span
                      className={cn(
                        'min-w-0 flex-1 text-sm font-medium text-foreground',
                        !isOpen && 'md:truncate',
                        'max-md:hidden',
                      )}
                    >
                      {isOpen ? <MarkdownText>{q.title}</MarkdownText> : q.title.split('\n')[0]}
                    </span>
                    {/* 점수 뱃지 */}
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
                          {t('미채점')}
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
                  {/* 모바일 하단 행: 제목 */}
                  <div
                    className={cn(
                      'overflow-x-auto text-sm font-medium text-foreground md:hidden',
                      !isOpen && 'line-clamp-2',
                    )}
                  >
                    {isOpen ? <MarkdownText>{q.title}</MarkdownText> : q.title.split('\n')[0]}
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
                          {textAnswer && String(textAnswer) !== '0' ? (
                            <span className="line-clamp-3">{String(textAnswer)}</span>
                          ) : (
                            <span className="italic text-muted-foreground">-</span>
                          )}
                        </div>
                      </div>

                      {/* 모범답안 */}
                      {modelAnswer && (
                        <div className="rounded-md border border-green-500/20 bg-green-500/5 px-3 py-2 max-md:py-2.5">
                          <span className="text-[0.7rem] text-green-600 max-md:text-xs">
                            {t('모범답안')}
                          </span>
                          <div className="mt-0.5 text-sm text-foreground">
                            <MarkdownText>{modelAnswer}</MarkdownText>
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

export default EssayQuizResult;
