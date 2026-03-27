import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'i18nexus';
import Header from '#widgets/header';
import Help from '#widgets/help';
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
import { Document, Page } from 'react-pdf';
import MockPageGrid from './MockPageGrid';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
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
  const { t } = useTranslation('make-quiz');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMock = searchParams.get('mock') === 'true';
  const levelDescriptions = useMemo(() => getLevelDescriptions(t), [t]);
  const acceptExtensions: string = SUPPORTED_EXTENSIONS.map((ext) => `.${ext}`).join(', ');
  const { state, actions } = usePrepareQuiz({ t, navigate });
  const { upload, options, pages, generation, ui, isWaitingForFirstQuiz, pdfOptions } = state;
  const storedFileInfo = useQuizGenerationStore((state) => state.fileInfo);
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

  return (
    <div className="flex min-h-screen flex-col bg-muted">
      <Header
        isSidebarOpen={ui.isSidebarOpen}
        toggleSidebar={uiActions.toggleSidebar}
        setIsSidebarOpen={uiActions.setIsSidebarOpen}
        setShowHelp={uiActions.setShowHelp}
      />

      <div className="mx-auto mt-4 w-full flex-1 px-4 sm:mt-6 md:mt-8 md:w-[90%] lg:w-[85%] xl:w-[80%]">
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
                          <Document
                            file={upload.uploadedUrl}
                            onLoadSuccess={pageActions.onDocumentLoadSuccess}
                            onLoadError={console.error}
                            options={pdfOptions}
                            loading={
                              <div className="flex flex-col items-center justify-center py-12">
                                <div className="mb-3 size-8 animate-spin rounded-full border-3 border-muted-foreground/20 border-t-primary" />
                                <p className="text-sm font-medium text-muted-foreground">
                                  {t('PDF 로딩 중...')}
                                </p>
                              </div>
                            }
                          >
                            <div className="relative">
                              <div
                                className="grid max-h-[360px] grid-cols-2 gap-2 overflow-y-auto p-1 sm:grid-cols-3 sm:gap-3 sm:p-1.5"
                                onMouseLeave={pageActions.handlePageMouseLeave}
                              >
                                {Array.from(
                                  new Array(Math.min(pages.visiblePageCount, pages.numPages ?? 0)),
                                  (_el: undefined, index: number) => {
                                    const pageNumber: number = index + 1;
                                    const isSelected: boolean =
                                      pages.selectedPages.includes(pageNumber);
                                    const isHovered: boolean =
                                      pages.hoveredPage?.pageNumber === pageNumber;

                                    return (
                                      <div
                                        key={`page_${pageNumber}`}
                                        className={cn(
                                          'relative cursor-pointer overflow-hidden rounded-none border-2 border-transparent bg-muted text-center transition-all duration-200 hover:z-10 hover:scale-[1.02] hover:shadow-md',
                                          isSelected && 'border-primary',
                                          isHovered && 'border-muted-foreground',
                                        )}
                                        onClick={() => {
                                          pageActions.handlePageSelection(pageNumber);
                                        }}
                                        onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                                          pageActions.handlePageMouseEnter(e, pageNumber);
                                        }}
                                      >
                                        <Page
                                          pageNumber={pageNumber}
                                          width={150}
                                          renderTextLayer={false}
                                          renderAnnotationLayer={false}
                                        />

                                        <p
                                          className={cn(
                                            'mt-2 flex items-center justify-center pb-2 text-sm text-muted-foreground',
                                            "before:mr-2 before:inline-block before:size-4 before:rounded-full before:border before:border-border before:bg-background before:content-['']",
                                            isSelected &&
                                              "font-semibold text-foreground before:border-primary before:bg-primary before:bg-[url(\"data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2016%2016'%3e%3cpath%20fill='none'%20stroke='white'%20stroke-linecap='round'%20stroke-linejoin='round'%20stroke-width='2'%20d='M4%208l3%203%205-5'/%3e%3c/svg%3e\")]",
                                          )}
                                        >
                                          {t('페이지')}
                                          {pageNumber}
                                        </p>
                                      </div>
                                    );
                                  },
                                )}
                                {pages.visiblePageCount < (pages.numPages ?? 0) && (
                                  <div className="col-span-full mt-4 flex flex-col items-center justify-center rounded-xl bg-muted p-5 text-muted-foreground">
                                    <div className="mb-2 size-6 animate-spin rounded-full border-2 border-border border-t-primary" />
                                    <p className="m-0 text-sm font-medium">
                                      {t('더 많은 페이지 로딩 중... (')}
                                      {pages.visiblePageCount}/{pages.numPages})
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* 페이지 호버 미리보기 */}
                              {pages.isPreviewVisible && pages.hoveredPage && (
                                <div
                                  className="pointer-events-none absolute z-30 rounded-2xl bg-background p-3 shadow-lg transition-[opacity,top] duration-200"
                                  style={pages.hoveredPage.style}
                                >
                                  <Page
                                    pageNumber={pages.hoveredPage.pageNumber}
                                    width={640}
                                    renderTextLayer={false}
                                    renderAnnotationLayer={false}
                                  />
                                </div>
                              )}
                            </div>
                          </Document>
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
                        <p className="m-0 whitespace-pre-wrap break-keep text-sm leading-relaxed text-foreground md:break-words">
                          {currentLevel?.question}
                        </p>
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
                            <span className="mt-1.5 inline-block text-xs text-muted-foreground">
                              {t('생성된 문제의 개수는 간혹 지정한 개수와 맞지 않을 수 있습니다.')}
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
                        <TextAnimate animation="slideUp" by="word">
                          {t('파일을 여기에 드래그하세요')}
                        </TextAnimate>
                      </span>
                      <span className="sm:hidden">
                        <TextAnimate animation="slideUp" by="word">
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
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t('생성된 문제의 개수는 간혹 지정한 개수와 맞지 않을 수 있습니다.')}
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
        {ui.showHelp && <Help />}
      </div>

      <Footer />
    </div>
  );
};

export default MakeQuiz;
