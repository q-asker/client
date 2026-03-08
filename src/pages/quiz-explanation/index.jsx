import { useTranslation } from 'i18nexus';
import React from 'react';
import { Document, Page } from 'react-pdf';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuizExplanation } from '#features/quiz-explanation';
import './index.css';

const QuizExplanation = () => {
  const { t } = useTranslation();
  const { problemSetId } = useParams();
  const navigate = useNavigate();
  const { state: locationState } = useLocation();
  const {
    quizzes: initialQuizzes = [],
    explanation: rawExplanation = [],
    uploadedUrl,
  } = locationState || {};
  const { state, actions } = useQuizExplanation({
    t,
    navigate,
    problemSetId,
    initialQuizzes,
    rawExplanation,
    uploadedUrl,
  });
  const { quiz, pdf, explanation, ui } = state;
  const { quiz: quizActions, pdf: pdfActions, common: commonActions } = actions;

  if (ui.isLoading) {
    return (
      <div className="spinner-container">
        <div className="spinner" />
        <p>{t('로딩 중…')}</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="navbar">
        <button className="close-button" onClick={() => commonActions.handleExit('/')}>
          x
        </button>
      </header>

      <main className="quiz-wrapper">
        <div className="layout-container">
          <section className="center-panel">
            <div className="counter-wrapper">
              <div className="toggle-wrapper toggle-wrapper-invisible">
                <span className="toggle-label">{t('❌ 오답만')}</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={quiz.showWrongOnly}
                    onChange={quizActions.handleWrongOnlyToggle}
                  />

                  <span className="slider round" />
                </label>
              </div>
              <span className="question-counter">
                {quiz.currentQuestion} /{' '}
                {quiz.showWrongOnly ? quiz.filteredTotalQuestions : quiz.totalQuestions}
              </span>

              <div className="toggle-wrapper">
                <span className="toggle-label">{t('❌ 오답만')}</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={quiz.showWrongOnly}
                    onChange={quizActions.handleWrongOnlyToggle}
                  />

                  <span className="slider round" />
                </label>
              </div>
            </div>
            <div className="question-area-container">
              {/* 좌측 번호 패널 */}
              <aside className="left-panel">
                {quiz.filteredQuizzes.map((q, index) => {
                  let resultClass = '';
                  if (q.userAnswer !== undefined && q.userAnswer !== null) {
                    // userAnswer가 존재하는 경우 (0 포함)
                    const correctOption = q.selections.find((opt) => opt.correct === true);

                    if (correctOption) {
                      // 데이터 타입 불일치 방지를 위해 숫자로 변환하여 비교
                      if (Number(q.userAnswer) === Number(correctOption.id)) {
                        resultClass = ' correct';
                      } else {
                        resultClass = ' incorrect';
                      }
                    }
                  }

                  return (
                    <button
                      key={q.number}
                      className={`skipped-button${resultClass}${
                        quiz.showWrongOnly
                          ? index + 1 === quiz.currentQuestion
                            ? ' current'
                            : ''
                          : q.number === quiz.currentQuestion
                            ? ' current'
                            : ''
                      }`}
                      onClick={() =>
                        quiz.showWrongOnly
                          ? quizActions.handleQuestionClick(index + 1)
                          : quizActions.handleQuestionClick(q.number)
                      }
                    >
                      {q.number}
                    </button>
                  );
                })}
              </aside>
              <div
                className={`question-area${
                  quiz.currentQuiz.userAnswer === undefined || quiz.currentQuiz.userAnswer === null
                    ? ' unanswered'
                    : ''
                }`}
              >
                <p className="question-text">{quiz.currentQuiz.title}</p>
              </div>

              <div className="options-container">
                {quiz.currentQuiz.selections.map((opt, idx) => {
                  const hasUserAnswer =
                    quiz.currentQuiz.userAnswer !== undefined &&
                    quiz.currentQuiz.userAnswer !== null;
                  const isCorrectOption = opt.correct === true;
                  const isWrongSelected =
                    hasUserAnswer &&
                    Number(quiz.currentQuiz.userAnswer) === Number(opt.id) &&
                    !opt.correct;
                  const borderClass = isCorrectOption
                    ? 'correct-option'
                    : isWrongSelected
                      ? 'wrong-option'
                      : '';
                  return (
                    <div key={opt.id} className={`option ${borderClass}`}>
                      <span className="option-icon">{idx + 1}</span>
                      <span className="option-text">{opt.content}</span>
                    </div>
                  );
                })}
              </div>

              <nav className="question-nav">
                <button
                  className="nav-button disabled"
                  onClick={quizActions.handlePrev}
                  disabled={quiz.currentQuestion === 1}
                >
                  {t('이전')}
                </button>

                <button
                  className="nav-button"
                  onClick={quizActions.handleNext}
                  disabled={
                    quiz.currentQuestion ===
                    (quiz.showWrongOnly ? quiz.filteredTotalQuestions : quiz.totalQuestions)
                  }
                >
                  {t('다음')}
                </button>
              </nav>
              <button className="go-home-button" onClick={() => commonActions.handleExit('/')}>
                {t('홈으로')}
              </button>
            </div>

            <div className="explanation-box">
              <div className="explanation-header">
                <h3 className="explanation-title">{t('해설')}</h3>
              </div>
              <p className="explanation-text">{explanation.thisExplanationText}</p>

              <div className="all-referenced-pages">
                <h4 className="all-pages-title">{t('📚 참조 페이지')}</h4>
                <div className="pages-list">
                  {explanation.thisExplanationObj?.referencedPages?.map((page, index) => (
                    <span
                      key={index}
                      className={`page-number ${pdf.currentPdfPage === index ? 'active' : ''}`}
                      onClick={() => pdfActions.setCurrentPdfPage(index)}
                    >
                      {page}
                    </span>
                  ))}
                </div>
              </div>

              {/**추가 사항 */}
              <div className="pdf-slide-box">
                <div className="slide-header">
                  <h4 className="slide-title">{t('📄 관련 슬라이드')}</h4>

                  {/* CSS 기반 스위치 */}
                  <label className="switch switch-with-margin">
                    <input
                      type="checkbox"
                      checked={pdf.showPdf}
                      onChange={pdfActions.handlePdfToggle}
                    />

                    <span className="slider round" />
                  </label>
                </div>
              </div>
              {pdf.showPdf && (
                <div className="pdf-slide-box" ref={pdf.pdfContainerRef}>
                  <div className="pdf-navigation">
                    <button
                      className="pdf-nav-button"
                      onClick={pdfActions.handlePrevPdfPage}
                      disabled={pdf.currentPdfPage === 0}
                    >
                      ←
                    </button>
                    <span className="pdf-page-counter">
                      {t('슬라이드의')}

                      {' ' +
                        explanation.thisExplanationObj?.referencedPages?.[pdf.currentPdfPage] +
                        ' '}
                      {t('페이지')}
                    </span>
                    <button
                      className="pdf-nav-button"
                      onClick={pdfActions.handleNextPdfPage}
                      disabled={
                        pdf.currentPdfPage ===
                        (explanation.thisExplanationObj?.referencedPages?.length || 1) - 1
                      }
                    >
                      →
                    </button>
                  </div>
                  {!uploadedUrl ? (
                    <p>{t('파일 링크가 만료되었습니다.')}</p>
                  ) : uploadedUrl.toLowerCase().endsWith('.pdf') ? (
                    <Document
                      file={uploadedUrl}
                      loading={<p>{t('PDF 로딩 중...')}</p>}
                      onLoadError={(err) => <p>{t('파일이 존재하지 않습니다.')}</p>}
                      options={pdf.pdfOptions}
                    >
                      <Page
                        pageNumber={
                          explanation.thisExplanationObj?.referencedPages?.[pdf.currentPdfPage] || 1
                        }
                        width={pdf.pdfWidth}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                      />
                    </Document>
                  ) : (
                    <p>{t('현재는 pdf 파일만 지원합니다.')}</p>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default QuizExplanation;
