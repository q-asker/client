import { useTranslation } from 'i18nexus';
import React from 'react';
import { Document, Page } from 'react-pdf';
import type { DocumentProps } from 'react-pdf';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuizExplanation } from '#features/quiz-explanation';
import { cn } from '@/shared/ui/lib/utils';
import MarkdownText from '@/shared/ui/components/markdown-text';
import { Button } from '@/shared/ui/components/button';
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

/** Lab Notebook — 과학적 데이터 뷰 스타일의 해설 화면 */
const QuizExplanationDesignD: React.FC = () => {
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

  /** 두 자리 숫자 포맷 (예: 01, 02) */
  const pad = (n: number) => String(n).padStart(2, '0');

  if (ui.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <p className="font-mono text-sm text-muted-foreground">{t('로딩 중…')}</p>
        </div>
      </div>
    );
  }

  const totalDisplay = quiz.showWrongOnly ? quiz.filteredTotalQuestions : quiz.totalQuestions;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* 상단 바 — 모노스페이스 카운터 */}
      <header className="flex items-center justify-between border-b border-border bg-muted/20 px-6 py-3">
        <div className="flex items-center gap-4">
          <span className="font-mono text-sm font-medium tabular-nums text-foreground">
            [{pad(quiz.currentQuestion)}/{pad(totalDisplay)}]
          </span>
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            {t('해설')}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* 오답만 토글 */}
          <label className="flex cursor-pointer items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
              {t('오답만')}
            </span>
            <div className="relative inline-block h-5 w-9">
              <input
                type="checkbox"
                checked={quiz.showWrongOnly}
                onChange={quizActions.handleWrongOnlyToggle}
                className="peer sr-only"
              />
              <span className="absolute inset-0 rounded-full bg-muted transition-colors duration-150 peer-checked:bg-primary" />
              <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform duration-150 peer-checked:translate-x-4" />
            </div>
          </label>

          <Button
            variant="ghost"
            size="sm"
            className="font-mono text-xs"
            onClick={() => commonActions.handleExit('/')}
          >
            {t('닫기')}
          </Button>
        </div>
      </header>

      {/* 메인 2열 그리드 */}
      <main className="mx-auto grid w-full max-w-7xl flex-1 gap-6 px-6 py-6 max-lg:grid-cols-1 lg:grid-cols-[1fr_400px]">
        {/* 좌측 — 문제 영역 */}
        <div className="flex flex-col gap-5">
          {/* 번호 패널 */}
          <div className="flex flex-wrap gap-1.5">
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
                    'flex h-8 w-8 items-center justify-center border font-mono text-xs tabular-nums transition-colors duration-150',
                    isCurrent
                      ? 'border-primary bg-primary text-primary-foreground'
                      : isCorrect
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-500'
                        : 'border-red-500/40 bg-red-500/10 text-red-500',
                  )}
                  onClick={() =>
                    quiz.showWrongOnly
                      ? quizActions.handleQuestionClick(index + 1)
                      : quizActions.handleQuestionClick(q.number)
                  }
                >
                  {pad(q.number)}
                </button>
              );
            })}
          </div>

          {/* 문제 컨테이너 — 점선 테두리 */}
          <div className="border border-dashed border-border bg-muted/20 p-5">
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
              <span className="mr-2 font-mono font-medium tabular-nums text-primary">
                Q{pad(quiz.currentQuiz.number)}.
              </span>
              {quiz.currentQuiz.title}
            </p>
          </div>

          {/* 선택지 — 컴팩트 수직 리스트 */}
          <div className="flex flex-col gap-1">
            {quiz.currentQuiz.selections.map((opt, idx) => {
              const hasUserAnswer =
                quiz.currentQuiz.userAnswer !== undefined && quiz.currentQuiz.userAnswer !== null;
              const isCorrectOption = (opt as unknown as { correct: boolean }).correct === true;
              const isWrongSelected =
                hasUserAnswer &&
                Number(quiz.currentQuiz.userAnswer) === Number(opt.id) &&
                !(opt as unknown as { correct: boolean }).correct;

              return (
                <div
                  key={opt.id}
                  className={cn(
                    'flex items-start gap-3 border px-4 py-2.5 text-sm transition-colors duration-150',
                    isCorrectOption
                      ? 'border-emerald-500/40 bg-emerald-500/5'
                      : isWrongSelected
                        ? 'border-red-500/40 bg-red-500/5'
                        : 'border-border bg-background',
                  )}
                >
                  {/* 상태 인디케이터 — 컬러 도트 */}
                  <span className="mt-0.5 flex shrink-0 items-center gap-2">
                    <span
                      className={cn(
                        'inline-block h-2 w-2 rounded-full',
                        isCorrectOption
                          ? 'bg-emerald-500'
                          : isWrongSelected
                            ? 'bg-red-500'
                            : 'bg-muted-foreground/30',
                      )}
                    />
                    <span className="font-mono text-xs tabular-nums text-muted-foreground">
                      {String.fromCharCode(65 + idx)}
                    </span>
                  </span>
                  <span className="whitespace-pre-wrap break-words leading-relaxed">
                    {opt.content}
                  </span>
                  {/* 정답/오답 라벨 */}
                  {isCorrectOption && (
                    <span className="ml-auto shrink-0 font-mono text-xs font-medium text-emerald-500">
                      {t('정답')}
                    </span>
                  )}
                  {isWrongSelected && (
                    <span className="ml-auto shrink-0 font-mono text-xs font-medium text-red-500">
                      {t('오답')}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* 이전/다음 네비게이션 */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 font-mono text-xs"
              onClick={quizActions.handlePrev}
              disabled={quiz.currentQuestion === 1}
            >
              &larr; {t('이전')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 font-mono text-xs"
              onClick={quizActions.handleNext}
              disabled={quiz.currentQuestion === totalDisplay}
            >
              {t('다음')} &rarr;
            </Button>
          </div>

          {/* 하단 액션 — 모바일에서만 표시 (데스크톱은 우측 패널 하단) */}
          <div className="flex gap-2 lg:hidden">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 font-mono text-xs"
              onClick={() => commonActions.handleExit('/')}
            >
              {t('홈으로')}
            </Button>
          </div>
        </div>

        {/* 우측 — 해설 + PDF (데스크톱에서 스티키) */}
        <aside className="flex flex-col gap-5 lg:sticky lg:top-6 lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto">
          {/* 해설 패널 */}
          <div className="border border-border bg-muted/20 p-5">
            <div className="mb-3 flex items-center gap-2 border-b border-border pb-2">
              <span className="font-mono text-xs font-medium uppercase tracking-widest text-primary">
                ANALYSIS
              </span>
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                #{pad(quiz.currentQuiz.number)}
              </span>
            </div>
            <MarkdownText className="text-sm leading-relaxed text-muted-foreground">
              {explanation.thisExplanationText}
            </MarkdownText>

            {/* 참조 페이지 — 모노스페이스 필 배지 */}
            {explanation.thisExplanationObj?.referencedPages &&
              explanation.thisExplanationObj.referencedPages.length > 0 && (
                <div className="mt-4 border-t border-border pt-3">
                  <span className="mb-2 block font-mono text-xs uppercase tracking-widest text-muted-foreground">
                    {t('참조 페이지')}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {explanation.thisExplanationObj.referencedPages.map(
                      (page: number, index: number) => (
                        <button
                          key={index}
                          className={cn(
                            'rounded-sm border px-2 py-0.5 font-mono text-xs tabular-nums transition-colors duration-150',
                            pdf.currentPdfPage === index
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border bg-background text-foreground hover:bg-accent',
                          )}
                          onClick={() => pdfActions.setCurrentPdfPage(index)}
                        >
                          [p.{page}]
                        </button>
                      ),
                    )}
                  </div>
                </div>
              )}
          </div>

          {/* PDF 섹션 */}
          <div className="border border-border bg-muted/20 p-5">
            <div className="mb-3 flex items-center justify-between border-b border-border pb-2">
              <span className="font-mono text-xs font-medium uppercase tracking-widest text-primary">
                PDF
              </span>
              <div className="relative inline-block h-5 w-9">
                <input
                  type="checkbox"
                  checked={pdf.showPdf}
                  onChange={pdfActions.handlePdfToggle}
                  className="peer sr-only"
                />
                <span className="absolute inset-0 rounded-full bg-muted transition-colors duration-150 peer-checked:bg-primary" />
                <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform duration-150 peer-checked:translate-x-4" />
              </div>
            </div>

            {pdf.showPdf && (
              <div className="w-full overflow-x-auto overflow-y-hidden" ref={pdf.pdfContainerRef}>
                {/* PDF 네비게이션 */}
                <div className="mb-3 flex items-center justify-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={pdfActions.handlePrevPdfPage}
                    disabled={pdf.currentPdfPage === 0}
                  >
                    &larr;
                  </Button>
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    {t('슬라이드의')}
                    {' ' +
                      explanation.thisExplanationObj?.referencedPages?.[pdf.currentPdfPage] +
                      ' '}
                    {t('페이지')}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={pdfActions.handleNextPdfPage}
                    disabled={
                      pdf.currentPdfPage ===
                      (explanation.thisExplanationObj?.referencedPages?.length || 1) - 1
                    }
                  >
                    &rarr;
                  </Button>
                </div>

                {/* PDF 뷰어 */}
                {!uploadedUrl ? (
                  <p className="text-center font-mono text-xs text-muted-foreground">
                    {t('파일 링크가 만료되었습니다.')}
                  </p>
                ) : uploadedUrl.toLowerCase().endsWith('.pdf') ? (
                  <Document
                    file={uploadedUrl}
                    loading={<p className="text-center font-mono text-xs">{t('PDF 로딩 중...')}</p>}
                    onLoadError={
                      ((err: Error) => (
                        <p className="font-mono text-xs">{t('파일이 존재하지 않습니다.')}</p>
                      )) as DocumentProps['onLoadError']
                    }
                    options={pdf.pdfOptions}
                    className="flex min-h-[300px] justify-center [&_.react-pdf\_\_Page]:h-auto [&_.react-pdf\_\_Page]:max-w-full [&_.react-pdf\_\_Page\_\_canvas]:!h-auto [&_.react-pdf\_\_Page\_\_canvas]:max-w-full"
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
                  <p className="text-center font-mono text-xs text-muted-foreground">
                    {t('현재는 pdf 파일만 지원합니다.')}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 홈으로 버튼 — 데스크톱에서만 표시 */}
          <div className="hidden lg:block">
            <Button
              variant="outline"
              size="sm"
              className="w-full font-mono text-xs"
              onClick={() => commonActions.handleExit('/')}
            >
              {t('홈으로')}
            </Button>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default QuizExplanationDesignD;
