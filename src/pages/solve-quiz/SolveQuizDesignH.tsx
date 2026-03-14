import { useTranslation } from 'i18nexus';

import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSolveQuiz } from '#features/solve-quiz';
import { isUnanswered } from '../../features/solve-quiz/lib/isUnanswered';
import { useQuizGenerationStore } from '#features/quiz-generation';
import { cn } from '@/shared/ui/lib/utils';
import MarkdownText from '@/shared/ui/components/markdown-text';

/** H안: Chat Interface — 채팅 UI 형태, 문제/선택지를 대화 버블로 표현 */
const SolveQuizDesignH: React.FC = () => {
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

  // 채팅 영역 자동 스크롤 ref
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [quiz.currentQuestion, quiz.selectedOption]);

  useEffect(() => {
    return () => {
      resetQuizGeneration();
    };
  }, [resetQuizGeneration]);

  /** 문제 번호 작은 버튼 렌더링 (헤더용) */
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
          'flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background text-xs font-medium text-muted-foreground',
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

  /** 대기 중인 문제 번호 버튼 렌더링 */
  const renderPendingButton = (index: number, keyPrefix = ''): React.ReactElement => (
    <button
      key={`${keyPrefix}pending-${index}`}
      className="flex h-7 w-7 animate-pulse items-center justify-center rounded-full border border-dashed border-border bg-muted text-xs text-muted-foreground/50"
      disabled
    >
      ·
    </button>
  );

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      {/* 제출 다이얼로그 */}
      {quiz.showSubmitDialog && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-foreground/40"
          onClick={quizActions.handleOverlayClick}
        >
          <div
            className="w-[90%] max-w-[560px] overflow-y-auto rounded-2xl bg-background shadow-card max-md:m-5 max-md:w-[95%]"
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

      {/* 채팅 앱 스타일 헤더 */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button
            className="cursor-pointer border-none bg-transparent text-lg text-muted-foreground transition-colors duration-200 hover:text-foreground"
            onClick={() => navigate('/')}
          >
            ✕
          </button>
          {/* 채팅 상대방 아바타 (AI 아이콘) */}
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            AI
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{t('퀴즈')}</p>
            <p className="text-xs text-muted-foreground">
              {quiz.currentQuestion} / {quiz.totalQuestions}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm text-muted-foreground">{quiz.currentTime}</span>
          <button
            className="cursor-pointer rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors duration-200 hover:bg-muted"
            onClick={quizActions.handleFinish}
          >
            {t('제출하기')}
          </button>
        </div>
      </header>

      {/* 문제 번호 네비게이션 바 */}
      <div className="border-b border-border bg-background px-4 py-2.5">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {quiz.quizzes.map((q) => renderQuestionButton(q))}
          {Array.from({ length: remainingCount }).map((_, index) => renderPendingButton(index))}
        </div>
      </div>

      {/* 채팅 메시지 영역 */}
      <main className="mx-auto flex w-full max-w-[760px] flex-1 flex-col px-4 py-6 max-md:px-3">
        {quiz.isLoading ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
            <p className="text-sm text-muted-foreground">{t('문제 로딩 중…')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* AI 문제 버블 — 왼쪽 정렬 */}
            <div className="flex items-start gap-3">
              {/* AI 아바타 */}
              <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                AI
              </div>
              <div className="flex max-w-[80%] flex-col gap-2">
                {/* 문제 번호 라벨 */}
                <span className="text-xs font-medium text-muted-foreground">
                  {t('문제')} {quiz.currentQuestion}
                </span>
                {/* 문제 말풍선 */}
                <div className="rounded-2xl rounded-tl-sm bg-card px-4 py-3.5 shadow-sm">
                  <p className="m-0 break-words text-sm leading-relaxed text-foreground">
                    <MarkdownText>{quiz.currentQuiz.title}</MarkdownText>
                  </p>
                </div>

                {/* 검토 체크박스 */}
                <label className="flex cursor-pointer select-none items-center gap-1.5 text-xs text-muted-foreground transition-colors duration-200 hover:text-primary">
                  <input
                    type="checkbox"
                    checked={quiz.currentQuiz.check || false}
                    onChange={quizActions.handleCheckToggle}
                    className="h-3.5 w-3.5 cursor-pointer accent-primary"
                  />
                  {t('검토')}
                </label>
              </div>
            </div>

            {/* 선택지 버블 그룹 — AI 말풍선 아래 */}
            <div className="flex items-start gap-3">
              {/* 아바타 자리 유지 */}
              <div className="w-8 shrink-0" />
              <div className="flex max-w-[80%] flex-col gap-2">
                {quiz.currentQuiz.selections.map((opt, idx) => (
                  <button
                    key={opt.id}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-3 text-left shadow-sm transition-all duration-200',
                      'hover:border-primary/30 hover:bg-primary/5',
                      quiz.selectedOption === opt.id &&
                        'border-primary bg-primary/10 shadow-[0_0_0_1.5px_var(--primary)]',
                    )}
                    onClick={() => quizActions.handleOptionSelect(opt.id)}
                  >
                    <span
                      className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border text-xs font-semibold text-muted-foreground transition-colors duration-200',
                        quiz.selectedOption === opt.id &&
                          'border-primary bg-primary text-primary-foreground',
                      )}
                    >
                      {idx + 1}
                    </span>
                    <span className="break-words text-sm leading-relaxed text-foreground">
                      <MarkdownText>{opt.content}</MarkdownText>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 사용자 답변 버블 — 오른쪽 정렬 (선택 시 표시) */}
            {quiz.selectedOption !== null && (
              <div className="flex justify-end">
                <div className="max-w-[60%] rounded-2xl rounded-tr-sm bg-primary px-4 py-3 shadow-sm">
                  <p className="m-0 break-words text-sm leading-relaxed text-primary-foreground">
                    <MarkdownText>
                      {quiz.currentQuiz.selections.find((s) => s.id === quiz.selectedOption)
                        ?.content || ''}
                    </MarkdownText>
                  </p>
                </div>
              </div>
            )}

            {/* 스크롤 앵커 */}
            <div ref={chatEndRef} />
          </div>
        )}
      </main>

      {/* 채팅 입력창 스타일 하단 액션 바 */}
      <div className="sticky bottom-0 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[760px] items-center gap-2">
          {/* 이전 버튼 */}
          <button
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors duration-200 hover:bg-muted"
            onClick={quizActions.handlePrev}
            aria-label="이전"
          >
            ←
          </button>

          {/* 확인 버튼 — 채팅 전송 버튼 스타일 */}
          <button
            className="flex-1 cursor-pointer rounded-2xl border-none bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors duration-200 hover:opacity-90"
            onClick={quizActions.handleSubmit}
          >
            {t('확인')}
          </button>

          {/* 다음 버튼 */}
          <button
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors duration-200 hover:bg-muted"
            onClick={quizActions.handleNext}
            aria-label="다음"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
};

export default SolveQuizDesignH;
