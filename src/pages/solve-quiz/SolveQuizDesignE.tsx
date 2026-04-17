import { useTranslation } from 'i18nexus';
import InlineEdit from '@/shared/ui/components/inline-edit';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSolveQuiz } from '#features/solve-quiz';
import { isUnanswered } from '../../features/solve-quiz/lib/isUnanswered';
import { useQuizGenerationStore } from '#features/quiz-generation';
import { useAuthStore } from '#entities/auth';
import { Eraser, LogIn } from 'lucide-react';
import CustomToast from '#shared/toast';
import { cn } from '@/shared/ui/lib/utils';
import MarkdownText from '@/shared/ui/components/markdown-text';
import { Skeleton } from '@/shared/ui/components/skeleton';

// 결정론적 셔플을 위한 시드 기반 난수 생성기
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

// 문자열을 숫자 시드로 변환
function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

// 시드 기반 Fisher-Yates 셔플
function seededShuffle<T>(array: T[], seed: number): T[] {
  const result = [...array];
  const random = seededRandom(seed);
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// 빈칸(___) 감지 정규식
const BLANK_REGEX = /_{3,}/g;

/** E안: 선택지 셔플 + 오답 소거법 */
const SolveQuizDesignE: React.FC = () => {
  const { t } = useTranslation('solve-quiz');
  const navigate = useNavigate();
  const { problemSetId } = useParams<{ problemSetId: string }>();
  const storeProblemSetId = useQuizGenerationStore((state) => state.problemSetId);
  const streamQuizzes = useQuizGenerationStore((state) => state.quizzes);
  const streamIsStreaming = useQuizGenerationStore((state) => state.isStreaming);
  const streamTotalCount = useQuizGenerationStore((state) => state.totalCount);
  const resetQuizGeneration = useQuizGenerationStore((state) => state.resetStreamingState);
  const isAuthenticated = !!useAuthStore((state) => state.accessToken);

  const isSameProblemSet = String(storeProblemSetId ?? '') === String(problemSetId ?? '');
  const quizzes = isSameProblemSet ? streamQuizzes : [];
  const isStreaming = isSameProblemSet ? streamIsStreaming : false;
  const totalCount = isSameProblemSet ? streamTotalCount : 0;

  const { state, actions } = useSolveQuiz({
    t,
    navigate,
    problemSetId: problemSetId ?? '',
    quizzes,
  });
  const { quiz } = state;
  const { quiz: quizActions } = actions;

  const remainingCount =
    isStreaming && totalCount > 0 ? Math.max(0, totalCount - quiz.totalQuestions) : 0;

  // 제목 편집 상태
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // 소거 모드 상태
  const [isEliminateMode, setIsEliminateMode] = useState(false);
  const [eliminatedMap, setEliminatedMap] = useState<Record<number, Set<string>>>({});

  // 문제 전환 시 소거 모드 OFF로 리셋
  useEffect(() => {
    setIsEliminateMode(false);
  }, [quiz.currentQuestion]);

  // 현재 문제의 선택지를 결정론적으로 셔플
  const shuffledSelections = useMemo(() => {
    if (!quiz.currentQuiz.selections?.length) return [];
    const seed = stringToSeed(`${problemSetId ?? ''}-${quiz.currentQuiz.number}`);
    return seededShuffle(quiz.currentQuiz.selections, seed);
  }, [problemSetId, quiz.currentQuiz.number, quiz.currentQuiz.selections]);

  // 현재 문제에서 소거된 선택지 ID 세트
  const currentEliminated = eliminatedMap[quiz.currentQuestion] ?? new Set<string>();

  // 소거 처리 핸들러
  const handleSelectionClick = (optionId: string) => {
    if (isEliminateMode) {
      setEliminatedMap((prev) => {
        const current = new Set(prev[quiz.currentQuestion] ?? []);
        if (current.has(optionId)) {
          // 이미 소거된 선택지 → 복원
          current.delete(optionId);
        } else {
          // 소거 가능 여부 확인 (최소 1개는 남겨야 함)
          const totalSelections = quiz.currentQuiz.selections.length;
          if (current.size >= totalSelections - 1) return prev;
          current.add(optionId);
        }
        return { ...prev, [quiz.currentQuestion]: current };
      });
    } else {
      quizActions.handleOptionSelect(optionId);
    }
  };

  // 빈칸 하이라이트: title에서 ___를 감지하여 인라인 span으로 대체
  const renderBlankTitle = (text: string, selectedContent?: string) => {
    if (!/_{3,}/.test(text)) return <MarkdownText>{text}</MarkdownText>;

    // 선택된 답안의 내용 가져오기
    const fillContent = selectedContent ?? null;

    const parts = text.split(BLANK_REGEX);
    const result: string[] = [];
    for (let i = 0; i < parts.length; i++) {
      result.push(parts[i]);
      if (i < parts.length - 1) {
        if (fillContent) {
          result.push(`\`${fillContent}\``);
        } else {
          result.push('`______`');
        }
      }
    }
    return <MarkdownText>{result.join('')}</MarkdownText>;
  };

  // 선택된 답안의 내용
  const selectedContent = quiz.selectedOption
    ? quiz.currentQuiz.selections.find((sel) => String(sel.id) === String(quiz.selectedOption))
        ?.content
    : undefined;

  // 퀴즈 제목을 브라우저 탭 타이틀에 반영
  useEffect(() => {
    if (quiz.title) {
      document.title = `${quiz.title} | Q-Asker`;
    }
    return () => {
      document.title = 'Q-Asker';
    };
  }, [quiz.title]);

  useEffect(() => {
    return () => {
      resetQuizGeneration();
    };
  }, [resetQuizGeneration]);

  /** 문제 번호 버튼 렌더링 */
  const renderQuestionButton = (
    q: (typeof quiz.quizzes)[number],
    keyPrefix = '',
  ): React.ReactElement => {
    const unanswered = isUnanswered(q.userAnswer, q.selections);
    return (
      <button
        key={`${keyPrefix}${q.number}`}
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background',
          'cursor-pointer text-sm font-medium text-muted-foreground transition-colors duration-200',
          'hover:border-primary hover:bg-primary/5',
          !unanswered && 'border-primary/40 bg-primary/10 text-primary',
          q.inReview && 'border-warning bg-warning/10 text-warning',
          q.number === quiz.currentQuestion &&
            'border-primary bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
        )}
        onClick={() => quizActions.handleJumpTo(q.number)}
      >
        {q.number}
      </button>
    );
  };

  /** 대기 중인 문제 번호 버튼 렌더링 */
  const renderPendingButton = (index: number, keyPrefix = ''): React.ReactElement => (
    <button
      key={`${keyPrefix}pending-${index}`}
      className="flex h-9 w-9 animate-pulse items-center justify-center rounded-lg border border-dashed border-border bg-muted text-sm text-muted-foreground"
      disabled
    >
      ...
    </button>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* 제출 다이얼로그 */}
      {quiz.showSubmitDialog && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-foreground/50"
          onClick={quizActions.handleOverlayClick}
        >
          <div
            className="w-[90%] max-w-[600px] animate-[slideIn_0.3s_ease-out] overflow-y-auto rounded-2xl bg-card shadow-card max-md:m-5 max-md:w-[95%]"
            style={{ maxHeight: '80vh' }}
          >
            {/* 다이얼로그 헤더 */}
            <div className="flex items-center justify-between border-b border-border px-6 py-5">
              <h2 className="m-0 text-xl font-semibold text-foreground">{t('제출 확인')}</h2>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-lg border-none bg-transparent text-2xl text-muted-foreground transition-colors duration-200 hover:bg-muted"
                onClick={quizActions.handleCancelSubmit}
              >
                x
              </button>
            </div>

            {/* 다이얼로그 콘텐츠 */}
            <div className="p-6">
              {/* 상단 통계 정보 */}
              <div className="mb-8 grid grid-cols-2 gap-4 rounded-2xl bg-muted p-5 max-md:grid-cols-1 max-md:gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-muted-foreground">{t('전체 문제:')}</span>
                  <span className="rounded-lg px-2 py-1 text-sm font-semibold">
                    {quiz.quizzes.length}
                    {t('개')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-muted-foreground">{t('답변한 문제:')}</span>
                  <span className="rounded-lg bg-primary/8 px-2 py-1 text-sm font-semibold text-primary/70">
                    {quiz.answeredCount}
                    {t('개')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-muted-foreground">{t('안푼 문제:')}</span>
                  <span className="rounded-lg bg-destructive/10 px-2 py-1 text-sm font-semibold text-destructive/80">
                    {quiz.unansweredCount}
                    {t('개')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-muted-foreground">{t('검토할 문제:')}</span>
                  <span className="rounded-lg bg-warning/10 px-2 py-1 text-sm font-semibold text-warning/80">
                    {quiz.reviewCount}
                    {t('개')}
                  </span>
                </div>
              </div>

              {/* 하단 문제별 선택 답안 */}
              <div>
                <h3 className="mb-4 text-lg font-semibold text-foreground">{t('선택한 답안')}</h3>
                <div className="max-h-[300px] overflow-y-auto rounded-2xl border border-border p-3">
                  {quiz.quizzes.map((quizItem) => {
                    const unanswered = isUnanswered(quizItem.userAnswer, quizItem.selections);
                    const selectedAnswer = unanswered
                      ? t('미선택')
                      : quizItem.selections?.find(
                          (sel) => String(sel.id) === String(quizItem.userAnswer),
                        )?.content ||
                        t('{{quizItem_userAnswer}}번', {
                          quizItem_userAnswer: quizItem.userAnswer ?? '',
                        });

                    return (
                      <div
                        key={quizItem.number}
                        className="flex items-center border-b border-border py-2 last:border-b-0"
                      >
                        <span className="shrink-0 min-w-[50px] font-semibold text-muted-foreground">
                          {quizItem.number}
                          {t('번:')}
                        </span>
                        <span
                          className={cn(
                            'ml-3 flex min-w-0 flex-1 items-center gap-2',
                            unanswered && 'italic text-destructive',
                            quizItem.inReview && 'text-warning',
                          )}
                        >
                          <span className="min-w-0 break-words">
                            <MarkdownText>{selectedAnswer}</MarkdownText>
                          </span>
                          {quizItem.inReview && (
                            <span className="shrink-0 whitespace-nowrap rounded-full bg-warning px-1.5 py-0.5 text-xs font-medium text-warning-foreground">
                              {t('검토')}
                            </span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 다이얼로그 버튼 */}
            <div className="flex justify-end gap-3 border-t border-border px-6 py-5 max-md:flex-col">
              <button
                className="cursor-pointer rounded-xl border-none bg-muted px-6 py-2.5 font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted max-md:w-full"
                onClick={quizActions.handleCancelSubmit}
              >
                {t('취소')}
              </button>
              <button
                className="cursor-pointer rounded-xl border-none bg-primary px-6 py-2.5 font-medium text-primary-foreground transition-colors duration-200 hover:opacity-90 max-md:w-full"
                onClick={quizActions.handleConfirmSubmit}
              >
                {t('제출하기')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 상단 타이머 바 */}
      <header className="bg-primary shadow-card">
        <div className="relative mx-auto flex w-[95%] max-w-[1200px] items-center justify-between py-3 text-primary-foreground">
          {/* 왼쪽: X 닫기 */}
          <button
            className="cursor-pointer border-none bg-transparent text-xl text-inherit"
            onClick={() => navigate('/')}
            aria-label={t('닫기')}
          >
            ✕
          </button>

          {/* 중앙: 타이머 */}
          <div className="absolute left-1/2 -translate-x-1/2 font-mono text-sm">
            {quiz.currentTime}
          </div>

          {/* 오른쪽: 기록 상태 + 프로필/로그인 */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-1.5 text-xs text-primary-foreground/80">
                <span className="inline-block size-2 rounded-full bg-green-400" />
                {t('퀴즈 기록 중')}
              </div>
            ) : (
              <button
                className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap border-none bg-transparent px-0 py-0 text-xs text-primary-foreground/80 transition-colors hover:text-primary-foreground"
                onClick={() => {
                  quizActions.persistNow();
                  CustomToast.info(
                    `${t('진행 상태가 저장되었습니다.')} ${t('로그인 후 이어서 풀 수 있습니다.')}`,
                  );
                  navigate('/login');
                }}
              >
                <LogIn className="size-3.5" />
                {t('로그인하고 기록하기')}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 퀴즈 제목 */}
      {quiz.title && (
        <div className="group mx-auto flex w-[95%] max-w-[1200px] items-center gap-1 pt-5">
          <InlineEdit
            value={quiz.title}
            onSubmit={quizActions.changeTitle}
            editing={isEditingTitle}
            onStartEdit={() => setIsEditingTitle(true)}
            onCancel={() => setIsEditingTitle(false)}
            size="md"
            textClassName="text-lg font-semibold"
            hideEditButton={!isAuthenticated}
            editButtonClassName="opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </div>
      )}

      {/* 문제 번호 네비게이션 (모바일) — 타이머 바로 아래 */}
      <div className="mx-auto w-[95%] pt-4 lg:hidden">
        <div className="rounded-2xl bg-card p-4 shadow-card">
          <h3 className="mb-3 border-b border-border pb-2.5 text-sm font-semibold text-foreground">
            {t('문제 목록')}
          </h3>
          <div className="grid grid-cols-[repeat(auto-fill,2.25rem)] justify-center gap-2">
            {quiz.quizzes.map((q) => renderQuestionButton(q, 'top-'))}
            {Array.from({ length: remainingCount }).map((_, index) =>
              renderPendingButton(index, 'top-'),
            )}
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 — lg 이상 2컬럼 */}
      <main className="mx-auto flex w-[95%] max-w-[1200px] flex-col py-6 lg:grid lg:grid-cols-12 lg:gap-6">
        {/* 좌측 패널: 문제 + 선택지 (col-span-8) */}
        <section className="flex flex-col gap-4 lg:col-span-8">
          {/* 질문 네비게이션 */}
          <nav className="flex items-center justify-between max-md:gap-2">
            <button
              className="cursor-pointer rounded-xl border-none bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors duration-200 hover:opacity-90 max-md:flex-1 max-md:text-sm"
              onClick={quizActions.handlePrev}
            >
              {t('이전')}
            </button>
            <span className="text-sm text-muted-foreground max-md:flex-1 max-md:text-center max-md:text-sm">
              {quiz.currentQuestion} / {quiz.totalQuestions}
            </span>
            <button
              className="cursor-pointer rounded-xl border-none bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors duration-200 hover:opacity-90 max-md:flex-1 max-md:text-sm"
              onClick={quizActions.handleNext}
            >
              {t('다음')}
            </button>
          </nav>

          {/* 문제 영역 */}
          {quiz.isLoading ? (
            <div className="w-full space-y-4">
              <div className="w-full overflow-hidden rounded-2xl bg-card p-6 shadow-card">
                <Skeleton className="mb-3 h-4 w-24 rounded" />
                <Skeleton className="mb-2 h-5 w-full rounded" />
                <Skeleton className="mb-2 h-5 w-3/4 rounded" />
                <Skeleton className="h-32 w-full rounded-lg" />
              </div>
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-xl" />
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* 문제 영역 — 시각적으로 하나의 카드 */}
              <div className="w-full overflow-hidden rounded-2xl bg-card shadow-card">
                {/* 검토 배지 */}
                <div className="flex justify-end px-5 pt-4 pb-0">
                  <button
                    onClick={quizActions.handleCheckToggle}
                    className={cn(
                      'flex shrink-0 cursor-pointer items-center gap-1 rounded-lg border-none px-2 py-1 text-xs font-semibold transition-all duration-200',
                      quiz.currentQuiz.inReview
                        ? 'bg-warning/12 text-warning'
                        : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill={quiz.currentQuiz.inReview ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
                    </svg>
                    {t('검토')}
                  </button>
                </div>

                {/* 질문 제목 — 빈칸 하이라이트 적용 */}
                <div className="p-5 pt-2 pb-6">
                  <div className="m-0 break-words text-base leading-relaxed text-foreground">
                    {renderBlankTitle(quiz.currentQuiz.title.split('\n')[0], selectedContent)}
                  </div>
                </div>

                {/* 문제 본문 (코드, 힌트 등) */}
                {quiz.currentQuiz.title.includes('\n') && (
                  <div className="px-5 pt-3 pb-6">
                    <div className="m-0 break-words text-base leading-relaxed text-foreground">
                      <MarkdownText>
                        {quiz.currentQuiz.title.split('\n').slice(1).join('\n')}
                      </MarkdownText>
                    </div>
                  </div>
                )}
              </div>

              {/* 소거 모드 토글 */}
              <div className="flex items-center justify-end">
                <button
                  onClick={() => setIsEliminateMode((prev) => !prev)}
                  className={cn(
                    'flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-200',
                    isEliminateMode
                      ? 'border-destructive/40 bg-destructive/10 text-destructive'
                      : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Eraser className="size-3.5" />
                  {t('소거')}
                </button>
              </div>

              {/* 선택지 리스트 — 셔플 적용 */}
              <div className="flex flex-col gap-3 max-md:mt-2 max-md:gap-2">
                {shuffledSelections.map((opt, idx) => {
                  const isEliminated = currentEliminated.has(opt.id);
                  return (
                    <div
                      key={opt.id}
                      className={cn(
                        'flex min-h-14 cursor-pointer items-center rounded-2xl bg-card px-4 py-5 shadow-card transition-colors duration-200',
                        'hover:bg-muted',
                        'max-md:min-h-12 max-md:px-3 max-md:py-4',
                        quiz.selectedOption === opt.id &&
                          !isEliminated &&
                          'ring-2 ring-primary ring-offset-1',
                        isEliminated && 'bg-muted/30 opacity-40',
                        isEliminateMode && !isEliminated && 'hover:bg-destructive/5',
                      )}
                      onClick={() => handleSelectionClick(opt.id)}
                    >
                      <span
                        className={cn(
                          'mr-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium max-md:mr-3 max-md:h-6 max-md:w-6 max-md:text-xs',
                          isEliminated && 'line-through',
                        )}
                      >
                        {idx + 1}
                      </span>
                      <span
                        className={cn(
                          'min-w-0 flex-1 break-words pr-3 text-base leading-[1.8] text-foreground max-md:pr-2 max-md:text-sm max-md:leading-relaxed',
                          isEliminated && 'line-through',
                        )}
                      >
                        <MarkdownText>{opt.content}</MarkdownText>
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* 확인 버튼 */}
          <button
            className="mt-auto cursor-pointer rounded-2xl border-none bg-primary py-3.5 text-base font-medium text-primary-foreground transition-colors duration-200 hover:opacity-90 max-md:mt-4 max-md:w-full"
            onClick={quizActions.handleSubmit}
          >
            {t('확인')}
          </button>
        </section>

        {/* 우측 패널: 네비게이션 + 실시간 통계 (col-span-4) — lg 이상에서만 표시 */}
        <aside className="hidden lg:col-span-4 lg:flex lg:flex-col lg:gap-5">
          {/* 실시간 통계 카드 */}
          <div className="rounded-2xl bg-card p-5 shadow-card">
            <h3 className="mb-4 border-b border-border pb-3 text-sm font-semibold text-foreground">
              {t('진행 현황')}
            </h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('전체 문제:')}</span>
                <span className="rounded-lg bg-muted px-3 py-1 text-sm font-bold text-foreground">
                  {quiz.totalQuestions}
                  {t('개')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('답변한 문제:')}</span>
                <span className="rounded-lg bg-primary/8 px-3 py-1 text-sm font-bold text-primary/70">
                  {quiz.answeredCount}
                  {t('개')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('안푼 문제:')}</span>
                <span className="rounded-lg bg-destructive/10 px-3 py-1 text-sm font-bold text-destructive/80">
                  {quiz.unansweredCount}
                  {t('개')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('검토할 문제:')}</span>
                <span className="rounded-lg bg-warning/10 px-3 py-1 text-sm font-bold text-warning/80">
                  {quiz.reviewCount}
                  {t('개')}
                </span>
              </div>
            </div>
            {/* 진행률 바 */}
            <div className="mt-4 pt-3">
              <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                <span>{t('진행률')}</span>
                <span className="font-semibold text-foreground">
                  {quiz.totalQuestions > 0
                    ? Math.round((quiz.answeredCount / quiz.totalQuestions) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{
                    width: `${quiz.totalQuestions > 0 ? (quiz.answeredCount / quiz.totalQuestions) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            {/* 제출하기 버튼 (데스크톱) */}
            <button
              className="mt-4 w-full cursor-pointer rounded-xl border-none bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors duration-200 hover:opacity-90"
              onClick={quizActions.handleFinish}
            >
              {t('제출하기')}
            </button>
          </div>

          {/* 문제 번호 네비게이션 카드 */}
          <div className="sticky top-6 rounded-2xl bg-card p-5 shadow-card">
            <h3 className="mb-4 border-b border-border pb-3 text-sm font-semibold text-foreground">
              {t('문제 목록')}
            </h3>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(2.25rem,1fr))] gap-2">
              {quiz.quizzes.map((q) => renderQuestionButton(q, 'sidebar-'))}
              {Array.from({ length: remainingCount }).map((_, index) =>
                renderPendingButton(index, 'sidebar-'),
              )}
            </div>
          </div>
        </aside>

        {/* 하단 패널 (모바일/태블릿) — lg 미만에서만 표시 */}
        <div className="mt-4 flex flex-col gap-4 lg:hidden">
          {/* 진행 현황 카드 */}
          <div className="rounded-2xl bg-card p-4 shadow-card">
            <h3 className="mb-3 border-b border-border pb-2.5 text-sm font-semibold text-foreground">
              {t('진행 현황')}
            </h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('전체 문제:')}</span>
                <span className="rounded-lg bg-muted px-2.5 py-0.5 text-sm font-bold text-foreground">
                  {quiz.totalQuestions}
                  {t('개')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('답변한 문제:')}</span>
                <span className="rounded-lg bg-primary/8 px-2.5 py-0.5 text-sm font-bold text-primary/70">
                  {quiz.answeredCount}
                  {t('개')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('안푼 문제:')}</span>
                <span className="rounded-lg bg-destructive/10 px-2.5 py-0.5 text-sm font-bold text-destructive/80">
                  {quiz.unansweredCount}
                  {t('개')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('검토할 문제:')}</span>
                <span className="rounded-lg bg-warning/10 px-2.5 py-0.5 text-sm font-bold text-warning/80">
                  {quiz.reviewCount}
                  {t('개')}
                </span>
              </div>
            </div>
            {/* 진행률 바 */}
            <div className="mt-3 pt-2.5">
              <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                <span>{t('진행률')}</span>
                <span className="font-semibold text-foreground">
                  {quiz.totalQuestions > 0
                    ? Math.round((quiz.answeredCount / quiz.totalQuestions) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{
                    width: `${quiz.totalQuestions > 0 ? (quiz.answeredCount / quiz.totalQuestions) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            {/* 제출하기 버튼 */}
            <button
              className="mt-3 w-full cursor-pointer rounded-xl border-none bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-colors duration-200 hover:opacity-90"
              onClick={quizActions.handleFinish}
            >
              {t('제출하기')}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SolveQuizDesignE;
