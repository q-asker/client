import { useTranslation } from 'i18nexus';
import React from 'react';
import { Document, Page } from 'react-pdf';
import type { DocumentProps } from 'react-pdf';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuizExplanation } from '#features/quiz-explanation';
import { cn } from '@/shared/ui/lib/utils';
import MarkdownText from '@/shared/ui/components/markdown-text';
import { Badge } from '@/shared/ui/components/badge';
import { Button } from '@/shared/ui/components/button';
import { BlurFade } from '@/shared/ui/components/blur-fade';
import type { Quiz } from '#features/quiz-generation';
import { MOCK_QUIZZES, MOCK_EXPLANATION, MOCK_UPLOADED_URL } from './mockExplanationData';

interface LocationState {
  quizzes?: Quiz[];
  explanation?: {
    results?: Array<{ number: number; explanation: string; referencedPages?: number[] }>;
  };
  uploadedUrl?: string;
}

/** Floating Panels — bg-muted/30 배경 위 플로팅 카드, BlurFade 입장 */
const QuizExplanationMagicF: React.FC = () => {
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
    ? { quizzes: MOCK_QUIZZES, explanation: MOCK_EXPLANATION, uploadedUrl: MOCK_UPLOADED_URL }
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
  const refPages = explanation.thisExplanationObj?.referencedPages;
  const total = quiz.showWrongOnly ? quiz.filteredTotalQuestions : quiz.totalQuestions;

  const isQuizCorrect = (q: Quiz) => {
    const c = q.selections.find((o) => (o as unknown as { correct: boolean }).correct);
    return q.userAnswer != null && c && Number(q.userAnswer) === Number(c.id);
  };

  if (ui.isLoading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-6 max-md:px-4">
        {/* 상단 통합 카드: 번호 + 오답만 토글 + 문제 타이틀 */}
        <BlurFade delay={0.05}>
          <div className="rounded-2xl bg-card p-6 shadow-sm">
            {/* 번호 + 카운터 + 오답만 + 닫기 */}
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex flex-wrap gap-1.5">
                  {quiz.filteredQuizzes.map((q, i) => {
                    const cur = quiz.showWrongOnly
                      ? i + 1 === quiz.currentQuestion
                      : q.number === quiz.currentQuestion;
                    return (
                      <button
                        key={q.number}
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-colors',
                          cur
                            ? 'bg-primary text-primary-foreground'
                            : isQuizCorrect(q)
                              ? 'bg-success/15 text-success'
                              : 'bg-destructive/15 text-destructive',
                        )}
                        onClick={() =>
                          quizActions.handleQuestionClick(quiz.showWrongOnly ? i + 1 : q.number)
                        }
                      >
                        {q.number}
                      </button>
                    );
                  })}
                </div>
                <span className="text-xs text-muted-foreground">
                  {quiz.currentQuestion}/{total}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex cursor-pointer items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">{t('오답만')}</span>
                  <div className="relative inline-block h-5 w-9">
                    <input
                      type="checkbox"
                      checked={quiz.showWrongOnly}
                      onChange={quizActions.handleWrongOnlyToggle}
                      className="peer sr-only"
                    />
                    <span className="absolute inset-0 rounded-full bg-muted transition-colors peer-checked:bg-primary" />
                    <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-4" />
                  </div>
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => commonActions.handleExit('/')}
                >
                  {t('닫기')}
                </Button>
              </div>
            </div>
            {/* 문제 타이틀 — 구분선으로 분리 */}
            <div className="border-t border-border pt-4">
              <p className="whitespace-pre-wrap text-lg font-semibold leading-relaxed">
                {quiz.currentQuiz.number}. {quiz.currentQuiz.title}
              </p>
            </div>
          </div>
        </BlurFade>

        <div className="flex gap-6 max-lg:flex-col">
          {/* 좌측 — sticky 패널 */}
          <BlurFade delay={0.1} className="flex flex-1 flex-col gap-5">
            <div className="sticky top-6 flex flex-col gap-5 rounded-2xl bg-card p-6 shadow-sm">
              {quiz.currentQuiz.selections.map((opt, idx) => {
                const correct = (opt as unknown as { correct: boolean }).correct;
                const wrongSel =
                  quiz.currentQuiz.userAnswer != null &&
                  Number(quiz.currentQuiz.userAnswer) === Number(opt.id) &&
                  !correct;
                return (
                  <BlurFade key={opt.id} delay={0.15 + idx * 0.05}>
                    <div
                      className={cn(
                        'flex items-center rounded-lg px-4 py-3 text-sm',
                        correct
                          ? 'bg-success/10 ring-2 ring-success/50'
                          : wrongSel
                            ? 'bg-destructive/5 ring-2 ring-destructive/50'
                            : 'bg-muted/40',
                      )}
                    >
                      <span className="mr-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                        {idx + 1}
                      </span>
                      <span className="whitespace-pre-wrap break-words leading-relaxed">
                        {opt.content}
                      </span>
                      {correct && (
                        <Badge variant="default" className="ml-auto shrink-0">
                          {t('정답')}
                        </Badge>
                      )}
                      {wrongSel && (
                        <Badge variant="destructive" className="ml-auto shrink-0">
                          {t('오답')}
                        </Badge>
                      )}
                    </div>
                  </BlurFade>
                );
              })}
              <div className="flex gap-3">
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
                  disabled={quiz.currentQuestion === total}
                >
                  {t('다음')}
                </Button>
              </div>
              <Button className="w-full" onClick={() => commonActions.handleExit('/')}>
                {t('홈으로')}
              </Button>
            </div>
          </BlurFade>

          {/* 우측 — 해설 + 참조 */}
          <BlurFade delay={0.2} className="flex flex-1 flex-col gap-5">
            <div className="rounded-2xl bg-card p-6 shadow-sm">
              <h3 className="mb-3 text-lg font-semibold">{t('해설')}</h3>
              <MarkdownText className="leading-relaxed text-muted-foreground">
                {explanation.thisExplanationText}
              </MarkdownText>
            </div>
            <div className="rounded-2xl bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold">{t('참조 자료')}</h3>
                <div className="relative inline-block h-6 w-11">
                  <input
                    type="checkbox"
                    checked={pdf.showPdf}
                    onChange={pdfActions.handlePdfToggle}
                    className="peer sr-only"
                  />
                  <span className="absolute inset-0 rounded-full bg-muted transition-colors peer-checked:bg-primary" />
                  <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
                </div>
              </div>
              {refPages && refPages.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {refPages.map((page: number, i: number) => (
                    <button
                      key={i}
                      className={cn(
                        'rounded-md px-3 py-1.5 text-sm font-medium',
                        pdf.currentPdfPage === i
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-accent',
                      )}
                      onClick={() => pdfActions.setCurrentPdfPage(i)}
                    >
                      {t('페이지')} {page}
                    </button>
                  ))}
                </div>
              )}
              {pdf.showPdf && (
                <div className="mt-4 w-full overflow-x-auto" ref={pdf.pdfContainerRef}>
                  <div className="mb-3 flex items-center justify-center gap-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={pdfActions.handlePrevPdfPage}
                      disabled={pdf.currentPdfPage === 0}
                    >
                      &larr;
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {t('슬라이드의')} {refPages?.[pdf.currentPdfPage]} {t('페이지')}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={pdfActions.handleNextPdfPage}
                      disabled={pdf.currentPdfPage === (refPages?.length || 1) - 1}
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
                      className="flex min-h-[400px] justify-center [&_.react-pdf\_\_Page]:h-auto [&_.react-pdf\_\_Page]:max-w-full [&_.react-pdf\_\_Page\_\_canvas]:!h-auto [&_.react-pdf\_\_Page\_\_canvas]:max-w-full"
                    >
                      <Page
                        pageNumber={refPages?.[pdf.currentPdfPage] || 1}
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
            </div>
          </BlurFade>
        </div>
      </main>
    </div>
  );
};

export default QuizExplanationMagicF;
