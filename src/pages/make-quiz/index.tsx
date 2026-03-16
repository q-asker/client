import React, { lazy, Suspense, useMemo } from 'react';
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
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/components/card';
import { Badge } from '@/shared/ui/components/badge';
import { TextAnimate } from '@/shared/ui/components/text-animate';

/** 퀴즈 유형 옵션 */
interface QuizTypeOption {
  key: QuestionType;
  label: string;
  icon: LucideIcon;
}

/** Sidebar Wizard 디자인 — 스텝 인디케이터 + 카드 컨텐츠 */
const MakeQuiz: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMock = searchParams.get('mock') === 'true';
  const levelDescriptions = useMemo(() => getLevelDescriptions(t), [t]);
  const acceptExtensions: string = SUPPORTED_EXTENSIONS.map((ext) => `.${ext}`).join(', ');
  const { state, actions } = usePrepareQuiz({ t, navigate });
  const { upload, options, pages, generation, ui, isWaitingForFirstQuiz, pdfOptions } = state;
  const storedFileInfo = useQuizGenerationStore((state) => state.fileInfo);
  const safeFileName: string = upload.file?.name || storedFileInfo?.name || t('업로드된 파일');
  const safeFileSize: number | undefined = upload.file?.size ?? storedFileInfo?.size;
  const {
    upload: uploadActions,
    options: optionActions,
    pages: pageActions,
    generation: generationActions,
    ui: uiActions,
    common: commonActions,
  } = actions;

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

      <div className="mx-auto mt-8 flex-1 px-4 md:mt-6 md:w-[90%] lg:w-[85%] xl:w-[80%]">
        {/* 2컬럼 레이아웃 (업로드 완료 후, 생성 전) */}
        {upload.uploadedUrl && !generation.problemSetId ? (
          <div className="lg:grid lg:grid-cols-2 lg:gap-8">
            {/* 좌측: 파일 정보 + PDF 미리보기 */}
            <div className="lg:sticky lg:top-24 lg:self-start">
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
                      'flex flex-col items-center justify-center rounded-2xl border border-border bg-muted px-8 py-10 text-center transition-colors duration-200 md:px-5 md:py-8',
                      upload.isDragging && 'border-primary bg-primary/5',
                    )}
                    onDragOver={uploadActions.handleDragOver}
                    onDragEnter={uploadActions.handleDragEnter}
                    onDragLeave={uploadActions.handleDragLeave}
                    onDrop={uploadActions.handleDrop}
                  >
                    <div className="mb-4 flex size-16 items-center justify-center rounded-2xl border border-border bg-background md:size-14">
                      <FileText className="size-8 text-primary md:size-6" />
                    </div>
                    <div className="text-lg font-bold text-foreground">{safeFileName}</div>
                    {safeFileSize && (
                      <span className="mt-1 text-sm text-muted-foreground">
                        ({(safeFileSize / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    )}
                    <button
                      className="mt-6 cursor-pointer rounded-2xl border-none bg-destructive px-6 py-2.5 text-sm font-semibold text-background transition-opacity duration-200 hover:opacity-90 md:px-5 md:py-2"
                      onClick={commonActions.handleRemoveFile}
                    >
                      {t('✕ 파일 삭제')}
                    </button>
                  </div>

                  {/* 페이지 지정 */}
                  {upload.uploadedUrl && (
                    <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-muted p-4 md:flex-col md:items-stretch md:p-3">
                      <div className="flex flex-1 flex-wrap items-center gap-2 md:flex-col md:items-start md:gap-1.5">
                        <span className="text-sm font-medium text-foreground">
                          {t('원하는 페이지 입력:')}
                        </span>
                        <div className="flex flex-nowrap items-center gap-2 md:w-full md:justify-center">
                          <input
                            type="number"
                            min="1"
                            max={pages.numPages ?? 1}
                            value={pages.pageRangeStart}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              pageActions.setPageRangeStart(e.target.value)
                            }
                            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                              if (e.key === 'Enter') {
                                pageActions.handleApplyPageRange();
                              }
                            }}
                            disabled={!pages.numPages}
                            className="w-20 rounded-xl border border-border bg-background px-3 py-2 text-center text-sm transition-all duration-200 focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground md:w-15 md:px-2 md:py-1.5"
                          />
                          <span className="text-muted-foreground">~</span>
                          <input
                            type="number"
                            min="1"
                            max={pages.numPages ?? 1}
                            value={pages.pageRangeEnd}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              pageActions.setPageRangeEnd(e.target.value)
                            }
                            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                              if (e.key === 'Enter') {
                                pageActions.handleApplyPageRange();
                              }
                            }}
                            disabled={!pages.numPages}
                            className="w-20 rounded-xl border border-border bg-background px-3 py-2 text-center text-sm transition-all duration-200 focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground md:w-15 md:px-2 md:py-1.5"
                          />
                          <button
                            type="button"
                            className="cursor-pointer rounded-2xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground md:h-8 md:min-w-11 md:px-3 md:py-0 md:text-sm md:leading-none"
                            onClick={pageActions.handleApplyPageRange}
                            disabled={!pages.numPages}
                          >
                            {t('적용')}
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-2 md:w-full md:flex-col md:gap-2">
                        <button
                          className="cursor-pointer rounded-2xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-muted md:w-full"
                          onClick={pageActions.handleSelectAllPages}
                        >
                          {t('전체 선택')}
                        </button>
                        <button
                          className="cursor-pointer rounded-2xl border border-destructive/20 bg-background px-4 py-2 text-sm font-medium text-destructive transition-colors duration-200 hover:bg-destructive/5 md:w-full"
                          onClick={pageActions.handleClearAllPages}
                        >
                          {t('전체 해제')}
                        </button>
                        <button
                          className={cn(
                            'cursor-pointer rounded-2xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-muted md:hidden',
                            pages.isPreviewVisible &&
                              'border-primary bg-primary text-primary-foreground',
                          )}
                          type="button"
                          onClick={() => pageActions.setIsPreviewVisible((prev: boolean) => !prev)}
                        >
                          {pages.isPreviewVisible ? t('미리보기 끄기') : t('미리보기 켜기')}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* PDF 페이지 그리드 */}
                  {upload.uploadedUrl && (
                    <div
                      className="mt-4 rounded-2xl border border-border bg-background p-5 md:p-4"
                      ref={pages.pdfPreviewRef}
                    >
                      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {t('선택된 페이지 수: ')}
                        </span>
                        <Badge variant="default" className="rounded-full">
                          {pages.selectedPages.length}/{pages.numPages ?? 0}
                        </Badge>
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
                        >
                          <div className="relative">
                            <div
                              className="grid max-h-[360px] grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3 overflow-y-auto p-1.5"
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
                                        'relative cursor-pointer overflow-hidden rounded-xl border-2 border-transparent bg-muted text-center transition-all duration-200 hover:z-10 hover:scale-[1.02] hover:shadow-md',
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
            <div className="mt-6 space-y-6 lg:mt-0">
              {/* ─── 스텝 1: 퀴즈 타입 ─── */}
              <Card className="rounded-2xl border border-border">
                <CardHeader>
                  <CardTitle>
                    <TextAnimate
                      animation="slideUp"
                      by="word"
                      className="text-2xl font-bold tracking-tight md:text-xl"
                    >
                      {t('퀴즈 타입을 선택하세요')}
                    </TextAnimate>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* 세그먼트 컨트롤 */}
                  <div className="flex gap-3 md:flex-wrap md:gap-2">
                    {quizTypes.map((type) => (
                      <button
                        key={type.key}
                        className={cn(
                          'cursor-pointer rounded-2xl border border-border bg-background px-6 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:border-primary md:flex-1 md:px-4 md:py-2',
                          options.questionType === type.key &&
                            'border-primary bg-primary text-primary-foreground',
                        )}
                        onClick={() => {
                          optionActions.handleQuestionTypeChange(type.key, type.label);
                        }}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <type.icon className="size-4" strokeWidth={1.8} />
                          {type.label}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* 난이도 미리보기 카드 */}
                  <div className="mt-6 rounded-2xl border border-border bg-muted p-6 md:p-4">
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
                      className="text-2xl font-bold tracking-tight md:text-xl"
                    >
                      {t('문제 개수를 지정하세요')}
                    </TextAnimate>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center rounded-2xl border border-border bg-muted p-8 md:p-6">
                    <div className="text-[4rem] font-black leading-none tracking-tight text-primary md:text-[3rem]">
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
                      className="text-2xl font-bold tracking-tight md:text-xl"
                    >
                      {t('문제를 생성하세요')}
                    </TextAnimate>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* 생성 상태 영역 */}
                  <div className="flex min-h-[140px] items-center justify-center rounded-2xl border border-border bg-muted p-8 text-center md:min-h-[100px] md:p-5">
                    {isWaitingForFirstQuiz ? (
                      <div className="flex flex-col items-center">
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
                          <p className="animate-fade-in-slide-down pt-2.5 text-sm text-muted-foreground opacity-0">
                            {t('현재 생성중입니다 조금만 더 기다려주세요!')}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="m-0 text-sm text-muted-foreground">
                        {t('문서를 분석하고 문제를 생성하려면 아래 버튼을 클릭하세요.')}
                      </p>
                    )}
                  </div>

                  {/* 생성 버튼 */}
                  <div className="mt-6 flex flex-col items-center gap-3 md:mb-8">
                    <button
                      className="w-full cursor-pointer rounded-2xl border-none bg-primary py-5 text-lg font-bold text-primary-foreground transition-opacity duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground md:py-4 md:text-base"
                      onClick={generationActions.generateQuestions}
                      disabled={
                        !upload.uploadedUrl || isWaitingForFirstQuiz || !pages.selectedPages.length
                      }
                    >
                      {isWaitingForFirstQuiz ? t('생성 중...') : t('문제 생성하기')}
                    </button>
                    {!isWaitingForFirstQuiz &&
                      !pages.selectedPages.length &&
                      pages.numPages === null && (
                        <p className="mt-1 text-center text-sm text-muted-foreground">
                          {t('페이지 정보를 불러오는 중입니다. 잠시만 기다려주세요.')}
                        </p>
                      )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : !upload.uploadedUrl ? (
          /* 파일 미업로드 상태: 풀폭 드래그 영역 */
          <div
            className={cn(
              'group relative overflow-hidden rounded-3xl border-2 border-dashed border-border bg-background transition-all duration-300',
              upload.isDragging && 'border-primary bg-primary/5 shadow-lg shadow-primary/10',
            )}
            onDragOver={uploadActions.handleDragOver}
            onDragEnter={uploadActions.handleDragEnter}
            onDragLeave={uploadActions.handleDragLeave}
            onDrop={uploadActions.handleDrop}
          >
            {isWaitingForFirstQuiz && !upload.uploadedUrl ? (
              /* 업로드 진행 중 */
              <div className="flex flex-col items-center px-8 py-20 text-center md:px-5 md:py-14">
                <div className="mb-6 size-14 animate-spin rounded-full border-4 border-muted-foreground/20 border-t-primary" />
                <div className="text-lg font-semibold text-foreground md:text-base">
                  {t('파일 업로드 중...')}
                  {Math.floor(upload.uploadElapsedTime / 1000)}
                  {t('초')}
                </div>
                {upload.fileExtension && upload.fileExtension !== 'pdf' && (
                  <div className="mt-4 max-w-[400px] text-sm leading-relaxed text-muted-foreground md:max-w-[90%]">
                    <strong className="text-foreground">
                      {upload.fileExtension.toUpperCase()}
                    </strong>{' '}
                    {t('파일을 PDF로 변환하고 있어요')}
                    <br />
                    <span className="text-xs italic">
                      {t('파일 크기에 따라 시간이 소요될 수 있습니다')}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* 상단: 드래그 영역 */}
                <div className="flex flex-col items-center px-8 pt-12 pb-6 text-center md:px-5 md:pt-9 md:pb-4">
                  {/* 아이콘 */}
                  <div className="relative mb-5 md:mb-4">
                    <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 md:size-16">
                      <ArrowUpFromLine
                        className="size-8 text-primary md:size-6"
                        strokeWidth={1.5}
                      />
                    </div>
                    <div className="absolute -inset-2 animate-pulse rounded-full border border-primary/20" />
                  </div>

                  <h2 className="mb-2 text-xl font-bold tracking-tight text-foreground md:mb-1.5 md:text-lg">
                    <TextAnimate animation="slideUp" by="word">
                      {t('파일을 여기에 드래그하세요')}
                    </TextAnimate>
                  </h2>
                  <p className="mb-4 text-sm text-muted-foreground md:mb-3">{t('또는')}</p>

                  <div className="relative inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all duration-200 hover:shadow-lg hover:shadow-primary/30 md:px-5 md:py-2">
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
                <div className="bg-gradient-to-b from-transparent to-muted/40 px-8 pt-4 pb-5 md:px-5 md:pt-3 md:pb-4">
                  <ul className="mx-auto grid w-fit list-none gap-3 p-0 text-left">
                    <li className="flex flex-wrap items-baseline justify-start gap-1.5 md:flex-col md:items-start md:gap-0.5">
                      <span className="min-w-[72px] text-xs tracking-wide md:block md:w-full">
                        {t('크기 제한')}
                      </span>
                      <span className="font-semibold text-foreground md:block md:w-full">
                        <Package className="inline size-4" /> {MAX_FILE_SIZE / 1024 / 1024}MB
                      </span>
                    </li>
                    <li className="flex flex-wrap items-baseline justify-start gap-1.5 md:flex-col md:items-start md:gap-0.5">
                      <span className="min-w-[72px] text-xs tracking-wide md:block md:w-full">
                        {t('지원하는 파일')}
                      </span>
                      <span className="font-semibold text-foreground md:block md:w-full">
                        <CheckCircle className="inline size-4" /> {SUPPORTED_EXTENSIONS.join(', ')}
                      </span>
                    </li>
                  </ul>
                  <p className="mt-3 text-center text-[10px] leading-relaxed text-muted-foreground/70">
                    {t('파일은 상업적 목적, AI 학습 목적으로 사용되지 않습니다.')}
                    {' · '}
                    {t('24시간 후 자동 삭제되며 별도로 저장, 공유되지 않습니다.')}
                  </p>
                </div>
              </>
            )}
          </div>
        ) : null}

        {/* ─── 생성 완료 결과 ─── */}
        {generation.problemSetId && (
          <Card className="mt-8 rounded-2xl border border-border">
            <CardHeader>
              <CardTitle className="text-2xl font-bold tracking-tight md:text-xl">
                {t('생성된 문제')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex w-full flex-wrap items-center gap-6 rounded-2xl border border-border bg-muted p-6 md:flex-col md:items-start md:gap-3 md:p-4">
                <div className="flex items-center gap-4 md:gap-3">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-background md:size-10">
                    <CheckCircle className="size-6 text-primary md:size-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="break-words text-lg font-bold text-foreground md:text-base">
                      {safeFileName}
                    </div>
                  </div>
                </div>
                <div className="ml-auto flex max-w-full shrink-0 flex-wrap items-center gap-3 md:ml-0 md:w-full md:flex-col md:gap-2">
                  <button
                    className="cursor-pointer rounded-2xl border border-border bg-background px-5 py-2.5 text-sm font-medium text-destructive transition-colors duration-200 hover:bg-muted md:w-full md:py-2.5"
                    onClick={commonActions.handleRemoveFile}
                  >
                    {t('다른 파일 넣기')}
                  </button>
                  <button
                    className="cursor-pointer rounded-2xl border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-muted md:w-full md:py-2.5"
                    onClick={commonActions.handleReCreate}
                  >
                    {t('다른 문제 생성')}
                  </button>
                  <button
                    className="cursor-pointer rounded-2xl border-none bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-opacity duration-200 hover:opacity-90 md:w-full md:py-2.5"
                    onClick={generationActions.handleNavigateToQuiz}
                  >
                    {t('문제 풀기')}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <RecentChanges />
        {ui.showHelp && <Help />}
      </div>

      <Footer />
    </div>
  );
};

/* 쿼리 파라미터 기반 변형 스위칭 (compare/mix 페이지용) */
/* 기존 유지 디자인 (참고용) */
const MakeQuizDesignA_ConceptMid = lazy(() => import('./MakeQuizDesignA_ConceptMid'));
const MakeQuizDesignB_PolishMid = lazy(() => import('./MakeQuizDesignB_PolishMid'));
const MakeQuizDesignB_PolishMax = lazy(() => import('./MakeQuizDesignB_PolishMax'));

/* 새 디자인 변형 8종 */
const MakeQuizDesign_A = lazy(() => import('./MakeQuizDesign_A'));
const MakeQuizDesign_B = lazy(() => import('./MakeQuizDesign_B'));
const MakeQuizDesign_C = lazy(() => import('./MakeQuizDesign_C'));
const MakeQuizDesign_D = lazy(() => import('./MakeQuizDesign_D'));
const MakeQuizDesign_E = lazy(() => import('./MakeQuizDesign_E'));
const MakeQuizDesign_F = lazy(() => import('./MakeQuizDesign_F'));
const MakeQuizDesign_G = lazy(() => import('./MakeQuizDesign_G'));
const MakeQuizDesign_H = lazy(() => import('./MakeQuizDesign_H'));

const MQ_VARIANTS: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  '1': MakeQuizDesignA_ConceptMid,
  '2': MakeQuizDesignB_PolishMid,
  '3': MakeQuizDesignB_PolishMax,
  '4': MakeQuizDesign_A,
  '5': MakeQuizDesign_B,
  '6': MakeQuizDesign_C,
  '7': MakeQuizDesign_D,
  '8': MakeQuizDesign_E,
  '9': MakeQuizDesign_F,
  '10': MakeQuizDesign_G,
  '11': MakeQuizDesign_H,
};

const MakeQuizWithVariant = () => {
  const [searchParams] = useSearchParams();
  const variant = searchParams.get('mq');
  const VariantComponent = variant ? MQ_VARIANTS[variant] : null;

  if (VariantComponent) {
    return (
      <Suspense fallback={null}>
        <VariantComponent />
      </Suspense>
    );
  }
  return <MakeQuiz />;
};

export default MakeQuizWithVariant;
