import { useTranslation } from 'i18nexus';

import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSolveQuiz } from '#features/solve-quiz';
import { isUnanswered } from '../../features/solve-quiz/lib/isUnanswered';
import { useQuizGenerationStore } from '#features/quiz-generation';
import { cn } from '@/shared/ui/lib/utils';
import { BlurFade } from '@/shared/ui/components/blur-fade';
import { motion, AnimatePresence } from 'framer-motion';
import MarkdownText from '@/shared/ui/components/markdown-text';

/** C안: Slide + Timeline Nav — 좌우 슬라이드 전환, 세로 타임라인 네비게이션, stagger 선택지 */
const SolveQuizMagicB: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { problemSetId } = useParams<{ problemSetId: string }>();
  const { uploadedUrl } = (location.state as { uploadedUrl?: string }) || {};
  const storeProblemSetId = useQuizGenerationStore((state) => state.problemSetId);
  const streamQuizzes = useQuizGenerationStore((state) => state.quizzes);
  const streamIsStreaming = useQuizGenerationStore((state) => state.isStreaming);
  const streamTotalCount = useQuizGenerationStore((state) => state.totalCount);
  const resetQuizGeneration = useQuizGenerationStore((state) => state.resetStreamingState);

  const isSameProblemSet = String(storeProblemSetId ?? '') === String(problemSetId ?? '');
  const quizzes = isSameProblemSet ? streamQuizzes : [];
  const isStreaming = isSameProblemSet ? streamIsStreaming : false;
  const totalCount = isSameProblemSet ? streamTotalCount : 0;

  const { state, actions } = useSolveQuiz({
    t,
    navigate,
    problemSetId,
    uploadedUrl,
    quizzes,
    isStreaming,
  });
  const { quiz } = state;
  const { quiz: quizActions } = actions;

  const remainingCount =
    isStreaming && totalCount > 0 ? Math.max(0, totalCount - quiz.totalQuestions) : 0;

  /** 슬라이드 방향 추적 */
  const [direction, setDirection] = useState(0);
  const prevQuestionRef = useRef(quiz.currentQuestion);

  useEffect(() => {
    if (quiz.currentQuestion > prevQuestionRef.current) {
      setDirection(1); // 오른쪽으로 슬라이드
    } else if (quiz.currentQuestion < prevQuestionRef.current) {
      setDirection(-1); // 왼쪽으로 슬라이드
    }
    prevQuestionRef.current = quiz.currentQuestion;
  }, [quiz.currentQuestion]);

  useEffect(() => {
    return () => {
      resetQuizGeneration();
    };
  }, [resetQuizGeneration]);

  /** 슬라이드 애니메이션 variants */
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -300 : 300,
      opacity: 0,
    }),
  };

  /** 이전 문제 핸들러 (방향 설정 포함) */
  const handlePrev = () => {
    setDirection(-1);
    quizActions.handlePrev();
  };

  /** 다음 문제 핸들러 (방향 설정 포함) */
  const handleNext = () => {
    setDirection(1);
    quizActions.handleNext();
  };

  /** 문제 점프 핸들러 (방향 설정 포함) */
  const handleJumpTo = (number: number) => {
    setDirection(number > quiz.currentQuestion ? 1 : -1);
    quizActions.handleJumpTo(number);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* 제출 다이얼로그 */}
      {quiz.showSubmitDialog && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-foreground/50"
          onClick={quizActions.handleOverlayClick}
        >
          <div
            className="w-[90%] max-w-[600px] animate-[slideIn_0.3s_ease-out] overflow-y-auto rounded-xl bg-card shadow-lg max-md:m-5 max-md:w-[95%]"
            style={{ maxHeight: '80vh' }}
          >
            {/* 다이얼로그 헤더 */}
            <div className="flex items-center justify-between border-b border-border px-6 py-5">
              <h2 className="m-0 text-xl font-semibold text-foreground">{t('제출 확인')}</h2>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-md border-none bg-transparent text-2xl text-muted-foreground hover:bg-muted"
                onClick={quizActions.handleCancelSubmit}
              >
                x
              </button>
            </div>

            {/* 다이얼로그 콘텐츠 */}
            <div className="p-6">
              {/* 상단 통계 정보 */}
              <div className="mb-8 grid grid-cols-2 gap-4 rounded-lg bg-muted p-5 max-md:grid-cols-1 max-md:gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-muted-foreground">{t('전체 문제:')}</span>
                  <span className="rounded px-2 py-1 text-sm font-semibold">
                    {quiz.quizzes.length}
                    {t('개')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-muted-foreground">{t('답변한 문제:')}</span>
                  <span className="rounded bg-success/15 px-2 py-1 text-sm font-semibold text-success">
                    {quiz.answeredCount}
                    {t('개')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-muted-foreground">{t('안푼 문제:')}</span>
                  <span className="rounded bg-destructive/15 px-2 py-1 text-sm font-semibold text-destructive">
                    {quiz.unansweredCount}
                    {t('개')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-muted-foreground">{t('검토할 문제:')}</span>
                  <span className="rounded bg-warning/15 px-2 py-1 text-sm font-semibold text-warning">
                    {quiz.reviewCount}
                    {t('개')}
                  </span>
                </div>
              </div>

              {/* 하단 문제별 선택 답안 */}
              <div>
                <h3 className="mb-4 text-lg font-semibold text-foreground">{t('선택한 답안')}</h3>
                <div className="max-h-[300px] overflow-y-auto rounded-lg border border-border p-3">
                  {quiz.quizzes.map((quizItem) => {
                    const unanswered = isUnanswered(quizItem.userAnswer, quizItem.selections);
                    const selectedAnswer = unanswered
                      ? t('미선택')
                      : quizItem.selections?.find((sel) => sel.id === quizItem.userAnswer)
                          ?.content || `${quizItem.userAnswer}번`;

                    return (
                      <div
                        key={quizItem.number}
                        className="flex items-center border-b border-border py-2 last:border-b-0"
                      >
                        <span className="min-w-[50px] font-semibold text-muted-foreground">
                          {quizItem.number}
                          {t('번:')}
                        </span>
                        <span
                          className={cn(
                            'ml-3 flex items-center gap-2 break-words',
                            unanswered && 'italic text-destructive',
                            quizItem.check && 'text-warning',
                          )}
                        >
                          <MarkdownText>{selectedAnswer}</MarkdownText>
                          {quizItem.check && (
                            <span className="rounded bg-warning px-1.5 py-0.5 text-xs font-medium text-warning-foreground">
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
                className="cursor-pointer rounded-md border-none bg-muted px-6 py-2.5 font-medium text-muted-foreground transition-all duration-200 hover:bg-accent max-md:w-full"
                onClick={quizActions.handleCancelSubmit}
              >
                {t('취소')}
              </button>
              <button
                className="cursor-pointer rounded-md border-none bg-primary px-6 py-2.5 font-medium text-primary-foreground transition-all duration-200 hover:bg-primary/90 max-md:w-full"
                onClick={quizActions.handleConfirmSubmit}
              >
                {t('제출하기')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 상단 네비게이션 바 */}
      <header className="flex items-center justify-between bg-primary p-4 text-primary-foreground">
        <button
          className="cursor-pointer border-none bg-transparent text-xl text-inherit"
          onClick={() => navigate('/')}
        >
          x
        </button>
        <div className="font-mono">{quiz.currentTime}</div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="mx-auto flex w-[90%] max-w-[1000px] flex-col pb-6 pt-6">
        {/* 질문 네비게이션 */}
        <nav className="mb-4 flex items-center justify-between max-md:gap-2">
          <button
            className="cursor-pointer rounded-lg border-none bg-primary px-4 py-2 text-primary-foreground max-md:flex-1 max-md:text-sm"
            onClick={handlePrev}
          >
            {t('이전')}
          </button>
          <span className="max-md:flex-1 max-md:text-center max-md:text-sm">
            {quiz.currentQuestion} / {quiz.totalQuestions}
          </span>
          <button
            className="cursor-pointer rounded-lg border-none bg-primary px-4 py-2 text-primary-foreground max-md:flex-1 max-md:text-sm"
            onClick={handleNext}
          >
            {t('다음')}
          </button>
        </nav>

        {/* 문제 영역 */}
        {quiz.isLoading ? (
          <div className="flex h-screen flex-col items-center justify-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
            <p>{t('문제 로딩 중…')}</p>
          </div>
        ) : (
          <div className="flex gap-6 max-md:flex-col">
            {/* 좌측 세로 타임라인 네비게이션 */}
            <aside className="relative flex flex-col items-center max-md:hidden">
              {/* 세로 연결선 */}
              <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-border" />

              <div className="relative flex flex-col gap-1">
                {quiz.quizzes.map((q) => {
                  const unanswered = isUnanswered(q.userAnswer, q.selections);
                  const isCurrent = q.number === quiz.currentQuestion;

                  return (
                    <button
                      key={q.number}
                      className={cn(
                        'relative z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-border bg-card text-xs font-medium transition-all duration-200',
                        'hover:scale-110 hover:border-primary',
                        !unanswered && 'border-accent bg-accent',
                        q.check && 'border-warning bg-warning/25',
                        isCurrent &&
                          'scale-110 border-primary bg-primary text-primary-foreground hover:scale-110',
                      )}
                      onClick={() => handleJumpTo(q.number)}
                    >
                      {q.number}
                    </button>
                  );
                })}
                {/* 스트리밍 대기 중인 문제 */}
                {Array.from({ length: remainingCount }).map((_, index) => (
                  <div
                    key={`pending-${index}`}
                    className="relative z-10 flex h-8 w-8 animate-pulse items-center justify-center rounded-full border-2 border-dashed border-border bg-primary/10 text-xs text-primary"
                  >
                    ...
                  </div>
                ))}
              </div>
            </aside>

            {/* 문제 콘텐츠 영역 — 좌우 슬라이드 전환 */}
            <div className="flex-1 overflow-hidden">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={quiz.currentQuestion}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  {/* 질문 영역 — BlurFade 입장 */}
                  <BlurFade delay={0.05} inView>
                    <div className="flex w-full items-center rounded-lg bg-muted p-4 max-md:flex-col max-md:items-start max-md:gap-3">
                      <div className="flex-1 pr-3 max-md:w-full max-md:pr-0">
                        <div className="m-0 break-words text-base leading-relaxed">
                          <MarkdownText>{quiz.currentQuiz.title}</MarkdownText>
                        </div>
                      </div>
                      <div className="border-l border-border pl-3 max-md:self-end max-md:border-l-0 max-md:pl-0">
                        <label className="flex cursor-pointer select-none items-center whitespace-nowrap text-base font-bold text-muted-foreground transition-colors duration-200 hover:text-primary">
                          <input
                            type="checkbox"
                            checked={quiz.currentQuiz.check || false}
                            onChange={quizActions.handleCheckToggle}
                            className="mr-2 h-5 w-5 cursor-pointer accent-primary"
                          />{' '}
                          {t('검토')}
                        </label>
                      </div>
                    </div>
                  </BlurFade>

                  {/* 선택지 리스트 — stagger 등장 */}
                  <div className="mt-4 flex flex-col gap-3 max-md:gap-2">
                    {quiz.currentQuiz.selections.map((opt, idx) => (
                      <motion.div
                        key={opt.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.3,
                          delay: 0.1 + idx * 0.08,
                          ease: 'easeOut',
                        }}
                        className={cn(
                          'flex min-h-14 cursor-pointer items-center rounded-lg border border-border bg-card px-3 py-5 transition-colors duration-200',
                          'hover:bg-accent',
                          'max-md:min-h-12 max-md:px-2 max-md:py-4',
                          quiz.selectedOption === opt.id && 'border-primary bg-accent',
                        )}
                        onClick={() => quizActions.handleOptionSelect(opt.id)}
                      >
                        <span className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted max-md:mr-2 max-md:h-6 max-md:w-6">
                          {idx + 1}
                        </span>
                        <span className="break-words pr-3 text-base leading-[1.8] max-md:pr-2 max-md:text-sm max-md:leading-relaxed">
                          <MarkdownText>{opt.content}</MarkdownText>
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* 확인 버튼 */}
              <button
                className="mt-4 w-full cursor-pointer rounded-lg border-none bg-primary p-3 text-base text-primary-foreground max-md:mt-4"
                onClick={quizActions.handleSubmit}
              >
                {t('확인')}
              </button>

              {/* 제출하기 버튼 */}
              <button
                className="mt-8 w-[100px] cursor-pointer self-end rounded-lg border-none bg-primary p-3 text-base text-primary-foreground max-md:mt-4 max-md:w-full"
                onClick={quizActions.handleFinish}
              >
                {t('제출하기')}
              </button>
            </div>
          </div>
        )}

        {/* 하단 문제 번호 패널 (모바일) */}
        <aside className="mt-4 hidden grid-cols-[repeat(auto-fill,2rem)] justify-center gap-2 rounded-lg bg-card p-4 shadow-md max-md:grid">
          {quiz.quizzes.map((q) => {
            const unanswered = isUnanswered(q.userAnswer, q.selections);
            return (
              <button
                key={`bottom-${q.number}`}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 border-border bg-card',
                  'cursor-pointer transition-all duration-200',
                  'hover:scale-110 hover:border-primary',
                  !unanswered && 'border-accent bg-accent',
                  q.check && 'border-warning bg-warning/25',
                  q.number === quiz.currentQuestion &&
                    'border-primary bg-primary font-bold text-primary-foreground hover:scale-100',
                )}
                onClick={() => handleJumpTo(q.number)}
              >
                {q.number}
              </button>
            );
          })}
          {Array.from({ length: remainingCount }).map((_, index) => (
            <div
              key={`bottom-pending-${index}`}
              className="flex h-8 w-8 animate-pulse items-center justify-center rounded-full border-2 border-dashed border-border bg-primary/10 text-xs text-primary"
            >
              ...
            </div>
          ))}
        </aside>
      </main>
    </div>
  );
};

export default SolveQuizMagicB;
