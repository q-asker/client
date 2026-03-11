import { useTranslation } from 'i18nexus';
import React from 'react';
import { Document, Page } from 'react-pdf';
import type { DocumentProps } from 'react-pdf';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuizExplanation } from '#features/quiz-explanation';
import { cn } from '@/shared/ui/lib/utils';
import type { Quiz } from '#features/quiz-generation';

/** location.state 타입 */
interface LocationState {
  quizzes?: Quiz[];
  explanation?: {
    results?: Array<{ number: number; explanation: string; referencedPages?: number[] }>;
  };
  uploadedUrl?: string;
}

const QuizExplanation: React.FC = () => {
  const { t } = useTranslation();
  const { problemSetId } = useParams<{ problemSetId: string }>();
  const navigate = useNavigate();
  const { state: locationState } = useLocation();
  const {
    quizzes: initialQuizzes = [],
    explanation: rawExplanation = [],
    uploadedUrl,
  } = (locationState as LocationState) || {};
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
      <div className="flex flex-col items-center p-8">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-black/10 border-t-indigo-500" />
        <p>{t('로딩 중…')}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f7fa]">
      {/* 네비게이션 바 */}
      <header className="flex items-center justify-between bg-[#6a33f8] p-4 text-white">
        <button
          className="cursor-pointer border-none bg-transparent text-xl text-inherit"
          onClick={() => commonActions.handleExit('/')}
        >
          x
        </button>
      </header>

      <main className="flex items-start justify-center">
        <div className="relative flex w-full max-w-[1500px] max-md:flex-col">
          <section className="mx-auto flex w-[90%] max-w-[900px] flex-col gap-4 pb-6 pt-4 max-md:w-full max-md:p-4">
            {/* 카운터 + 오답만 토글 */}
            <div className="relative flex w-full items-center justify-between">
              {/* 보이지 않는 왼쪽 토글 (레이아웃 균형용) */}
              <div className="invisible flex items-center">
                <span className="mr-2 text-sm">{t('❌ 오답만')}</span>
                <label className="relative inline-block h-7 w-[50px] align-middle">
                  <input
                    type="checkbox"
                    checked={quiz.showWrongOnly}
                    onChange={quizActions.handleWrongOnlyToggle}
                    className="h-0 w-0 opacity-0"
                  />
                  <span
                    className={cn(
                      'absolute inset-0 cursor-pointer rounded-[14px] transition-colors duration-300',
                      'before:absolute before:bottom-[3px] before:left-[3px] before:h-[22px] before:w-[22px] before:rounded-full before:bg-white before:transition-transform before:duration-300',
                      quiz.showWrongOnly ? 'bg-[#4cd964] before:translate-x-[22px]' : 'bg-gray-300',
                    )}
                  />
                </label>
              </div>

              <span className="inline-block text-base font-bold">
                {quiz.currentQuestion} /{' '}
                {quiz.showWrongOnly ? quiz.filteredTotalQuestions : quiz.totalQuestions}
              </span>

              {/* 실제 오답만 토글 */}
              <div className="flex items-center">
                <span className="mr-2 text-sm">{t('❌ 오답만')}</span>
                <label className="relative inline-block h-7 w-[50px] align-middle">
                  <input
                    type="checkbox"
                    checked={quiz.showWrongOnly}
                    onChange={quizActions.handleWrongOnlyToggle}
                    className="h-0 w-0 opacity-0"
                  />
                  <span
                    className={cn(
                      'absolute inset-0 cursor-pointer rounded-[14px] transition-colors duration-300',
                      'before:absolute before:bottom-[3px] before:left-[3px] before:h-[22px] before:w-[22px] before:rounded-full before:bg-white before:transition-transform before:duration-300',
                      quiz.showWrongOnly ? 'bg-[#4cd964] before:translate-x-[22px]' : 'bg-gray-300',
                    )}
                  />
                </label>
              </div>
            </div>

            {/* 문제 영역 컨테이너 */}
            <div className="flex flex-col gap-4">
              {/* 좌측 번호 패널 (데스크톱) */}
              <aside className="absolute grid -translate-x-[120%] grid-cols-[repeat(5,minmax(2rem,1fr))] gap-2 rounded-lg bg-white p-4 shadow-md max-[1500px]:hidden">
                {quiz.filteredQuizzes.map((q, index) => {
                  const correctOption = q.selections.find(
                    (opt) => (opt as unknown as { correct: boolean }).correct === true,
                  );
                  const isCorrect =
                    q.userAnswer !== undefined &&
                    q.userAnswer !== null &&
                    correctOption &&
                    Number(q.userAnswer) === Number(correctOption.id);
                  const isIncorrect =
                    q.userAnswer !== undefined &&
                    q.userAnswer !== null &&
                    correctOption &&
                    Number(q.userAnswer) !== Number(correctOption.id);

                  const isCurrent = quiz.showWrongOnly
                    ? index + 1 === quiz.currentQuestion
                    : q.number === quiz.currentQuestion;

                  return (
                    <button
                      key={q.number}
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded border border-gray-300 bg-white',
                        'cursor-pointer transition-all duration-200',
                        'hover:scale-110 hover:bg-gray-200',
                        isCorrect && 'border-[#77ff77] bg-[#ddffdd]',
                        isIncorrect && 'border-[#ff7777] bg-[#ffdddd]',
                        isCurrent && 'bg-[#6a33f8] text-white hover:scale-100 hover:bg-[#6a33f8]',
                      )}
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

              {/* 질문 영역 */}
              <div
                className={cn(
                  'flex rounded-lg bg-[#e6ebf1] p-4 max-md:flex-col max-md:gap-2 max-md:p-3',
                  (quiz.currentQuiz.userAnswer === undefined ||
                    quiz.currentQuiz.userAnswer === null) &&
                    'rounded-lg border-2 border-red-500',
                )}
              >
                <p className="m-0 whitespace-pre-wrap break-words text-base">
                  {quiz.currentQuiz.title}
                </p>
              </div>

              {/* 선택지 리스트 */}
              <div className="flex flex-col gap-3 max-md:mt-2 max-md:gap-2">
                {quiz.currentQuiz.selections.map((opt, idx) => {
                  const hasUserAnswer =
                    quiz.currentQuiz.userAnswer !== undefined &&
                    quiz.currentQuiz.userAnswer !== null;
                  const isCorrectOption = (opt as unknown as { correct: boolean }).correct === true;
                  const isWrongSelected =
                    hasUserAnswer &&
                    Number(quiz.currentQuiz.userAnswer) === Number(opt.id) &&
                    !(opt as unknown as { correct: boolean }).correct;

                  return (
                    <div
                      key={opt.id}
                      className={cn(
                        'flex min-h-14 items-center rounded-lg bg-white px-3 py-5',
                        'max-md:min-h-12 max-md:px-2 max-md:py-4',
                        isCorrectOption
                          ? 'border-2 border-green-600'
                          : isWrongSelected
                            ? 'border-2 border-red-500'
                            : 'border border-gray-300',
                      )}
                    >
                      <span className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f0f3f5] max-md:mr-2 max-md:h-6 max-md:w-6">
                        {idx + 1}
                      </span>
                      <span className="whitespace-pre-wrap break-words pr-3 text-base leading-[1.8] max-md:pr-2 max-md:text-sm max-md:leading-relaxed">
                        {opt.content}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* 이전/다음 네비게이션 */}
              <nav className="mb-4 mt-4 flex justify-between gap-4 max-md:mb-4 max-md:gap-2">
                <button
                  className="flex-1 cursor-pointer rounded border-none bg-[#6a33f8] px-3 py-2 text-sm text-white hover:bg-violet-500 disabled:cursor-default disabled:bg-gray-400"
                  onClick={quizActions.handlePrev}
                  disabled={quiz.currentQuestion === 1}
                >
                  {t('이전')}
                </button>
                <button
                  className="flex-1 cursor-pointer rounded border-none bg-[#6a33f8] px-3 py-2 text-sm text-white hover:bg-violet-500 disabled:cursor-default disabled:bg-gray-400"
                  onClick={quizActions.handleNext}
                  disabled={
                    quiz.currentQuestion ===
                    (quiz.showWrongOnly ? quiz.filteredTotalQuestions : quiz.totalQuestions)
                  }
                >
                  {t('다음')}
                </button>
              </nav>

              {/* 홈으로 버튼 */}
              <button
                className="w-full cursor-pointer rounded-lg border-none bg-[#6a33f8] p-3 text-base text-white transition-all duration-200 hover:bg-violet-500 max-md:mt-4"
                onClick={() => commonActions.handleExit('/')}
              >
                {t('홈으로')}
              </button>
            </div>

            {/* 해설 박스 */}
            <div className="mt-6 rounded-lg bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.05)] max-md:mt-3 max-md:p-3">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="m-0 text-xl text-gray-800">{t('해설')}</h3>
              </div>
              <p className="whitespace-pre-wrap break-words text-base leading-[1.8] text-gray-800">
                {explanation.thisExplanationText}
              </p>

              {/* 참조 페이지 */}
              <div className="my-4 rounded-lg bg-gray-50 p-4">
                <h4 className="mb-2 text-base text-gray-800">{t('📚 참조 페이지')}</h4>
                <div className="flex flex-wrap gap-2">
                  {explanation.thisExplanationObj?.referencedPages?.map(
                    (page: number, index: number) => (
                      <span
                        key={index}
                        className={cn(
                          'cursor-pointer rounded px-3 py-1 transition-all duration-200',
                          pdf.currentPdfPage === index
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 hover:bg-gray-300',
                        )}
                        onClick={() => pdfActions.setCurrentPdfPage(index)}
                      >
                        {page}
                      </span>
                    ),
                  )}
                </div>
              </div>

              {/* PDF 슬라이드 토글 */}
              <div className="mt-4 w-full overflow-x-auto overflow-y-hidden max-md:mt-3">
                <div className="mt-4 flex items-center max-md:mt-3">
                  <h4 className="m-0 text-base font-bold">{t('📄 관련 슬라이드')}</h4>
                  <label className="relative ml-3 inline-block h-7 w-[50px] align-middle">
                    <input
                      type="checkbox"
                      checked={pdf.showPdf}
                      onChange={pdfActions.handlePdfToggle}
                      className="h-0 w-0 opacity-0"
                    />
                    <span
                      className={cn(
                        'absolute inset-0 cursor-pointer rounded-[14px] transition-colors duration-300',
                        'before:absolute before:bottom-[3px] before:left-[3px] before:h-[22px] before:w-[22px] before:rounded-full before:bg-white before:transition-transform before:duration-300',
                        pdf.showPdf ? 'bg-[#4cd964] before:translate-x-[22px]' : 'bg-gray-300',
                      )}
                    />
                  </label>
                </div>
              </div>

              {/* PDF 뷰어 */}
              {pdf.showPdf && (
                <div
                  className="mt-4 w-full overflow-x-auto overflow-y-hidden max-md:mt-3"
                  ref={pdf.pdfContainerRef}
                >
                  {/* PDF 네비게이션 */}
                  <div className="mb-4 flex items-center justify-center gap-4">
                    <button
                      className="flex h-10 w-10 items-center justify-center rounded-full border-none bg-gray-100 text-2xl transition-colors duration-200 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={pdfActions.handlePrevPdfPage}
                      disabled={pdf.currentPdfPage === 0}
                    >
                      &larr;
                    </button>
                    <span className="text-sm text-gray-500">
                      {t('슬라이드의')}
                      {' ' +
                        explanation.thisExplanationObj?.referencedPages?.[pdf.currentPdfPage] +
                        ' '}
                      {t('페이지')}
                    </span>
                    <button
                      className="flex h-10 w-10 items-center justify-center rounded-full border-none bg-gray-100 text-2xl transition-colors duration-200 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={pdfActions.handleNextPdfPage}
                      disabled={
                        pdf.currentPdfPage ===
                        (explanation.thisExplanationObj?.referencedPages?.length || 1) - 1
                      }
                    >
                      &rarr;
                    </button>
                  </div>

                  {/* PDF 콘텐츠 */}
                  {!uploadedUrl ? (
                    <p>{t('파일 링크가 만료되었습니다.')}</p>
                  ) : uploadedUrl.toLowerCase().endsWith('.pdf') ? (
                    <Document
                      file={uploadedUrl}
                      loading={<p>{t('PDF 로딩 중...')}</p>}
                      onLoadError={
                        ((err: Error) => (
                          <p>{t('파일이 존재하지 않습니다.')}</p>
                        )) as DocumentProps['onLoadError']
                      }
                      options={pdf.pdfOptions}
                      className="flex min-h-[500px] justify-center [&_.react-pdf\_\_Page]:h-auto [&_.react-pdf\_\_Page]:max-w-full [&_.react-pdf\_\_Page\_\_canvas]:!h-auto [&_.react-pdf\_\_Page\_\_canvas]:max-w-full"
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
