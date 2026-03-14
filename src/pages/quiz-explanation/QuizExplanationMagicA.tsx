import { useTranslation } from 'i18nexus';
import React from 'react';
import { Document, Page } from 'react-pdf';
import type { DocumentProps } from 'react-pdf';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuizExplanation } from '#features/quiz-explanation';
import { cn } from '@/shared/ui/lib/utils';
import MarkdownText from '@/shared/ui/components/markdown-text';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/components/card';
import { Badge } from '@/shared/ui/components/badge';
import { Button } from '@/shared/ui/components/button';
import { BlurFade } from '@/shared/ui/components/blur-fade';
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

/** Smooth Transition — DesignA 기반 + BlurFade 문제 전환 애니메이션 */
const QuizExplanationMagicA: React.FC = () => {
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

  if (ui.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <p className="text-muted-foreground">{t('로딩 중…')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* 헤더 */}
      <BlurFade delay={0.05}>
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <h1 className="text-lg font-semibold text-foreground">{t('해설')}</h1>
          <Button variant="ghost" size="sm" onClick={() => commonActions.handleExit('/')}>
            {t('닫기')}
          </Button>
        </header>
      </BlurFade>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8 max-md:px-4 max-md:py-6">
        {/* 카운터 + 오답만 토글 */}
        <BlurFade delay={0.1}>
          <div className="mb-6 flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              {quiz.currentQuestion} /{' '}
              {quiz.showWrongOnly ? quiz.filteredTotalQuestions : quiz.totalQuestions}
            </span>
            <label className="flex cursor-pointer items-center gap-2">
              <span className="text-sm text-muted-foreground">{t('오답만')}</span>
              <div className="relative inline-block h-6 w-11">
                <input
                  type="checkbox"
                  checked={quiz.showWrongOnly}
                  onChange={quizActions.handleWrongOnlyToggle}
                  className="peer sr-only"
                />
                <span className="absolute inset-0 rounded-full bg-muted transition-colors duration-200 peer-checked:bg-primary" />
                <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-200 peer-checked:translate-x-5" />
              </div>
            </label>
          </div>
        </BlurFade>

        {/* 번호 패널 */}
        <BlurFade delay={0.15}>
          <div className="mb-6 flex flex-wrap gap-2">
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
                    'flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-medium transition-all duration-200',
                    isCurrent
                      ? 'border-primary bg-primary text-primary-foreground'
                      : isCorrect
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100',
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
        </BlurFade>

        {/* 문제 카드 — 문제 전환 시 애니메이션 적용 */}
        <BlurFade key={`question-${quiz.currentQuestion}`} delay={0.1}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="whitespace-pre-wrap break-words text-base leading-relaxed">
                {quiz.currentQuiz.number}. {quiz.currentQuiz.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {quiz.currentQuiz.selections.map((opt, idx) => {
                const hasUserAnswer =
                  quiz.currentQuiz.userAnswer !== undefined && quiz.currentQuiz.userAnswer !== null;
                const isCorrectOption = (opt as unknown as { correct: boolean }).correct === true;
                const isWrongSelected =
                  hasUserAnswer &&
                  Number(quiz.currentQuiz.userAnswer) === Number(opt.id) &&
                  !(opt as unknown as { correct: boolean }).correct;

                return (
                  <BlurFade key={`${quiz.currentQuestion}-opt-${opt.id}`} delay={0.15 + idx * 0.05}>
                    <div
                      className={cn(
                        'flex items-center rounded-lg px-4 py-3 text-sm',
                        isCorrectOption
                          ? 'border-2 border-emerald-500 bg-emerald-50'
                          : isWrongSelected
                            ? 'border-2 border-destructive bg-destructive/5'
                            : 'border border-border bg-card',
                      )}
                    >
                      <span className="mr-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                        {idx + 1}
                      </span>
                      <span className="whitespace-pre-wrap break-words leading-relaxed">
                        {opt.content}
                      </span>
                      {isCorrectOption && (
                        <Badge variant="default" className="ml-auto shrink-0">
                          {t('정답')}
                        </Badge>
                      )}
                      {isWrongSelected && (
                        <Badge variant="destructive" className="ml-auto shrink-0">
                          {t('오답')}
                        </Badge>
                      )}
                    </div>
                  </BlurFade>
                );
              })}
            </CardContent>
          </Card>
        </BlurFade>

        {/* 이전/다음 네비게이션 */}
        <div className="mb-6 flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={quizActions.handlePrev}
            disabled={quiz.currentQuestion === 1}
          >
            {t('이전')}
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={quizActions.handleNext}
            disabled={
              quiz.currentQuestion ===
              (quiz.showWrongOnly ? quiz.filteredTotalQuestions : quiz.totalQuestions)
            }
          >
            {t('다음')}
          </Button>
        </div>

        {/* 해설 카드 — 문제 전환 시 애니메이션 적용 */}
        <BlurFade key={`explanation-${quiz.currentQuestion}`} delay={0.2}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">{t('해설')}</CardTitle>
            </CardHeader>
            <CardContent>
              <MarkdownText className="leading-relaxed text-muted-foreground">
                {explanation.thisExplanationText}
              </MarkdownText>

              {/* 참조 페이지 */}
              {explanation.thisExplanationObj?.referencedPages &&
                explanation.thisExplanationObj.referencedPages.length > 0 && (
                  <div className="mt-6 rounded-lg bg-muted p-4">
                    <h4 className="mb-3 text-sm font-semibold text-foreground">
                      {t('참조 페이지')}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {explanation.thisExplanationObj.referencedPages.map(
                        (page: number, index: number) => (
                          <button
                            key={index}
                            className={cn(
                              'rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200',
                              pdf.currentPdfPage === index
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-background text-foreground hover:bg-accent',
                            )}
                            onClick={() => pdfActions.setCurrentPdfPage(index)}
                          >
                            {page}
                          </button>
                        ),
                      )}
                    </div>
                  </div>
                )}

              {/* PDF 슬라이드 토글 */}
              <div className="mt-6 flex items-center gap-3">
                <span className="text-sm font-medium text-foreground">{t('관련 슬라이드')}</span>
                <div className="relative inline-block h-6 w-11">
                  <input
                    type="checkbox"
                    checked={pdf.showPdf}
                    onChange={pdfActions.handlePdfToggle}
                    className="peer sr-only"
                  />
                  <span className="absolute inset-0 rounded-full bg-muted transition-colors duration-200 peer-checked:bg-primary" />
                  <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-200 peer-checked:translate-x-5" />
                </div>
              </div>

              {/* PDF 뷰어 */}
              {pdf.showPdf && (
                <div
                  className="mt-4 w-full overflow-x-auto overflow-y-hidden"
                  ref={pdf.pdfContainerRef}
                >
                  <div className="mb-4 flex items-center justify-center gap-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={pdfActions.handlePrevPdfPage}
                      disabled={pdf.currentPdfPage === 0}
                    >
                      &larr;
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {t('슬라이드의')}
                      {' ' +
                        explanation.thisExplanationObj?.referencedPages?.[pdf.currentPdfPage] +
                        ' '}
                      {t('페이지')}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={pdfActions.handleNextPdfPage}
                      disabled={
                        pdf.currentPdfPage ===
                        (explanation.thisExplanationObj?.referencedPages?.length || 1) - 1
                      }
                    >
                      &rarr;
                    </Button>
                  </div>

                  {!uploadedUrl ? (
                    <p className="text-center text-muted-foreground">
                      {t('파일 링크가 만료되었습니다.')}
                    </p>
                  ) : uploadedUrl.toLowerCase().endsWith('.pdf') ? (
                    <Document
                      file={uploadedUrl}
                      loading={<p className="text-center">{t('PDF 로딩 중...')}</p>}
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
                    <p className="text-center text-muted-foreground">
                      {t('현재는 pdf 파일만 지원합니다.')}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </BlurFade>

        {/* 홈으로 버튼 */}
        <BlurFade delay={0.3}>
          <Button className="w-full" size="lg" onClick={() => commonActions.handleExit('/')}>
            {t('홈으로')}
          </Button>
        </BlurFade>
      </main>
    </div>
  );
};

export default QuizExplanationMagicA;
