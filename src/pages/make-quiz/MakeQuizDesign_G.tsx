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
import { TextAnimate } from '@/shared/ui/components/text-animate';
import { Badge } from '@/shared/ui/components/badge';

/** 퀴즈 유형 옵션 */
interface QuizTypeOption {
  key: QuestionType;
  label: string;
  icon: LucideIcon;
}

/** Stacked Sections 디자인 — 수직 리듬 밴드, 교차 배경색으로 섹션 구분 */
const MakeQuizDesign_G: React.FC = () => {
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
    <div className="flex min-h-screen flex-col">
      <Header
        isSidebarOpen={ui.isSidebarOpen}
        toggleSidebar={uiActions.toggleSidebar}
        setIsSidebarOpen={uiActions.setIsSidebarOpen}
        setShowHelp={uiActions.setShowHelp}
      />

      <div className="mx-auto mt-8 flex-1 px-4 md:mt-6 md:w-[90%] lg:w-[85%] xl:w-[80%]">
        {/* ─── 파일 미업로드 / 업로드 중 상태 ─── */}
        {!upload.uploadedUrl && (
          <section className="relative -mx-4 border-y-2 border-border bg-background px-4 py-8">
            {/* hollow 아웃라인 워터마크 */}
            <span
              className="pointer-events-none absolute -top-8 right-4 select-none text-[8rem] font-black leading-none"
              style={{ WebkitTextStroke: '2px var(--color-border)', color: 'transparent' }}
            >
              01
            </span>

            <div className="relative z-10">
              <TextAnimate
                animation="slideUp"
                by="word"
                className="text-2xl font-black tracking-tight text-foreground md:text-xl"
              >
                {t('파일을 업로드하세요')}
              </TextAnimate>
              <p className="mt-2 text-sm text-muted-foreground">
                {t('퀴즈를 생성할 문서를 드래그하거나 선택하세요')}
              </p>
            </div>

            {/* 업로드 영역 */}
            <div
              className={cn(
                'mt-8 flex flex-col items-center justify-center rounded-none border-y-2 border-border bg-muted px-8 py-20 text-center transition-colors duration-200 md:px-5 md:py-14',
                upload.isDragging && 'bg-primary/10',
              )}
              onDragOver={uploadActions.handleDragOver}
              onDragEnter={uploadActions.handleDragEnter}
              onDragLeave={uploadActions.handleDragLeave}
              onDrop={uploadActions.handleDrop}
            >
              {isWaitingForFirstQuiz ? (
                <div className="flex flex-col items-center">
                  <div className="mb-6 size-16 animate-spin rounded-none border-4 border-muted-foreground/20 border-t-primary" />
                  <div className="text-xl font-black text-foreground md:text-lg">
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
                  <div className="mb-8">
                    <Cloud className="size-20 text-muted-foreground/40 md:size-14" />
                  </div>
                  <div className="text-xl font-black text-foreground md:text-lg">
                    {t('파일을 여기에 드래그하세요')}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{t('또는')}</p>
                  <div className="relative mt-6 inline-block cursor-pointer rounded-none border-y-2 border-border bg-primary px-8 py-3 text-sm font-black text-primary-foreground transition-opacity duration-200 hover:opacity-80 md:px-6 md:py-2.5">
                    {t('파일 선택하기')}
                    <input
                      type="file"
                      accept={acceptExtensions}
                      onChange={uploadActions.handleFileInput}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                  </div>
                  {/* 파일 제한 정보 */}
                  <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground md:flex-col md:gap-2">
                    <Badge variant="outline" className="rounded-none">
                      {t('크기 제한')} · {MAX_FILE_SIZE / 1024 / 1024}MB
                    </Badge>
                    <Badge variant="outline" className="rounded-none">
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
        )}

        {/* ─── 2컬럼 레이아웃: 업로드 완료 + 생성 전 ─── */}
        {upload.uploadedUrl && !generation.problemSetId && (
          <div className="lg:grid lg:grid-cols-2 lg:gap-8">
            {/* 좌측: 파일 정보 + PDF 미리보기 (sticky) */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              {/* 파일 정보 밴드 */}
              <section className="relative -mx-4 border-y-2 border-border bg-background px-4 py-8">
                <span
                  className="pointer-events-none absolute -top-8 right-4 select-none text-[8rem] font-black leading-none"
                  style={{ WebkitTextStroke: '2px var(--color-border)', color: 'transparent' }}
                >
                  01
                </span>

                <div className="relative z-10">
                  <TextAnimate
                    animation="slideUp"
                    by="word"
                    className="text-2xl font-black tracking-tight text-foreground md:text-xl"
                  >
                    {t('업로드된 파일')}
                  </TextAnimate>
                </div>

                {/* 파일 정보 카드 */}
                <div
                  className={cn(
                    'mt-8 flex flex-col items-center justify-center rounded-none border-y-2 border-border bg-muted px-8 py-10 text-center transition-colors duration-200 md:px-5 md:py-8',
                    upload.isDragging && 'bg-primary/10',
                  )}
                  onDragOver={uploadActions.handleDragOver}
                  onDragEnter={uploadActions.handleDragEnter}
                  onDragLeave={uploadActions.handleDragLeave}
                  onDrop={uploadActions.handleDrop}
                >
                  <FileText className="mb-4 size-16 text-muted-foreground/50 md:size-12" />
                  <div className="text-xl font-black text-foreground">{safeFileName}</div>
                  {safeFileSize && (
                    <span className="mt-1 text-sm text-muted-foreground">
                      ({(safeFileSize / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  )}
                  <button
                    className="mt-6 cursor-pointer rounded-none border-y-2 border-destructive bg-destructive px-6 py-2.5 text-sm font-black text-background transition-opacity duration-200 hover:opacity-80 md:px-5 md:py-2"
                    onClick={commonActions.handleRemoveFile}
                  >
                    {t('✕ 파일 삭제')}
                  </button>
                </div>

                {/* PDF 페이지 그리드 */}
                <div
                  className="mt-6 rounded-none border-y-2 border-border bg-muted/40 p-6 md:p-4"
                  ref={pages.pdfPreviewRef}
                >
                  <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-black text-foreground">{t('선택된 페이지 수: ')}</span>
                    <Badge variant="outline" className="rounded-none font-black">
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
                              const isSelected: boolean = pages.selectedPages.includes(pageNumber);
                              const isHovered: boolean =
                                pages.hoveredPage?.pageNumber === pageNumber;

                              return (
                                <div
                                  key={`page_${pageNumber}`}
                                  className={cn(
                                    'relative cursor-pointer overflow-hidden rounded-none border-2 border-transparent bg-background text-center transition-all duration-200 hover:z-10 hover:scale-[1.02]',
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
                                      "before:mr-2 before:inline-block before:size-4 before:border-2 before:border-border before:bg-background before:content-['']",
                                      isSelected &&
                                        "font-black text-foreground before:border-primary before:bg-primary before:bg-[url(\"data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2016%2016'%3e%3cpath%20fill='none'%20stroke='white'%20stroke-linecap='round'%20stroke-linejoin='round'%20stroke-width='2'%20d='M4%208l3%203%205-5'/%3e%3c/svg%3e\")]",
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
                            <div className="col-span-full mt-4 flex flex-col items-center justify-center border-y-2 border-border bg-muted p-5 text-muted-foreground">
                              <div className="mb-2 size-6 animate-spin rounded-full border-2 border-border border-t-primary" />
                              <p className="m-0 text-sm font-black">
                                {t('더 많은 페이지 로딩 중... (')}
                                {pages.visiblePageCount}/{pages.numPages})
                              </p>
                            </div>
                          )}
                        </div>

                        {/* 페이지 호버 미리보기 */}
                        {pages.isPreviewVisible && pages.hoveredPage && (
                          <div
                            className="pointer-events-none absolute z-30 rounded-none border-2 border-border bg-background p-3 shadow-none transition-[opacity,top] duration-200"
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
            </div>

            {/* 우측: 퀴즈 옵션 패널들 */}
            <div className="mt-6 space-y-0 lg:mt-0">
              {/* ─── 퀴즈 타입 (짝수 밴드 — bg-muted) ─── */}
              <section className="relative -mx-4 bg-muted px-4 py-8">
                <span
                  className="pointer-events-none absolute -top-8 right-4 select-none text-[8rem] font-black leading-none"
                  style={{ WebkitTextStroke: '2px var(--color-border)', color: 'transparent' }}
                >
                  02
                </span>

                <div className="relative z-10">
                  <TextAnimate
                    animation="slideUp"
                    by="word"
                    className="text-2xl font-black tracking-tight text-foreground md:text-xl"
                  >
                    {t('퀴즈 타입을 선택하세요')}
                  </TextAnimate>
                </div>

                {/* 큰 선택 카드 형태 */}
                <div className="mt-8 grid grid-cols-3 gap-3 md:grid-cols-1">
                  {quizTypes.map((type) => (
                    <button
                      key={type.key}
                      className={cn(
                        'flex h-24 cursor-pointer items-center justify-center rounded-none border-y-2 border-border bg-background text-sm font-black text-muted-foreground transition-all duration-200 hover:bg-primary/5 md:h-16',
                        options.questionType === type.key && 'bg-primary text-primary-foreground',
                      )}
                      onClick={() => {
                        optionActions.handleQuestionTypeChange(type.key, type.label);
                      }}
                    >
                      <span className="inline-flex items-center gap-2">
                        <type.icon className="size-5" strokeWidth={2} />
                        {type.label}
                      </span>
                    </button>
                  ))}
                </div>

                {/* 난이도 미리보기 */}
                <div className="mt-6 rounded-none border-y-2 border-border bg-background p-6 md:p-4">
                  <div className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
                    {currentLevel?.title}
                  </div>
                  <div className="border-y-2 border-border bg-muted/40 p-4">
                    <p className="m-0 whitespace-pre-wrap break-keep text-sm font-medium leading-relaxed text-foreground md:break-words">
                      {currentLevel?.question}
                    </p>
                  </div>
                  {currentLevel?.options && currentLevel.options.length > 0 && (
                    <div className="mt-4 flex flex-col gap-2">
                      {currentLevel.options.map((option: string, index: number) => (
                        <div
                          key={`${option}-${index}`}
                          className="flex items-center border-y-2 border-border bg-muted/40 px-4 py-3"
                        >
                          <span className="mr-3 inline-flex size-8 shrink-0 items-center justify-center bg-primary text-xs font-black text-primary-foreground">
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

              {/* ─── 문제 개수 (홀수 밴드 — bg-background) ─── */}
              <section className="relative -mx-4 border-y-2 border-border bg-background px-4 py-8">
                <span
                  className="pointer-events-none absolute -top-8 right-4 select-none text-[8rem] font-black leading-none"
                  style={{ WebkitTextStroke: '2px var(--color-border)', color: 'transparent' }}
                >
                  03
                </span>

                <div className="relative z-10">
                  <TextAnimate
                    animation="slideUp"
                    by="word"
                    className="text-2xl font-black tracking-tight text-foreground md:text-xl"
                  >
                    {t('문제 개수를 지정하세요')}
                  </TextAnimate>
                </div>

                {/* 거대한 현재값 표시 */}
                <div className="mt-8 flex flex-col items-center">
                  <div className="text-[3rem] font-bold text-primary">{options.questionCount}</div>
                  <span className="mt-1 text-sm font-black uppercase tracking-widest text-muted-foreground">
                    {t('문제')}
                  </span>
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
                    className="h-2 w-full accent-primary"
                  />
                  <div className="mt-3 flex justify-between text-xs font-black text-muted-foreground">
                    <span>5</span>
                    <span>10</span>
                    <span>15</span>
                    <span>20</span>
                    <span>25</span>
                  </div>
                </div>
              </section>

              {/* ─── 페이지 선택 (짝수 밴드 — bg-muted) ─── */}
              <section className="relative -mx-4 bg-muted px-4 py-8">
                <span
                  className="pointer-events-none absolute -top-8 right-4 select-none text-[8rem] font-black leading-none"
                  style={{ WebkitTextStroke: '2px var(--color-border)', color: 'transparent' }}
                >
                  04
                </span>

                <div className="relative z-10">
                  <TextAnimate
                    animation="slideUp"
                    by="word"
                    className="text-2xl font-black tracking-tight text-foreground md:text-xl"
                  >
                    {t('특정 페이지를 지정하세요')}
                  </TextAnimate>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t('최대 ')}
                    {MAX_SELECT_PAGES}
                    {t(' 페이지')} {t('선택할 수 있어요')}
                  </p>
                </div>

                {/* 페이지 범위 입력 */}
                <div className="mt-8 flex flex-wrap items-center gap-3 rounded-none border-y-2 border-border bg-background p-6 md:flex-col md:items-stretch md:p-4">
                  <div className="flex flex-1 flex-wrap items-center gap-2 md:flex-col md:items-start md:gap-1.5">
                    <span className="text-sm font-black text-foreground">
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
                        className="w-20 rounded-none border-y-2 border-border bg-background px-3 py-2 text-center text-sm font-bold transition-all duration-200 focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground md:w-15 md:px-2 md:py-1.5"
                      />
                      <span className="text-lg font-black text-muted-foreground">~</span>
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
                        className="w-20 rounded-none border-y-2 border-border bg-background px-3 py-2 text-center text-sm font-bold transition-all duration-200 focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground md:w-15 md:px-2 md:py-1.5"
                      />
                      <button
                        type="button"
                        className="cursor-pointer rounded-none border-y-2 border-primary bg-primary px-5 py-2 text-sm font-black text-primary-foreground transition-opacity duration-200 hover:opacity-80 disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:text-muted-foreground md:h-8 md:min-w-11 md:px-3 md:py-0 md:text-sm md:leading-none"
                        onClick={pageActions.handleApplyPageRange}
                        disabled={!pages.numPages}
                      >
                        {t('적용')}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2 md:w-full md:flex-col md:gap-2">
                    <button
                      className="cursor-pointer rounded-none border-y-2 border-border bg-background px-5 py-2 text-sm font-black text-foreground transition-colors duration-200 hover:bg-muted md:w-full"
                      onClick={pageActions.handleSelectAllPages}
                    >
                      {t('전체 선택')}
                    </button>
                    <button
                      className="cursor-pointer rounded-none border-y-2 border-destructive/30 bg-background px-5 py-2 text-sm font-black text-destructive transition-colors duration-200 hover:bg-destructive/5 md:w-full"
                      onClick={pageActions.handleClearAllPages}
                    >
                      {t('전체 해제')}
                    </button>
                    <button
                      className={cn(
                        'cursor-pointer rounded-none border-y-2 border-border bg-background px-5 py-2 text-sm font-black text-foreground transition-colors duration-200 hover:bg-muted md:hidden',
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
              </section>

              {/* ─── 문제 생성 (홀수 밴드 — bg-background) ─── */}
              <section className="relative -mx-4 border-y-2 border-border bg-background px-4 py-8">
                <span
                  className="pointer-events-none absolute -top-8 right-4 select-none text-[8rem] font-black leading-none"
                  style={{ WebkitTextStroke: '2px var(--color-border)', color: 'transparent' }}
                >
                  05
                </span>

                <div className="relative z-10">
                  <TextAnimate
                    animation="slideUp"
                    by="word"
                    className="text-2xl font-black tracking-tight text-foreground md:text-xl"
                  >
                    {t('문제를 생성하세요')}
                  </TextAnimate>
                </div>

                {/* 생성 상태 영역 */}
                <div className="mt-8 flex min-h-[160px] items-center justify-center rounded-none border-y-2 border-border bg-muted p-8 text-center md:min-h-[120px] md:p-5">
                  {isWaitingForFirstQuiz ? (
                    <div className="flex flex-col items-center">
                      <div className="mb-4 size-14 animate-spin border-4 border-muted-foreground/20 border-t-primary" />
                      <p className="m-0 text-sm font-bold md:text-sm">
                        {t('문제 생성 중...')}
                        {Math.floor(generation.generationElapsedTime / 1000)}
                        {t('초')}
                        <br />
                        <span className="mt-1.5 inline-block text-xs font-normal text-muted-foreground">
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
                <div className="mt-8 flex flex-col items-center gap-3 md:mb-8">
                  <button
                    className="w-full cursor-pointer rounded-none border-y-2 border-primary bg-primary py-5 text-lg font-black text-primary-foreground transition-opacity duration-200 hover:opacity-80 disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:text-muted-foreground md:py-4 md:text-base"
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
        )}

        {/* ─── 생성 완료 결과 ─── */}
        {generation.problemSetId && (
          <section className="relative -mx-4 border-y-2 border-border bg-muted px-4 py-8">
            <TextAnimate
              animation="slideUp"
              by="word"
              className="text-2xl font-black tracking-tight text-foreground md:text-xl"
            >
              {t('생성된 문제')}
            </TextAnimate>
            <div className="mt-8 flex w-full flex-wrap items-center gap-6 rounded-none border-y-2 border-border bg-background p-6 md:flex-col md:items-start md:gap-3 md:p-4">
              <div className="flex items-center gap-4 md:gap-3">
                <div className="flex size-14 shrink-0 items-center justify-center border-y-2 border-border bg-muted md:size-10">
                  <FileText className="size-8 text-muted-foreground md:size-6" />
                </div>
                <div className="min-w-0">
                  <div className="break-words text-lg font-black text-foreground md:text-base">
                    {safeFileName}
                  </div>
                </div>
              </div>
              <div className="ml-auto flex max-w-full shrink-0 flex-wrap items-center gap-3 md:ml-0 md:w-full md:flex-col md:gap-2">
                <button
                  className="cursor-pointer rounded-none border-y-2 border-destructive bg-background px-5 py-2.5 text-sm font-black text-destructive transition-colors duration-200 hover:bg-destructive/5 md:w-full md:py-2.5"
                  onClick={commonActions.handleRemoveFile}
                >
                  {t('다른 파일 넣기')}
                </button>
                <button
                  className="cursor-pointer rounded-none border-y-2 border-border bg-background px-5 py-2.5 text-sm font-black text-foreground transition-colors duration-200 hover:bg-muted md:w-full md:py-2.5"
                  onClick={commonActions.handleReCreate}
                >
                  {t('다른 문제 생성')}
                </button>
                <button
                  className="cursor-pointer rounded-none border-y-2 border-primary bg-primary px-5 py-2.5 text-sm font-black text-primary-foreground transition-opacity duration-200 hover:opacity-80 md:w-full md:py-2.5"
                  onClick={generationActions.handleNavigateToQuiz}
                >
                  {t('문제 풀기')}
                </button>
              </div>
            </div>
          </section>
        )}

        <RecentChanges />
        {ui.showHelp && <Help />}
      </div>

      <Footer />
    </div>
  );
};

export default MakeQuizDesign_G;
