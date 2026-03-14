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
import { TextAnimate } from '@/shared/ui/components/text-animate';
import { Card, CardContent } from '@/shared/ui/components/card';
import { Badge } from '@/shared/ui/components/badge';

/** 퀴즈 유형 옵션 */
interface QuizTypeOption {
  key: QuestionType;
  label: string;
  icon: LucideIcon;
}

/** Playful Accent 디자인 — 컬러풀 인터랙티브, 섹션별 다른 악센트 컬러 */
const MakeQuizDesign_H: React.FC = () => {
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
        {/* ─── 파일 미업로드 / 업로드 중 상태 ─── */}
        {!upload.uploadedUrl && (
          <BlurFade delay={0.1}>
            <section className="relative overflow-hidden rounded-2xl border border-border border-l-4 border-l-primary bg-card p-8 shadow-sm md:p-5">
              {/* 원형 섹션 번호 배지 */}
              <div className="absolute -top-3 -left-3 z-10 flex size-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                1
              </div>
              {/* 배경 워터마크 */}
              <span className="pointer-events-none absolute -bottom-4 -right-4 select-none text-[6rem] font-bold leading-none text-muted-foreground/5">
                UPLOAD
              </span>

              <div className="relative z-10 pl-6">
                <TextAnimate
                  animation="blurInUp"
                  by="word"
                  className="text-2xl font-bold tracking-tight text-foreground md:text-xl"
                >
                  {t('파일을 업로드하세요')}
                </TextAnimate>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('퀴즈를 생성할 문서를 드래그하거나 선택하세요')}
                </p>
              </div>

              {/* 업로드 영역 */}
              <div
                className={cn(
                  'mt-6 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-primary/20 bg-background px-8 py-20 text-center transition-all duration-300 md:px-5 md:py-14',
                  upload.isDragging && 'scale-[1.01] border-primary/50 bg-primary/5 shadow-md',
                )}
                onDragOver={uploadActions.handleDragOver}
                onDragEnter={uploadActions.handleDragEnter}
                onDragLeave={uploadActions.handleDragLeave}
                onDrop={uploadActions.handleDrop}
              >
                {isWaitingForFirstQuiz ? (
                  <div className="flex flex-col items-center">
                    <div className="mb-6 size-16 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
                    <div className="text-xl font-bold text-foreground md:text-lg">
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
                    <div className="mb-8 flex size-24 items-center justify-center rounded-full bg-primary/10 md:size-16">
                      <Cloud className="size-12 text-primary/60 md:size-8" />
                    </div>
                    <div className="text-xl font-bold text-foreground md:text-lg">
                      {t('파일을 여기에 드래그하세요')}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{t('또는')}</p>
                    <div className="relative mt-6">
                      <ShimmerButton className="px-8 py-3 text-sm font-bold md:px-6 md:py-2.5">
                        {t('파일 선택하기')}
                      </ShimmerButton>
                      <input
                        type="file"
                        accept={acceptExtensions}
                        onChange={uploadActions.handleFileInput}
                        className="absolute inset-0 cursor-pointer opacity-0"
                      />
                    </div>
                    {/* 파일 제한 정보 */}
                    <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-xs md:flex-col md:gap-2">
                      <Badge className="rounded-2xl bg-primary/10 text-primary hover:bg-primary/15">
                        {t('크기 제한')} · {MAX_FILE_SIZE / 1024 / 1024}MB
                      </Badge>
                      <Badge className="rounded-2xl bg-primary/10 text-primary hover:bg-primary/15">
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
          </BlurFade>
        )}

        {/* ─── 2컬럼 레이아웃: 업로드 완료 + 생성 전 ─── */}
        {upload.uploadedUrl && !generation.problemSetId && (
          <div className="lg:grid lg:grid-cols-2 lg:gap-8">
            {/* 좌측: 파일 정보 + PDF 미리보기 (sticky) */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <BlurFade delay={0.1}>
                <section className="relative overflow-hidden rounded-2xl border border-border border-l-4 border-l-primary bg-card p-8 shadow-sm md:p-5">
                  {/* 원형 섹션 번호 배지 */}
                  <div className="absolute -top-3 -left-3 z-10 flex size-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                    1
                  </div>
                  <span className="pointer-events-none absolute -bottom-4 -right-4 select-none text-[6rem] font-bold leading-none text-muted-foreground/5">
                    FILE
                  </span>

                  <div className="relative z-10 pl-6">
                    <TextAnimate
                      animation="blurInUp"
                      by="word"
                      className="text-2xl font-bold tracking-tight text-foreground md:text-xl"
                    >
                      {t('업로드된 파일')}
                    </TextAnimate>
                  </div>

                  {/* 파일 정보 카드 */}
                  <div
                    className={cn(
                      'mt-6 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-primary/20 bg-background px-8 py-10 text-center transition-all duration-300 md:px-5 md:py-8',
                      upload.isDragging && 'border-primary/50 bg-primary/5',
                    )}
                    onDragOver={uploadActions.handleDragOver}
                    onDragEnter={uploadActions.handleDragEnter}
                    onDragLeave={uploadActions.handleDragLeave}
                    onDrop={uploadActions.handleDrop}
                  >
                    <div className="mb-4 flex size-20 items-center justify-center rounded-full bg-primary/10 md:size-14">
                      <FileText className="size-10 text-primary/60 md:size-7" />
                    </div>
                    <div className="text-xl font-bold text-foreground">{safeFileName}</div>
                    {safeFileSize && (
                      <span className="mt-1 text-sm text-muted-foreground">
                        ({(safeFileSize / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    )}
                    <button
                      className="mt-6 cursor-pointer rounded-2xl bg-destructive px-6 py-2.5 text-sm font-bold text-background shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-md md:px-5 md:py-2"
                      onClick={commonActions.handleRemoveFile}
                    >
                      {t('✕ 파일 삭제')}
                    </button>
                  </div>

                  {/* PDF 페이지 그리드 */}
                  <div
                    className="mt-6 rounded-2xl bg-background p-5 shadow-sm md:p-4"
                    ref={pages.pdfPreviewRef}
                  >
                    <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {t('선택된 페이지 수: ')}
                      </span>
                      <Badge className="rounded-2xl bg-primary/10 text-primary hover:bg-primary/15">
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
                                      'relative cursor-pointer overflow-hidden rounded-2xl border-2 border-transparent bg-background text-center shadow-sm transition-all duration-300 hover:z-10 hover:scale-105 hover:shadow-md',
                                      isSelected && 'border-primary shadow-md',
                                      isHovered && 'border-primary/40',
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
                                        "before:mr-2 before:inline-block before:size-4 before:rounded-full before:border-2 before:border-primary/20 before:bg-background before:content-['']",
                                        isSelected &&
                                          "font-bold text-primary before:border-primary before:bg-primary before:bg-[url(\"data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2016%2016'%3e%3cpath%20fill='none'%20stroke='white'%20stroke-linecap='round'%20stroke-linejoin='round'%20stroke-width='2'%20d='M4%208l3%203%205-5'/%3e%3c/svg%3e\")]",
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
                              <div className="col-span-full mt-4 flex flex-col items-center justify-center rounded-2xl bg-primary/5 p-5 text-muted-foreground">
                                <div className="mb-2 size-6 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
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
                              className="pointer-events-none absolute z-30 rounded-2xl bg-background p-3 shadow-lg transition-[opacity,top] duration-300"
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
                </section>
              </BlurFade>
            </div>

            {/* 우측: 퀴즈 옵션 패널들 */}
            <div className="mt-6 space-y-6 lg:mt-0">
              {/* ─── 퀴즈 타입 (border-l-primary) ─── */}
              <BlurFade delay={0.2}>
                <section className="relative overflow-hidden rounded-2xl border border-border border-l-4 border-l-primary bg-card p-8 shadow-sm md:p-5">
                  <div className="absolute -top-3 -left-3 z-10 flex size-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                    2
                  </div>
                  <span className="pointer-events-none absolute -bottom-4 -right-4 select-none text-[6rem] font-bold leading-none text-muted-foreground/5">
                    TYPE
                  </span>

                  <div className="relative z-10 pl-6">
                    <TextAnimate
                      animation="blurInUp"
                      by="word"
                      className="text-2xl font-bold tracking-tight text-foreground md:text-xl"
                    >
                      {t('퀴즈 타입을 선택하세요')}
                    </TextAnimate>
                  </div>

                  {/* 세로 카드 형태 퀴즈 타입 */}
                  <div className="mt-6 grid grid-cols-3 gap-3 md:grid-cols-1">
                    {quizTypes.map((type) => (
                      <Card
                        key={type.key}
                        className={cn(
                          'cursor-pointer rounded-2xl border-2 border-border bg-background transition-all duration-300 hover:scale-105 hover:shadow-md',
                          options.questionType === type.key &&
                            'scale-105 border-primary bg-primary/5 shadow-md',
                        )}
                        onClick={() => {
                          optionActions.handleQuestionTypeChange(type.key, type.label);
                        }}
                      >
                        <CardContent className="flex flex-col items-center gap-3 p-6 md:p-4">
                          <type.icon
                            className={cn(
                              'size-8 text-muted-foreground transition-colors duration-300 md:size-6',
                              options.questionType === type.key && 'text-primary',
                            )}
                            strokeWidth={1.8}
                          />
                          <span
                            className={cn(
                              'text-sm font-semibold text-muted-foreground transition-colors duration-300',
                              options.questionType === type.key && 'text-primary',
                            )}
                          >
                            {type.label}
                          </span>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* 난이도 미리보기 */}
                  <div className="mt-6 rounded-2xl bg-background p-6 shadow-sm md:p-4">
                    <Badge className="mb-3 rounded-2xl bg-primary/10 text-primary hover:bg-primary/15">
                      {currentLevel?.title}
                    </Badge>
                    <div className="rounded-xl bg-primary/5 p-4">
                      <p className="m-0 whitespace-pre-wrap break-keep text-sm leading-relaxed text-foreground md:break-words">
                        {currentLevel?.question}
                      </p>
                    </div>
                    {currentLevel?.options && currentLevel.options.length > 0 && (
                      <div className="mt-4 flex flex-col gap-2">
                        {currentLevel.options.map((option: string, index: number) => (
                          <div
                            key={`${option}-${index}`}
                            className="flex items-center rounded-xl bg-primary/5 px-4 py-3"
                          >
                            <span className="mr-3 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
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
              </BlurFade>

              {/* ─── 문제 개수 (border-l-blue-500) ─── */}
              <BlurFade delay={0.3}>
                <section className="relative overflow-hidden rounded-2xl border border-border border-l-4 border-l-blue-500 bg-card p-8 shadow-sm md:p-5">
                  <div className="absolute -top-3 -left-3 z-10 flex size-12 items-center justify-center rounded-full bg-blue-500/10 text-lg font-bold text-blue-500">
                    3
                  </div>
                  <span className="pointer-events-none absolute -bottom-4 -right-4 select-none text-[6rem] font-bold leading-none text-muted-foreground/5">
                    COUNT
                  </span>

                  <div className="relative z-10 pl-6">
                    <TextAnimate
                      animation="blurInUp"
                      by="word"
                      className="text-2xl font-bold tracking-tight text-foreground md:text-xl"
                    >
                      {t('문제 개수를 지정하세요')}
                    </TextAnimate>
                  </div>

                  {/* 숫자 표시 */}
                  <div className="mt-6 flex flex-col items-center">
                    <div className="flex size-28 items-center justify-center rounded-3xl bg-blue-500/10 shadow-sm md:size-22">
                      <span className="text-4xl font-bold text-blue-500 md:text-3xl">
                        {options.questionCount}
                      </span>
                    </div>
                    <Badge className="mt-3 rounded-2xl bg-blue-500/10 text-blue-500 hover:bg-blue-500/15">
                      {t('문제')}
                    </Badge>
                  </div>

                  <div className="mx-auto mt-6 max-w-md">
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
                      className="h-2 w-full accent-blue-500"
                    />
                    <div className="mt-3 flex justify-between text-xs font-medium text-muted-foreground">
                      <span>5</span>
                      <span>10</span>
                      <span>15</span>
                      <span>20</span>
                      <span>25</span>
                    </div>
                  </div>
                </section>
              </BlurFade>

              {/* ─── 페이지 선택 (border-l-green-500) ─── */}
              <BlurFade delay={0.4}>
                <section className="relative overflow-hidden rounded-2xl border border-border border-l-4 border-l-green-500 bg-card p-8 shadow-sm md:p-5">
                  <div className="absolute -top-3 -left-3 z-10 flex size-12 items-center justify-center rounded-full bg-green-500/10 text-lg font-bold text-green-500">
                    4
                  </div>
                  <span className="pointer-events-none absolute -bottom-4 -right-4 select-none text-[6rem] font-bold leading-none text-muted-foreground/5">
                    PAGE
                  </span>

                  <div className="relative z-10 pl-6">
                    <TextAnimate
                      animation="blurInUp"
                      by="word"
                      className="text-2xl font-bold tracking-tight text-foreground md:text-xl"
                    >
                      {t('특정 페이지를 지정하세요')}
                    </TextAnimate>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t('최대 ')}
                      {MAX_SELECT_PAGES}
                      {t(' 페이지')} {t('선택할 수 있어요')}
                    </p>
                  </div>

                  {/* 페이지 범위 입력 */}
                  <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl bg-background p-5 shadow-sm md:flex-col md:items-stretch md:p-4">
                    <div className="flex flex-1 flex-wrap items-center gap-2 md:flex-col md:items-start md:gap-1.5">
                      <span className="text-sm font-semibold text-foreground">
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
                          className="w-20 rounded-2xl border border-green-500/20 bg-background px-3 py-2 text-center text-sm shadow-sm transition-all duration-300 focus:border-green-500/50 focus:shadow-md focus:outline-none disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground md:w-15 md:px-2 md:py-1.5"
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
                          className="w-20 rounded-2xl border border-green-500/20 bg-background px-3 py-2 text-center text-sm shadow-sm transition-all duration-300 focus:border-green-500/50 focus:shadow-md focus:outline-none disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground md:w-15 md:px-2 md:py-1.5"
                        />
                        <button
                          type="button"
                          className="cursor-pointer rounded-2xl bg-green-500 px-5 py-2 text-sm font-bold text-white shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-md disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none md:h-8 md:min-w-11 md:px-3 md:py-0 md:text-sm md:leading-none"
                          onClick={pageActions.handleApplyPageRange}
                          disabled={!pages.numPages}
                        >
                          {t('적용')}
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2 md:w-full md:flex-col md:gap-2">
                      <button
                        className="cursor-pointer rounded-2xl border border-green-500/20 bg-background px-5 py-2 text-sm font-semibold text-foreground shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-md md:w-full"
                        onClick={pageActions.handleSelectAllPages}
                      >
                        {t('전체 선택')}
                      </button>
                      <button
                        className="cursor-pointer rounded-2xl border border-destructive/20 bg-background px-5 py-2 text-sm font-semibold text-destructive shadow-sm transition-all duration-300 hover:scale-105 hover:bg-destructive/5 hover:shadow-md md:w-full"
                        onClick={pageActions.handleClearAllPages}
                      >
                        {t('전체 해제')}
                      </button>
                      <button
                        className={cn(
                          'cursor-pointer rounded-2xl border border-green-500/20 bg-background px-5 py-2 text-sm font-semibold text-foreground shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-md md:hidden',
                          pages.isPreviewVisible &&
                            'border-green-500 bg-green-500 text-white shadow-md',
                        )}
                        type="button"
                        onClick={() => pageActions.setIsPreviewVisible((prev: boolean) => !prev)}
                      >
                        {pages.isPreviewVisible ? t('미리보기 끄기') : t('미리보기 켜기')}
                      </button>
                    </div>
                  </div>
                </section>
              </BlurFade>

              {/* ─── 문제 생성 (border-l-orange-500) ─── */}
              <BlurFade delay={0.5}>
                <section className="relative overflow-hidden rounded-2xl border border-border border-l-4 border-l-orange-500 bg-card p-8 shadow-sm md:p-5">
                  <div className="absolute -top-3 -left-3 z-10 flex size-12 items-center justify-center rounded-full bg-orange-500/10 text-lg font-bold text-orange-500">
                    5
                  </div>
                  <span className="pointer-events-none absolute -bottom-4 -right-4 select-none text-[6rem] font-bold leading-none text-muted-foreground/5">
                    CREATE
                  </span>

                  <div className="relative z-10 pl-6">
                    <TextAnimate
                      animation="blurInUp"
                      by="word"
                      className="text-2xl font-bold tracking-tight text-foreground md:text-xl"
                    >
                      {t('문제를 생성하세요')}
                    </TextAnimate>
                  </div>

                  {/* 생성 상태 영역 */}
                  <div className="mt-6 flex min-h-[160px] items-center justify-center rounded-3xl bg-background p-8 text-center shadow-sm md:min-h-[120px] md:p-5">
                    {isWaitingForFirstQuiz ? (
                      <div className="flex flex-col items-center">
                        <div className="mb-4 size-14 animate-spin rounded-full border-4 border-orange-500/20 border-t-orange-500" />
                        <p className="m-0 text-sm font-medium md:text-sm">
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

                  {/* 생성 버튼 — ShimmerButton */}
                  <div className="mt-6 flex flex-col items-center gap-3 md:mb-8">
                    <ShimmerButton
                      className="w-full py-5 text-lg font-bold md:py-4 md:text-base"
                      onClick={generationActions.generateQuestions}
                      disabled={
                        !upload.uploadedUrl || isWaitingForFirstQuiz || !pages.selectedPages.length
                      }
                    >
                      {isWaitingForFirstQuiz ? t('생성 중...') : t('문제 생성하기')}
                    </ShimmerButton>
                    {!isWaitingForFirstQuiz &&
                      !pages.selectedPages.length &&
                      pages.numPages === null && (
                        <p className="mt-1 text-center text-sm text-muted-foreground">
                          {t('페이지 정보를 불러오는 중입니다. 잠시만 기다려주세요.')}
                        </p>
                      )}
                  </div>
                </section>
              </BlurFade>
            </div>
          </div>
        )}

        {/* ─── 생성 완료 결과 ─── */}
        {generation.problemSetId && (
          <BlurFade delay={0.1}>
            <section className="relative overflow-hidden rounded-2xl border border-border border-l-4 border-l-primary bg-card p-8 shadow-sm md:p-5">
              <div className="absolute -top-3 -left-3 z-10 flex size-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                ✓
              </div>
              <span className="pointer-events-none absolute -bottom-4 -right-4 select-none text-[6rem] font-bold leading-none text-muted-foreground/5">
                DONE
              </span>

              <div className="relative z-10 pl-6">
                <TextAnimate
                  animation="blurInUp"
                  by="word"
                  className="text-2xl font-bold tracking-tight text-foreground md:text-xl"
                >
                  {t('생성된 문제')}
                </TextAnimate>
              </div>

              <div className="mt-6 flex w-full flex-wrap items-center gap-6 rounded-2xl bg-background p-6 shadow-sm md:flex-col md:items-start md:gap-3 md:p-4">
                <div className="flex items-center gap-4 md:gap-3">
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/10 md:size-10">
                    <FileText className="size-7 text-primary/60 md:size-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="break-words text-lg font-bold text-foreground md:text-base">
                      {safeFileName}
                    </div>
                  </div>
                </div>
                <div className="ml-auto flex max-w-full shrink-0 flex-wrap items-center gap-3 md:ml-0 md:w-full md:flex-col md:gap-2">
                  <button
                    className="cursor-pointer rounded-2xl border border-destructive/20 bg-background px-5 py-2.5 text-sm font-semibold text-destructive shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-md md:w-full md:py-2.5"
                    onClick={commonActions.handleRemoveFile}
                  >
                    {t('다른 파일 넣기')}
                  </button>
                  <button
                    className="cursor-pointer rounded-2xl border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-md md:w-full md:py-2.5"
                    onClick={commonActions.handleReCreate}
                  >
                    {t('다른 문제 생성')}
                  </button>
                  <ShimmerButton
                    className="px-5 py-2.5 text-sm font-bold md:w-full md:py-2.5"
                    onClick={generationActions.handleNavigateToQuiz}
                  >
                    {t('문제 풀기')}
                  </ShimmerButton>
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

export default MakeQuizDesign_H;
