import { useTranslation } from 'i18nexus';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSolveQuiz } from '#features/solve-quiz';
import { isUnanswered } from '../../features/solve-quiz/lib/isUnanswered';
import { useQuizGenerationStore } from '#features/quiz-generation';
import { cn } from '@/shared/ui/lib/utils';
import MarkdownText from '@/shared/ui/components/markdown-text';

/** H안: Focus Mode — 집중 모드 */
const SolveQuizDesignC: React.FC = () => {
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

  /** 컨트롤 자동 숨김 상태 */
  const [controlsVisible, setControlsVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  /** 마우스/터치 이동 시 컨트롤 표시, 3초 미조작 시 숨김 */
  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setControlsVisible(false), 3000);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', showControls);
    window.addEventListener('touchstart', showControls);
    showControls(); // 초기 타이머 시작
    return () => {
      window.removeEventListener('mousemove', showControls);
      window.removeEventListener('touchstart', showControls);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [showControls]);

  useEffect(() => {
    return () => {
      resetQuizGeneration();
    };
  }, [resetQuizGeneration]);

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      {/* 제출 다이얼로그 */}
      {quiz.showSubmitDialog && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40"
          onClick={quizActions.handleOverlayClick}
        >
          <div
            className="w-[90%] max-w-[560px] animate-[slideIn_0.3s_ease-out] overflow-y-auto rounded-2xl border border-border bg-background shadow-card max-md:m-5 max-md:w-[95%]"
            style={{ maxHeight: '80vh' }}
          >
            {/* 다이얼로그 헤더 */}
            <div className="flex items-center justify-between px-8 py-6">
              <h2 className="m-0 text-lg font-semibold text-foreground">{t('제출 확인')}</h2>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full border-none bg-transparent text-xl text-muted-foreground transition-colors duration-200 hover:bg-muted"
                onClick={quizActions.handleCancelSubmit}
              >
                x
              </button>
            </div>

            {/* 다이얼로그 콘텐츠 */}
            <div className="px-8 pb-6">
              {/* 상단 통계 정보 */}
              <div className="mb-8 grid grid-cols-2 gap-3 max-md:grid-cols-1">
                <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                  <span className="text-sm text-muted-foreground">{t('전체 문제:')}</span>
                  <span className="text-sm font-semibold text-foreground">
                    {quiz.quizzes.length}
                    {t('개')}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                  <span className="text-sm text-muted-foreground">{t('답변한 문제:')}</span>
                  <span className="text-sm font-semibold text-emerald-600">
                    {quiz.answeredCount}
                    {t('개')}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                  <span className="text-sm text-muted-foreground">{t('안푼 문제:')}</span>
                  <span className="text-sm font-semibold text-red-600">
                    {quiz.unansweredCount}
                    {t('개')}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                  <span className="text-sm text-muted-foreground">{t('검토할 문제:')}</span>
                  <span className="text-sm font-semibold text-amber-600">
                    {quiz.reviewCount}
                    {t('개')}
                  </span>
                </div>
              </div>

              {/* 하단 문제별 선택 답안 */}
              <div>
                <h3 className="mb-4 text-base font-semibold text-foreground">{t('선택한 답안')}</h3>
                <div className="max-h-[300px] overflow-y-auto rounded-xl border border-border">
                  {quiz.quizzes.map((quizItem) => {
                    const unanswered = isUnanswered(quizItem.userAnswer, quizItem.selections);
                    const selectedAnswer = unanswered
                      ? t('미선택')
                      : quizItem.selections?.find((sel) => sel.id === quizItem.userAnswer)
                          ?.content || `${quizItem.userAnswer}번`;

                    return (
                      <div
                        key={quizItem.number}
                        className="flex items-center border-b border-border px-4 py-3 last:border-b-0"
                      >
                        <span className="min-w-[48px] text-sm font-medium text-muted-foreground">
                          {quizItem.number}
                          {t('번:')}
                        </span>
                        <span
                          className={cn(
                            'ml-3 flex items-center gap-2 break-words text-sm',
                            unanswered && 'italic text-red-500',
                            quizItem.check && 'text-amber-600',
                          )}
                        >
                          <MarkdownText>{selectedAnswer}</MarkdownText>
                          {quizItem.check && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-600">
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
            <div className="flex justify-end gap-3 border-t border-border px-8 py-5 max-md:flex-col">
              <button
                className="cursor-pointer rounded-xl border border-border bg-background px-6 py-2.5 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted max-md:w-full"
                onClick={quizActions.handleCancelSubmit}
              >
                {t('취소')}
              </button>
              <button
                className="cursor-pointer rounded-xl border-none bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors duration-200 hover:opacity-90 max-md:w-full"
                onClick={quizActions.handleConfirmSubmit}
              >
                {t('제출하기')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 상단 바 — 3초 미조작 시 자동 숨김 */}
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 flex items-center justify-between bg-primary px-6 py-4 text-primary-foreground transition-opacity duration-500',
          controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
      >
        <button
          className="cursor-pointer border-none bg-transparent text-lg text-primary-foreground transition-colors duration-200 hover:text-primary-foreground/80"
          onClick={() => navigate('/')}
        >
          x
        </button>
        <div className="flex items-center gap-4">
          <span className="text-sm text-primary-foreground">
            {quiz.currentQuestion} / {quiz.totalQuestions}
          </span>
          <span className="font-mono text-sm text-primary-foreground">{quiz.currentTime}</span>
        </div>
      </header>

      {/* 메인 콘텐츠 — 전체 화면 집중 모드 */}
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-8 py-24 max-md:px-5">
        {quiz.isLoading ? (
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
            <p className="text-sm text-muted-foreground">{t('문제 로딩 중…')}</p>
          </div>
        ) : (
          <section className="flex flex-col gap-8">
            {/* 문제 영역 */}
            <div className="flex flex-col gap-3">
              {/* 문제 번호 + 검토 체크박스 */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Q{quiz.currentQuestion}
                </span>
                <label className="flex cursor-pointer select-none items-center gap-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-primary">
                  <input
                    type="checkbox"
                    checked={quiz.currentQuiz.check || false}
                    onChange={quizActions.handleCheckToggle}
                    className="h-4 w-4 cursor-pointer accent-primary"
                  />
                  {t('검토')}
                </label>
              </div>

              {/* 문제 텍스트 — 큰 폰트 */}
              <div className="m-0 break-words text-xl leading-relaxed text-foreground">
                <MarkdownText>{quiz.currentQuiz.title}</MarkdownText>
              </div>
            </div>

            {/* 선택지 리스트 */}
            <div className="flex flex-col gap-3">
              {quiz.currentQuiz.selections.map((opt, idx) => (
                <div
                  key={opt.id}
                  className={cn(
                    'flex min-h-14 cursor-pointer items-center rounded-xl border border-transparent px-5 py-4 transition-all duration-200',
                    'hover:border-primary/30 hover:bg-muted',
                    quiz.selectedOption === opt.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border/50 bg-muted/30',
                  )}
                  onClick={() => quizActions.handleOptionSelect(opt.id)}
                >
                  <span
                    className={cn(
                      'mr-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium transition-colors duration-200',
                      quiz.selectedOption === opt.id
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border text-muted-foreground',
                    )}
                  >
                    {idx + 1}
                  </span>
                  <span className="break-words text-lg leading-relaxed text-foreground">
                    <MarkdownText>{opt.content}</MarkdownText>
                  </span>
                </div>
              ))}
            </div>

            {/* 확인 버튼 */}
            <button
              className="cursor-pointer rounded-xl border-none bg-primary py-3 text-sm font-medium text-primary-foreground transition-opacity duration-200 hover:opacity-90"
              onClick={quizActions.handleSubmit}
            >
              {t('확인')}
            </button>

            {/* 제출하기 버튼 */}
            <button
              className="w-[120px] cursor-pointer self-end rounded-xl border border-border bg-background py-2.5 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-muted max-md:w-full max-md:self-stretch"
              onClick={quizActions.handleFinish}
            >
              {t('제출하기')}
            </button>
          </section>
        )}
      </main>

      {/* 좌측 이전 버튼 — 화면 좌측 끝, auto-hide */}
      <button
        className={cn(
          'fixed left-0 top-1/2 z-40 -translate-y-1/2 cursor-pointer rounded-r-xl border border-l-0 border-border bg-background/70 px-3 py-6 text-muted-foreground backdrop-blur-sm transition-all duration-500 hover:bg-background hover:text-foreground',
          controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        onClick={quizActions.handlePrev}
      >
        ‹
      </button>

      {/* 우측 다음 버튼 — 화면 우측 끝, auto-hide */}
      <button
        className={cn(
          'fixed right-0 top-1/2 z-40 -translate-y-1/2 cursor-pointer rounded-l-xl border border-r-0 border-border bg-background/70 px-3 py-6 text-muted-foreground backdrop-blur-sm transition-all duration-500 hover:bg-background hover:text-foreground',
          // dot nav와 겹치지 않도록 오른쪽에 충분한 여백 확보
          'mr-10',
          controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        onClick={quizActions.handleNext}
      >
        ›
      </button>

      {/* 우측 고정 세로 dot nav */}
      <nav className="fixed right-4 top-1/2 z-50 flex -translate-y-1/2 flex-col items-center gap-1.5">
        {quiz.quizzes.map((q) => {
          const unanswered = isUnanswered(q.userAnswer, q.selections);
          const isCurrent = q.number === quiz.currentQuestion;

          return (
            <button
              key={q.number}
              title={`${q.number}번`}
              className={cn(
                'rounded-full border-none bg-muted-foreground/30 transition-all duration-200 hover:scale-125 hover:bg-primary/60',
                // 현재 문제
                isCurrent && 'size-3 bg-primary',
                // 검토 표시
                !isCurrent && q.check && 'size-2.5 bg-amber-400',
                // 응답 완료
                !isCurrent && !q.check && !unanswered && 'size-2.5 bg-primary/40',
                // 미응답
                !isCurrent && !q.check && unanswered && 'size-2.5 bg-muted-foreground/30',
              )}
              onClick={() => quizActions.handleJumpTo(q.number)}
            />
          );
        })}
        {/* 스트리밍 중 대기 dot */}
        {Array.from({ length: remainingCount }).map((_, index) => (
          <span
            key={`pending-${index}`}
            className="size-2.5 animate-pulse rounded-full bg-muted-foreground/15"
          />
        ))}
      </nav>
    </div>
  );
};

export default SolveQuizDesignC;
