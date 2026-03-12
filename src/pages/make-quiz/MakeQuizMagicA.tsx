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
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { useNavigate } from 'react-router-dom';
import RecentChanges from '#widgets/recent-changes';
import { cn } from '@/shared/ui/lib/utils';
import type { QuestionType, QuizLevel } from '#features/prepare-quiz';
import { BlurFade } from '@/shared/ui/components/blur-fade';
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

/** 퀴즈 유형 옵션 */
interface QuizTypeOption {
  key: QuestionType;
  label: string;
  icon: LucideIcon;
  desc: string;
}

/** B안 — Floating Card Stack: 플로팅 넘버 뱃지 + 개별 타입 카드 + 대형 숫자 + BlurFade 교차 */
const MakeQuizMagicA: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
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

  /** 퀴즈 유형 목록 (아이콘 + 설명 포함) */
  const quizTypes: QuizTypeOption[] = [
    { key: 'MULTIPLE', label: t('객관식'), icon: ListChecks, desc: t('4개 보기 중 정답 선택') },
    { key: 'BLANK', label: t('빈칸 넣기'), icon: PenLine, desc: t('빈칸에 알맞은 답 입력') },
    { key: 'OX', label: t('OX 퀴즈'), icon: CircleDot, desc: t('참/거짓 판별') },
  ];

  /** 현재 난이도 설명 */
  const currentLevel: { title: string; question: string; options: string[] } | undefined =
    levelDescriptions[options.quizLevel as QuizLevel];

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <Header
        isSidebarOpen={ui.isSidebarOpen}
        toggleSidebar={uiActions.toggleSidebar}
        setIsSidebarOpen={uiActions.setIsSidebarOpen}
        setShowHelp={uiActions.setShowHelp}
      />

      <div className="mx-auto mt-10 flex-1 px-5 md:mt-6 md:w-[90%] md:px-4 lg:w-[65%]">
        {/* === 섹션 1: 파일 업로드 === */}
        <BlurFade delay={0.05} direction="left" inView>
          <section className="relative mb-8 md:mb-6">
            {/* 플로팅 넘버 뱃지 */}
            <span className="absolute -left-3 -top-3 z-10 flex size-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white shadow-sm md:-left-1 md:-top-1 md:size-7 md:text-xs">
              1
            </span>
            <div
              className={cn(
                'overflow-hidden rounded-2xl border border-border bg-background p-10 text-center shadow-card transition-all duration-200 md:p-6',
                upload.isDragging && 'border-primary bg-primary/10 shadow-md',
              )}
              onDragOver={uploadActions.handleDragOver}
              onDragEnter={uploadActions.handleDragEnter}
              onDragLeave={uploadActions.handleDragLeave}
              onDrop={uploadActions.handleDrop}
            >
              {/* 파일 업로드 중일 때 */}
              {isWaitingForFirstQuiz && !upload.uploadedUrl ? (
                <div className="flex flex-col items-center p-8">
                  <div className="mb-4 size-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-lg font-semibold text-muted-foreground md:text-base">
                      {t('파일 업로드 중...')}
                      {Math.floor(upload.uploadElapsedTime / 1000)}
                      {t('초')}
                    </div>
                  </div>
                  {upload.fileExtension && upload.fileExtension !== 'pdf' && (
                    <div className="mt-4 flex max-w-[400px] animate-fade-in-scale items-center gap-3 px-5 py-3 md:max-w-[90%] md:flex-col md:text-center">
                      <div className="text-left text-sm leading-relaxed text-foreground md:text-center md:text-[13px]">
                        <strong className="text-[15px] font-semibold md:text-sm">
                          {upload.fileExtension.toUpperCase()}
                        </strong>
                        {t('파일을 PDF로 변환하고 있어요')}
                        <br />
                        <span className="text-xs italic text-muted-foreground md:text-[11px]">
                          {t('파일 크기에 따라 시간이 소요될 수 있습니다')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : !upload.uploadedUrl ? (
                <>
                  {/* 원형 아이콘 컨테이너 */}
                  <div className="mx-auto mb-5 flex size-20 items-center justify-center rounded-full bg-primary/10 shadow-sm md:size-16">
                    <Cloud className="size-12 md:size-10 text-muted-foreground" />
                  </div>
                  <div className="text-xl font-bold text-foreground md:text-lg">
                    {t('파일을 여기에 드래그하세요')}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{t('또는')}</p>
                  <div className="relative mt-4 inline-block cursor-pointer rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md md:px-5 md:py-2">
                    {t('파일 선택하기')}
                    <input
                      type="file"
                      accept={acceptExtensions}
                      onChange={uploadActions.handleFileInput}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                  </div>
                  {/* 파일 제한 정보 */}
                  <div className="mt-6 flex justify-center gap-6 text-muted-foreground md:flex-col md:items-center md:gap-2">
                    <span className="flex items-center gap-1.5 text-sm">
                      <Package className="inline size-4" />
                      <span className="text-xs text-muted-foreground">{t('크기 제한')}</span>
                      <span className="font-semibold text-foreground">
                        {MAX_FILE_SIZE / 1024 / 1024}MB
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5 text-sm">
                      <CheckCircle className="inline size-4" />
                      <span className="text-xs text-muted-foreground">{t('지원하는 파일')}</span>
                      <span className="font-semibold text-foreground">
                        {SUPPORTED_EXTENSIONS.join(', ')}
                      </span>
                    </span>
                  </div>
                  <div className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    {t('파일은 상업적 목적, AI 학습 목적으로 사용되지 않습니다.')}
                    <br />
                    {t('24시간 후 자동 삭제되며 별도로 저장, 공유되지 않습니다.')}
                  </div>
                </>
              ) : (
                <>
                  <div className="mx-auto mb-5 flex size-20 items-center justify-center rounded-full bg-muted text-4xl shadow-sm md:size-16 md:text-3xl">
                    <FileText className="size-10 md:size-8 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="text-xl font-bold text-foreground md:text-lg">
                      {safeFileName}
                    </div>
                    {safeFileSize && (
                      <span className="mt-1 text-sm text-muted-foreground">
                        ({(safeFileSize / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    )}
                  </div>
                  <button
                    className="mt-5 cursor-pointer rounded-full border border-destructive/30 bg-background px-5 py-2 text-sm font-medium text-destructive transition-colors duration-200 hover:bg-destructive/5 md:px-4 md:py-1.5"
                    onClick={commonActions.handleRemoveFile}
                  >
                    {t('✕ 파일 삭제')}
                  </button>
                </>
              )}
            </div>
          </section>
        </BlurFade>

        {/* === 옵션 패널 === */}
        {upload.uploadedUrl && !generation.problemSetId && (
          <>
            {/* 섹션 2: 퀴즈 타입 — 개별 카드 형태 */}
            <BlurFade delay={0.1} direction="right" inView>
              <section className="relative mb-8 md:mb-6">
                <span className="absolute -left-3 -top-3 z-10 flex size-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white shadow-sm md:-left-1 md:-top-1 md:size-7 md:text-xs">
                  2
                </span>
                <div className="rounded-2xl border border-border bg-background p-6 shadow-card md:p-5">
                  <div className="mb-5 text-lg font-bold text-foreground md:mb-4 md:text-base">
                    {t('1. 퀴즈 타입을 선택하세요!')}
                  </div>
                  {/* 타입 카드 그리드 */}
                  <div className="grid grid-cols-3 gap-3 md:grid-cols-1">
                    {quizTypes.map((type) => (
                      <button
                        key={type.key}
                        className={cn(
                          'flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-border bg-background px-4 py-5 text-center transition-all duration-200 hover:border-primary/60 hover:shadow-sm md:flex-row md:items-center md:gap-3 md:px-4 md:py-3',
                          options.questionType === type.key &&
                            'border-primary bg-primary/10 shadow-sm',
                        )}
                        onClick={() => {
                          optionActions.handleQuestionTypeChange(type.key, type.label);
                        }}
                      >
                        <type.icon
                          className={cn(
                            'size-6 text-muted-foreground md:size-5',
                            options.questionType === type.key && 'text-primary',
                          )}
                          strokeWidth={1.8}
                        />
                        <div className="flex flex-col gap-0.5">
                          <span
                            className={cn(
                              'text-sm font-semibold text-foreground',
                              options.questionType === type.key && 'text-primary',
                            )}
                          >
                            {type.label}
                          </span>
                          <span className="text-[11px] text-muted-foreground">{type.desc}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  {/* 난이도 미리보기 */}
                  <div className="mt-5">
                    <div className="rounded-xl border border-border bg-muted/50 p-4">
                      <div className="mb-2 text-[13px] font-semibold text-muted-foreground">
                        {currentLevel?.title}
                      </div>
                      <div className="rounded-lg bg-background px-3 py-2.5">
                        <p className="m-0 whitespace-pre-wrap break-keep text-[13px] leading-relaxed md:break-words">
                          {currentLevel?.question}
                        </p>
                      </div>
                      {currentLevel?.options && currentLevel.options.length > 0 && (
                        <div className="mt-2.5 flex flex-col gap-2">
                          {currentLevel.options.map((option: string, index: number) => (
                            <div
                              key={`${option}-${index}`}
                              className="flex items-center rounded-lg border border-border bg-background px-2.5 py-2 md:px-3 md:py-2.5"
                            >
                              <span className="mr-2.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                {index + 1}
                              </span>
                              <span className="whitespace-pre-wrap break-keep text-[13px] leading-relaxed md:break-words">
                                {option}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            </BlurFade>

            {/* 섹션 3: 문제 개수 — 대형 중앙 숫자 */}
            <BlurFade delay={0.15} direction="left" inView>
              <section className="relative mb-8 md:mb-6">
                <span className="absolute -left-3 -top-3 z-10 flex size-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white shadow-sm md:-left-1 md:-top-1 md:size-7 md:text-xs">
                  3
                </span>
                <div className="rounded-2xl border border-border bg-background p-6 shadow-card md:p-5">
                  <div className="mb-5 text-lg font-bold text-foreground md:mb-4 md:text-base">
                    {t('2. 문제 개수를 지정하세요!')}
                  </div>
                  {/* 대형 숫자 디스플레이 */}
                  <div className="flex flex-col items-center py-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-6xl font-black tabular-nums text-primary md:text-5xl">
                        {options.questionCount}
                      </span>
                      <span className="text-lg font-medium text-muted-foreground">{t('문제')}</span>
                    </div>
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
                      className="mt-4 h-1.5 w-full max-w-xs accent-primary md:h-[3px]"
                    />
                    {/* 눈금 라벨 */}
                    <div className="mt-2 flex w-full max-w-xs justify-between px-0.5">
                      {[5, 10, 15, 20, 25].map((n) => (
                        <span
                          key={n}
                          className={cn(
                            'text-xs',
                            options.questionCount === n
                              ? 'font-bold text-primary'
                              : 'text-muted-foreground',
                          )}
                        >
                          {n}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            </BlurFade>

            {/* 섹션 4: 페이지 선택 */}
            <BlurFade delay={0.2} direction="right" inView>
              <section className="relative mb-8 md:mb-6">
                <span className="absolute -left-3 -top-3 z-10 flex size-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white shadow-sm md:-left-1 md:-top-1 md:size-7 md:text-xs">
                  4
                </span>
                <div className="rounded-2xl border border-border bg-background p-6 shadow-card md:p-5">
                  <div className="flex flex-col gap-1">
                    <div className="text-lg font-bold text-foreground md:text-base">
                      {t('3. 특정 페이지를 지정하세요!')}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                        {t('최대 ')}
                        {MAX_SELECT_PAGES}
                        {t(' 페이지')}
                      </span>
                      <span>{t('선택할 수 있어요')}</span>
                    </div>
                  </div>
                  <div className="mt-5 flex w-full flex-wrap items-center gap-3 rounded-xl border border-border bg-muted/50 p-4 md:flex-col md:items-stretch md:p-3">
                    <div className="flex flex-1 flex-wrap items-center gap-2 md:flex-col md:items-start md:flex-nowrap md:gap-1.5">
                      <span className="text-left text-sm font-medium text-foreground md:mb-0.5 md:w-full">
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
                          className="w-20 rounded-lg border border-border px-3 py-2 text-center text-base transition-all duration-200 focus:border-primary focus:shadow-focus-ring-sm focus:outline-none disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground md:w-15 md:px-2 md:py-1.5 md:text-sm"
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
                          className="w-20 rounded-lg border border-border px-3 py-2 text-center text-base transition-all duration-200 focus:border-primary focus:shadow-focus-ring-sm focus:outline-none disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground md:w-15 md:px-2 md:py-1.5 md:text-sm"
                        />
                        <button
                          type="button"
                          className="cursor-pointer rounded-full bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:shadow-md disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none md:h-8 md:min-w-11 md:whitespace-nowrap md:px-3 md:py-0 md:text-sm md:leading-none"
                          onClick={pageActions.handleApplyPageRange}
                          disabled={!pages.numPages}
                        >
                          {t('적용')}
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-wrap items-center justify-end gap-2 md:w-full md:flex-col md:items-stretch md:gap-2.5">
                      <button
                        className="cursor-pointer rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors duration-200 hover:bg-primary/8 md:w-full"
                        onClick={pageActions.handleSelectAllPages}
                      >
                        {t('전체 선택')}
                      </button>
                      <button
                        className="cursor-pointer rounded-full border border-destructive/20 bg-background px-4 py-2 text-sm font-medium text-destructive transition-colors duration-200 hover:bg-destructive/5 md:w-full"
                        onClick={pageActions.handleClearAllPages}
                      >
                        {t('전체 해제')}
                      </button>
                      <button
                        className={cn(
                          'cursor-pointer rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-muted md:hidden',
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
                  {upload.uploadedUrl && (
                    <div
                      className="mt-6 rounded-xl border border-border p-4"
                      ref={pages.pdfPreviewRef}
                    >
                      <div className="flex items-center gap-1.5 pb-2 text-sm font-medium text-foreground">
                        <strong>{t('선택된 페이지 수: ')}</strong>
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                          {pages.selectedPages.length}/{pages.numPages ?? 0}
                        </span>
                      </div>
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
                                      'relative cursor-pointer overflow-hidden rounded-lg border-2 border-border text-center transition-all duration-200 hover:z-10 hover:scale-[1.02] hover:shadow-md',
                                      isSelected && 'border-primary shadow-sm',
                                      isHovered && 'border-primary/60 shadow-focus-ring-sm',
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
                                        'mt-2 flex items-center justify-center pb-2 text-sm',
                                        "before:mr-2 before:inline-block before:size-4 before:rounded-[3px] before:border before:border-border before:bg-background before:content-['']",
                                        isSelected &&
                                          "before:border-primary before:bg-primary before:bg-[url(\"data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2016%2016'%3e%3cpath%20fill='none'%20stroke='white'%20stroke-linecap='round'%20stroke-linejoin='round'%20stroke-width='2'%20d='M4%208l3%203%205-5'/%3e%3c/svg%3e\")]",
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
                              <div className="col-span-full mt-4 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted p-5 text-muted-foreground">
                                <div className="mb-2 size-6 animate-spin rounded-full border-2 border-border border-t-primary" />
                                <p className="m-0 text-sm font-medium">
                                  {t('더 많은 페이지 로딩 중... (')}
                                  {pages.visiblePageCount}/{pages.numPages})
                                </p>
                              </div>
                            )}
                          </div>

                          {pages.isPreviewVisible && pages.hoveredPage && (
                            <div
                              className="pointer-events-none absolute z-30 rounded-xl bg-background p-2.5 shadow-card transition-[opacity,top] duration-200"
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
                    </div>
                  )}
                </div>
              </section>
            </BlurFade>

            {/* 섹션 5: 문제 생성 */}
            <BlurFade delay={0.25} direction="left" inView>
              <section className="relative mb-8 md:mb-6">
                <span className="absolute -left-3 -top-3 z-10 flex size-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white shadow-sm md:-left-1 md:-top-1 md:size-7 md:text-xs">
                  5
                </span>
                <div className="rounded-2xl border border-border bg-background p-6 shadow-card md:p-5">
                  <div className="mb-5 text-lg font-bold text-foreground md:mb-4 md:text-base">
                    {t('4. 문제를 생성하세요!')}
                  </div>
                  <div className="flex min-h-[120px] items-center justify-center rounded-xl border border-border bg-muted/50 p-5 text-center md:min-h-[80px] md:p-4">
                    {isWaitingForFirstQuiz ? (
                      <div className="flex flex-col items-center justify-center py-4">
                        <div className="mb-4 size-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
                        <p className="m-0 md:text-sm">
                          {t('문제 생성 중...')}
                          {Math.floor(generation.generationElapsedTime / 1000)}
                          {t('초')}
                          <br />
                          <span className="mt-1.5 inline-block text-[13px] tracking-tight text-muted-foreground opacity-90">
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
                      <p className="m-0 text-muted-foreground md:text-sm">
                        {t('문서를 분석하고 문제를 생성하려면 아래 버튼을 클릭하세요.')}
                      </p>
                    )}
                  </div>
                  <div className="mt-6 flex flex-col items-center gap-3">
                    <button
                      className="w-full max-w-sm cursor-pointer rounded-xl border-none bg-primary px-8 py-4 text-base font-bold text-white shadow-sm transition-all duration-200 hover:shadow-md disabled:cursor-not-allowed disabled:bg-muted-foreground disabled:shadow-none md:max-w-none md:py-3 md:text-sm"
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
                        <p className="text-center text-sm text-muted-foreground">
                          {t('페이지 정보를 불러오는 중입니다. 잠시만 기다려주세요.')}
                        </p>
                      )}
                  </div>
                </div>
              </section>
            </BlurFade>
          </>
        )}

        {/* === 생성 완료 === */}
        {generation.problemSetId && (
          <BlurFade delay={0.1} direction="up" inView>
            <section className="relative mb-8">
              <span className="absolute -left-3 -top-3 z-10 flex size-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white shadow-sm">
                ✓
              </span>
              <div className="rounded-2xl border border-border bg-background p-6 shadow-card">
                <div className="mb-4 text-lg font-bold text-foreground">{t('생성된 문제')}</div>
                <div className="flex w-full flex-wrap items-center gap-6 rounded-xl bg-muted/50 p-6 transition-shadow duration-200 hover:shadow-md md:flex-col md:items-start md:gap-3 md:p-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <FileText className="size-8 md:size-6 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 grow-0">
                    <div className="break-words text-lg font-semibold text-foreground md:text-[0.95rem]">
                      {safeFileName}
                    </div>
                  </div>
                  <div className="ml-auto flex max-w-full shrink-0 flex-wrap items-center gap-3 md:ml-0 md:w-full md:flex-col md:gap-2">
                    <button
                      className="cursor-pointer rounded-full border border-destructive/20 bg-background px-5 py-2 text-sm font-medium text-destructive transition-colors duration-200 hover:bg-destructive/5 md:w-full md:py-2.5"
                      onClick={commonActions.handleRemoveFile}
                    >
                      {t('다른 파일 넣기')}
                    </button>
                    <button
                      className="cursor-pointer rounded-full border border-primary/20 bg-primary/10 px-5 py-2 text-sm font-medium text-primary transition-colors duration-200 hover:bg-primary/8 md:w-full md:py-2.5"
                      onClick={commonActions.handleReCreate}
                    >
                      {t('다른 문제 생성')}
                    </button>
                    <button
                      className="cursor-pointer rounded-full bg-primary px-5 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:shadow-md md:w-full md:py-2.5"
                      onClick={generationActions.handleNavigateToQuiz}
                    >
                      {t('문제 풀기')}
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </BlurFade>
        )}

        <RecentChanges />
        {ui.showHelp && <Help />}
      </div>

      <Footer />
    </div>
  );
};

export default MakeQuizMagicA;
