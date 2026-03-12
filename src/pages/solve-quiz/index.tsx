import { useTranslation } from 'i18nexus';

import React, { useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSolveQuiz } from '#features/solve-quiz';
import { isUnanswered } from '../../features/solve-quiz/lib/isUnanswered';
import { useQuizGenerationStore } from '#features/quiz-generation';
import { cn } from '@/shared/ui/lib/utils';

const SolveQuiz: React.FC = () => {
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
          'flex h-8 w-8 items-center justify-center rounded border border-border bg-card',
          'cursor-pointer transition-all duration-200',
          'hover:scale-110 hover:bg-muted',
          !unanswered && 'bg-muted',
          q.check && 'bg-amber-200',
          q.number === quiz.currentQuestion &&
            'bg-primary font-bold text-primary-foreground hover:scale-100 hover:bg-primary',
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
      className="flex h-8 w-8 animate-pulse items-center justify-center rounded border border-dashed border-gray-300 bg-indigo-50 text-indigo-600"
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
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50"
          onClick={quizActions.handleOverlayClick}
        >
          <div
            className="w-[90%] max-w-[600px] animate-[slideIn_0.3s_ease-out] overflow-y-auto rounded-xl bg-white shadow-[0_10px_25px_rgba(0,0,0,0.15)] max-md:m-5 max-md:w-[95%]"
            style={{ maxHeight: '80vh' }}
          >
            {/* 다이얼로그 헤더 */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
              <h2 className="m-0 text-xl font-semibold text-gray-800">{t('제출 확인')}</h2>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-md border-none bg-transparent text-2xl text-gray-500 hover:bg-gray-100"
                onClick={quizActions.handleCancelSubmit}
              >
                x
              </button>
            </div>

            {/* 다이얼로그 콘텐츠 */}
            <div className="p-6">
              {/* 상단 통계 정보 */}
              <div className="mb-8 grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-5 max-md:grid-cols-1 max-md:gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700">{t('전체 문제:')}</span>
                  <span className="rounded px-2 py-1 text-sm font-semibold">
                    {quiz.quizzes.length}
                    {t('개')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700">{t('답변한 문제:')}</span>
                  <span className="rounded bg-emerald-100 px-2 py-1 text-sm font-semibold text-emerald-600">
                    {quiz.answeredCount}
                    {t('개')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700">{t('안푼 문제:')}</span>
                  <span className="rounded bg-red-100 px-2 py-1 text-sm font-semibold text-red-600">
                    {quiz.unansweredCount}
                    {t('개')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700">{t('검토할 문제:')}</span>
                  <span className="rounded bg-amber-100 px-2 py-1 text-sm font-semibold text-amber-600">
                    {quiz.reviewCount}
                    {t('개')}
                  </span>
                </div>
              </div>

              {/* 하단 문제별 선택 답안 */}
              <div>
                <h3 className="mb-4 text-lg font-semibold text-gray-800">{t('선택한 답안')}</h3>
                <div className="max-h-[300px] overflow-y-auto rounded-lg border border-gray-200 p-3">
                  {quiz.quizzes.map((quizItem) => {
                    const unanswered = isUnanswered(quizItem.userAnswer, quizItem.selections);
                    const selectedAnswer = unanswered
                      ? t('미선택')
                      : quizItem.selections?.find((sel) => sel.id === quizItem.userAnswer)
                          ?.content || `${quizItem.userAnswer}번`;

                    return (
                      <div
                        key={quizItem.number}
                        className="flex items-center border-b border-gray-100 py-2 last:border-b-0"
                      >
                        <span className="min-w-[50px] font-semibold text-gray-700">
                          {quizItem.number}
                          {t('번:')}
                        </span>
                        <span
                          className={cn(
                            'ml-3 flex items-center gap-2 whitespace-pre-wrap break-words',
                            unanswered && 'italic text-red-600',
                            quizItem.check && 'text-amber-600',
                          )}
                        >
                          {selectedAnswer}
                          {quizItem.check && (
                            <span className="rounded bg-amber-400 px-1.5 py-0.5 text-xs font-medium text-white">
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
            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-5 max-md:flex-col">
              <button
                className="cursor-pointer rounded-md border-none bg-gray-100 px-6 py-2.5 font-medium text-gray-700 transition-all duration-200 hover:bg-gray-200 max-md:w-full"
                onClick={quizActions.handleCancelSubmit}
              >
                {t('취소')}
              </button>
              <button
                className="cursor-pointer rounded-md border-none bg-blue-500 px-6 py-2.5 font-medium text-white transition-all duration-200 hover:bg-blue-600 max-md:w-full"
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
      <main className="mx-auto flex w-[90%] max-w-[900px] flex-col pb-6 pt-6">
        {/* 중앙 패널 */}
        <section className="flex max-w-[900px] flex-col gap-4">
          {/* 질문 네비게이션 */}
          <nav className="flex items-center justify-between max-md:mb-4 max-md:gap-2">
            <button
              className="cursor-pointer rounded-lg border-none bg-primary px-4 py-2 text-primary-foreground max-md:flex-1 max-md:text-sm"
              onClick={quizActions.handlePrev}
            >
              {t('이전')}
            </button>
            <span className="max-md:flex-1 max-md:text-center max-md:text-sm">
              {quiz.currentQuestion} / {quiz.totalQuestions}
            </span>
            <button
              className="cursor-pointer rounded-lg border-none bg-primary px-4 py-2 text-primary-foreground max-md:flex-1 max-md:text-sm"
              onClick={quizActions.handleNext}
            >
              {t('다음')}
            </button>
          </nav>

          {/* 문제 영역 */}
          {quiz.isLoading ? (
            <div className="flex h-screen flex-col items-center justify-center">
              <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-black/10 border-t-indigo-500" />
              <p>{t('문제 로딩 중…')}</p>
            </div>
          ) : (
            <>
              <div className="relative flex">
                {/* 좌측 문제 번호 패널 (데스크톱) */}
                <aside className="absolute grid -translate-x-[120%] grid-cols-[repeat(5,minmax(2rem,1fr))] gap-2 rounded-lg bg-card p-4 shadow-md max-[1500px]:hidden">
                  {quiz.quizzes.map((q) => renderQuestionButton(q))}
                  {Array.from({ length: remainingCount }).map((_, index) =>
                    renderPendingButton(index),
                  )}
                </aside>

                {/* 질문 + 검토 영역 */}
                <div className="flex w-full items-center rounded-lg bg-muted p-4 max-md:flex-col max-md:items-start max-md:gap-3">
                  <div className="flex-1 pr-3 max-md:w-full max-md:pr-0">
                    <p className="m-0 whitespace-pre-wrap break-words text-base leading-relaxed">
                      {quiz.currentQuiz.title}
                    </p>
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
              </div>

              {/* 선택지 리스트 */}
              <div className="flex flex-col gap-3 max-md:mt-2 max-md:gap-2">
                {quiz.currentQuiz.selections.map((opt, idx) => (
                  <div
                    key={opt.id}
                    className={cn(
                      'flex min-h-14 cursor-pointer items-center rounded-lg border border-border bg-card px-3 py-5 transition-colors duration-200',
                      'hover:bg-muted',
                      'max-md:min-h-12 max-md:px-2 max-md:py-4',
                      quiz.selectedOption === opt.id && 'border-primary bg-muted',
                    )}
                    onClick={() => quizActions.handleOptionSelect(opt.id)}
                  >
                    <span className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted max-md:mr-2 max-md:h-6 max-md:w-6">
                      {idx + 1}
                    </span>
                    <span className="whitespace-pre-wrap break-words pr-3 text-base leading-[1.8] max-md:pr-2 max-md:text-sm max-md:leading-relaxed">
                      {opt.content}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* 확인 버튼 */}
          <button
            className="mt-auto cursor-pointer rounded-lg border-none bg-primary p-3 text-base text-primary-foreground max-md:mt-4 max-md:w-full"
            onClick={quizActions.handleSubmit}
          >
            {t('확인')}
          </button>

          {/* 제출하기 버튼 */}
          <button
            className="mt-8 w-[100px] cursor-pointer self-end rounded-lg border-none bg-primary p-3 text-base text-primary-foreground max-md:mt-4 max-md:w-full max-md:self-stretch"
            onClick={quizActions.handleFinish}
          >
            {t('제출하기')}
          </button>
        </section>

        {/* 하단 문제 번호 패널 (모바일/태블릿) */}
        <aside className="mt-4 hidden grid-cols-[repeat(auto-fill,2rem)] justify-center gap-2 rounded-lg bg-card p-4 shadow-md max-[1500px]:grid">
          {quiz.quizzes.map((q) => renderQuestionButton(q, 'bottom-'))}
          {Array.from({ length: remainingCount }).map((_, index) =>
            renderPendingButton(index, 'bottom-'),
          )}
        </aside>
      </main>
    </div>
  );
};

export default SolveQuiz;
