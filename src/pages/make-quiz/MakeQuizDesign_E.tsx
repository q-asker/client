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
import { BlurFade } from '@/shared/ui/components/blur-fade';
import { Card, CardContent } from '@/shared/ui/components/card';
import { Badge } from '@/shared/ui/components/badge';

/** 퀴즈 유형 옵션 */
interface QuizTypeOption {
  key: QuestionType;
  label: string;
  icon: LucideIcon;
}

/** Floating Island 디자인 — 극단적 깊은 그림자 + 그리드 패턴 배경 */
const MakeQuizDesign_E: React.FC = () => {
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

  /** macOS 윈도우 도트 */
  const MacDots = () => (
    <div className="mb-3 flex gap-1.5">
      <span className="size-3 rounded-full bg-red-400" />
      <span className="size-3 rounded-full bg-yellow-400" />
      <span className="size-3 rounded-full bg-green-400" />
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        isSidebarOpen={ui.isSidebarOpen}
        toggleSidebar={uiActions.toggleSidebar}
        setIsSidebarOpen={uiActions.setIsSidebarOpen}
        setShowHelp={uiActions.setShowHelp}
      />

      {/* 그리드 패턴 배경 */}
      <div
        className="mx-auto mt-8 flex-1 px-4 md:mt-6 md:w-[90%] lg:w-[85%] xl:w-[80%]"
        style={{
          backgroundImage:
            'linear-gradient(to right, var(--color-border) 1px, transparent 1px), linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        {/* ─── 파일 미업로드: 업로드 Floating 카드 ─── */}
        {!upload.uploadedUrl && (
          <BlurFade inView>
            <Card className="relative overflow-hidden border-none shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] transition-transform duration-300 hover:-translate-y-1">
              <CardContent className="relative p-8 md:p-5">
                <MacDots />

                {/* 워터마크 */}
                <span className="pointer-events-none absolute bottom-0 right-4 select-none overflow-hidden text-[5rem] font-bold text-muted/30">
                  01
                </span>

                <div className="relative z-10 mb-6 md:mb-4">
                  <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-xl">
                    {t('파일을 업로드하세요')}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t('퀴즈를 생성할 문서를 드래그하거나 선택하세요')}
                  </p>
                </div>

                <div
                  className={cn(
                    'relative z-10 flex flex-col items-center justify-center rounded-3xl bg-muted/50 px-8 py-16 text-center transition-colors duration-200 md:px-5 md:py-10',
                    upload.isDragging && 'bg-primary/10',
                  )}
                  onDragOver={uploadActions.handleDragOver}
                  onDragEnter={uploadActions.handleDragEnter}
                  onDragLeave={uploadActions.handleDragLeave}
                  onDrop={uploadActions.handleDrop}
                >
                  {/* 업로드 중 */}
                  {isWaitingForFirstQuiz ? (
                    <div className="flex flex-col items-center">
                      <div className="mb-5 size-14 animate-spin rounded-full border-4 border-muted border-t-primary" />
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
                      <div className="mb-5 flex size-20 items-center justify-center rounded-full bg-background shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] md:size-16">
                        <Cloud className="size-12 text-muted-foreground md:size-10" />
                      </div>
                      <div className="text-lg font-semibold text-foreground md:text-base">
                        {t('파일을 여기에 드래그하세요')}
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{t('또는')}</p>
                      <div className="relative mt-4 inline-block cursor-pointer rounded-2xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity duration-200 hover:opacity-90 md:px-5 md:py-2">
                        {t('파일 선택하기')}
                        <input
                          type="file"
                          accept={acceptExtensions}
                          onChange={uploadActions.handleFileInput}
                          className="absolute inset-0 cursor-pointer opacity-0"
                        />
                      </div>
                      {/* 파일 정보 */}
                      <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground md:flex-col md:gap-2">
                        <Badge variant="outline">
                          {t('크기 제한')} · {MAX_FILE_SIZE / 1024 / 1024}MB
                        </Badge>
                        <Badge variant="outline">
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
              </CardContent>
            </Card>
          </BlurFade>
        )}

        {/* ─── 2컬럼 (업로드 후, 생성 전) ─── */}
        {upload.uploadedUrl && !generation.problemSetId && (
          <div className="lg:grid lg:grid-cols-2 lg:gap-8">
            {/* ═══ 좌측: 파일 정보 + PDF 미리보기 ═══ */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <BlurFade inView>
                <Card className="relative overflow-hidden border-none shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] transition-transform duration-300 hover:-translate-y-1">
                  <CardContent className="relative p-6 md:p-4">
                    <MacDots />

                    {/* 워터마크 */}
                    <span className="pointer-events-none absolute bottom-0 right-4 select-none overflow-hidden text-[5rem] font-bold text-muted/30">
                      00
                    </span>

                    {/* 파일 정보 */}
                    <div
                      className={cn(
                        'flex flex-col items-center rounded-2xl bg-muted/50 p-8 text-center transition-colors duration-200 md:p-5',
                        upload.isDragging && 'bg-primary/10',
                      )}
                      onDragOver={uploadActions.handleDragOver}
                      onDragEnter={uploadActions.handleDragEnter}
                      onDragLeave={uploadActions.handleDragLeave}
                      onDrop={uploadActions.handleDrop}
                    >
                      {isWaitingForFirstQuiz && !upload.uploadedUrl ? (
                        <div className="flex flex-col items-center">
                          <div className="mb-5 size-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
                          <div className="text-base font-semibold text-foreground">
                            {t('파일 업로드 중...')}
                            {Math.floor(upload.uploadElapsedTime / 1000)}
                            {t('초')}
                          </div>
                          {upload.fileExtension && upload.fileExtension !== 'pdf' && (
                            <div className="mt-3 text-sm leading-relaxed text-muted-foreground">
                              <strong className="text-foreground">
                                {upload.fileExtension.toUpperCase()}
                              </strong>{' '}
                              {t('파일을 PDF로 변환하고 있어요')}
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          <div className="mb-3">
                            <FileText className="size-10 text-muted-foreground" />
                          </div>
                          <div className="text-lg font-bold text-foreground">{safeFileName}</div>
                          {safeFileSize && (
                            <span className="mt-1 text-sm text-muted-foreground">
                              ({(safeFileSize / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          )}
                          <button
                            className="mt-4 cursor-pointer rounded-2xl border border-destructive/20 bg-background px-4 py-2 text-sm text-destructive transition-colors duration-200 hover:bg-destructive/5"
                            onClick={commonActions.handleRemoveFile}
                          >
                            {t('✕ 파일 삭제')}
                          </button>
                        </>
                      )}
                    </div>

                    {/* PDF 페이지 그리드 */}
                    {upload.uploadedUrl && (
                      <div className="mt-4 rounded-2xl bg-muted/30 p-4" ref={pages.pdfPreviewRef}>
                        <div className="mb-3 flex items-center gap-2 text-sm">
                          <span className="font-medium text-foreground">
                            {t('선택된 페이지 수: ')}
                          </span>
                          <Badge variant="outline">
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
                                className="grid max-h-[400px] grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-3 overflow-y-auto p-1.5"
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
                                          'relative cursor-pointer overflow-hidden rounded-2xl border-2 border-transparent bg-background text-center transition-all duration-200 hover:z-10 hover:scale-[1.02] hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)]',
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
                                          width={130}
                                          renderTextLayer={false}
                                          renderAnnotationLayer={false}
                                        />

                                        <p
                                          className={cn(
                                            'mt-2 flex items-center justify-center pb-2 text-xs text-muted-foreground',
                                            "before:mr-1.5 before:inline-block before:size-3.5 before:rounded-full before:border before:border-border before:bg-background before:content-['']",
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
                                  <div className="col-span-full mt-4 flex flex-col items-center justify-center rounded-2xl bg-background p-5 text-muted-foreground">
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
                                  className="pointer-events-none absolute z-30 rounded-2xl bg-background p-3 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] transition-[opacity,top] duration-200"
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
              </BlurFade>
            </div>

            {/* ═══ 우측: 옵션 패널들 ═══ */}
            <div className="mt-6 space-y-6 lg:mt-0">
              {/* ─── 퀴즈 타입 카드 ─── */}
              <BlurFade inView>
                <Card className="relative overflow-hidden border-none shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] transition-transform duration-300 hover:-translate-y-1">
                  <CardContent className="relative p-6 md:p-5">
                    <MacDots />

                    {/* 워터마크 */}
                    <span className="pointer-events-none absolute bottom-0 right-4 select-none overflow-hidden text-[5rem] font-bold text-muted/30">
                      01
                    </span>

                    <div className="relative z-10 mb-5">
                      <h2 className="text-lg font-bold text-foreground">
                        {t('퀴즈 타입을 선택하세요')}
                      </h2>
                    </div>

                    {/* 세그먼트 컨트롤 */}
                    <div className="relative z-10 flex gap-2 md:flex-wrap">
                      {quizTypes.map((type) => (
                        <button
                          key={type.key}
                          className={cn(
                            'flex-1 cursor-pointer rounded-2xl border-none bg-muted/50 py-3 text-sm font-medium text-muted-foreground transition-all duration-200 hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] md:py-2 md:text-sm',
                            options.questionType === type.key &&
                              'bg-primary text-primary-foreground shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)]',
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

                    {/* 난이도 미리보기 */}
                    <div className="relative z-10 mt-5 rounded-2xl bg-muted/50 p-4">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        {currentLevel?.title}
                      </div>
                      <div className="rounded-2xl bg-background p-3 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.08)]">
                        <p className="m-0 whitespace-pre-wrap break-keep text-sm leading-relaxed text-foreground md:break-words">
                          {currentLevel?.question}
                        </p>
                      </div>
                      {currentLevel?.options && currentLevel.options.length > 0 && (
                        <div className="mt-3 flex flex-col gap-2">
                          {currentLevel.options.map((option: string, index: number) => (
                            <div
                              key={`${option}-${index}`}
                              className="flex items-center rounded-2xl bg-background px-3 py-2.5 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.08)]"
                            >
                              <span className="mr-2.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground">
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
              </BlurFade>

              {/* ─── 문제 개수 카드 ─── */}
              <BlurFade inView>
                <Card className="relative overflow-hidden border-none shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] transition-transform duration-300 hover:-translate-y-1">
                  <CardContent className="relative p-6 md:p-5">
                    <MacDots />

                    {/* 워터마크 */}
                    <span className="pointer-events-none absolute bottom-0 right-4 select-none overflow-hidden text-[5rem] font-bold text-muted/30">
                      02
                    </span>

                    <div className="relative z-10 mb-5">
                      <h2 className="text-lg font-bold text-foreground">
                        {t('문제 개수를 지정하세요')}
                      </h2>
                    </div>

                    {/* 대형 숫자 + 슬라이더 */}
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="text-[3.5rem] font-black leading-none tracking-tight text-foreground md:text-[2.5rem]">
                        {options.questionCount}
                      </div>
                      <span className="mt-1 text-sm font-medium text-muted-foreground">
                        {t('문제')}
                      </span>
                      <div className="mt-5 w-full max-w-sm">
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
              </BlurFade>

              {/* ─── 페이지 선택 카드 ─── */}
              <BlurFade inView>
                <Card className="relative overflow-hidden border-none shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] transition-transform duration-300 hover:-translate-y-1">
                  <CardContent className="relative p-6 md:p-5">
                    <MacDots />

                    {/* 워터마크 */}
                    <span className="pointer-events-none absolute bottom-0 right-4 select-none overflow-hidden text-[5rem] font-bold text-muted/30">
                      03
                    </span>

                    <div className="relative z-10 mb-2">
                      <h2 className="text-lg font-bold text-foreground">
                        {t('특정 페이지를 지정하세요')}
                      </h2>
                    </div>

                    {/* 최대 페이지 배지 */}
                    <div className="relative z-10 mb-5">
                      <Badge variant="outline">
                        {t('최대 ')}
                        {MAX_SELECT_PAGES}
                        {t(' 페이지')} {t('선택할 수 있어요')}
                      </Badge>
                    </div>

                    {/* 페이지 범위 입력 */}
                    <div className="relative z-10 flex flex-wrap items-center gap-3 rounded-2xl bg-muted/50 p-4 md:flex-col md:items-stretch md:p-3">
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
                            className="w-18 rounded-2xl border-none bg-background px-3 py-2 text-center text-sm shadow-[0_4px_20px_-5px_rgba(0,0,0,0.08)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground md:w-15 md:px-2 md:py-1.5"
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
                            className="w-18 rounded-2xl border-none bg-background px-3 py-2 text-center text-sm shadow-[0_4px_20px_-5px_rgba(0,0,0,0.08)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground md:w-15 md:px-2 md:py-1.5"
                          />
                          <button
                            type="button"
                            className="cursor-pointer rounded-2xl bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-opacity duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground md:h-8 md:min-w-11 md:px-3 md:py-0 md:text-sm md:leading-none"
                            onClick={pageActions.handleApplyPageRange}
                            disabled={!pages.numPages}
                          >
                            {t('적용')}
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-2 md:w-full md:flex-col md:gap-2">
                        <button
                          className="cursor-pointer rounded-2xl border-none bg-background px-3.5 py-2 text-sm font-medium text-foreground shadow-[0_4px_20px_-5px_rgba(0,0,0,0.08)] transition-colors duration-200 hover:bg-muted md:w-full"
                          onClick={pageActions.handleSelectAllPages}
                        >
                          {t('전체 선택')}
                        </button>
                        <button
                          className="cursor-pointer rounded-2xl border-none bg-background px-3.5 py-2 text-sm font-medium text-destructive shadow-[0_4px_20px_-5px_rgba(0,0,0,0.08)] transition-colors duration-200 hover:bg-destructive/5 md:w-full"
                          onClick={pageActions.handleClearAllPages}
                        >
                          {t('전체 해제')}
                        </button>
                        <button
                          className={cn(
                            'cursor-pointer rounded-2xl border-none bg-background px-3.5 py-2 text-sm font-medium text-foreground shadow-[0_4px_20px_-5px_rgba(0,0,0,0.08)] transition-colors duration-200 hover:bg-muted md:hidden',
                            pages.isPreviewVisible && 'bg-primary text-primary-foreground',
                          )}
                          type="button"
                          onClick={() => pageActions.setIsPreviewVisible((prev: boolean) => !prev)}
                        >
                          {pages.isPreviewVisible ? t('미리보기 끄기') : t('미리보기 켜기')}
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </BlurFade>

              {/* ─── 문제 생성 카드 ─── */}
              <BlurFade inView>
                <Card className="relative overflow-hidden border-none shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] transition-transform duration-300 hover:-translate-y-1">
                  <CardContent className="relative p-6 md:p-5">
                    <MacDots />

                    {/* 워터마크 */}
                    <span className="pointer-events-none absolute bottom-0 right-4 select-none overflow-hidden text-[5rem] font-bold text-muted/30">
                      04
                    </span>

                    <div className="relative z-10 mb-5">
                      <h2 className="text-lg font-bold text-foreground">
                        {t('문제를 생성하세요')}
                      </h2>
                    </div>

                    {/* 생성 상태 */}
                    <div className="relative z-10 flex min-h-[120px] items-center justify-center rounded-2xl bg-muted/50 p-5 text-center md:min-h-[100px] md:p-4">
                      {isWaitingForFirstQuiz ? (
                        <div className="flex flex-col items-center">
                          <div className="mb-4 size-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
                          <p className="m-0 text-sm">
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
                    <div className="relative z-10 mt-5 flex flex-col items-center gap-3">
                      <button
                        className="w-full cursor-pointer rounded-3xl border-none bg-primary py-4 text-base font-bold text-primary-foreground shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] transition-opacity duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none md:py-3 md:text-sm"
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
                          <p className="mt-1 text-center text-sm text-muted-foreground">
                            {t('페이지 정보를 불러오는 중입니다. 잠시만 기다려주세요.')}
                          </p>
                        )}
                    </div>
                  </CardContent>
                </Card>
              </BlurFade>
            </div>
          </div>
        )}

        {/* ─── 생성 완료 결과 ─── */}
        {generation.problemSetId && (
          <BlurFade inView>
            <Card className="relative overflow-hidden border-none shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] transition-transform duration-300 hover:-translate-y-1">
              <CardContent className="relative p-8 md:p-5">
                <MacDots />

                <h2 className="mb-6 text-xl font-bold tracking-tight text-foreground md:mb-4 md:text-lg">
                  {t('생성된 문제')}
                </h2>
                <div className="flex w-full flex-wrap items-center gap-6 rounded-3xl bg-muted/50 p-6 md:flex-col md:items-start md:gap-3 md:p-4">
                  <div className="flex items-center gap-4 md:gap-3">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-background shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] md:size-10">
                      <CheckCircle className="size-8 text-primary md:size-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="break-words text-lg font-bold text-foreground md:text-base">
                        {safeFileName}
                      </div>
                    </div>
                  </div>
                  <div className="ml-auto flex max-w-full shrink-0 flex-wrap items-center gap-3 md:ml-0 md:w-full md:flex-col md:gap-2">
                    <button
                      className="cursor-pointer rounded-2xl border-none bg-background px-5 py-2.5 text-sm font-medium text-destructive shadow-[0_4px_20px_-5px_rgba(0,0,0,0.08)] transition-colors duration-200 hover:bg-destructive/5 md:w-full md:py-2.5"
                      onClick={commonActions.handleRemoveFile}
                    >
                      {t('다른 파일 넣기')}
                    </button>
                    <button
                      className="cursor-pointer rounded-2xl border-none bg-background px-5 py-2.5 text-sm font-medium text-foreground shadow-[0_4px_20px_-5px_rgba(0,0,0,0.08)] transition-colors duration-200 hover:bg-muted md:w-full md:py-2.5"
                      onClick={commonActions.handleReCreate}
                    >
                      {t('다른 문제 생성')}
                    </button>
                    <button
                      className="cursor-pointer rounded-2xl border-none bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] transition-opacity duration-200 hover:opacity-90 md:w-full md:py-2.5"
                      onClick={generationActions.handleNavigateToQuiz}
                    >
                      {t('문제 풀기')}
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </BlurFade>
        )}

        <RecentChanges />
        {ui.showHelp && <Help />}
      </div>

      <Footer />
    </div>
  );
};

export default MakeQuizDesign_E;
