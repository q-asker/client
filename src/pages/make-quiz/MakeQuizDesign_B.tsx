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
import { ShimmerButton } from '@/shared/ui/components/shimmer-button';
import { BlurFade } from '@/shared/ui/components/blur-fade';
import { Badge } from '@/shared/ui/components/badge';

/** 퀴즈 유형 옵션 */
interface QuizTypeOption {
  key: QuestionType;
  label: string;
  icon: LucideIcon;
}

/** 그라디언트 보더 래퍼 컴포넌트 */
const GradientBorder = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      'rounded-2xl bg-gradient-to-r from-primary via-accent to-secondary p-px',
      className,
    )}
  >
    <div className="rounded-2xl bg-foreground">{children}</div>
  </div>
);

/** Neon Gradient — 다크 모드 그라디언트 네온 글로우 */
const MakeQuizDesign_B: React.FC = () => {
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
    <div className="flex min-h-screen flex-col bg-foreground text-background">
      <Header
        isSidebarOpen={ui.isSidebarOpen}
        toggleSidebar={uiActions.toggleSidebar}
        setIsSidebarOpen={uiActions.setIsSidebarOpen}
        setShowHelp={uiActions.setShowHelp}
      />

      <div className="mx-auto mt-8 flex-1 px-4 md:mt-6 md:w-[90%] lg:w-[85%] xl:w-[80%]">
        {/* 페이지 타이틀 + 워터마크 */}
        <BlurFade delay={0.05}>
          <div className="relative mb-10 md:mb-6">
            <span className="pointer-events-none absolute -top-4 -right-4 select-none bg-gradient-to-r from-primary to-accent bg-clip-text text-[8rem] font-bold text-transparent opacity-10">
              Q
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-background">
              {t('퀴즈 만들기')}
            </h1>
          </div>
        </BlurFade>

        {/* 업로드 완료 + 생성 전: 2컬럼 */}
        {upload.uploadedUrl && !generation.problemSetId ? (
          <div className="lg:grid lg:grid-cols-2 lg:gap-8">
            {/* 좌측: sticky 파일+PDF */}
            <BlurFade delay={0.1}>
              <div className="lg:sticky lg:top-24 lg:self-start">
                <GradientBorder>
                  <div className="p-7">
                    <h2 className="mb-4 text-lg font-semibold text-background">
                      {t('업로드된 파일')}
                    </h2>

                    <div
                      className={cn(
                        'rounded-2xl border-2 border-dashed border-background/20 p-8 text-center transition-colors duration-200 hover:border-primary/50 md:p-5',
                        upload.isDragging && 'border-primary bg-primary/10',
                      )}
                      onDragOver={uploadActions.handleDragOver}
                      onDragEnter={uploadActions.handleDragEnter}
                      onDragLeave={uploadActions.handleDragLeave}
                      onDrop={uploadActions.handleDrop}
                    >
                      <div className="mb-3">
                        <FileText className="size-10 text-background/40" />
                      </div>
                      <div className="flex flex-col items-center justify-center">
                        <div className="my-2 text-lg font-bold text-background">{safeFileName}</div>
                        {safeFileSize && (
                          <Badge className="mt-1">
                            {(safeFileSize / 1024 / 1024).toFixed(2)} MB
                          </Badge>
                        )}
                      </div>
                      <button
                        className="mt-4 cursor-pointer rounded-2xl border border-destructive/40 bg-foreground px-4 py-2 text-destructive transition-colors duration-200 hover:bg-destructive/10 md:px-3 md:py-1.5 md:text-sm"
                        onClick={commonActions.handleRemoveFile}
                      >
                        {t('파일 삭제')}
                      </button>
                    </div>

                    {/* PDF 미리보기 */}
                    {upload.uploadedUrl && (
                      <div
                        className="mt-4 rounded-2xl border border-background/10 p-4"
                        ref={pages.pdfPreviewRef}
                      >
                        <div className="flex items-center gap-1.5 pb-1.5 pl-1.5 text-sm font-medium text-background">
                          <strong>{t('선택된 페이지 수: ')}</strong>
                          <Badge>
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
                                          'relative cursor-pointer overflow-hidden rounded-2xl border border-background/10 text-center transition-all duration-200 hover:z-10 hover:scale-[1.02]',
                                          isSelected &&
                                            'ring-2 ring-primary shadow-[0_0_15px] shadow-primary/40',
                                          isHovered && 'border-primary/60',
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
                                            'mt-2 flex items-center justify-center pb-2 text-sm text-background/70',
                                            "before:mr-2 before:inline-block before:size-4 before:rounded-full before:border before:border-background/30 before:bg-foreground before:content-['']",
                                            isSelected &&
                                              "text-primary before:border-primary before:bg-primary before:bg-[url(\"data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2016%2016'%3e%3cpath%20fill='none'%20stroke='white'%20stroke-linecap='round'%20stroke-linejoin='round'%20stroke-width='2'%20d='M4%208l3%203%205-5'/%3e%3c/svg%3e\")]",
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
                                  <div className="col-span-full mt-4 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-background/20 bg-background/5 p-5 text-background/50">
                                    <div className="mb-2 size-6 animate-spin rounded-full border-2 border-background/20 border-t-primary" />
                                    <p className="m-0 text-sm font-medium">
                                      {t('더 많은 페이지 로딩 중... (')}
                                      {pages.visiblePageCount}/{pages.numPages})
                                    </p>
                                  </div>
                                )}
                              </div>

                              {pages.isPreviewVisible && pages.hoveredPage && (
                                <div
                                  className="pointer-events-none absolute z-30 rounded-2xl bg-foreground p-2.5 shadow-[0_0_30px] shadow-primary/30 transition-[opacity,top] duration-200"
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
                </GradientBorder>
              </div>
            </BlurFade>

            {/* 우측: 퀴즈 옵션 */}
            <div className="mt-6 space-y-6 lg:mt-0">
              {/* 1. 퀴즈 타입 */}
              <BlurFade delay={0.2}>
                <GradientBorder>
                  <div className="p-7">
                    <h2 className="mb-4 text-lg font-semibold text-background">
                      {t('1. 퀴즈 타입을 선택하세요!')}
                    </h2>
                    <div className="flex overflow-hidden rounded-2xl border border-background/10">
                      {quizTypes.map((type) => (
                        <button
                          key={type.key}
                          className={cn(
                            'flex-1 cursor-pointer border-none bg-foreground py-3 font-medium text-background/50 transition-all duration-200 hover:bg-background/10 md:py-2 md:text-sm',
                            options.questionType === type.key &&
                              'bg-gradient-to-r from-primary to-accent text-foreground',
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

                    {/* 난이도 설명 */}
                    <div className="mt-4 w-full text-center">
                      <div className="w-full max-w-full rounded-2xl border border-background/10 bg-background/5 p-3 md:p-3.5">
                        <div className="mb-2 text-[13px] font-semibold text-background/60">
                          {currentLevel?.title}
                        </div>
                        <div className="rounded-2xl bg-foreground px-3 py-2.5">
                          <p className="m-0 whitespace-pre-wrap break-keep text-[13px] leading-relaxed text-background/80 md:break-words">
                            {currentLevel?.question}
                          </p>
                        </div>
                        {currentLevel?.options && currentLevel.options.length > 0 && (
                          <div className="mt-2.5 flex flex-col gap-2">
                            {currentLevel.options.map((option: string, index: number) => (
                              <div
                                key={`${option}-${index}`}
                                className="flex items-center rounded-2xl border border-background/10 bg-foreground px-2.5 py-2 md:px-3 md:py-2.5"
                              >
                                <span className="mr-2.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
                                  {index + 1}
                                </span>
                                <span className="whitespace-pre-wrap break-keep text-[13px] leading-relaxed text-background/80 md:break-words">
                                  {option}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </GradientBorder>
              </BlurFade>

              {/* 2. 문제 개수 */}
              <BlurFade delay={0.3}>
                <GradientBorder>
                  <div className="p-7">
                    <h2 className="mb-4 text-lg font-semibold text-background">
                      {t('2. 문제 개수를 지정하세요!')}
                    </h2>
                    <div>
                      <label className="mb-3 block text-sm font-medium text-background md:mb-2 md:text-sm">
                        <strong>{t('문제 개수: ')}</strong>
                        <Badge className="ml-2">
                          {options.questionCount}
                          {t('문제')}
                        </Badge>
                      </label>
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
                        className="h-1 w-full accent-primary md:h-[3px]"
                      />
                    </div>
                  </div>
                </GradientBorder>
              </BlurFade>

              {/* 3. 페이지 선택 */}
              <BlurFade delay={0.4}>
                <GradientBorder>
                  <div className="p-7">
                    <h2 className="mb-4 text-lg font-semibold text-background">
                      {t('3. 특정 페이지를 지정하세요!')}
                    </h2>
                    <div className="flex items-center gap-1.5 pb-3 text-sm font-medium text-background">
                      <Badge>
                        {t('최대 ')}
                        {MAX_SELECT_PAGES}
                        {t(' 페이지')}
                      </Badge>
                      <span className="font-semibold text-background/80">
                        <strong>{t('선택할 수 있어요')}</strong>
                      </span>
                    </div>
                    <div className="flex w-full flex-wrap items-center gap-3 rounded-2xl border border-background/10 bg-background/5 p-4 text-center md:flex-col md:items-stretch md:p-3">
                      <div className="flex flex-1 flex-wrap items-center gap-2 text-center md:flex-col md:items-start md:flex-nowrap md:gap-1.5">
                        <span className="text-left font-medium text-background/80 md:mb-0.5 md:w-full">
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
                            className="w-20 rounded-2xl border border-background/20 bg-foreground px-3 py-2 text-center text-base text-background transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none disabled:cursor-not-allowed disabled:text-background/30 md:w-15 md:px-2 md:py-1.5 md:text-sm"
                          />
                          <span className="text-center text-background/40 md:inline-flex md:items-center md:px-0.5 md:text-sm">
                            ~
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
                              if (e.key === 'Enter') {
                                pageActions.handleApplyPageRange();
                              }
                            }}
                            disabled={!pages.numPages}
                            className="w-20 rounded-2xl border border-background/20 bg-foreground px-3 py-2 text-center text-base text-background transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none disabled:cursor-not-allowed disabled:text-background/30 md:w-15 md:px-2 md:py-1.5 md:text-sm"
                          />
                          <button
                            type="button"
                            className="cursor-pointer rounded-2xl bg-gradient-to-r from-primary to-accent px-3.5 py-2 text-[0.95rem] font-medium text-foreground shadow-[0_0_15px] shadow-primary/30 transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_20px] hover:shadow-primary/40 disabled:cursor-not-allowed disabled:bg-none disabled:bg-background/10 disabled:text-background/30 disabled:shadow-none md:h-8 md:min-w-11 md:whitespace-nowrap md:px-2.5 md:py-0 md:text-sm md:leading-none"
                            onClick={pageActions.handleApplyPageRange}
                            disabled={!pages.numPages}
                          >
                            {t('적용')}
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-1 flex-wrap items-center justify-end gap-2 md:w-full md:flex-col md:items-stretch md:gap-2.5">
                        <button
                          className="cursor-pointer rounded-2xl border border-primary/40 bg-primary/10 px-3.5 py-2 text-[0.95rem] text-primary transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_15px] hover:shadow-primary/30 md:w-full"
                          onClick={pageActions.handleSelectAllPages}
                        >
                          {t('전체 선택')}
                        </button>
                        <button
                          className="cursor-pointer rounded-2xl border border-destructive/30 bg-foreground px-3.5 py-2 text-[0.95rem] text-destructive transition-all duration-200 hover:scale-[1.02] hover:bg-destructive/10 md:w-full"
                          onClick={pageActions.handleClearAllPages}
                        >
                          {t('전체 해제')}
                        </button>
                        <button
                          className={cn(
                            'cursor-pointer rounded-2xl border border-background/20 bg-foreground px-3.5 py-2 text-[0.95rem] text-background transition-all duration-200 hover:scale-[1.02] hover:bg-background/10 md:hidden',
                            pages.isPreviewVisible &&
                              'border-primary bg-primary/20 text-primary shadow-[0_0_10px] shadow-primary/30',
                          )}
                          type="button"
                          onClick={() => pageActions.setIsPreviewVisible((prev: boolean) => !prev)}
                        >
                          {pages.isPreviewVisible ? t('미리보기 끄기') : t('미리보기 켜기')}
                        </button>
                      </div>
                    </div>
                  </div>
                </GradientBorder>
              </BlurFade>

              {/* 4. 문제 생성 */}
              <BlurFade delay={0.5}>
                <GradientBorder>
                  <div className="p-7">
                    <h2 className="mb-4 text-lg font-semibold text-background">
                      {t('4. 문제를 생성하세요!')}
                    </h2>
                    <div className="flex min-h-[120px] items-center justify-center rounded-2xl border border-background/10 bg-background/5 p-5 text-center md:min-h-[100px] md:p-4">
                      {isWaitingForFirstQuiz ? (
                        <div className="flex min-h-[120px] flex-col items-center justify-center">
                          <div className="mb-4 size-12 animate-spin rounded-full border-4 border-background/10 border-t-primary shadow-[0_0_20px] shadow-primary/30" />
                          <p className="m-0 py-0.5 text-background/80 md:text-sm">
                            {t('문제 생성 중...')}
                            {Math.floor(generation.generationElapsedTime / 1000)}
                            {t('초')}
                            <br />{' '}
                            <span className="mt-1.5 inline-block text-[13px] tracking-tight text-background/50 opacity-90">
                              {t('생성된 문제의 개수는 간혹 지정한 개수와 맞지 않을 수 있습니다.')}
                            </span>
                          </p>
                          {generation.showWaitMessage && (
                            <p className="animate-fade-in-slide-down pt-2.5 text-sm text-background/50 opacity-0">
                              {t('현재 생성중입니다 조금만 더 기다려주세요!')}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="m-0 text-background/50 md:text-sm">
                          {t('문서를 분석하고 문제를 생성하려면 아래 버튼을 클릭하세요.')}
                        </p>
                      )}
                    </div>
                    <div className="mt-5 flex flex-col items-center justify-center gap-4 md:gap-3">
                      <ShimmerButton
                        className="w-full py-4 text-base md:py-3 md:text-sm"
                        onClick={generationActions.generateQuestions}
                        disabled={
                          !upload.uploadedUrl ||
                          isWaitingForFirstQuiz ||
                          !pages.selectedPages.length
                        }
                      >
                        {isWaitingForFirstQuiz ? t('생성 중...') : t('문제 생성하기')}
                      </ShimmerButton>
                      {!isWaitingForFirstQuiz &&
                        !pages.selectedPages.length &&
                        pages.numPages === null && (
                          <p className="mt-1 text-center text-sm text-background/50">
                            {t('페이지 정보를 불러오는 중입니다. 잠시만 기다려주세요.')}
                          </p>
                        )}
                    </div>
                  </div>
                </GradientBorder>
              </BlurFade>
            </div>
          </div>
        ) : !upload.uploadedUrl ? (
          /* 미업로드: 풀폭 드래그 영역 */
          <BlurFade delay={0.1}>
            <GradientBorder>
              <div
                className={cn(
                  'rounded-2xl p-10 text-center transition-all duration-300 md:p-6',
                  upload.isDragging && 'bg-primary/10',
                )}
                onDragOver={uploadActions.handleDragOver}
                onDragEnter={uploadActions.handleDragEnter}
                onDragLeave={uploadActions.handleDragLeave}
                onDrop={uploadActions.handleDrop}
              >
                {isWaitingForFirstQuiz ? (
                  <div className="flex flex-col items-center p-8">
                    <div className="mb-4 size-12 animate-spin rounded-full border-4 border-background/10 border-t-primary shadow-[0_0_20px] shadow-primary/30" />
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-lg font-semibold text-background/70 md:text-base">
                        {t('파일 업로드 중...')}
                        {Math.floor(upload.uploadElapsedTime / 1000)}
                        {t('초')}
                      </div>
                    </div>
                    {upload.fileExtension && upload.fileExtension !== 'pdf' && (
                      <div className="mt-4 flex max-w-[400px] animate-fade-in-scale items-center gap-3 px-5 py-3 md:max-w-[90%] md:flex-col md:text-center">
                        <div className="text-left text-sm leading-relaxed text-background/70 md:text-center md:text-[13px]">
                          <Badge className="mr-1">{upload.fileExtension.toUpperCase()}</Badge>
                          {t('파일을 PDF로 변환하고 있어요')}
                          <br />
                          <span className="text-xs italic text-background/40">
                            {t('파일 크기에 따라 시간이 소요될 수 있습니다')}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="mb-4 md:mb-3">
                      <Cloud className="size-12 text-background/30 md:size-10" />
                    </div>
                    <div className="my-2 text-lg font-bold text-background">
                      {t('파일을 여기에 드래그하세요')}
                    </div>
                    <p className="text-background/50">{t('또는')}</p>
                    <ShimmerButton className="mt-2 px-6 py-2.5 md:px-4 md:py-2 md:text-sm">
                      <span className="relative">
                        {t('파일 선택하기')}
                        <input
                          type="file"
                          accept={acceptExtensions}
                          onChange={uploadActions.handleFileInput}
                          className="absolute inset-0 cursor-pointer opacity-0"
                        />
                      </span>
                    </ShimmerButton>
                  </>
                )}
                {!isWaitingForFirstQuiz && (
                  <>
                    <div className="flex justify-center text-background/50 md:text-sm">
                      <ul className="mx-auto mt-4 grid list-none gap-1.5 p-0 text-left">
                        <li className="flex flex-wrap items-baseline justify-start gap-1.5 md:flex-col md:items-start md:gap-0.5">
                          <span className="min-w-[72px] text-xs tracking-wide text-background/40 md:block md:w-full">
                            {t('크기 제한')}
                          </span>
                          <span className="font-semibold text-background/70 md:block md:w-full">
                            <Package className="inline size-4" /> {MAX_FILE_SIZE / 1024 / 1024}MB
                          </span>
                        </li>
                        <li className="flex flex-wrap items-baseline justify-start gap-1.5 md:flex-col md:items-start md:gap-0.5">
                          <span className="min-w-[72px] text-xs tracking-wide text-background/40 md:block md:w-full">
                            {t('지원하는 파일')}
                          </span>
                          <span className="font-semibold text-background/70 md:block md:w-full">
                            <CheckCircle className="inline size-4" />{' '}
                            {SUPPORTED_EXTENSIONS.join(', ')}
                          </span>
                        </li>
                      </ul>
                    </div>
                    <div className="mt-4 text-sm leading-relaxed text-background/35">
                      {t('파일은 상업적 목적, AI 학습 목적으로 사용되지 않습니다.')}
                      <br />
                      {t('24시간 후 자동 삭제되며 별도로 저장, 공유되지 않습니다.')}
                    </div>
                  </>
                )}
              </div>
            </GradientBorder>
          </BlurFade>
        ) : null}

        {/* 생성 완료: 풀폭 결과 카드 */}
        {generation.problemSetId && (
          <BlurFade delay={0.1}>
            <GradientBorder className="mt-8">
              <div className="p-7">
                <h2 className="mb-4 text-lg font-semibold text-background">{t('생성된 문제')}</h2>
                <div className="flex w-full flex-wrap items-center gap-6 rounded-2xl border border-background/10 bg-background/5 p-6 md:flex-col md:items-start md:gap-2 md:p-4">
                  <div className="shrink-0">
                    <FileText className="size-8 text-background/40 md:size-6" />
                  </div>
                  <div className="min-w-0 grow-0">
                    <div className="mb-1 break-words text-lg font-semibold text-background md:text-[0.95rem]">
                      {safeFileName}
                    </div>
                  </div>
                  <div className="ml-auto flex max-w-full shrink-0 flex-wrap items-center gap-3 md:ml-0 md:w-full md:flex-col md:gap-2">
                    <button
                      className="cursor-pointer rounded-2xl border border-destructive/30 bg-foreground px-4 py-2 font-medium text-destructive transition-all duration-200 hover:scale-[1.02] hover:bg-destructive/10 hover:shadow-[0_0_15px] hover:shadow-destructive/20 disabled:cursor-not-allowed disabled:opacity-50 md:w-full md:whitespace-nowrap md:py-2.5 md:text-sm"
                      onClick={commonActions.handleRemoveFile}
                    >
                      {t('다른 파일 넣기')}
                    </button>
                    <button
                      className="cursor-pointer rounded-2xl border border-primary/30 bg-primary/10 px-4 py-2 font-medium text-primary transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_0_15px] hover:shadow-primary/20 disabled:cursor-not-allowed disabled:opacity-50 md:w-full md:whitespace-nowrap md:py-2.5 md:text-sm"
                      onClick={commonActions.handleReCreate}
                    >
                      {t('다른 문제 생성')}
                    </button>
                    <ShimmerButton
                      className="px-4 py-2 font-medium md:w-full md:whitespace-nowrap md:py-2.5 md:text-sm"
                      onClick={generationActions.handleNavigateToQuiz}
                    >
                      {t('문제 풀기')}
                    </ShimmerButton>
                  </div>
                </div>
              </div>
            </GradientBorder>
          </BlurFade>
        )}

        <RecentChanges />
        {ui.showHelp && <Help />}
      </div>

      <Footer />
    </div>
  );
};

export default MakeQuizDesign_B;
