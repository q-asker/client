import { useTranslation } from 'i18nexus';
import React from 'react';
import { Document, Page } from 'react-pdf';
import type { DocumentProps } from 'react-pdf';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuizExplanation } from '#features/quiz-explanation';
import { cn } from '@/shared/ui/lib/utils';
import MarkdownText from '@/shared/ui/components/markdown-text';
import type { Quiz } from '#features/quiz-generation';
import { MOCK_QUIZZES, MOCK_EXPLANATION, MOCK_UPLOADED_URL } from './mockExplanationData';

/** location.state 타입 */
interface LocationState {
  quizzes?: Quiz[];
  explanation?: {
    results?: Array<{ number: number; explanation: string; referencedPages?: number[] }>;
  };
  uploadedUrl?: string;
}

/** Ink & Paper — 에디토리얼 매거진 스타일 해설 뷰 */
const QuizExplanationDesignC: React.FC = () => {
  const { t } = useTranslation();
  const { problemSetId } = useParams<{ problemSetId: string }>();
  const navigate = useNavigate();
  const { state: locationState } = useLocation();
  const [searchParams] = useSearchParams();
  const isMock = searchParams.get('mock') === 'true';

  const {
    quizzes: initialQuizzes = [],
    explanation: rawExplanation = [],
    uploadedUrl,
  } = isMock
    ? {
        quizzes: MOCK_QUIZZES,
        explanation: MOCK_EXPLANATION,
        uploadedUrl: MOCK_UPLOADED_URL,
      }
    : (locationState as LocationState) || {};

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

  /* 로딩 상태 */
  if (ui.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-foreground" />
          <p className="text-sm tracking-tight text-muted-foreground">{t('로딩 중…')}</p>
        </div>
      </div>
    );
  }

  /* 현재 문제의 정답 여부 판별 */
  const currentCorrectOption = quiz.currentQuiz.selections.find(
    (opt) => (opt as unknown as { correct: boolean }).correct === true,
  );
  const isCurrentCorrect =
    quiz.currentQuiz.userAnswer !== undefined &&
    quiz.currentQuiz.userAnswer !== null &&
    currentCorrectOption &&
    Number(quiz.currentQuiz.userAnswer) === Number(currentCorrectOption.id);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* 헤더 — 미니멀 에디토리얼 네비게이션 */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-5">
          <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {t('해설')}
          </span>
          <button
            className="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
            onClick={() => commonActions.handleExit('/')}
          >
            {t('닫기')} &times;
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 pb-16 pt-12 max-md:px-4 max-md:pt-8">
        {/* 카운터 + 오답만 토글 */}
        <div className="mb-10 flex items-center justify-between">
          <span className="text-sm tabular-nums text-muted-foreground">
            {quiz.currentQuestion} /{' '}
            {quiz.showWrongOnly ? quiz.filteredTotalQuestions : quiz.totalQuestions}
          </span>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <span>{t('오답만')}</span>
            <div className="relative inline-block h-5 w-9">
              <input
                type="checkbox"
                checked={quiz.showWrongOnly}
                onChange={quizActions.handleWrongOnlyToggle}
                className="peer sr-only"
              />
              <span className="absolute inset-0 rounded-full bg-muted transition-colors duration-200 peer-checked:bg-foreground" />
              <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-background transition-transform duration-200 peer-checked:translate-x-4" />
            </div>
          </label>
        </div>

        {/* 번호 패널 — 수평 번호 스트립 */}
        <div className="mb-10 flex flex-wrap gap-1.5">
          {quiz.filteredQuizzes.map((q, index) => {
            const correctOption = q.selections.find(
              (opt) => (opt as unknown as { correct: boolean }).correct === true,
            );
            const isCorrect =
              q.userAnswer !== undefined &&
              q.userAnswer !== null &&
              correctOption &&
              Number(q.userAnswer) === Number(correctOption.id);
            const isCurrent = quiz.showWrongOnly
              ? index + 1 === quiz.currentQuestion
              : q.number === quiz.currentQuestion;

            return (
              <button
                key={q.number}
                className={cn(
                  'flex h-8 w-8 items-center justify-center text-xs tabular-nums transition-colors duration-200',
                  isCurrent
                    ? 'bg-foreground text-background'
                    : isCorrect
                      ? 'text-muted-foreground hover:text-foreground'
                      : 'text-destructive hover:text-destructive/80',
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
        </div>

        {/* 문제 영역 — 워터마크 번호 + 풀쿼트 스타일 제목 */}
        <section className="relative mb-10">
          {/* 장식용 대형 번호 워터마크 */}
          <span className="pointer-events-none absolute -left-2 -top-6 select-none text-[4rem] font-black leading-none text-foreground opacity-[0.06]">
            {quiz.currentQuiz.number}
          </span>

          {/* 질문 제목 — 풀쿼트 스타일 */}
          <div className="border-l-4 border-primary py-2 pl-5">
            <p className="whitespace-pre-wrap break-words text-lg font-medium leading-relaxed tracking-tight text-foreground">
              {quiz.currentQuiz.title}
            </p>
          </div>
        </section>

        {/* 구분선 */}
        <hr className="mb-8 border-t border-border" />

        {/* 선택지 — 번호 리스트, 카드 없이 */}
        <ol className="mb-10 list-none space-y-4 pl-0">
          {quiz.currentQuiz.selections.map((opt, idx) => {
            const hasUserAnswer =
              quiz.currentQuiz.userAnswer !== undefined && quiz.currentQuiz.userAnswer !== null;
            const isCorrectOption = (opt as unknown as { correct: boolean }).correct === true;
            const isWrongSelected =
              hasUserAnswer &&
              Number(quiz.currentQuiz.userAnswer) === Number(opt.id) &&
              !(opt as unknown as { correct: boolean }).correct;

            return (
              <li key={opt.id} className="flex items-start gap-3">
                {/* 번호 */}
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center text-sm font-medium text-muted-foreground">
                  {idx + 1}.
                </span>

                {/* 내용 */}
                <span
                  className={cn(
                    'flex-1 whitespace-pre-wrap break-words leading-relaxed',
                    isCorrectOption && 'font-medium text-foreground',
                    isWrongSelected && 'text-destructive line-through decoration-destructive/40',
                    !isCorrectOption && !isWrongSelected && 'text-muted-foreground',
                  )}
                >
                  {opt.content}
                </span>

                {/* 정답/오답 아이콘 */}
                {isCorrectOption && (
                  <span className="mt-0.5 shrink-0 text-sm text-foreground" aria-label={t('정답')}>
                    &#10003;
                  </span>
                )}
                {isWrongSelected && (
                  <span className="mt-0.5 shrink-0 text-sm text-destructive" aria-label={t('오답')}>
                    &#10005;
                  </span>
                )}
              </li>
            );
          })}
        </ol>

        {/* 이전/다음 네비게이션 */}
        <nav className="mb-12 flex gap-4">
          <button
            className="flex-1 border border-border py-2.5 text-sm text-foreground transition-colors duration-200 hover:bg-muted disabled:cursor-default disabled:text-muted-foreground disabled:opacity-50"
            onClick={quizActions.handlePrev}
            disabled={quiz.currentQuestion === 1}
          >
            &larr; {t('이전')}
          </button>
          <button
            className="flex-1 border border-border py-2.5 text-sm text-foreground transition-colors duration-200 hover:bg-muted disabled:cursor-default disabled:text-muted-foreground disabled:opacity-50"
            onClick={quizActions.handleNext}
            disabled={
              quiz.currentQuestion ===
              (quiz.showWrongOnly ? quiz.filteredTotalQuestions : quiz.totalQuestions)
            }
          >
            {t('다음')} &rarr;
          </button>
        </nav>

        {/* 구분선 */}
        <hr className="mb-10 border-t border-border" />

        {/* 해설 섹션 — 블록쿼트 스타일 */}
        <section className="mb-10 rounded-sm bg-muted/30 px-6 py-8 max-md:px-4 max-md:py-6">
          <h2 className="mb-6 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {t('해설')}
          </h2>

          {/* 해설 본문 — 이탤릭 리드인 */}
          <blockquote className="border-l-2 border-muted-foreground/20 pl-4">
            <MarkdownText className="leading-relaxed text-foreground/80">
              {explanation.thisExplanationText}
            </MarkdownText>
          </blockquote>

          {/* 참조 페이지 */}
          {explanation.thisExplanationObj?.referencedPages &&
            explanation.thisExplanationObj.referencedPages.length > 0 && (
              <div className="mt-8">
                <h3 className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  {t('참조 페이지')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {explanation.thisExplanationObj.referencedPages.map(
                    (page: number, index: number) => (
                      <button
                        key={index}
                        className={cn(
                          'px-3 py-1 text-sm tabular-nums transition-colors duration-200',
                          pdf.currentPdfPage === index
                            ? 'bg-foreground text-background'
                            : 'text-muted-foreground underline decoration-muted-foreground/30 underline-offset-4 hover:text-foreground',
                        )}
                        onClick={() => pdfActions.setCurrentPdfPage(index)}
                      >
                        p.{page}
                      </button>
                    ),
                  )}
                </div>
              </div>
            )}

          {/* PDF 토글 — 텍스트 링크 스타일 */}
          <div className="mt-8">
            <button
              className="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
              onClick={pdfActions.handlePdfToggle}
            >
              {pdf.showPdf
                ? t('관련 슬라이드 닫기') + ' \u2190'
                : t('관련 슬라이드 보기') + ' \u2192'}
            </button>
          </div>

          {/* PDF 뷰어 */}
          {pdf.showPdf && (
            <div
              className="mt-6 w-full overflow-x-auto overflow-y-hidden"
              ref={pdf.pdfContainerRef}
            >
              {/* PDF 네비게이션 */}
              <div className="mb-4 flex items-center justify-center gap-6">
                <button
                  className="text-muted-foreground transition-colors duration-200 hover:text-foreground disabled:opacity-30"
                  onClick={pdfActions.handlePrevPdfPage}
                  disabled={pdf.currentPdfPage === 0}
                >
                  &larr;
                </button>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {t('슬라이드의')}
                  {' ' +
                    explanation.thisExplanationObj?.referencedPages?.[pdf.currentPdfPage] +
                    ' '}
                  {t('페이지')}
                </span>
                <button
                  className="text-muted-foreground transition-colors duration-200 hover:text-foreground disabled:opacity-30"
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
                <p className="text-center text-sm text-muted-foreground">
                  {t('파일 링크가 만료되었습니다.')}
                </p>
              ) : uploadedUrl.toLowerCase().endsWith('.pdf') ? (
                <Document
                  file={uploadedUrl}
                  loading={
                    <p className="text-center text-sm text-muted-foreground">
                      {t('PDF 로딩 중...')}
                    </p>
                  }
                  onLoadError={
                    ((err: Error) => (
                      <p className="text-center text-sm text-muted-foreground">
                        {t('파일이 존재하지 않습니다.')}
                      </p>
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
                <p className="text-center text-sm text-muted-foreground">
                  {t('현재는 pdf 파일만 지원합니다.')}
                </p>
              )}
            </div>
          )}
        </section>

        {/* 구분선 */}
        <hr className="mb-10 border-t border-border" />

        {/* 하단 버튼 영역 */}
        <div className="flex flex-col gap-3">
          {/* 홈으로 */}
          <button
            className="w-full border border-foreground bg-foreground py-3 text-sm font-medium tracking-tight text-background transition-colors duration-200 hover:bg-foreground/90"
            onClick={() => commonActions.handleExit('/')}
          >
            {t('홈으로')}
          </button>

          {/* 나가기 */}
          <button
            className="w-full py-3 text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
            onClick={() => commonActions.handleExit('/')}
          >
            {t('닫기')}
          </button>
        </div>
      </main>
    </div>
  );
};

export default QuizExplanationDesignC;
