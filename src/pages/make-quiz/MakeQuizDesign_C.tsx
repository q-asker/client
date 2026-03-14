import { useMemo } from 'react';
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
import { useNavigate, useSearchParams } from 'react-router-dom';
import RecentChanges from '#widgets/recent-changes';
import { cn } from '@/shared/ui/lib/utils';
import type { QuestionType, QuizLevel } from '#features/prepare-quiz';
import {
  ListChecks,
  PenLine,
  CircleDot,
  Cloud,
  Package,
  CheckCircle,
  FileText,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/components/tabs';
import { Card, CardContent } from '@/shared/ui/components/card';
import { Badge } from '@/shared/ui/components/badge';

/** 퀴즈 유형 옵션 */
interface QuizTypeOption {
  key: QuestionType;
  label: string;
  icon: LucideIcon;
}

/** Rounded Pastel 디자인 — 둥근 파스텔 카드, 부드럽고 따뜻한 느낌 */
const MakeQuizDesign_C: React.FC = () => {
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
    <div className="flex min-h-screen flex-col bg-background">
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
              <div className="relative overflow-hidden rounded-3xl bg-primary/5 p-6">
                {/* 파스텔 원형 워터마크 */}
                <div className="absolute -top-6 -right-6 size-16 rounded-full bg-primary/10" />

                <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-xl">
                  {t('업로드된 파일')}
                </h2>

                {/* 파일 정보 영역 */}
                <div
                  className={cn(
                    'mt-4 flex flex-col items-center justify-center rounded-[2rem] bg-background px-8 py-10 text-center transition-colors duration-200 md:px-5 md:py-8',
                    upload.isDragging && 'bg-primary/5',
                  )}
                  onDragOver={uploadActions.handleDragOver}
                  onDragEnter={uploadActions.handleDragEnter}
                  onDragLeave={uploadActions.handleDragLeave}
                  onDrop={uploadActions.handleDrop}
                >
                  <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10 md:size-14">
                    <FileText className="size-8 text-primary md:size-6" />
                  </div>
                  <div className="text-lg font-bold text-foreground">{safeFileName}</div>
                  {safeFileSize && (
                    <Badge variant="secondary" className="mt-2 rounded-full">
                      {(safeFileSize / 1024 / 1024).toFixed(2)} MB
                    </Badge>
                  )}
                  <button
                    className="mt-6 cursor-pointer rounded-full border-none bg-destructive px-6 py-2.5 text-sm font-semibold text-background transition-opacity duration-200 hover:opacity-90 md:px-5 md:py-2"
                    onClick={commonActions.handleRemoveFile}
                  >
                    {t('✕ 파일 삭제')}
                  </button>
                </div>

                {/* PDF 페이지 그리드 */}
                {upload.uploadedUrl && (
                  <div
                    className="mt-4 rounded-3xl bg-background p-5 md:p-4"
                    ref={pages.pdfPreviewRef}
                  >
                    <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{t('선택된 페이지 수: ')}</span>
                      <span className="inline-flex items-center justify-center rounded-full bg-primary px-3 py-0.5 text-xs font-bold text-primary-foreground">
                        {pages.selectedPages.length}/{pages.numPages ?? 0}
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
                                      'relative cursor-pointer overflow-hidden rounded-2xl bg-muted text-center transition-all duration-200 hover:z-10 hover:scale-[1.02]',
                                      isSelected && 'ring-2 ring-primary',
                                      isHovered && 'ring-2 ring-muted-foreground',
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
                              <div className="col-span-full mt-4 flex flex-col items-center justify-center rounded-2xl bg-muted p-5 text-muted-foreground">
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
                              className="pointer-events-none absolute z-30 rounded-3xl bg-background p-3 shadow-lg transition-[opacity,top] duration-200"
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
              </div>
            </div>

            {/* 우측: 퀴즈 옵션 4개 섹션 */}
            <div className="mt-6 space-y-6 lg:mt-0">
              {/* ─── 섹션 1: 퀴즈 타입 ─── */}
              <section className="relative overflow-hidden rounded-3xl bg-accent/10 p-6">
                {/* 파스텔 원형 워터마크 */}
                <div className="absolute -top-6 -right-6 size-16 rounded-full bg-primary/10" />

                <div className="relative z-10">
                  <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-xl">
                    {t('퀴즈 타입을 선택하세요')}
                  </h2>
                </div>

                {/* Tabs 컴포넌트로 퀴즈 타입 선택 */}
                <Tabs
                  value={options.questionType}
                  onValueChange={(value: string) => {
                    const selected = quizTypes.find((qt) => qt.key === value);
                    if (selected) {
                      optionActions.handleQuestionTypeChange(selected.key, selected.label);
                    }
                  }}
                  className="mt-6"
                >
                  <TabsList className="w-full rounded-full bg-background">
                    {quizTypes.map((type) => (
                      <TabsTrigger
                        key={type.key}
                        value={type.key}
                        className="flex-1 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <type.icon className="size-4" strokeWidth={1.8} />
                          {type.label}
                        </span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>

                {/* 난이도 미리보기 카드 */}
                <div className="mt-6 rounded-[2rem] bg-background p-6 md:p-4">
                  <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {currentLevel?.title}
                  </div>
                  <div className="rounded-2xl bg-muted/50 p-4">
                    <p className="m-0 whitespace-pre-wrap break-keep text-sm leading-relaxed text-foreground md:break-words">
                      {currentLevel?.question}
                    </p>
                  </div>
                  {currentLevel?.options && currentLevel.options.length > 0 && (
                    <div className="mt-4 flex flex-col gap-2">
                      {currentLevel.options.map((option: string, index: number) => (
                        <div
                          key={`${option}-${index}`}
                          className="flex items-center rounded-2xl bg-muted/50 px-4 py-3"
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
              </section>

              {/* ─── 섹션 2: 문제 개수 ─── */}
              <section className="relative overflow-hidden rounded-3xl bg-secondary/10 p-6">
                {/* 파스텔 원형 워터마크 */}
                <div className="absolute -top-6 -right-6 size-16 rounded-full bg-primary/10" />

                <div className="relative z-10">
                  <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-xl">
                    {t('문제 개수를 지정하세요')}
                  </h2>
                </div>

                {/* 대형 숫자 표시 */}
                <div className="mt-6 flex flex-col items-center rounded-[2rem] bg-background p-8 md:p-6">
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
              </section>

              {/* ─── 섹션 3: 페이지 선택 ─── */}
              <section className="relative overflow-hidden rounded-3xl bg-muted p-6">
                {/* 파스텔 원형 워터마크 */}
                <div className="absolute -top-6 -right-6 size-16 rounded-full bg-primary/10" />

                <div className="relative z-10">
                  <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-xl">
                    {t('특정 페이지를 지정하세요')}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t('최대 ')}
                    {MAX_SELECT_PAGES}
                    {t(' 페이지')} {t('선택할 수 있어요')}
                  </p>
                </div>

                {/* 페이지 범위 입력 */}
                <div className="mt-6 flex flex-wrap items-center gap-3 rounded-[2rem] bg-background p-5 md:flex-col md:items-stretch md:p-4">
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
                        className="w-20 rounded-full border-none bg-muted px-3 py-2 text-center text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:text-muted-foreground md:w-15 md:px-2 md:py-1.5"
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
                        className="w-20 rounded-full border-none bg-muted px-3 py-2 text-center text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:text-muted-foreground md:w-15 md:px-2 md:py-1.5"
                      />
                      <button
                        type="button"
                        className="cursor-pointer rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground md:h-8 md:min-w-11 md:px-3 md:py-0 md:text-sm md:leading-none"
                        onClick={pageActions.handleApplyPageRange}
                        disabled={!pages.numPages}
                      >
                        {t('적용')}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2 md:w-full md:flex-col md:gap-2">
                    <button
                      className="cursor-pointer rounded-full bg-muted px-4 py-2 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-muted-foreground/10 md:w-full"
                      onClick={pageActions.handleSelectAllPages}
                    >
                      {t('전체 선택')}
                    </button>
                    <button
                      className="cursor-pointer rounded-full bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive transition-colors duration-200 hover:bg-destructive/20 md:w-full"
                      onClick={pageActions.handleClearAllPages}
                    >
                      {t('전체 해제')}
                    </button>
                    <button
                      className={cn(
                        'cursor-pointer rounded-full bg-muted px-4 py-2 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-muted-foreground/10 md:hidden',
                        pages.isPreviewVisible && 'bg-primary text-primary-foreground',
                      )}
                      type="button"
                      onClick={() => pageActions.setIsPreviewVisible((prev: boolean) => !prev)}
                    >
                      {pages.isPreviewVisible ? t('미리보기 끄기') : t('미리보기 켜기')}
                    </button>
                  </div>
                </div>
              </section>

              {/* ─── 섹션 4: 문제 생성 ─── */}
              <section className="relative overflow-hidden rounded-3xl bg-primary/5 p-6">
                {/* 파스텔 원형 워터마크 */}
                <div className="absolute -top-6 -right-6 size-16 rounded-full bg-primary/10" />

                <div className="relative z-10">
                  <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-xl">
                    {t('문제를 생성하세요')}
                  </h2>
                </div>

                {/* 생성 상태 영역 */}
                <div className="mt-6 flex min-h-[140px] items-center justify-center rounded-[2rem] bg-background p-8 text-center md:min-h-[100px] md:p-5">
                  {isWaitingForFirstQuiz ? (
                    <div className="flex flex-col items-center">
                      <div className="mb-4 size-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
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
                    className="w-full cursor-pointer rounded-full border-none bg-primary py-5 text-lg font-bold text-primary-foreground transition-opacity duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground md:py-4 md:text-base"
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
              </section>
            </div>
          </div>
        ) : !upload.uploadedUrl ? (
          /* 파일 미업로드 상태: 풀폭 드래그 영역 */
          <section className="relative overflow-hidden rounded-3xl bg-primary/5 p-8">
            {/* 파스텔 원형 워터마크 */}
            <div className="absolute -top-6 -right-6 size-16 rounded-full bg-primary/10" />

            <div className="relative z-10">
              <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-xl">
                {t('파일을 업로드하세요')}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('퀴즈를 생성할 문서를 드래그하거나 선택하세요')}
              </p>
            </div>

            {/* 업로드 영역 */}
            <div
              className={cn(
                'mt-6 flex flex-col items-center justify-center rounded-[2rem] bg-background px-8 py-16 text-center transition-colors duration-200 md:px-5 md:py-10',
                upload.isDragging && 'bg-primary/5',
              )}
              onDragOver={uploadActions.handleDragOver}
              onDragEnter={uploadActions.handleDragEnter}
              onDragLeave={uploadActions.handleDragLeave}
              onDrop={uploadActions.handleDrop}
            >
              {/* 파일 업로드 중 */}
              {isWaitingForFirstQuiz && !upload.uploadedUrl ? (
                <div className="flex flex-col items-center">
                  <div className="mb-6 size-14 animate-spin rounded-full border-4 border-muted border-t-primary" />
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
                  {/* 업로드 아이콘 */}
                  <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-primary/10 md:size-16">
                    <Cloud className="size-10 text-primary/60 md:size-8" />
                  </div>
                  <div className="text-lg font-semibold text-foreground md:text-base">
                    {t('파일을 여기에 드래그하세요')}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{t('또는')}</p>
                  <div className="relative mt-4 inline-block cursor-pointer rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity duration-200 hover:opacity-90 md:px-5 md:py-2">
                    {t('파일 선택하기')}
                    <input
                      type="file"
                      accept={acceptExtensions}
                      onChange={uploadActions.handleFileInput}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                  </div>
                  {/* 파일 제한 정보 */}
                  <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground md:flex-col md:gap-2">
                    <Badge variant="secondary" className="rounded-full">
                      {t('크기 제한')} · {MAX_FILE_SIZE / 1024 / 1024}MB
                    </Badge>
                    <Badge variant="secondary" className="rounded-full">
                      {t('지원하는 파일')} · {SUPPORTED_EXTENSIONS.join(', ')}
                    </Badge>
                  </div>
                  <div className="mt-4 max-w-md text-xs leading-relaxed text-muted-foreground">
                    {t('파일은 상업적 목적, AI 학습 목적으로 사용되지 않습니다.')}
                    <br />
                    {t('24시간 후 자동 삭제되며 별도로 저장, 공유되지 않습니다.')}
                  </div>
                </>
              )}
            </div>
          </section>
        ) : null}

        {/* ─── 생성 완료 결과 ─── */}
        {generation.problemSetId && (
          <Card className="mt-8 rounded-3xl border-none bg-primary/5">
            <CardContent className="p-6">
              <h2 className="mb-6 text-2xl font-bold tracking-tight text-foreground md:text-xl">
                {t('생성된 문제')}
              </h2>

              <div className="flex w-full flex-wrap items-center gap-6 rounded-[2rem] bg-background p-6 md:flex-col md:items-start md:gap-3 md:p-4">
                <div className="flex items-center gap-4 md:gap-3">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 md:size-10">
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
                    className="cursor-pointer rounded-full bg-destructive/10 px-5 py-2.5 text-sm font-medium text-destructive transition-colors duration-200 hover:bg-destructive/20 md:w-full md:py-2.5"
                    onClick={commonActions.handleRemoveFile}
                  >
                    {t('다른 파일 넣기')}
                  </button>
                  <button
                    className="cursor-pointer rounded-full bg-muted px-5 py-2.5 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-muted-foreground/10 md:w-full md:py-2.5"
                    onClick={commonActions.handleReCreate}
                  >
                    {t('다른 문제 생성')}
                  </button>
                  <button
                    className="cursor-pointer rounded-full border-none bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-opacity duration-200 hover:opacity-90 md:w-full md:py-2.5"
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

export default MakeQuizDesign_C;
