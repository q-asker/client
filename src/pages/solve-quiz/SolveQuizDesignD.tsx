import { useTranslation } from 'i18nexus';
import InlineEdit from '@/shared/ui/components/inline-edit';
import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSolveQuiz } from '#features/solve-quiz';
import { isUnanswered } from '../../features/solve-quiz/lib/isUnanswered';
import { useQuizGenerationStore } from '#features/quiz-generation';
import { useAuthStore } from '#entities/auth';
import { ChevronDown, ChevronUp, LogIn, NotebookPen, PenLine } from 'lucide-react';
import CustomToast from '#shared/toast';
import { cn } from '@/shared/ui/lib/utils';
import MarkdownText from '@/shared/ui/components/markdown-text';
import { Skeleton } from '@/shared/ui/components/skeleton';
import { AnimatePresence, motion } from 'framer-motion';

/** 빈칸 위치 감지 (렌더링용) */
const BLANK_REGEX = /_{3,}/;

/** 빈칸 슬롯 — 문제 제목 내 `_______`을 시각적 슬롯으로 렌더링 */
const BlankSlot: React.FC<{
  value: string;
  hasSelection: boolean;
  onClick?: () => void;
  ariaLabel?: string;
}> = ({ value, hasSelection, onClick, ariaLabel }) => (
  <span
    className={cn(
      'inline-flex max-w-[20rem] cursor-pointer items-baseline border-b-2 px-1 py-0.5 transition-all duration-300',
      value
        ? hasSelection
          ? 'border-primary bg-primary/8 text-primary'
          : 'border-primary/50 bg-primary/5 text-primary/80'
        : 'min-w-[4rem] border-muted-foreground/40',
    )}
    title={value || undefined}
    onClick={onClick}
    role="button"
    tabIndex={0}
    aria-label={ariaLabel}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick?.();
      }
    }}
  >
    {value ? (
      <span className="truncate font-medium">{value}</span>
    ) : (
      <span className="inline-block h-[1.2em] w-px" />
    )}
  </span>
);

/** D안: 타이핑 우선 + 선택지 폴백 */
const SolveQuizDesignD: React.FC = () => {
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
  const appliedInstruction = quiz.currentQuiz?.appliedInstruction ?? null;

  const remainingCount =
    isStreaming && totalCount > 0 ? Math.max(0, totalCount - quiz.totalQuestions) : 0;

  // 제목 편집 상태
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // AI 지시사항 공개 상태
  const [showInstruction, setShowInstruction] = useState(false);

  // 선택지 공개 상태
  const [showSelections, setShowSelections] = useState(() => {
    const saved = localStorage.getItem(`solve_show_selections_${problemSetId}`);
    return saved ? saved === 'true' : true;
  });

  // 선택지 토글 시 저장
  const toggleSelections = () => {
    const nextValue = !showSelections;
    setShowSelections(nextValue);
    localStorage.setItem(`solve_show_selections_${problemSetId}`, String(nextValue));
  };

  // 메모 상태
  const [note, setNote] = useState(() => {
    return localStorage.getItem(`solve_note_${problemSetId}_${quiz.currentQuestion}`) || '';
  });

  // 메모 공개 상태
  const [showNote, setShowNote] = useState(() => {
    const saved = localStorage.getItem(`solve_show_note_${problemSetId}`);
    return saved ? saved === 'true' : true;
  });

  // 메모 토글 시 저장
  const toggleNote = () => {
    const nextValue = !showNote;
    setShowNote(nextValue);
    localStorage.setItem(`solve_show_note_${problemSetId}`, String(nextValue));
  };

  // BLANK 문제 전용 상태
  const [typedAnswer, setTypedAnswer] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const firstSelectionRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const isBlank = quiz.currentQuiz.type === 'BLANK';
  const isOX = quiz.currentQuiz.type === 'OX';

  /** BLANK 문제의 제목을 빈칸 슬롯 포함 React 노드로 렌더링 */
  const renderBlankTitle = useCallback(
    (text: string) => {
      const match = text.match(BLANK_REGEX);
      if (!match || match.index === undefined) {
        return <MarkdownText>{text}</MarkdownText>;
      }
      const before = text.slice(0, match.index);
      const after = text.slice(match.index + match[0].length);
      return (
        <span className="[&_.markdown-text]:inline [&_.markdown-text>span]:inline">
          {before && <MarkdownText>{before}</MarkdownText>}
          <BlankSlot
            value={typedAnswer}
            hasSelection={!!quiz.selectedOption}
            onClick={() => inputRef.current?.focus()}
            ariaLabel={t('빈칸을 클릭하여 답 입력')}
          />
          {after && <MarkdownText>{after}</MarkdownText>}
        </span>
      );
    },
    [typedAnswer, quiz.selectedOption, t],
  );

  // 문제 전환 시 상태 초기화 및 로드
  useEffect(() => {
    // 메모 로드
    const savedNote =
      localStorage.getItem(`solve_note_${problemSetId}_${quiz.currentQuestion}`) || '';
    setNote(savedNote);

    // 선택지 공개 상태 로드
    const savedToggle = localStorage.getItem(`solve_show_selections_${problemSetId}`);
    const alreadyAnswered = !isUnanswered(
      quiz.currentQuiz?.userAnswer,
      quiz.currentQuiz?.selections,
    );

    if (alreadyAnswered || isOX) {
      setShowSelections(true);
    } else if (isBlank) {
      setShowSelections(false);
    } else {
      setShowSelections(savedToggle ? savedToggle === 'true' : true);
    }

    // BLANK 문제 처리
    if (isBlank) {
      const answered = quiz.currentQuiz.selections.find(
        (sel) => String(sel.id) === String(quiz.currentQuiz.userAnswer),
      );
      setTypedAnswer(answered ? answered.content : '');
      const isTouch = window.matchMedia('(pointer: coarse)').matches;
      if (!isTouch) {
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    } else {
      setTypedAnswer('');
    }
  }, [
    quiz.currentQuestion,
    problemSetId,
    isBlank,
    isOX,
    quiz.currentQuiz?.userAnswer,
    quiz.currentQuiz?.selections,
  ]);

  // 메모 저장
  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNote(value);
    localStorage.setItem(`solve_note_${problemSetId}_${quiz.currentQuestion}`, value);
  };

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

  /** 선택지 클릭 시 입력 필드에도 반영 + 자동 닫기 */
  const handleBlankOptionSelect = (optId: string) => {
    quizActions.handleOptionSelect(optId);
    const selected = quiz.currentQuiz.selections.find((sel) => sel.id === optId);
    if (selected) {
      setTypedAnswer(selected.content);
    }
    // 선택 후 선택지 닫기 + 입력 필드로 포커스 복귀
    setShowSelections(false);
    setTimeout(() => inputRef.current?.focus(), 310);
  };

  /** BLANK 문제의 직접 입력 + 폴백 선택지 영역 */
  const renderBlankInput = () => (
    <div className="flex flex-col gap-3 max-md:mt-2">
      {/* Phase 1: 직접 입력 필드 */}
      <div className="relative flex flex-col gap-2">
        <div className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground/60">
          <PenLine className="size-4" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={typedAnswer}
          onChange={(e) => setTypedAnswer(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              // Enter 키로 선택지 토글
              e.preventDefault();
              setShowSelections((prev) => {
                if (!prev) {
                  setTimeout(() => firstSelectionRef.current?.focus(), 310);
                }
                return !prev;
              });
            } else if (e.key === 'Escape') {
              // Escape 키로 포커스 해제
              e.preventDefault();
              inputRef.current?.blur();
            }
          }}
          placeholder={t('답을 직접 입력하세요')}
          aria-label={t('답을 직접 입력하세요')}
          className={cn(
            'h-14 w-full rounded-2xl border border-input bg-card pl-10 pr-12 text-base text-foreground shadow-card max-md:pr-4',
            'placeholder:text-muted-foreground/50',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0',
            'transition-all duration-200',
          )}
        />
        {/* Enter 키 힌트 뱃지 (데스크톱만 표시) */}
        <div className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 max-md:hidden">
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            Enter
          </kbd>
        </div>
      </div>

      {/* 선택지 토글 버튼 */}
      <button
        className={cn(
          'flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border-none px-4 py-2.5 text-sm font-medium transition-all duration-200 active:scale-[0.98]',
          showSelections
            ? 'bg-primary/10 text-primary hover:bg-primary/15'
            : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground',
        )}
        onClick={toggleSelections}
        aria-expanded={showSelections}
        aria-controls={listboxId}
      >
        {showSelections ? t('선택지 숨기기') : t('선택지 보기')}
        {showSelections ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
      </button>

      {/* Phase 2: 선택지 리스트 (확장/축소 애니메이션) */}
      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-300 ease-out',
          showSelections ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
        inert={!showSelections || undefined}
        aria-hidden={!showSelections}
      >
        <div className="overflow-hidden px-1 pt-1 pb-4">
          <div
            id={listboxId}
            className="flex flex-col gap-3 max-md:gap-2"
            role="listbox"
            aria-label={t('선택지 보기')}
          >
            {quiz.currentQuiz.selections.map((opt, idx) => (
              <div
                key={opt.id}
                ref={idx === 0 ? firstSelectionRef : undefined}
                tabIndex={showSelections ? 0 : -1}
                role="option"
                aria-selected={quiz.selectedOption === opt.id}
                className={cn(
                  'flex min-h-14 cursor-pointer items-center rounded-2xl bg-card px-4 py-5 shadow-card transition-colors duration-200',
                  'hover:bg-muted',
                  'max-md:min-h-12 max-md:px-3 max-md:py-4',
                  quiz.selectedOption === opt.id && 'ring-2 ring-primary ring-offset-1',
                )}
                onClick={() => handleBlankOptionSelect(opt.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleBlankOptionSelect(opt.id);
                  } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    const next = e.currentTarget.nextElementSibling as HTMLElement | null;
                    next?.focus();
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    const prev = e.currentTarget.previousElementSibling as HTMLElement | null;
                    prev?.focus();
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    setShowSelections(false);
                    setTimeout(() => inputRef.current?.focus(), 310);
                  }
                }}
              >
                <span
                  className={cn(
                    'mr-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium max-md:mr-3 max-md:h-6 max-md:w-6 max-md:text-xs',
                    quiz.selectedOption === opt.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted',
                  )}
                >
                  {idx + 1}
                </span>
                <span className="min-w-0 flex-1 break-words pr-3 text-base leading-[1.8] text-foreground max-md:pr-2 max-md:text-sm max-md:leading-relaxed">
                  <MarkdownText>{opt.content}</MarkdownText>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  /** 선택지 영역 렌더링 */
  const renderSelections = () => (
    <div className="flex flex-col gap-2">
      {/* 선택지 토글 버튼 — OX 타입은 숨김 */}
      {!isOX && (
        <button
          className="cursor-pointer self-start border-none bg-transparent px-1 py-0 text-xs text-muted-foreground transition-colors duration-200 hover:text-foreground"
          onClick={toggleSelections}
        >
          <span className="inline-flex items-center gap-1">
            {showSelections ? (
              <>
                <ChevronUp className="size-3" />
                {t('선택지 숨기기')}
              </>
            ) : (
              <>
                <ChevronDown className="size-3" />
                {t('선택지 보기')}
              </>
            )}
          </span>
        </button>
      )}

      {/* 선택지 리스트 (확장/축소 애니메이션) */}
      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-300 ease-out',
          showSelections || isOX ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
        inert={(!showSelections && !isOX) || undefined}
        aria-hidden={!showSelections && !isOX}
      >
        <div className="overflow-hidden px-1 pt-1 pb-4">
          <div className="flex flex-col gap-3 max-md:gap-2">
            {quiz.currentQuiz.selections.map((opt, idx) => (
              <div
                key={opt.id}
                className={cn(
                  'flex min-h-14 cursor-pointer items-center rounded-2xl bg-card px-4 py-5 shadow-card transition-colors duration-200',
                  'hover:bg-muted',
                  'max-md:min-h-12 max-md:px-3 max-md:py-4',
                  quiz.selectedOption === opt.id && 'ring-2 ring-primary ring-offset-0',
                )}
                onClick={() => quizActions.handleOptionSelect(opt.id)}
              >
                <span className="mr-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium max-md:mr-3 max-md:h-6 max-md:w-6 max-md:text-xs">
                  {idx + 1}
                </span>
                <span className="min-w-0 flex-1 break-words pr-3 text-base leading-[1.8] text-foreground max-md:pr-2 max-md:text-sm max-md:leading-relaxed">
                  <MarkdownText>{opt.content}</MarkdownText>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* 제출 확인 다이얼로그 */}
      <AnimatePresence>
        {quiz.showSubmitDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
            onClick={quizActions.handleOverlayClick}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-card shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 다이얼로그 헤더 */}
              <div className="flex items-center justify-between border-b border-border px-6 py-5">
                <h2 className="m-0 text-xl font-semibold text-foreground">{t('제출 확인')}</h2>
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-lg border-none bg-transparent text-2xl text-muted-foreground transition-colors duration-200 hover:bg-muted"
                  onClick={quizActions.handleCancelSubmit}
                >
                  ✕
                </button>
              </div>

              {/* 다이얼로그 콘텐츠 */}
              <div className="flex-1 overflow-y-auto p-6">
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
                          <span className="min-w-[50px] shrink-0 font-semibold text-muted-foreground">
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* AI 지시사항 배너 (모바일) */}
      {appliedInstruction && (
        <div className="mx-auto w-[95%] pt-3 lg:hidden">
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2.5">
            <button
              className="flex w-full cursor-pointer items-center justify-between border-none bg-transparent p-0 text-xs font-semibold text-primary/70"
              onClick={() => setShowInstruction((prev) => !prev)}
            >
              <span className="flex items-center gap-1.5">
                <span>✦</span>
                {t('AI 지시사항 반영 결과')}
              </span>
              {showInstruction ? (
                <ChevronUp className="size-3.5" />
              ) : (
                <ChevronDown className="size-3.5" />
              )}
            </button>
            <div
              className={cn(
                'grid transition-[grid-template-rows] duration-300 ease-out',
                showInstruction ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
              )}
            >
              <div className="overflow-hidden">
                <p className="m-0 pt-2 text-xs leading-relaxed text-foreground/70">
                  {appliedInstruction}
                </p>
              </div>
            </div>
          </div>
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
                {/* 검토 버튼 */}
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

                {/* 질문 제목 — BLANK 문제일 때 빈칸 슬롯으로 시각화 */}
                <div className="p-5 pt-2 pb-6">
                  <div className="m-0 break-words text-base leading-relaxed text-foreground">
                    {isBlank ? (
                      renderBlankTitle(quiz.currentQuiz.title.split('\n')[0])
                    ) : (
                      <MarkdownText>{quiz.currentQuiz.title.split('\n')[0]}</MarkdownText>
                    )}
                  </div>
                </div>

                {/* 문제 본문 (코드, 힌트 등) */}
                {quiz.currentQuiz.title.includes('\n') && (
                  <div className="px-5 pt-3 pb-6">
                    <div className="m-0 break-words text-base leading-relaxed text-foreground">
                      {isBlank ? (
                        renderBlankTitle(quiz.currentQuiz.title.split('\n').slice(1).join('\n'))
                      ) : (
                        <MarkdownText>
                          {quiz.currentQuiz.title.split('\n').slice(1).join('\n')}
                        </MarkdownText>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 메모 영역 — 문제와 선택지 사이 (BLANK, OX 문제 제외) */}
              {!isBlank && !isOX && (
                <div className="flex flex-col gap-2">
                  {/* 메모 토글 버튼 */}
                  <button
                    className="cursor-pointer self-start border-none bg-transparent px-1 py-0 text-xs text-muted-foreground transition-colors duration-200 hover:text-foreground"
                    onClick={toggleNote}
                  >
                    <span className="inline-flex items-center gap-1">
                      {showNote ? (
                        <>
                          <ChevronUp className="size-3" />
                          {t('정답 적어보기 숨기기')}
                        </>
                      ) : (
                        <>
                          <ChevronDown className="size-3" />
                          {t('정답 적어보기')}
                        </>
                      )}
                    </span>
                  </button>

                  {/* 메모 입력 영역 (확장/축소) */}
                  <div
                    className={cn(
                      'grid transition-[grid-template-rows] duration-300 ease-out',
                      showNote ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                    )}
                    inert={!showNote || undefined}
                    aria-hidden={!showNote}
                  >
                    <div className="overflow-hidden">
                      <div className="relative rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4 shadow-sm">
                        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-primary/70">
                          <NotebookPen className="size-3.5" />
                          {t('정답 적어보기')}
                        </div>
                        <textarea
                          value={note}
                          onChange={handleNoteChange}
                          placeholder={t('정답 내용을 입력하세요')}
                          rows={3}
                          className="w-full resize-none border-none bg-transparent p-0 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-0"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 선택지 영역: BLANK이면 직접 입력 UI, 아니면 기존 선택지 */}
              {isBlank ? renderBlankInput() : renderSelections()}
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
          {/* AI 지시사항 카드 */}
          {appliedInstruction && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4">
              <button
                className="flex w-full cursor-pointer items-center justify-between border-none bg-transparent p-0 text-xs font-semibold text-primary/70"
                onClick={() => setShowInstruction((prev) => !prev)}
              >
                <span className="flex items-center gap-1.5">
                  <span>✦</span>
                  {t('AI 지시사항 반영 결과')}
                </span>
                {showInstruction ? (
                  <ChevronUp className="size-3.5" />
                ) : (
                  <ChevronDown className="size-3.5" />
                )}
              </button>
              <div
                className={cn(
                  'grid transition-[grid-template-rows] duration-300 ease-out',
                  showInstruction ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                )}
              >
                <div className="overflow-hidden">
                  <p className="m-0 pt-2.5 text-sm leading-relaxed text-foreground/80">
                    {appliedInstruction}
                  </p>
                </div>
              </div>
            </div>
          )}

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

export default SolveQuizDesignD;
