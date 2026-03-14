import { useTranslation } from 'i18nexus';

import React, { useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSolveQuiz } from '#features/solve-quiz';
import { isUnanswered } from '../../features/solve-quiz/lib/isUnanswered';
import { useQuizGenerationStore } from '#features/quiz-generation';
import { cn } from '@/shared/ui/lib/utils';
import MarkdownText from '@/shared/ui/components/markdown-text';

/** G안: Grid Gallery — 문제를 그리드 카드로 전체 표시, 선택 시 포커스 */
const SolveQuizDesignG: React.FC = () => {
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

  useEffect(() => {
    return () => {
      resetQuizGeneration();
    };
  }, [resetQuizGeneration]);

  /** 그리드 갤러리의 문제 미리보기 카드 (번호 네비게이션 역할) */
  const renderQuestionButton = (
    q: (typeof quiz.quizzes)[number],
    keyPrefix = '',
  ): React.ReactElement => {
    const unanswered = isUnanswered(q.userAnswer, q.selections);
    const isActive = q.number === quiz.currentQuestion;
    return (
      <button
        key={`${keyPrefix}${q.number}`}
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-xs font-medium text-muted-foreground',
          'cursor-pointer transition-all duration-200 hover:border-primary hover:text-primary',
          !unanswered && 'border-primary/40 bg-primary/10 text-primary',
          q.check && 'border-warning bg-warning/10 text-warning',
          isActive && 'border-primary bg-primary text-primary-foreground',
        )}
        onClick={() => quizActions.handleJumpTo(q.number)}
      >
        {q.number}
      </button>
    );
  };

  /** 대기 중인 그리드 카드 자리 표시자 */
  const renderPendingButton = (index: number, keyPrefix = ''): React.ReactElement => (
    <button
      key={`${keyPrefix}pending-${index}`}
      className="flex h-8 w-8 animate-pulse items-center justify-center rounded-lg border border-dashed border-border bg-muted text-xs text-muted-foreground/50"
      disabled
    >
      ·
    </button>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* 제출 다이얼로그 */}
      {quiz.showSubmitDialog && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-foreground/40"
          onClick={quizActions.handleOverlayClick}
        >
          <div
            className="w-[90%] max-w-[560px] overflow-y-auto rounded-2xl border border-border bg-background shadow-card max-md:m-5 max-md:w-[95%]"
            style={{ maxHeight: '80vh' }}
          >
            {/* 다이얼로그 헤더 */}
            <div className="flex items-center justify-between border-b border-border px-6 py-5">
              <h2 className="m-0 text-lg font-semibold text-foreground">{t('제출 확인')}</h2>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-full border-none bg-transparent text-xl text-muted-foreground transition-colors duration-200 hover:bg-muted"
                onClick={quizActions.handleCancelSubmit}
              >
                ✕
              </button>
            </div>

            {/* 다이얼로그 콘텐츠 */}
            <div className="px-6 pb-6 pt-5">
              {/* 통계 */}
              <div className="mb-6 grid grid-cols-2 gap-3 max-md:grid-cols-1">
                <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                  <span className="text-sm text-muted-foreground">{t('전체 문제:')}</span>
                  <span className="text-sm font-semibold text-foreground">
                    {quiz.quizzes.length}
                    {t('개')}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                  <span className="text-sm text-muted-foreground">{t('답변한 문제:')}</span>
                  <span className="text-sm font-semibold text-success">
                    {quiz.answeredCount}
                    {t('개')}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                  <span className="text-sm text-muted-foreground">{t('안푼 문제:')}</span>
                  <span className="text-sm font-semibold text-destructive">
                    {quiz.unansweredCount}
                    {t('개')}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                  <span className="text-sm text-muted-foreground">{t('검토할 문제:')}</span>
                  <span className="text-sm font-semibold text-warning">
                    {quiz.reviewCount}
                    {t('개')}
                  </span>
                </div>
              </div>

              {/* 선택 답안 목록 */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-foreground">{t('선택한 답안')}</h3>
                <div className="max-h-[280px] overflow-y-auto rounded-xl border border-border">
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
                            unanswered && 'italic text-destructive',
                            quizItem.check && 'text-warning',
                          )}
                        >
                          <MarkdownText>{selectedAnswer}</MarkdownText>
                          {quizItem.check && (
                            <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
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

      {/* 좌측 사이드바 — 그리드 갤러리 문제 목록 */}
      <aside className="flex w-72 flex-shrink-0 flex-col border-r border-border bg-muted/20 max-lg:hidden">
        {/* 사이드바 헤더 */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <button
            className="cursor-pointer border-none bg-transparent text-lg text-muted-foreground transition-colors duration-200 hover:text-foreground"
            onClick={() => navigate('/')}
          >
            ✕
          </button>
          <span className="font-mono text-sm text-muted-foreground">{quiz.currentTime}</span>
        </div>

        {/* 진행 통계 */}
        <div className="border-b border-border px-5 py-4">
          <div className="mb-2 flex justify-between text-xs text-muted-foreground">
            <span>{t('진행률')}</span>
            <span className="font-medium text-foreground">
              {quiz.totalQuestions > 0
                ? Math.round((quiz.answeredCount / quiz.totalQuestions) * 100)
                : 0}
              %
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{
                width: `${quiz.totalQuestions > 0 ? (quiz.answeredCount / quiz.totalQuestions) * 100 : 0}%`,
              }}
            />
          </div>
          <div className="mt-3 flex justify-between text-xs">
            <span className="text-success">
              {t('완료')} {quiz.answeredCount}
            </span>
            <span className="text-destructive">
              {t('미답')} {quiz.unansweredCount}
            </span>
            <span className="text-warning">
              {t('검토')} {quiz.reviewCount}
            </span>
          </div>
        </div>

        {/* 그리드 갤러리 — 문제 카드 목록 */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-5 gap-1.5">
            {quiz.quizzes.map((q) => renderQuestionButton(q, 'sidebar-'))}
            {Array.from({ length: remainingCount }).map((_, index) =>
              renderPendingButton(index, 'sidebar-'),
            )}
          </div>
        </div>

        {/* 사이드바 하단 버튼 영역 */}
        <div className="border-t border-border p-4">
          <button
            className="w-full cursor-pointer rounded-xl border-none bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors duration-200 hover:opacity-90"
            onClick={quizActions.handleFinish}
          >
            {t('제출하기')}
          </button>
        </div>
      </aside>

      {/* 메인 콘텐츠 영역 */}
      <div className="flex flex-1 flex-col">
        {/* 모바일 헤더 */}
        <header className="flex items-center justify-between border-b border-border px-5 py-3 lg:hidden">
          <button
            className="cursor-pointer border-none bg-transparent text-lg text-muted-foreground transition-colors duration-200 hover:text-foreground"
            onClick={() => navigate('/')}
          >
            ✕
          </button>
          <span className="font-mono text-sm text-muted-foreground">{quiz.currentTime}</span>
          <button
            className="cursor-pointer rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors duration-200 hover:bg-muted"
            onClick={quizActions.handleFinish}
          >
            {t('제출하기')}
          </button>
        </header>

        {/* 문제 풀기 패널 */}
        <main className="flex flex-1 flex-col p-8 max-md:p-5">
          {quiz.isLoading ? (
            <div className="flex flex-1 flex-col items-center justify-center">
              <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
              <p className="text-sm text-muted-foreground">{t('문제 로딩 중…')}</p>
            </div>
          ) : (
            <div className="mx-auto flex w-full max-w-[680px] flex-col gap-5">
              {/* 문제 번호 배지 + 검토 체크박스 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="rounded-xl bg-primary px-3 py-1 text-sm font-bold text-primary-foreground">
                    {quiz.currentQuestion}
                  </span>
                  <span className="text-sm text-muted-foreground">/ {quiz.totalQuestions}</span>
                </div>
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

              {/* 문제 내용 */}
              <div className="rounded-2xl border border-border bg-card p-6">
                <p className="m-0 break-words text-base leading-relaxed text-foreground">
                  <MarkdownText>{quiz.currentQuiz.title}</MarkdownText>
                </p>
              </div>

              {/* 선택지 — 세로 스택 */}
              <div className="flex flex-col gap-2.5">
                {quiz.currentQuiz.selections.map((opt, idx) => (
                  <div
                    key={opt.id}
                    className={cn(
                      'group flex cursor-pointer items-center gap-4 rounded-2xl border border-border bg-background px-5 py-4 transition-all duration-200',
                      'hover:border-primary/40 hover:shadow-sm',
                      quiz.selectedOption === opt.id &&
                        'border-primary bg-primary/5 shadow-[0_0_0_2px_var(--primary)]',
                    )}
                    onClick={() => quizActions.handleOptionSelect(opt.id)}
                  >
                    {/* 라디오 버튼 스타일 인디케이터 */}
                    <span
                      className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-muted-foreground/40 transition-colors duration-200',
                        quiz.selectedOption === opt.id && 'border-primary',
                      )}
                    >
                      {quiz.selectedOption === opt.id && (
                        <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                      )}
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground">{idx + 1}</span>
                    <span className="flex-1 break-words text-sm leading-relaxed text-foreground">
                      <MarkdownText>{opt.content}</MarkdownText>
                    </span>
                  </div>
                ))}
              </div>

              {/* 이전/확인/다음 버튼 */}
              <div className="flex gap-3">
                <button
                  className="cursor-pointer rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-muted"
                  onClick={quizActions.handlePrev}
                >
                  ← {t('이전')}
                </button>
                <button
                  className="flex-1 cursor-pointer rounded-xl border-none bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors duration-200 hover:opacity-90"
                  onClick={quizActions.handleSubmit}
                >
                  {t('확인')}
                </button>
                <button
                  className="cursor-pointer rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-muted"
                  onClick={quizActions.handleNext}
                >
                  {t('다음')} →
                </button>
              </div>

              {/* 모바일 전용 문제 번호 그리드 */}
              <div className="hidden max-lg:block">
                <div className="flex flex-wrap gap-1.5 rounded-xl border border-border bg-muted/30 p-3">
                  {quiz.quizzes.map((q) => renderQuestionButton(q, 'mobile-'))}
                  {Array.from({ length: remainingCount }).map((_, index) =>
                    renderPendingButton(index, 'mobile-'),
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SolveQuizDesignG;
