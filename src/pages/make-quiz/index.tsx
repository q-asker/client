import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'i18nexus';
import Header from '#widgets/header';
import Footer from '#widgets/footer';
import {
  usePrepareQuiz,
  getLevelDescriptions,
  MAX_FILE_SIZE,
  MAX_SELECT_PAGES,
  SUPPORTED_EXTENSIONS,
} from '#features/prepare-quiz';
import { useQuizGenerationStore } from '#features/quiz-generation';
import axiosInstance from '#shared/api';
import CustomToast from '#shared/toast';
import { useAuthStore } from '#entities/auth';
import MarkdownText from '@/shared/ui/components/markdown-text';
import MockPageGrid from './MockPageGrid';

// PDF 뷰어를 파일 업로드 후에만 로드 (초기 번들 106KB 절감)
const PdfPageSelector = React.lazy(() => import('./PdfPageSelector'));
import { useNavigate } from 'react-router-dom';
import RecentChanges from '#widgets/recent-changes';
import { cn } from '@/shared/ui/lib/utils';
import type { QuestionType, QuizLevel } from '#features/prepare-quiz';
import {
  ListChecks,
  PenLine,
  CircleDot,
  Package,
  CheckCircle,
  FileText,
  Upload,
  ArrowUpFromLine,
  X,
  Eye,
  EyeOff,
  CheckSquare,
  XSquare,
  BookOpen,
  Shield,
  Lightbulb,
  HelpCircle,
  ChevronDown,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/components/card';
import { Badge } from '@/shared/ui/components/badge';
import { Button } from '@/shared/ui/components/button';
import InlineEdit from '@/shared/ui/components/inline-edit';
import { Skeleton } from '@/shared/ui/components/skeleton';
import { TextAnimate } from '@/shared/ui/components/text-animate';
import { BorderBeam } from '@/shared/ui/components/border-beam';

/** 퀴즈 유형 옵션 */
interface QuizTypeOption {
  key: QuestionType;
  label: string;
  icon: LucideIcon;
}

/** Sidebar Wizard 디자인 — 스텝 인디케이터 + 카드 컨텐츠 */
const MakeQuiz: React.FC = () => {
  const { t, currentLanguage } = useTranslation('make-quiz');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMock = searchParams.get('mock') === 'true';
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const levelDescriptions = useMemo(() => getLevelDescriptions(t), []);
  const acceptExtensions: string = SUPPORTED_EXTENSIONS.map((ext) => `.${ext}`).join(', ');
  const { state, actions } = usePrepareQuiz({ t, currentLanguage, navigate });
  const { upload, options, pages, generation, ui, isWaitingForFirstQuiz, pdfOptions } = state;
  const storedFileInfo = useQuizGenerationStore((state) => state.fileInfo);

  // Zustand persist hydration 완료 전까지 빈 화면 → 퀴즈 화면 플래싱 방지
  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => {
    const unsub = useQuizGenerationStore.persist.onFinishHydration(() => setIsHydrated(true));
    // 이미 hydration이 완료된 경우
    if (useQuizGenerationStore.persist.hasHydrated()) setIsHydrated(true);
    return unsub;
  }, []);
  const isAuthenticated = !!useAuthStore((state) => state.accessToken);
  const generatedQuizCount = useQuizGenerationStore((state) => state.quizzes.length);
  const safeFileName: string = upload.file?.name || storedFileInfo?.name || t('업로드된 파일');
  const safeFileSize: number | undefined = upload.file?.size ?? storedFileInfo?.size;

  // 생성 완료 후 서버에서 ProblemSet 정보 조회
  interface ProblemSetSummary {
    title: string;
    quizType: 'MULTIPLE' | 'BLANK' | 'OX';
    totalCount: number;
  }
  const [problemSetInfo, setProblemSetInfo] = useState<ProblemSetSummary | null>(null);

  useEffect(() => {
    if (!generation.problemSetId) {
      setProblemSetInfo(null);
      return;
    }
    let cancelled = false;
    axiosInstance
      .get<ProblemSetSummary>(`/problem-set/${generation.problemSetId}`)
      .then(({ data }) => {
        if (!cancelled) setProblemSetInfo(data);
      })
      .catch(() => {
        // 조회 실패 시 무시 — 클라이언트 정보 폴백
      });
    return () => {
      cancelled = true;
    };
  }, [generation.problemSetId]);
  const {
    upload: uploadActions,
    options: optionActions,
    pages: pageActions,
    generation: generationActions,
    ui: uiActions,
    common: commonActions,
  } = actions;

  // 제목 인라인 편집
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const submitTitleEdit = async (trimmed: string) => {
    if (!generation.problemSetId) return;
    try {
      const { data } = await axiosInstance.patch<{ title: string }>(
        `/problem-set/${generation.problemSetId}/title`,
        { title: trimmed },
      );
      // 서버 응답으로 로컬 상태 즉시 반영
      setProblemSetInfo((prev) => (prev ? { ...prev, title: data.title } : prev));
      CustomToast.success(t('제목이 변경되었습니다.'));
    } catch (error) {
      console.error(t('제목 변경 실패:'), error);
    }
  };

  const quizTypes: QuizTypeOption[] = [
    { key: 'MULTIPLE', label: t('객관식'), icon: ListChecks },
    { key: 'BLANK', label: t('빈칸 넣기'), icon: PenLine },
    { key: 'OX', label: t('OX 퀴즈'), icon: CircleDot },
  ];

  const currentLevel: { title: string; question: string; options: string[] } | undefined =
    levelDescriptions[options.quizLevel as QuizLevel];

  // Hydration 완료 전 — 레이아웃만 표시하여 업로드↔퀴즈 화면 플래싱 방지
  if (!isHydrated) {
    return (
      <div className="flex min-h-screen flex-col bg-muted">
        <Header
          isSidebarOpen={ui.isSidebarOpen}
          toggleSidebar={uiActions.toggleSidebar}
          setIsSidebarOpen={uiActions.setIsSidebarOpen}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted">
      <Header
        isSidebarOpen={ui.isSidebarOpen}
        toggleSidebar={uiActions.toggleSidebar}
        setIsSidebarOpen={uiActions.setIsSidebarOpen}
      />

      <div className="mx-auto mt-4 w-full flex-1 px-4 sm:mt-6 md:mt-8 md:w-[90%] lg:w-[85%] xl:w-[80%]">
        <h1 className="sr-only">
          {currentLanguage === 'en'
            ? 'Free AI Quiz Generator for PDF, PPT, Word'
            : 'PDF, PPT, Word로 무료 AI 퀴즈 생성'}
        </h1>
        <AnimatePresence mode="wait">
          {/* 2컬럼 레이아웃 (업로드 완료 후, 생성 전, 생성 중 아닐 때) */}
          {upload.uploadedUrl && !generation.problemSetId && !isWaitingForFirstQuiz ? (
            <motion.div
              key="editor"
              exit={{ opacity: 0, scale: 0.96, y: -20 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className="lg:grid lg:grid-cols-2 lg:gap-8"
            >
              {/* 좌측: 파일 정보 + PDF 미리보기 */}
              <div className="lg:sticky lg:top-6 lg:self-start">
                <Card className="rounded-2xl border border-border">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold tracking-tight md:text-xl">
                      {t('업로드된 파일')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* 파일 정보 영역 */}
                    <div
                      className={cn(
                        'flex flex-col items-center justify-center rounded-2xl border border-border bg-muted px-5 py-6 text-center transition-colors duration-200 sm:px-8 sm:py-10',
                        upload.isDragging && 'border-primary bg-primary/5',
                      )}
                      onDragOver={uploadActions.handleDragOver}
                      onDragEnter={uploadActions.handleDragEnter}
                      onDragLeave={uploadActions.handleDragLeave}
                      onDrop={uploadActions.handleDrop}
                    >
                      <div className="mb-3 flex size-12 items-center justify-center rounded-2xl border border-border bg-background sm:mb-4 sm:size-16">
                        <FileText className="size-5 text-primary sm:size-8" />
                      </div>
                      <div className="max-w-full truncate text-base font-bold text-foreground sm:text-lg">
                        {safeFileName}
                      </div>
                      {safeFileSize && (
                        <span className="mt-1 text-sm text-muted-foreground">
                          ({(safeFileSize / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      )}
                      <button
                        className="mt-4 cursor-pointer rounded-2xl border-none bg-destructive px-5 py-2 text-sm font-semibold text-background transition-opacity duration-200 hover:opacity-90 sm:mt-6 sm:px-6 sm:py-2.5"
                        onClick={commonActions.handleRemoveFile}
                      >
                        <span className="inline-flex items-center gap-1">
                          <X className="size-3.5" strokeWidth={2.5} />
                          {t('파일 삭제')}
                        </span>
                      </button>
                    </div>

                    {/* 페이지 지정 + PDF 그리드 통합 */}
                    {upload.uploadedUrl && (
                      <div
                        className="mt-6 rounded-2xl border border-border bg-background p-6"
                        ref={pages.pdfPreviewRef}
                      >
                        {/* 페이지 선택 툴바 */}
                        <div className="mb-4 flex flex-col gap-3">
                          {/* 페이지 지정 라벨 */}
                          <TextAnimate
                            animation="slideUp"
                            by="word"
                            className="text-xl font-semibold tracking-tight md:text-xl"
                          >
                            {t('페이지를 지정하세요')}
                          </TextAnimate>

                          {/* 범위 입력: []-[] 적용 */}
                          <div className="flex items-center gap-2">
                            <span className="shrink-0 text-xs font-medium text-muted-foreground sm:text-sm">
                              {t('범위 지정:')}
                            </span>
                            <div className="inline-flex h-9 w-fit items-center overflow-hidden rounded-xl border border-border bg-muted/40 shadow-sm">
                              <input
                                type="number"
                                min="1"
                                max={pages.numPages ?? 1}
                                value={pages.pageRangeStart}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  pageActions.setPageRangeStart(e.target.value)
                                }
                                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                  if (e.key === 'Enter') pageActions.handleApplyPageRange();
                                }}
                                disabled={!pages.numPages}
                                aria-label={t('시작 페이지')}
                                className="w-12 border-none bg-transparent text-center text-sm font-bold tabular-nums text-foreground outline-none disabled:cursor-not-allowed disabled:text-muted-foreground"
                              />

                              <span className="select-none px-1 text-sm font-medium text-muted-foreground">
                                –
                              </span>
                              <input
                                type="number"
                                min="1"
                                max={pages.numPages ?? 1}
                                value={pages.pageRangeEnd}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  pageActions.setPageRangeEnd(e.target.value)
                                }
                                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                  if (e.key === 'Enter') pageActions.handleApplyPageRange();
                                }}
                                disabled={!pages.numPages}
                                aria-label={t('끝 페이지')}
                                className="w-12 border-none bg-transparent text-center text-sm font-bold tabular-nums text-foreground outline-none disabled:cursor-not-allowed disabled:text-muted-foreground"
                              />

                              <button
                                type="button"
                                className="cursor-pointer self-stretch border-l border-border bg-primary px-3 text-xs font-semibold text-primary-foreground transition-opacity duration-150 hover:opacity-90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground sm:px-4"
                                onClick={pageActions.handleApplyPageRange}
                                disabled={!pages.numPages}
                              >
                                {t('적용')}
                              </button>
                            </div>
                          </div>

                          {/* 액션 버튼 그룹 */}
                          <div className="flex h-9 items-stretch gap-1.5 sm:gap-2">
                            <button
                              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-border bg-muted/40 px-2.5 text-xs font-medium text-foreground transition-all duration-200 hover:bg-muted sm:px-3"
                              onClick={pageActions.handleSelectAllPages}
                            >
                              <CheckSquare className="size-3.5" strokeWidth={2} />
                              {t('전체 선택')}
                            </button>
                            <button
                              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-destructive/20 bg-muted/40 px-2.5 text-xs font-medium text-destructive transition-all duration-200 hover:bg-destructive/5 sm:px-3"
                              onClick={pageActions.handleClearAllPages}
                            >
                              <XSquare className="size-3.5" strokeWidth={2} />
                              {t('전체 해제')}
                            </button>
                            <button
                              className={cn(
                                'hidden cursor-pointer items-center gap-1.5 rounded-xl border px-2.5 text-xs font-medium transition-all duration-200 sm:px-3 md:inline-flex',
                                pages.isPreviewVisible
                                  ? 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/15'
                                  : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground',
                              )}
                              type="button"
                              onClick={() =>
                                pageActions.setIsPreviewVisible((prev: boolean) => !prev)
                              }
                            >
                              {pages.isPreviewVisible ? (
                                <>
                                  <EyeOff className="size-3.5" strokeWidth={2} />
                                  {t('미리보기 끄기')}
                                </>
                              ) : (
                                <>
                                  <Eye className="size-3.5" strokeWidth={2} />
                                  {t('미리보기 켜기')}
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                        {/* 선택 카운트 */}
                        <div className="mb-4 flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground">
                            {t('선택된 페이지 수:')}
                          </span>
                          <span className="text-xs font-medium text-muted-foreground">
                            {pages.selectedPages.length}
                          </span>
                          <span className="text-xs text-muted-foreground/60">
                            {t('(최대')}
                            {MAX_SELECT_PAGES})
                          </span>
                        </div>
                        {isMock ? (
                          <MockPageGrid
                            numPages={pages.numPages ?? 0}
                            selectedPages={pages.selectedPages}
                            onPageClick={pageActions.handlePageSelection}
                          />
                        ) : (
                          <React.Suspense
                            fallback={
                              <div className="flex flex-col items-center justify-center py-12">
                                <div className="mb-3 size-8 animate-spin rounded-full border-3 border-muted-foreground/20 border-t-primary" />
                                <p className="text-sm font-medium text-muted-foreground">
                                  {t('PDF 로딩 중...')}
                                </p>
                              </div>
                            }
                          >
                            <PdfPageSelector
                              uploadedUrl={upload.uploadedUrl}
                              pdfOptions={pdfOptions}
                              numPages={pages.numPages}
                              visiblePageCount={pages.visiblePageCount}
                              selectedPages={pages.selectedPages}
                              hoveredPage={pages.hoveredPage}
                              isPreviewVisible={pages.isPreviewVisible}
                              t={t}
                              onDocumentLoadSuccess={pageActions.onDocumentLoadSuccess}
                              onLoadError={(error: Error & { status?: number }) => {
                                if (
                                  error.name === 'MissingPDFException' ||
                                  (error.status && error.status >= 400 && error.status < 500)
                                ) {
                                  CustomToast.error(
                                    t('파일이 존재하지 않습니다. 다시 업로드해주세요.'),
                                  );
                                  commonActions.handleRemoveFile();
                                } else {
                                  console.error(error);
                                }
                              }}
                              onPageClick={pageActions.handlePageSelection}
                              onPageMouseEnter={pageActions.handlePageMouseEnter}
                              onPageMouseLeave={pageActions.handlePageMouseLeave}
                            />
                          </React.Suspense>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* 우측: 스텝 인디케이터 + 카드 컨텐츠 */}
              <div className="mt-4 space-y-4 sm:mt-6 sm:space-y-6 lg:mt-0">
                {/* ─── 스텝 1: 퀴즈 타입 ─── */}
                <Card className="rounded-2xl border border-border">
                  <CardHeader>
                    <CardTitle>
                      <TextAnimate
                        animation="slideUp"
                        by="word"
                        className="text-xl font-semibold tracking-tight md:text-xl"
                      >
                        {t('퀴즈 타입을 선택하세요')}
                      </TextAnimate>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* 세그먼트 컨트롤 */}
                    <div className="flex overflow-hidden rounded-2xl border border-border">
                      {quizTypes.map((type, index) => (
                        <button
                          key={type.key}
                          className={cn(
                            'flex-1 cursor-pointer border-none px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors duration-200',
                            index < quizTypes.length - 1 && 'border-r border-border',
                            options.questionType === type.key
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-background hover:bg-muted',
                          )}
                          onClick={() => {
                            optionActions.handleQuestionTypeChange(type.key, type.label);
                          }}
                        >
                          <span className="inline-flex items-center justify-center gap-1 sm:gap-1.5">
                            <type.icon className="size-4" strokeWidth={1.8} />
                            <span className="text-xs sm:text-sm">{type.label}</span>
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* 난이도 미리보기 카드 */}
                    <div className="mt-4 rounded-2xl border border-border bg-muted p-4 sm:mt-6 sm:p-6">
                      <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        {currentLevel?.title}
                      </div>
                      <div className="rounded-xl bg-background p-4">
                        <MarkdownText className="break-keep text-sm leading-relaxed text-foreground md:break-words">
                          {currentLevel?.question ?? ''}
                        </MarkdownText>
                      </div>
                      {currentLevel?.options && currentLevel.options.length > 0 && (
                        <div className="mt-4 flex flex-col gap-2">
                          {currentLevel.options.map((option: string, index: number) => (
                            <div
                              key={`${option}-${index}`}
                              className="flex items-center rounded-xl bg-background px-4 py-3"
                            >
                              <span className="mr-3 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                {index + 1}
                              </span>
                              <span className="whitespace-pre-wrap break-keep text-sm leading-relaxed text-foreground md:break-words">
                                {option}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* ─── 스텝 2: 문제 개수 ─── */}
                <Card className="rounded-2xl border border-border">
                  <CardHeader>
                    <CardTitle>
                      <TextAnimate
                        animation="slideUp"
                        by="word"
                        className="text-xl font-semibold tracking-tight md:text-xl"
                      >
                        {t('문제 개수를 지정하세요')}
                      </TextAnimate>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center rounded-2xl border border-border bg-muted p-6 sm:p-8">
                      <div className="text-[3rem] font-black leading-none tracking-tight text-primary sm:text-[4rem]">
                        {options.questionCount}
                      </div>
                      <span className="mt-2 text-sm font-medium text-muted-foreground">
                        {t('문제')}
                      </span>
                      <div className="mt-6 w-full max-w-md">
                        <input
                          type="range"
                          min="5"
                          max="25"
                          step="5"
                          value={options.questionCount}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const newCount: number = +e.target.value;
                            optionActions.handleQuestionCountChange(newCount);
                          }}
                          aria-label={t('문제 수')}
                          className="h-1.5 w-full accent-primary md:h-1"
                        />

                        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                          <span>5</span>
                          <span>10</span>
                          <span>15</span>
                          <span>20</span>
                          <span>25</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* ─── 스텝 4: 문제 생성 ─── */}
                <Card className="rounded-2xl border border-border">
                  <CardHeader>
                    <CardTitle>
                      <TextAnimate
                        animation="slideUp"
                        by="word"
                        className="text-xl font-semibold tracking-tight md:text-xl"
                      >
                        {t('문제를 생성하세요')}
                      </TextAnimate>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AnimatePresence mode="wait">
                      {isWaitingForFirstQuiz ? (
                        /* 생성 중: 버튼이 위로 올라가며 스피너로 전환 */
                        <motion.div
                          key="generating"
                          initial={{ opacity: 0, y: 40 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, ease: 'easeOut' }}
                          className="flex min-h-[80px] flex-col items-center justify-center rounded-2xl border border-border bg-muted p-4 text-center sm:min-h-[100px] sm:p-6"
                        >
                          <div className="mb-4 size-12 animate-spin rounded-full border-4 border-muted-foreground/20 border-t-primary" />
                          <p className="m-0 text-sm md:text-sm">
                            {t('문제 생성 중...')}
                            {Math.floor(generation.generationElapsedTime / 1000)}
                            {t('초')}
                            <br />
                            <span className="mt-1.5 inline-block text-xs text-muted-foreground/60">
                              {t('생성된 문제의 개수는 간혹 지정한 개수와 맞지 않을 수 있습니다.')}
                              <br />
                              {t('AI는 실수를 할 수 있습니다. 학습 보조 도구로 활용해 주세요.')}
                            </span>
                          </p>
                          {generation.showWaitMessage && (
                            <motion.p
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: 0.2 }}
                              className="pt-2.5 text-sm text-muted-foreground"
                            >
                              {t('현재 생성중입니다 조금만 더 기다려주세요!')}
                            </motion.p>
                          )}
                        </motion.div>
                      ) : (
                        /* 대기: 안내 텍스트 + 버튼 */
                        <motion.div
                          key="idle"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0, y: -20, transition: { duration: 0.25 } }}
                        >
                          <div className="flex min-h-[80px] items-center justify-center rounded-2xl border border-border bg-muted p-4 text-center sm:min-h-[100px] sm:p-6">
                            <p className="m-0 text-sm text-muted-foreground">
                              {t('문서를 분석하고 문제를 생성하려면 아래 버튼을 클릭하세요.')}
                            </p>
                          </div>

                          {/* 생성 버튼 */}
                          <div className="mt-4 flex flex-col items-center gap-3 sm:mt-6">
                            <button
                              className="w-full cursor-pointer rounded-2xl border-none bg-primary py-4 text-base font-bold text-primary-foreground transition-opacity duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground sm:py-5 sm:text-lg"
                              onClick={generationActions.generateQuestions}
                              disabled={
                                !upload.uploadedUrl ||
                                isWaitingForFirstQuiz ||
                                !pages.selectedPages.length
                              }
                            >
                              {t('문제 생성하기')}
                            </button>
                            {!pages.selectedPages.length && pages.numPages === null && (
                              <p className="mt-1 text-center text-sm text-muted-foreground">
                                {t('페이지 정보를 불러오는 중입니다. 잠시만 기다려주세요.')}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          ) : !upload.uploadedUrl && !generation.problemSetId ? (
            /* 파일 미업로드 상태: 풀폭 드래그 영역 */
            <div
              className={cn(
                'group relative overflow-hidden rounded-3xl border border-border/60 bg-background shadow-[0_2px_12px_oklch(0_0_0/0.04)] transition-all duration-300',
                upload.isDragging &&
                  'border-primary/40 bg-primary/5 shadow-[0_4px_24px_oklch(0.511_0.23_277/0.12)]',
              )}
              onDragOver={uploadActions.handleDragOver}
              onDragEnter={uploadActions.handleDragEnter}
              onDragLeave={uploadActions.handleDragLeave}
              onDrop={uploadActions.handleDrop}
            >
              {upload.isDragging && (
                <BorderBeam
                  size={120}
                  duration={4}
                  colorFrom="oklch(0.511 0.2301 276.97)"
                  colorTo="oklch(0.627 0.1638 271.53)"
                  borderWidth={2}
                />
              )}
              {isWaitingForFirstQuiz && !upload.uploadedUrl ? (
                /* 업로드 진행 중 */
                <div className="flex flex-col items-center px-5 py-12 text-center sm:px-8 sm:py-16">
                  {/* SVG 원형 프로그레스 */}
                  <div className="relative mb-6 flex size-20 items-center justify-center">
                    <svg className="size-full -rotate-90" viewBox="0 0 64 64">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        fill="none"
                        className="stroke-muted"
                        strokeWidth="4"
                      />

                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        fill="none"
                        className="stroke-primary"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray="176"
                        strokeDashoffset="44"
                        style={{
                          animation: 'spin 1.5s linear infinite',
                          transformOrigin: 'center',
                        }}
                      />
                    </svg>
                    {/* 중앙 경과 시간 */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold text-primary tabular-nums">
                        {Math.floor(upload.uploadElapsedTime / 1000)}
                        <span className="text-xs font-normal text-muted-foreground">{t('초')}</span>
                      </span>
                    </div>
                  </div>

                  {/* 상태 텍스트 */}
                  <div className="mb-2 text-base font-semibold text-foreground">
                    {upload.fileExtension && upload.fileExtension !== 'pdf'
                      ? t('파일 변환 중')
                      : t('파일 업로드 중')}
                  </div>

                  {/* 변환 안내 */}
                  {upload.fileExtension && upload.fileExtension !== 'pdf' ? (
                    <p className="max-w-[360px] text-sm leading-relaxed text-muted-foreground">
                      <strong className="text-foreground">
                        {upload.fileExtension.toUpperCase()}
                      </strong>{' '}
                      {t('파일을 PDF로 변환하고 있어요')}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t('잠시만 기다려 주세요')}</p>
                  )}
                </div>
              ) : (
                <>
                  {/* 상단: 업로드 영역 */}
                  <div className="flex flex-col items-center px-5 pt-10 pb-5 text-center sm:px-8 sm:pt-12 sm:pb-6">
                    {/* 아이콘 */}
                    <div className="relative mb-4 sm:mb-5">
                      <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 sm:size-20">
                        <ArrowUpFromLine
                          className="size-6 text-primary sm:size-8"
                          strokeWidth={1.5}
                        />
                      </div>
                      <div className="absolute -inset-2 animate-pulse rounded-full border border-primary/20" />
                    </div>

                    {/* 모바일: "파일을 업로드하세요", 데스크톱: "파일을 여기에 드래그하세요" */}
                    <h2 className="mb-1.5 text-lg font-bold tracking-tight text-foreground sm:mb-2 sm:text-xl">
                      <span className="hidden sm:inline">
                        <TextAnimate animation="slideUp" by="word" startOnView={false}>
                          {t('파일을 여기에 드래그하세요')}
                        </TextAnimate>
                      </span>
                      <span className="sm:hidden">
                        <TextAnimate animation="slideUp" by="word" startOnView={false}>
                          {t('파일을 업로드하세요')}
                        </TextAnimate>
                      </span>
                    </h2>
                    <p className="mb-3 text-sm text-muted-foreground sm:mb-4">
                      <span className="hidden sm:inline">{t('또는')}</span>
                    </p>

                    <div className="relative inline-flex w-full max-w-[280px] cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all duration-200 hover:shadow-lg hover:shadow-primary/30 sm:w-auto sm:py-2.5 sm:text-sm">
                      <Upload className="size-4" strokeWidth={2} />
                      {t('파일 선택하기')}
                      <input
                        type="file"
                        accept={acceptExtensions}
                        onChange={uploadActions.handleFileInput}
                        aria-label={t('파일 선택하기')}
                        className="absolute inset-0 cursor-pointer opacity-0"
                      />
                    </div>
                  </div>

                  {/* 하단: 파일 정보 */}
                  <div className="bg-gradient-to-b from-transparent to-muted/40 px-5 pt-3 pb-4 sm:px-8 sm:pt-4 sm:pb-5">
                    <div className="mx-auto flex w-fit flex-col gap-2 text-left sm:flex-row sm:gap-6">
                      <div className="flex items-center gap-2">
                        <Package className="size-4 shrink-0 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{t('크기 제한')}</span>
                        <span className="text-sm font-semibold text-foreground">
                          {MAX_FILE_SIZE / 1024 / 1024}MB
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="size-4 shrink-0 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{t('지원하는 파일')}</span>
                        <span className="text-sm font-semibold text-foreground">
                          {SUPPORTED_EXTENSIONS.join(', ')}
                        </span>
                      </div>
                    </div>
                    <p className="mt-3 text-center text-[10px] leading-relaxed text-muted-foreground/70">
                      {t('파일은 상업적 목적, AI 학습 목적으로 사용되지 않습니다.')}
                      <span className="hidden sm:inline">{' · '}</span>
                      <br className="sm:hidden" />
                      {t('24시간 후 자동 삭제되며 별도로 저장, 공유되지 않습니다.')}
                    </p>
                  </div>
                </>
              )}
            </div>
          ) : null}

          {/* ─── 생성 중 ─── */}
          {isWaitingForFirstQuiz && !generation.problemSetId && upload.uploadedUrl && (
            <motion.div
              key="generating"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -20 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <Card className="mx-auto mt-4 max-w-lg overflow-hidden rounded-2xl border border-border sm:mt-8">
                <div className="flex flex-col items-center px-4 py-6 text-center sm:px-6 sm:py-8">
                  <div className="mb-5 size-14 animate-spin rounded-full border-4 border-muted-foreground/20 border-t-primary" />
                  <p className="m-0 text-base font-semibold text-foreground">
                    {t('문제 생성 중...')}
                    {Math.floor(generation.generationElapsedTime / 1000)}
                    {t('초')}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground/60">
                    {t('생성된 문제의 개수는 간혹 지정한 개수와 맞지 않을 수 있습니다.')}
                    <br />
                    {t('AI는 실수를 할 수 있습니다. 학습 보조 도구로 활용해 주세요.')}
                  </p>
                  <p
                    className={cn(
                      'mt-4 text-sm text-muted-foreground transition-opacity duration-300',
                      generation.showWaitMessage ? 'opacity-100' : 'opacity-0',
                    )}
                  >
                    {t('현재 생성중입니다 조금만 더 기다려주세요!')}
                  </p>
                </div>
              </Card>
            </motion.div>
          )}

          {/* ─── 생성 완료 결과 ─── */}
          {generation.problemSetId && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            >
              <Card className="mx-auto mt-4 max-w-lg overflow-hidden rounded-2xl border border-border sm:mt-8">
                {/* 히어로 영역: 파일명 + 유형 + 문제 수 */}
                <div className="flex flex-col items-center gap-2 px-4 pt-5 sm:px-6 sm:pt-6">
                  {problemSetInfo ? (
                    <>
                      {/* 파일명 — 서버 응답 */}
                      <div className="flex w-full max-w-[360px] items-center justify-center gap-2 text-foreground">
                        {!isEditingTitle && <FileText className="size-5 shrink-0" />}
                        <InlineEdit
                          value={problemSetInfo.title}
                          editing={isEditingTitle}
                          onStartEdit={() => setIsEditingTitle(true)}
                          onCancel={() => setIsEditingTitle(false)}
                          onSubmit={submitTitleEdit}
                          size="md"
                          textClassName="max-w-[260px] truncate text-base font-bold sm:max-w-[360px] sm:text-lg"
                          hideEditButton={!isAuthenticated}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
                          <ListChecks className="size-3.5" />
                          <span className="text-sm font-medium">
                            {quizTypes.find((qt) => qt.key === problemSetInfo.quizType)?.label ||
                              t('객관식')}
                          </span>
                        </Badge>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black tabular-nums text-primary sm:text-3xl">
                          {problemSetInfo.totalCount}
                        </span>
                        <span className="text-sm font-medium text-muted-foreground">
                          {t('문제')}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <Skeleton className="h-7 w-48 rounded-md" />
                      <Skeleton className="h-7 w-20 rounded-full" />
                      <Skeleton className="h-9 w-24 rounded-md" />
                    </>
                  )}
                </div>

                {/* CTA */}
                <div className="px-4 pt-2 pb-4 sm:px-6 sm:pt-2 sm:pb-6">
                  <button
                    className="w-full cursor-pointer rounded-xl border-none bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-sm shadow-primary/20 transition-all duration-200 hover:shadow-md hover:shadow-primary/30"
                    onClick={generationActions.handleNavigateToQuiz}
                  >
                    {t('문제 풀기')}
                  </button>

                  {/* 보조 액션 */}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      className="cursor-pointer rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
                      onClick={() => {
                        if (
                          window.confirm(
                            String(t('현재 생성된 퀴즈가 사라집니다. 계속하시겠습니까?')),
                          )
                        ) {
                          commonActions.handleReCreate();
                        }
                      }}
                    >
                      {t('다른 문제 생성')}
                    </button>
                    <button
                      className="cursor-pointer rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-destructive/70 transition-colors duration-200 hover:bg-muted hover:text-destructive"
                      onClick={() => {
                        if (
                          window.confirm(
                            String(t('현재 생성된 퀴즈가 사라집니다. 계속하시겠습니까?')),
                          )
                        ) {
                          commonActions.handleRemoveFile();
                        }
                      }}
                    >
                      {t('다른 파일 넣기')}
                    </button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <RecentChanges />
      </div>

      {/* ─── SEO 콘텐츠 섹션: 파일 미업로드 & 퀴즈 미생성 시에만 표시 ─── */}
      {!upload.uploadedUrl && !generation.problemSetId && !isWaitingForFirstQuiz && (
        <div className="mx-auto w-full px-4 md:w-[90%] lg:w-[85%] xl:w-[80%]">
          <SeoContent t={t} currentLanguage={currentLanguage} />
        </div>
      )}

      <Footer />
    </div>
  );
};

export default MakeQuiz;

/* ─── SEO 콘텐츠 컴포넌트 ─── */

/** FAQ 아코디언 아이템 */
const FaqItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        className="flex w-full cursor-pointer items-center justify-between bg-transparent px-0 py-4 text-left text-sm font-semibold text-foreground"
        onClick={() => setOpen(!open)}
      >
        {question}
        <ChevronDown
          className={cn(
            'size-4 shrink-0 text-muted-foreground transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>
      {open && <p className="mt-0 mb-4 text-sm leading-relaxed text-muted-foreground">{answer}</p>}
    </div>
  );
};

/** 6단계 가이드 스텝 데이터 */
const GUIDE_STEPS = [
  { stepKey: '1단계: 파일 업로드', descKey: '파일을 드래그하거나 버튼 클릭' },
  { stepKey: '2단계: 퀴즈 옵션 설정', descKey: '빈칸 채우기, OX, 객관식 중 선택' },
  { stepKey: '3단계: AI 문제 생성', descKey: '업로드된 문서를 AI가 분석하여 문제 생성' },
  { stepKey: '4단계: 퀴즈 풀기', descKey: '생성된 객관식 문제를 순서대로 풀이' },
  { stepKey: '5단계: 결과 및 해설 확인', descKey: '점수, 소요시간 등 결과 확인' },
  { stepKey: '6단계: 퀴즈 기록 관리', descKey: '만든 퀴즈가 퀴즈 기록에 자동 저장' },
] as const;

/** FAQ 데이터 */
const FAQ_ITEMS = [
  {
    qKey: 'Q. Q-Asker는 정말 무료인가요?',
    aKey: '네, PDF, PPT, Word 기반 AI 퀴즈 생성은 현재 완전 무료입니다. 별도의 회원가입 없이 누구나 자유롭게 이용할 수 있습니다.',
  },
  {
    qKey: 'Q. 업로드한 제 파일은 안전하게 관리되나요?',
    aKey: '네. 업로드된 파일은 퀴즈 생성을 위해서만 일시적으로 사용되며, 24시간 뒤에 삭제됩니다.',
  },
  {
    qKey: 'Q. AI가 만든 퀴즈의 정확도는 어느 정도인가요?',
    aKey: 'AI는 높은 정확도로 문서를 분석하지만, 100% 완벽하지 않을 수 있습니다. 생성된 문제는 학습 참고용이며, 중요한 정보는 반드시 원본과 교차 확인해주세요.',
  },
  {
    qKey: 'Q. 이미지로 된 파일도 퀴즈로 만들 수 있나요?',
    aKey: '네. OCR을 지원하여 스캔 본이나 사진 형태의 문서도 분석할 수 있습니다.',
  },
  {
    qKey: 'Q. 한 번에 몇 문제까지 생성할 수 있나요?',
    aKey: '5개, 10개, 15개, 20개, 25개 중 선택할 수 있습니다. 페이지 범위를 지정하면 특정 구간에 집중한 문제를 생성할 수 있습니다.',
  },
  {
    qKey: 'Q. 생성된 퀴즈는 저장되나요?',
    aKey: '네. 로그인 시 퀴즈 기록에 자동 저장되며, 비로그인 시에도 24시간 동안 브라우저에 임시 저장됩니다.',
  },
] as const;

/** 메인 페이지 하단 SEO 콘텐츠 — 서비스 소개, 가이드, 팁, 신뢰, FAQ */
const SeoContent: React.FC<{ t: (key: string) => string; currentLanguage: string }> = ({
  t,
  currentLanguage,
}) => {
  return (
    <section id="how-to-use" className="mt-8 space-y-6 pb-4 sm:mt-12 sm:space-y-8">
      {/* 서비스 소개 */}
      <div className="text-center">
        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {currentLanguage === 'en'
            ? 'Q-Asker: Free AI Quiz Generator for PDF, PPT, Word'
            : 'Q-Asker: PDF, PPT, Word로 무료 AI 퀴즈 생성'}
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {t(
            'PDF, PPT, Word 파일을 업로드하면 AI가 퀴즈를 생성해줘요. 빈칸, OX, 객관식 문제로 시험에 완벽 대비할 수 있어요. 지금 회원가입 없이 무료로 시작하세요.',
          )}
        </p>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground/80">
          {currentLanguage === 'en'
            ? 'Q-Asker is a free, no-signup-required web tool that automatically generates quizzes from PDF, PPT, and Word files. Users upload a document of up to 30MB, select a page range and question count (5–25), and the AI produces fill-in-the-blank, true/false, or multiple-choice questions within seconds. OCR is fully supported for scanned documents. All uploaded files are permanently deleted within 24 hours and are never used for commercial purposes or AI training. Quiz results include detailed explanations with source page references, and all generated quizzes are saved in your history for later review.'
            : 'Q-Asker는 PDF, PPT, Word 파일을 업로드하면 AI가 빈칸 채우기, OX, 객관식 퀴즈를 자동 생성하는 무료 웹 서비스입니다. 최대 30MB 파일을 업로드하고 페이지 범위와 문제 수(5~25개)를 선택하면 수 초 내에 퀴즈가 생성됩니다. 스캔 문서도 OCR로 지원되며, 업로드된 파일은 24시간 후 자동 삭제됩니다. 상업적 목적이나 AI 학습에 사용되지 않습니다. 채점 결과와 함께 모든 문제의 상세 해설과 원본 페이지 참조를 제공하며, 생성된 퀴즈는 히스토리에 자동 저장됩니다.'}
        </p>
      </div>

      {/* 6단계 가이드 */}
      <Card className="rounded-2xl border border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-bold">
            <BookOpen className="size-5 text-primary" />
            {t('AI 퀴즈 만들기 6단계 가이드')}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {t('가지고 계신 학습 자료로 AI 퀴즈를 만드는 가장 쉬운 방법을 알려드립니다.')}
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {GUIDE_STEPS.map((step, i) => (
              <div
                key={step.stepKey}
                className="flex items-start gap-3 rounded-xl border border-border bg-muted/50 p-4"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t(step.stepKey)}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {t(step.descKey)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 활용 팁 + 신뢰 이유 — 2컬럼 */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* 활용 팁 */}
        <Card className="rounded-2xl border border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <Lightbulb className="size-5 text-chart-3" />
              {t('AI 퀴즈 활용 200% 팁')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="text-sm leading-relaxed text-muted-foreground">
                {t('1. 빈칸 채우기로 핵심 개념을 정리하세요.')}
              </li>
              <li className="text-sm leading-relaxed text-muted-foreground">
                {t('2. OX로 빠르게 개념을 점검하세요.')}
              </li>
              <li className="text-sm leading-relaxed text-muted-foreground">
                {t('3. 객관식으로 개념을 응용해 보세요.')}
              </li>
            </ul>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {t(
                '빈칸, OX, 객관식 유형을 번갈아 풀어보며 개념 이해와 기억을 균형 있게 강화하세요.',
              )}
            </p>
          </CardContent>
        </Card>

        {/* 신뢰 이유 */}
        <Card className="rounded-2xl border border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <Shield className="size-5 text-chart-2" />
              {t('Q-Asker를 신뢰할 수 있는 이유')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
                <CheckCircle className="mt-0.5 size-4 shrink-0 text-chart-2" />
                {t('자료 보호')} — {t('모든 자료는 업로드 이후 24시간 뒤에 삭제됩니다')}
              </li>
              <li className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
                <CheckCircle className="mt-0.5 size-4 shrink-0 text-chart-2" />
                {t('명확한 문제 생성 기준')} — {t('문제 유형별 기준에 맞춰 퀴즈를 생성합니다.')}
              </li>
              <li className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
                <CheckCircle className="mt-0.5 size-4 shrink-0 text-chart-2" />
                {t('파일은 상업적 목적, AI 학습 목적으로 사용되지 않습니다.')}
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* 주의사항 */}
      <Card className="rounded-2xl border border-border">
        <CardContent className="pt-6">
          <p className="text-sm leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">{t('꼭 읽어주세요: 주의사항')}</span>
            <br />
            {t(
              '생성된 문제는 학습 참고용이며, 사실관계가 100% 정확하지 않을 수 있습니다. 중요한 정보는 반드시 원본과 교차 확인하세요.',
            )}
          </p>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card className="rounded-2xl border border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-bold">
            <HelpCircle className="size-5 text-primary" />
            {t('자주 묻는 질문 (FAQ)')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {FAQ_ITEMS.map((item) => (
            <FaqItem key={item.qKey} question={t(item.qKey)} answer={t(item.aKey)} />
          ))}
        </CardContent>
      </Card>
    </section>
  );
};
