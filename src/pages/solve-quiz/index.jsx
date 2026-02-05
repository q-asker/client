import { useTranslation } from 'i18nexus'; // SolveQuiz.jsx

import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSolveQuiz } from '#features/solve-quiz';
import { useQuizGenerationStore } from '#features/quiz-generation';
import './index.css';

const SolveQuiz = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { problemSetId } = useParams();
  const { uploadedUrl } = location.state || {};
  const storeProblemSetId = useQuizGenerationStore((state) => state.problemSetId);
  const streamQuizzes = useQuizGenerationStore((state) => state.quizzes);
  const streamIsStreaming = useQuizGenerationStore((state) => state.isStreaming);
  const streamTotalCount = useQuizGenerationStore((state) => state.totalCount);

  const quizzes = storeProblemSetId === problemSetId ? streamQuizzes : [];
  const isStreaming = storeProblemSetId === problemSetId ? streamIsStreaming : false;
  const totalCount = storeProblemSetId === problemSetId ? streamTotalCount : 0;

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

  return (
    <div className="solve-app-container">
      {/* 제출 다이얼로그 */}
      {quiz.showSubmitDialog && (
        <div className="submit-dialog-overlay" onClick={quizActions.handleOverlayClick}>
          <div className="submit-dialog">
            <div className="submit-dialog-header">
              <h2>{t('제출 확인')}</h2>
              <button className="submit-dialog-close" onClick={quizActions.handleCancelSubmit}>
                ×
              </button>
            </div>

            <div className="submit-dialog-content">
              {/* 상단 통계 정보 */}
              <div className="submit-stats">
                <div className="stat-item">
                  <span className="stat-label">{t('전체 문제:')}</span>
                  <span className="stat-value">
                    {quiz.quizzes.length}
                    {t('개')}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">{t('답변한 문제:')}</span>
                  <span className="stat-value answered">
                    {quiz.answeredCount}
                    {t('개')}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">{t('안푼 문제:')}</span>
                  <span className="stat-value unanswered">
                    {quiz.unansweredCount}
                    {t('개')}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">{t('검토할 문제:')}</span>
                  <span className="stat-value review">
                    {quiz.reviewCount}
                    {t('개')}
                  </span>
                </div>
              </div>

              {/* 하단 문제별 선택 답안 */}
              <div className="submit-answers">
                <h3>{t('선택한 답안')}</h3>
                <div className="answers-list">
                  {quiz.quizzes.map((quizItem) => {
                    const selectedAnswer =
                      quizItem.userAnswer === 0
                        ? t('미선택')
                        : quizItem.selections?.find((sel) => sel.id === quizItem.userAnswer)
                            ?.content || `${quizItem.userAnswer}번`;

                    return (
                      <div key={quizItem.number} className="answer-item">
                        <span className="answer-number">
                          {quizItem.number}
                          {t('번:')}
                        </span>
                        <span
                          className={`answer-text ${
                            quizItem.userAnswer === 0 ? 'unanswered' : ''
                          } ${quizItem.check ? 'review' : ''}`}
                        >
                          {selectedAnswer}
                          {quizItem.check && <span className="review-badge">{t('검토')}</span>}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="submit-dialog-buttons">
              <button className="submit-button cancel" onClick={quizActions.handleCancelSubmit}>
                {t('취소')}
              </button>
              <button className="submit-button confirm" onClick={quizActions.handleConfirmSubmit}>
                {t('제출하기')}
              </button>
            </div>
          </div>
        </div>
      )}
      <header className="solve-navbar">
        {/* 헤더는 항상 보여주고 */}
        <button className="solve-close-button" onClick={() => navigate('/')}>
          x
        </button>
        <div className="solve-time-display">{quiz.currentTime}</div>
      </header>
      <main className="solve-quiz-wrapper">
        {/* 가운데 패널 */}
        <section className="solve-center-panel">
          <nav className="solve-question-nav">
            <button className="solve-nav-button" onClick={quizActions.handlePrev}>
              {t('이전')}
            </button>
            <span>
              {quiz.currentQuestion} / {quiz.totalQuestions}
            </span>
            <button className="solve-nav-button" onClick={quizActions.handleNext}>
              {t('다음')}
            </button>
          </nav>
          {/* ─── 여기부터 문제 영역 ─── */}
          {quiz.isLoading ? (
            <div className="solve-spinner-container">
              <div className="solve-spinner" />
              <p>{t('문제 로딩 중…')}</p>
            </div>
          ) : (
            <div className="solve-question-and-review-container">
              <aside className="solve-left-panel">
                {quiz.quizzes.map((q) => (
                  <button
                    key={q.number}
                    className={`solve-skipped-button${
                      q.userAnswer !== 0 ? ' solve-answered' : ''
                    }${q.check ? ' solve-checked' : ''}${
                      q.number === quiz.currentQuestion ? ' solve-current' : ''
                    }`}
                    onClick={() => quizActions.handleJumpTo(q.number)}
                  >
                    {q.number}
                  </button>
                ))}
                {Array.from({ length: remainingCount }).map((_, index) => (
                  <button
                    key={`pending-${index}`}
                    className="solve-skipped-button solve-pending"
                    disabled
                  >
                    …
                  </button>
                ))}
              </aside>
              <div className="solve-question-and-review-wrapper">
                <div className="solve-question-area">
                  <p className="solve-question-text">{quiz.currentQuiz.title}</p>
                </div>
                <div className="solve-review-area">
                  <label>
                    <input
                      type="checkbox"
                      checked={quiz.currentQuiz.check || false}
                      onChange={quizActions.handleCheckToggle}
                    />{' '}
                    {t('검토')}
                  </label>
                </div>
              </div>
              <div className="solve-options-container">
                {quiz.currentQuiz.selections.map((opt, idx) => (
                  <div
                    key={opt.id}
                    className={`solve-option${
                      quiz.selectedOption === opt.id ? ' solve-selected' : ''
                    }`}
                    onClick={() => quizActions.handleOptionSelect(opt.id)}
                  >
                    <span className="solve-option-icon">{idx + 1}</span>
                    <span className="solve-option-text">{opt.content}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* ─── 여기까지 문제 영역 ─── */}
          <button className="solve-submit-button" onClick={quizActions.handleSubmit}>
            {t('확인')}
          </button>
          <button
            className="solve-submit-button solve-submit-all-button"
            onClick={quizActions.handleFinish}
          >
            {t('제출하기')}
          </button>
        </section>
        <aside className="solve-bottom-panel">
          {quiz.quizzes.map((q) => (
            <button
              key={q.number}
              className={`solve-skipped-button${
                q.userAnswer !== 0 ? ' solve-answered' : ''
              }${q.check ? ' solve-checked' : ''}${
                q.number === quiz.currentQuestion ? ' solve-current' : ''
              }`}
              onClick={() => quizActions.handleJumpTo(q.number)}
            >
              {q.number}
            </button>
          ))}
          {Array.from({ length: remainingCount }).map((_, index) => (
            <button
              key={`pending-bottom-${index}`}
              className="solve-skipped-button solve-pending"
              disabled
            >
              …
            </button>
          ))}
        </aside>
      </main>
    </div>
  );
};

export default SolveQuiz;
