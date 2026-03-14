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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/components/tabs';
import { Badge } from '@/shared/ui/components/badge';

/** 퀴즈 유형 옵션 */
interface QuizTypeOption {
  key: QuestionType;
  label: string;
  icon: LucideIcon;
}

/** Compact Dashboard 디자인 — 고밀도 Notion/Linear 스타일 */
const MakeQuizDesign_F: React.FC = () => {
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

  /** 퀴즈 유형 목록 */
  const quizTypes: QuizTypeOption[] = [
    { key: 'MULTIPLE', label: t('객관식'), icon: ListChecks },
    { key: 'BLANK', label: t('빈칸 넣기'), icon: PenLine },
    { key: 'OX', label: t('OX 퀴즈'), icon: CircleDot },
  ];

  /** 현재 난이도 설명 */
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
        {/* ─── 파일 미업로드: 컴팩트 업로드 영역 ─── */}
        {!upload.uploadedUrl && (
          <div className="rounded-lg border border-border/50 bg-card p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">01</span>
              <h2 className="text-sm font-semibold text-foreground">{t('파일을 업로드하세요')}</h2>
            </div>

            <div
              className={cn(
                'flex flex-col items-center justify-center rounded-lg border border-dashed border-border/50 bg-background px-4 py-10 text-center transition-colors duration-200 md:py-8',
                upload.isDragging && 'border-primary bg-primary/5',
              )}
              onDragOver={uploadActions.handleDragOver}
              onDragEnter={uploadActions.handleDragEnter}
              onDragLeave={uploadActions.handleDragLeave}
              onDrop={uploadActions.handleDrop}
            >
              {/* 업로드 중 */}
              {isWaitingForFirstQuiz ? (
                <div className="flex flex-col items-center">
                  <div className="mb-3 size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
                  <div className="text-sm font-medium text-foreground">
                    {t('파일 업로드 중...')}
                    {Math.floor(upload.uploadElapsedTime / 1000)}
                    {t('초')}
                  </div>
                  {upload.fileExtension && upload.fileExtension !== 'pdf' && (
                    <div className="mt-2 max-w-[300px] text-xs leading-relaxed text-muted-foreground">
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
                  <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-muted">
                    <Cloud className="size-5 text-muted-foreground" />
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    {t('파일을 여기에 드래그하세요')}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{t('또는')}</p>
                  <div className="relative mt-3 inline-block cursor-pointer rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity duration-200 hover:opacity-90">
                    {t('파일 선택하기')}
                    <input
                      type="file"
                      accept={acceptExtensions}
                      onChange={uploadActions.handleFileInput}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                  </div>
                  {/* 파일 정보 */}
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {t('크기 제한')} {MAX_FILE_SIZE / 1024 / 1024}MB
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {SUPPORTED_EXTENSIONS.join(', ')}
                    </Badge>
                  </div>
                  <div className="mt-3 max-w-sm text-xs leading-relaxed text-muted-foreground">
                    {t('파일은 상업적 목적, AI 학습 목적으로 사용되지 않습니다.')}
                    <br />
                    {t('24시간 후 자동 삭제되며 별도로 저장, 공유되지 않습니다.')}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ─── 2컬럼 대시보드 (업로드 후, 생성 전) ─── */}
        {upload.uploadedUrl && !generation.problemSetId && (
          <div className="lg:grid lg:grid-cols-2 lg:gap-4">
            {/* ═══ 좌측: 파일 + PDF 미리보기 ═══ */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-lg border border-border/50 bg-card p-3">
                {/* 미니 툴바: 파일명 + 크기 인라인 */}
                <div className="mb-2 flex items-center gap-2 border-b border-border/50 pb-2">
                  <FileText className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-xs font-medium text-foreground">
                    {safeFileName}
                  </span>
                  {safeFileSize && (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      ({(safeFileSize / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  )}
                  <button
                    className="ml-auto shrink-0 cursor-pointer rounded-md px-2 py-0.5 text-xs text-destructive transition-colors duration-200 hover:bg-destructive/5"
                    onClick={commonActions.handleRemoveFile}
                  >
                    {t('삭제')}
                  </button>
                </div>

                {/* PDF 페이지 그리드 (소형 썸네일) */}
                {upload.uploadedUrl && (
                  <div ref={pages.pdfPreviewRef}>
                    <div className="mb-2 flex items-center gap-1.5 text-xs">
                      <span className="text-muted-foreground">{t('선택된 페이지 수: ')}</span>
                      <Badge variant="secondary" className="px-1.5 py-0 text-xs">
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
                            className="grid max-h-[350px] grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2 overflow-y-auto p-1"
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
                                      'relative cursor-pointer overflow-hidden rounded-md border border-transparent bg-background text-center transition-all duration-150 hover:z-10 hover:scale-[1.02]',
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
                                      width={100}
                                      renderTextLayer={false}
                                      renderAnnotationLayer={false}
                                    />

                                    <p
                                      className={cn(
                                        'mt-1 flex items-center justify-center pb-1 text-xs text-muted-foreground',
                                        "before:mr-1 before:inline-block before:size-3 before:rounded-full before:border before:border-border before:bg-background before:content-['']",
                                        isSelected &&
                                          "font-semibold text-foreground before:border-primary before:bg-primary before:bg-[url(\"data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2016%2016'%3e%3cpath%20fill='none'%20stroke='white'%20stroke-linecap='round'%20stroke-linejoin='round'%20stroke-width='2'%20d='M4%208l3%203%205-5'/%3e%3c/svg%3e\")]",
                                      )}
                                    >
                                      {pageNumber}
                                    </p>
                                  </div>
                                );
                              },
                            )}
                            {pages.visiblePageCount < (pages.numPages ?? 0) && (
                              <div className="col-span-full mt-2 flex flex-col items-center justify-center rounded-md bg-muted p-3 text-muted-foreground">
                                <div className="mb-1 size-4 animate-spin rounded-full border-2 border-border border-t-primary" />
                                <p className="m-0 text-xs">
                                  {t('더 많은 페이지 로딩 중... (')}
                                  {pages.visiblePageCount}/{pages.numPages})
                                </p>
                              </div>
                            )}
                          </div>

                          {/* 페이지 호버 미리보기 */}
                          {pages.isPreviewVisible && pages.hoveredPage && (
                            <div
                              className="pointer-events-none absolute z-30 rounded-lg bg-background p-2 shadow-md transition-[opacity,top] duration-200"
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

            {/* ═══ 우측: Tabs로 "설정" | "생성" 분할 ═══ */}
            <div className="mt-4 lg:mt-0">
              <Tabs defaultValue="settings" className="w-full">
                <div className="rounded-lg border border-border/50 bg-card">
                  <TabsList className="w-full justify-start rounded-none border-b border-border/50 bg-transparent p-0">
                    <TabsTrigger
                      value="settings"
                      className="rounded-none border-b-2 border-transparent px-4 py-2 text-xs font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                    >
                      {t('설정')}
                    </TabsTrigger>
                    <TabsTrigger
                      value="generate"
                      className="rounded-none border-b-2 border-transparent px-4 py-2 text-xs font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                    >
                      {t('생성')}
                    </TabsTrigger>
                  </TabsList>

                  {/* ─── 설정 탭 ─── */}
                  <TabsContent value="settings" className="p-3">
                    {/* 퀴즈 타입 */}
                    <div className="mb-4">
                      <div className="mb-2 flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">01</span>
                        <h3 className="text-xs font-semibold text-foreground">
                          {t('퀴즈 타입을 선택하세요')}
                        </h3>
                      </div>
                      <div className="flex gap-1.5">
                        {quizTypes.map((type) => (
                          <button
                            key={type.key}
                            className={cn(
                              'flex-1 cursor-pointer rounded-lg border border-border/50 bg-background px-2 py-1.5 text-xs font-medium text-muted-foreground transition-all duration-150 hover:border-primary',
                              options.questionType === type.key &&
                                'border-primary bg-primary text-primary-foreground',
                            )}
                            onClick={() => {
                              optionActions.handleQuestionTypeChange(type.key, type.label);
                            }}
                          >
                            <span className="inline-flex items-center gap-1">
                              <type.icon className="size-3" strokeWidth={1.8} />
                              {type.label}
                            </span>
                          </button>
                        ))}
                      </div>

                      {/* 난이도 미리보기 */}
                      <div className="mt-2 rounded-lg border border-border/50 bg-background p-2">
                        <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {currentLevel?.title}
                        </div>
                        <p className="m-0 whitespace-pre-wrap break-keep text-xs leading-relaxed text-foreground md:break-words">
                          {currentLevel?.question}
                        </p>
                        {currentLevel?.options && currentLevel.options.length > 0 && (
                          <div className="mt-1.5 flex flex-col gap-1">
                            {currentLevel.options.map((option: string, index: number) => (
                              <div
                                key={`${option}-${index}`}
                                className="flex items-center rounded-md bg-muted/50 px-2 py-1"
                              >
                                <span className="mr-1.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-background text-xs font-bold text-foreground">
                                  {index + 1}
                                </span>
                                <span className="whitespace-pre-wrap break-keep text-xs leading-relaxed text-foreground md:break-words">
                                  {option}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 문제 개수 */}
                    <div className="mb-4">
                      <div className="mb-2 flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">02</span>
                        <h3 className="text-xs font-semibold text-foreground">
                          {t('문제 개수를 지정하세요')}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-background p-3">
                        <div className="text-2xl font-black leading-none text-foreground">
                          {options.questionCount}
                        </div>
                        <span className="text-xs text-muted-foreground">{t('문제')}</span>
                        <div className="flex-1">
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
                            className="h-1 w-full accent-primary"
                          />
                          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                            <span>5</span>
                            <span>10</span>
                            <span>15</span>
                            <span>20</span>
                            <span>25</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 페이지 선택 */}
                    <div>
                      <div className="mb-2 flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">03</span>
                        <h3 className="text-xs font-semibold text-foreground">
                          {t('특정 페이지를 지정하세요')}
                        </h3>
                        <Badge variant="secondary" className="ml-auto px-1.5 py-0 text-xs">
                          {t('최대 ')}
                          {MAX_SELECT_PAGES}
                          {t(' 페이지')}
                        </Badge>
                      </div>
                      <div className="rounded-lg border border-border/50 bg-background p-2">
                        <div className="flex flex-wrap items-center gap-2 md:flex-col md:items-stretch">
                          <div className="flex flex-1 flex-wrap items-center gap-1.5 md:flex-col md:items-start md:gap-1">
                            <span className="text-xs text-muted-foreground">
                              {t('원하는 페이지 입력:')}
                            </span>
                            <div className="flex flex-nowrap items-center gap-1.5 md:w-full md:justify-center">
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
                                className="w-14 rounded-md border border-border/50 bg-card px-2 py-1 text-center text-xs transition-all duration-150 focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:text-muted-foreground"
                              />
                              <span className="text-xs text-muted-foreground">~</span>
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
                                className="w-14 rounded-md border border-border/50 bg-card px-2 py-1 text-center text-xs transition-all duration-150 focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:text-muted-foreground"
                              />
                              <button
                                type="button"
                                className="cursor-pointer rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground transition-opacity duration-150 hover:opacity-90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                                onClick={pageActions.handleApplyPageRange}
                                disabled={!pages.numPages}
                              >
                                {t('적용')}
                              </button>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 md:w-full md:flex-col">
                            <button
                              className="cursor-pointer rounded-md border border-border/50 bg-card px-2.5 py-1 text-xs font-medium text-foreground transition-colors duration-150 hover:bg-muted md:w-full"
                              onClick={pageActions.handleSelectAllPages}
                            >
                              {t('전체 선택')}
                            </button>
                            <button
                              className="cursor-pointer rounded-md border border-border/50 bg-card px-2.5 py-1 text-xs font-medium text-destructive transition-colors duration-150 hover:bg-destructive/5 md:w-full"
                              onClick={pageActions.handleClearAllPages}
                            >
                              {t('전체 해제')}
                            </button>
                            <button
                              className={cn(
                                'cursor-pointer rounded-md border border-border/50 bg-card px-2.5 py-1 text-xs font-medium text-foreground transition-colors duration-150 hover:bg-muted md:hidden',
                                pages.isPreviewVisible &&
                                  'border-primary bg-primary text-primary-foreground',
                              )}
                              type="button"
                              onClick={() =>
                                pageActions.setIsPreviewVisible((prev: boolean) => !prev)
                              }
                            >
                              {pages.isPreviewVisible ? t('미리보기 끄기') : t('미리보기 켜기')}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* ─── 생성 탭 ─── */}
                  <TabsContent value="generate" className="p-3">
                    <div className="mb-3 flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">04</span>
                      <h3 className="text-xs font-semibold text-foreground">
                        {t('문제를 생성하세요')}
                      </h3>
                    </div>

                    {/* 생성 상태 */}
                    <div className="flex min-h-[80px] items-center justify-center rounded-lg border border-border/50 bg-background p-4 text-center">
                      {isWaitingForFirstQuiz ? (
                        <div className="flex flex-col items-center">
                          <div className="mb-3 size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
                          <p className="m-0 text-xs">
                            {t('문제 생성 중...')}
                            {Math.floor(generation.generationElapsedTime / 1000)}
                            {t('초')}
                            <br />
                            <span className="mt-1 inline-block text-xs text-muted-foreground">
                              {t('생성된 문제의 개수는 간혹 지정한 개수와 맞지 않을 수 있습니다.')}
                            </span>
                          </p>
                          {generation.showWaitMessage && (
                            <p className="animate-fade-in-slide-down pt-2 text-xs text-muted-foreground opacity-0">
                              {t('현재 생성중입니다 조금만 더 기다려주세요!')}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="m-0 text-xs text-muted-foreground">
                          {t('문서를 분석하고 문제를 생성하려면 아래 버튼을 클릭하세요.')}
                        </p>
                      )}
                    </div>

                    {/* 생성 버튼 */}
                    <div className="mt-3 flex flex-col items-center gap-2">
                      <button
                        className="w-full cursor-pointer rounded-lg border-none bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-opacity duration-150 hover:opacity-90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                        onClick={generationActions.generateQuestions}
                        disabled={
                          !upload.uploadedUrl ||
                          isWaitingForFirstQuiz ||
                          !pages.selectedPages.length
                        }
                      >
                        {isWaitingForFirstQuiz ? t('생성 중...') : t('문제 생성하기')}
                      </button>
                      {!isWaitingForFirstQuiz &&
                        !pages.selectedPages.length &&
                        pages.numPages === null && (
                          <p className="text-center text-xs text-muted-foreground">
                            {t('페이지 정보를 불러오는 중입니다. 잠시만 기다려주세요.')}
                          </p>
                        )}
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>
        )}

        {/* ─── 생성 완료 결과 ─── */}
        {generation.problemSetId && (
          <div className="rounded-lg border border-border/50 bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold text-foreground">{t('생성된 문제')}</h2>
            <div className="flex w-full flex-wrap items-center gap-4 rounded-lg border border-border/50 bg-background p-3 md:flex-col md:items-start md:gap-2">
              <div className="flex items-center gap-2">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
                  <CheckCircle className="size-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-foreground">{safeFileName}</div>
                </div>
              </div>
              <div className="ml-auto flex max-w-full shrink-0 flex-wrap items-center gap-2 md:ml-0 md:w-full md:flex-col md:gap-1.5">
                <button
                  className="cursor-pointer rounded-md border border-border/50 bg-card px-3 py-1.5 text-xs font-medium text-destructive transition-colors duration-150 hover:bg-destructive/5 md:w-full"
                  onClick={commonActions.handleRemoveFile}
                >
                  {t('다른 파일 넣기')}
                </button>
                <button
                  className="cursor-pointer rounded-md border border-border/50 bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors duration-150 hover:bg-muted md:w-full"
                  onClick={commonActions.handleReCreate}
                >
                  {t('다른 문제 생성')}
                </button>
                <button
                  className="cursor-pointer rounded-md border-none bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity duration-150 hover:opacity-90 md:w-full"
                  onClick={generationActions.handleNavigateToQuiz}
                >
                  {t('문제 풀기')}
                </button>
              </div>
            </div>
          </div>
        )}

        <RecentChanges />
        {ui.showHelp && <Help />}
      </div>

      <Footer />
    </div>
  );
};

export default MakeQuizDesign_F;
