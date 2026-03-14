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

/** Ink & Paper — 활자 인쇄 에디토리얼 스타일 */
const MakeQuizDesign_A: React.FC = () => {
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
        {/* 페이지 타이틀 + 워터마크 */}
        <div className="relative mb-10 md:mb-6">
          <span className="pointer-events-none absolute -top-4 -right-4 select-none text-[8rem] font-extralight text-foreground/5">
            Q
          </span>
          <TextAnimate type="fadeIn" className="text-3xl font-light tracking-tight text-foreground">
            {t('퀴즈 만들기')}
          </TextAnimate>
          <hr className="mt-4 border-t border-foreground/20" />
        </div>

        {/* 업로드 완료 + 생성 전: 2컬럼 */}
        {upload.uploadedUrl && !generation.problemSetId ? (
          <div className="lg:grid lg:grid-cols-2 lg:gap-12">
            {/* 좌측: sticky 파일+PDF */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              {/* 파일 정보 패널 */}
              <div className="bg-transparent">
                <span className="text-xs uppercase tracking-[0.2em] text-foreground/60">
                  {t('업로드된 파일')}
                </span>
                <hr className="mt-2 border-t border-foreground/20" />

                <div
                  className={cn(
                    'mt-6 border-t border-b border-foreground/10 py-8 text-center transition-colors duration-200',
                    upload.isDragging && 'bg-foreground/5',
                  )}
                  onDragOver={uploadActions.handleDragOver}
                  onDragEnter={uploadActions.handleDragEnter}
                  onDragLeave={uploadActions.handleDragLeave}
                  onDrop={uploadActions.handleDrop}
                >
                  <div className="mb-3">
                    <FileText className="size-8 text-foreground/40" strokeWidth={1} />
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <div className="my-1 text-lg font-medium tracking-tight text-foreground">
                      {safeFileName}
                    </div>
                    {safeFileSize && (
                      <Badge variant="outline" className="mt-1 font-mono text-xs">
                        {(safeFileSize / 1024 / 1024).toFixed(2)} MB
                      </Badge>
                    )}
                  </div>
                  <button
                    className="mt-5 cursor-pointer border border-foreground px-4 py-2 text-sm text-foreground transition-colors duration-200 hover:bg-foreground hover:text-background md:px-3 md:py-1.5 md:text-xs"
                    onClick={commonActions.handleRemoveFile}
                  >
                    {t('파일 삭제')}
                  </button>
                </div>

                {/* PDF 미리보기 */}
                {upload.uploadedUrl && (
                  <div className="mt-6" ref={pages.pdfPreviewRef}>
                    <div className="flex items-center gap-2 pb-2 text-sm text-foreground/80">
                      <span className="text-xs uppercase tracking-[0.2em] text-foreground/60">
                        {t('선택된 페이지 수')}
                      </span>
                      <Badge variant="outline" className="font-mono text-xs">
                        {pages.selectedPages.length}/{pages.numPages ?? 0}
                      </Badge>
                    </div>
                    <hr className="mb-4 border-t border-foreground/10" />
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
                                      'relative cursor-pointer overflow-hidden border border-foreground/10 text-center transition-all duration-200 hover:z-10 hover:scale-[1.02]',
                                      isSelected && 'border-foreground',
                                      isHovered && 'border-foreground/60',
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
                                        'mt-2 flex items-center justify-center pb-2 text-xs tracking-wide',
                                        "before:mr-2 before:inline-block before:size-3.5 before:border before:border-foreground/30 before:bg-transparent before:content-['']",
                                        isSelected &&
                                          "font-bold underline decoration-foreground underline-offset-4 before:border-foreground before:bg-foreground before:bg-[url(\"data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2016%2016'%3e%3cpath%20fill='none'%20stroke='white'%20stroke-linecap='round'%20stroke-linejoin='round'%20stroke-width='2'%20d='M4%208l3%203%205-5'/%3e%3c/svg%3e\")]",
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
                              <div className="col-span-full mt-4 flex flex-col items-center justify-center border-t border-foreground/10 p-5 text-foreground/50">
                                <div className="mb-2 size-5 animate-spin border border-foreground/20 border-t-foreground" />
                                <p className="m-0 text-xs tracking-wide">
                                  {t('더 많은 페이지 로딩 중... (')}
                                  {pages.visiblePageCount}/{pages.numPages})
                                </p>
                              </div>
                            )}
                          </div>

                          {pages.isPreviewVisible && pages.hoveredPage && (
                            <div
                              className="pointer-events-none absolute z-30 border border-foreground/20 bg-background p-2.5 transition-[opacity,top] duration-200"
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

            {/* 우측: 퀴즈 옵션 */}
            <div className="mt-6 space-y-8 lg:mt-0">
              {/* 1. 퀴즈 타입 */}
              <div>
                <span className="text-xs uppercase tracking-[0.2em] text-foreground/60">
                  {t('1. 퀴즈 타입을 선택하세요!')}
                </span>
                <hr className="mt-2 mb-5 border-t border-foreground/20" />

                <div className="flex flex-col gap-3">
                  {quizTypes.map((type) => (
                    <button
                      key={type.key}
                      className={cn(
                        'flex cursor-pointer items-center gap-3 border border-foreground/10 bg-transparent px-4 py-3 text-left text-foreground/60 transition-colors duration-200 hover:bg-foreground hover:text-background md:px-3 md:py-2',
                        options.questionType === type.key &&
                          'border-foreground bg-foreground text-background',
                      )}
                      onClick={() => {
                        optionActions.handleQuestionTypeChange(type.key, type.label);
                      }}
                    >
                      <type.icon className="size-4 shrink-0" strokeWidth={1.5} />
                      <span className="text-sm tracking-wide">{type.label}</span>
                    </button>
                  ))}
                </div>

                {/* 난이도 설명 */}
                <div className="mt-5 border-l-2 border-foreground/20 pl-4">
                  <div className="mb-2 text-xs uppercase tracking-[0.2em] text-foreground/50">
                    {currentLevel?.title}
                  </div>
                  <p className="m-0 whitespace-pre-wrap break-keep text-sm leading-relaxed text-foreground/80 md:break-words">
                    {currentLevel?.question}
                  </p>
                  {currentLevel?.options && currentLevel.options.length > 0 && (
                    <div className="mt-3 flex flex-col gap-1.5">
                      {currentLevel.options.map((option: string, index: number) => (
                        <div
                          key={`${option}-${index}`}
                          className="flex items-center gap-2 py-1.5 text-sm text-foreground/70"
                        >
                          <span className="inline-flex size-5 shrink-0 items-center justify-center font-mono text-xs text-foreground/40">
                            {index + 1}.
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

              <hr className="border-t border-foreground/10" />

              {/* 2. 문제 개수 */}
              <div>
                <span className="text-xs uppercase tracking-[0.2em] text-foreground/60">
                  {t('2. 문제 개수를 지정하세요!')}
                </span>
                <hr className="mt-2 mb-5 border-t border-foreground/20" />

                <label className="mb-3 flex items-center gap-2 text-sm text-foreground">
                  <strong>{t('문제 개수: ')}</strong>
                  <Badge variant="outline" className="font-mono">
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
                  className="h-px w-full accent-foreground md:h-px"
                />
              </div>

              <hr className="border-t border-foreground/10" />

              {/* 3. 페이지 선택 */}
              <div>
                <span className="text-xs uppercase tracking-[0.2em] text-foreground/60">
                  {t('3. 특정 페이지를 지정하세요!')}
                </span>
                <hr className="mt-2 mb-5 border-t border-foreground/20" />

                <div className="mb-3 flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="font-mono text-xs">
                    {t('최대 ')}
                    {MAX_SELECT_PAGES}
                    {t(' 페이지')}
                  </Badge>
                  <span className="text-foreground/70">{t('선택할 수 있어요')}</span>
                </div>

                <div className="border-t border-b border-foreground/10 py-4">
                  <div className="flex flex-wrap items-center gap-3 md:flex-col md:items-stretch">
                    <div className="flex flex-1 flex-wrap items-center gap-2 text-center md:flex-col md:items-start md:flex-nowrap md:gap-1.5">
                      <span className="text-left text-sm text-foreground/70 md:mb-0.5 md:w-full">
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
                          className="w-16 border border-foreground/20 bg-transparent px-2 py-1.5 text-center font-mono text-sm text-foreground transition-colors duration-200 focus:border-foreground focus:outline-none disabled:cursor-not-allowed disabled:text-foreground/30 md:w-14"
                        />
                        <span className="font-mono text-foreground/40">~</span>
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
                          className="w-16 border border-foreground/20 bg-transparent px-2 py-1.5 text-center font-mono text-sm text-foreground transition-colors duration-200 focus:border-foreground focus:outline-none disabled:cursor-not-allowed disabled:text-foreground/30 md:w-14"
                        />
                        <button
                          type="button"
                          className="cursor-pointer border border-foreground bg-transparent px-3 py-1.5 text-sm text-foreground transition-colors duration-200 hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:border-foreground/20 disabled:text-foreground/30 md:h-8 md:min-w-11 md:whitespace-nowrap md:px-2.5 md:py-0 md:text-sm md:leading-none"
                          onClick={pageActions.handleApplyPageRange}
                          disabled={!pages.numPages}
                        >
                          {t('적용')}
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-wrap items-center justify-end gap-2 md:w-full md:flex-col md:items-stretch md:gap-2.5">
                      <button
                        className="cursor-pointer border border-foreground/30 bg-transparent px-3 py-1.5 text-sm text-foreground transition-colors duration-200 hover:bg-foreground hover:text-background md:w-full"
                        onClick={pageActions.handleSelectAllPages}
                      >
                        {t('전체 선택')}
                      </button>
                      <button
                        className="cursor-pointer border border-foreground/30 bg-transparent px-3 py-1.5 text-sm text-foreground/60 transition-colors duration-200 hover:bg-foreground hover:text-background md:w-full"
                        onClick={pageActions.handleClearAllPages}
                      >
                        {t('전체 해제')}
                      </button>
                      <button
                        className={cn(
                          'cursor-pointer border border-foreground/30 bg-transparent px-3 py-1.5 text-sm text-foreground transition-colors duration-200 hover:bg-foreground hover:text-background md:hidden',
                          pages.isPreviewVisible &&
                            'border-foreground bg-foreground text-background',
                        )}
                        type="button"
                        onClick={() => pageActions.setIsPreviewVisible((prev: boolean) => !prev)}
                      >
                        {pages.isPreviewVisible ? t('미리보기 끄기') : t('미리보기 켜기')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <hr className="border-t border-foreground/10" />

              {/* 4. 문제 생성 */}
              <div>
                <span className="text-xs uppercase tracking-[0.2em] text-foreground/60">
                  {t('4. 문제를 생성하세요!')}
                </span>
                <hr className="mt-2 mb-5 border-t border-foreground/20" />

                <div className="flex min-h-[100px] items-center justify-center border-t border-b border-foreground/10 py-8 text-center md:min-h-[80px] md:py-5">
                  {isWaitingForFirstQuiz ? (
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-4 size-10 animate-spin border border-foreground/20 border-t-foreground" />
                      <p className="m-0 text-sm text-foreground/80 md:text-xs">
                        {t('문제 생성 중...')}
                        {Math.floor(generation.generationElapsedTime / 1000)}
                        {t('초')}
                        <br />
                        <span className="mt-1.5 inline-block text-xs tracking-wide text-foreground/50">
                          {t('생성된 문제의 개수는 간혹 지정한 개수와 맞지 않을 수 있습니다.')}
                        </span>
                      </p>
                      {generation.showWaitMessage && (
                        <p className="animate-fade-in-slide-down pt-2.5 text-xs text-foreground/50 opacity-0">
                          {t('현재 생성중입니다 조금만 더 기다려주세요!')}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="m-0 text-sm text-foreground/50 md:text-xs">
                      {t('문서를 분석하고 문제를 생성하려면 아래 버튼을 클릭하세요.')}
                    </p>
                  )}
                </div>
                <div className="mt-6 flex flex-col items-center justify-center gap-4 md:gap-3">
                  <button
                    className="w-full cursor-pointer border border-foreground bg-foreground px-8 py-4 text-sm uppercase tracking-[0.15em] text-background transition-colors duration-200 hover:bg-transparent hover:text-foreground disabled:cursor-not-allowed disabled:border-foreground/20 disabled:bg-foreground/10 disabled:text-foreground/30 md:px-0 md:py-3 md:text-xs"
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
                      <p className="mt-1 text-center text-xs text-foreground/50">
                        {t('페이지 정보를 불러오는 중입니다. 잠시만 기다려주세요.')}
                      </p>
                    )}
                </div>
              </div>
            </div>
          </div>
        ) : !upload.uploadedUrl ? (
          /* 미업로드: 풀폭 드래그 영역 */
          <div
            className={cn(
              'border-t border-b border-foreground/20 py-16 text-center transition-colors duration-200 md:py-10',
              upload.isDragging && 'bg-foreground/5',
            )}
            onDragOver={uploadActions.handleDragOver}
            onDragEnter={uploadActions.handleDragEnter}
            onDragLeave={uploadActions.handleDragLeave}
            onDrop={uploadActions.handleDrop}
          >
            {isWaitingForFirstQuiz ? (
              <div className="flex flex-col items-center p-8">
                <div className="mb-4 size-10 animate-spin border border-foreground/20 border-t-foreground" />
                <div className="flex flex-col items-center gap-2">
                  <div className="text-sm font-medium tracking-wide text-foreground/70 md:text-xs">
                    {t('파일 업로드 중...')}
                    {Math.floor(upload.uploadElapsedTime / 1000)}
                    {t('초')}
                  </div>
                </div>
                {upload.fileExtension && upload.fileExtension !== 'pdf' && (
                  <div className="mt-4 max-w-[400px] animate-fade-in-scale px-5 py-3 md:max-w-[90%]">
                    <div className="text-sm leading-relaxed text-foreground/70 md:text-center md:text-xs">
                      <Badge variant="outline" className="mr-1 font-mono">
                        {upload.fileExtension.toUpperCase()}
                      </Badge>
                      {t('파일을 PDF로 변환하고 있어요')}
                      <br />
                      <span className="text-xs italic text-foreground/40">
                        {t('파일 크기에 따라 시간이 소요될 수 있습니다')}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="mb-4 md:mb-3">
                  <Cloud className="size-10 text-foreground/30" strokeWidth={1} />
                </div>
                <div className="my-2 text-lg font-light tracking-tight text-foreground">
                  {t('파일을 여기에 드래그하세요')}
                </div>
                <p className="text-sm text-foreground/40">{t('또는')}</p>
                <div className="relative mt-2 inline-block cursor-pointer border border-foreground px-5 py-2.5 text-sm text-foreground transition-colors duration-200 hover:bg-foreground hover:text-background md:px-4 md:py-2 md:text-xs">
                  {t('파일 선택하기')}
                  <input
                    type="file"
                    accept={acceptExtensions}
                    onChange={uploadActions.handleFileInput}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                </div>
              </>
            )}
            {!isWaitingForFirstQuiz && (
              <>
                <div className="mt-8 flex justify-center text-foreground/50 md:text-sm">
                  <ul className="mx-auto grid list-none gap-2 p-0 text-left">
                    <li className="flex flex-wrap items-baseline gap-2 md:flex-col md:items-start md:gap-0.5">
                      <span className="text-xs uppercase tracking-[0.15em] text-foreground/40 md:block md:w-full">
                        {t('크기 제한')}
                      </span>
                      <span className="text-sm text-foreground/70 md:block md:w-full">
                        <Package className="inline size-3.5" strokeWidth={1.5} />{' '}
                        {MAX_FILE_SIZE / 1024 / 1024}MB
                      </span>
                    </li>
                    <li className="flex flex-wrap items-baseline gap-2 md:flex-col md:items-start md:gap-0.5">
                      <span className="text-xs uppercase tracking-[0.15em] text-foreground/40 md:block md:w-full">
                        {t('지원하는 파일')}
                      </span>
                      <span className="text-sm text-foreground/70 md:block md:w-full">
                        <CheckCircle className="inline size-3.5" strokeWidth={1.5} />{' '}
                        {SUPPORTED_EXTENSIONS.join(', ')}
                      </span>
                    </li>
                  </ul>
                </div>
                <div className="mt-4 text-xs leading-relaxed text-foreground/35">
                  {t('파일은 상업적 목적, AI 학습 목적으로 사용되지 않습니다.')}
                  <br />
                  {t('24시간 후 자동 삭제되며 별도로 저장, 공유되지 않습니다.')}
                </div>
              </>
            )}
          </div>
        ) : null}

        {/* 생성 완료: 풀폭 결과 카드 */}
        {generation.problemSetId && (
          <div className="mt-10">
            <span className="text-xs uppercase tracking-[0.2em] text-foreground/60">
              {t('생성된 문제')}
            </span>
            <hr className="mt-2 mb-6 border-t border-foreground/20" />
            <div className="flex w-full flex-wrap items-center gap-6 border-t border-b border-foreground/10 py-6 md:flex-col md:items-start md:gap-3">
              <div className="shrink-0">
                <FileText className="size-7 text-foreground/40" strokeWidth={1} />
              </div>
              <div className="min-w-0 grow-0">
                <div className="break-words text-lg font-light tracking-tight text-foreground md:text-base">
                  {safeFileName}
                </div>
              </div>
              <div className="ml-auto flex max-w-full shrink-0 flex-wrap items-center gap-3 md:ml-0 md:w-full md:flex-col md:gap-2">
                <button
                  className="cursor-pointer border border-foreground/30 bg-transparent px-4 py-2 text-sm text-foreground/60 transition-colors duration-200 hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:opacity-50 md:w-full md:py-2.5 md:text-xs"
                  onClick={commonActions.handleRemoveFile}
                >
                  {t('다른 파일 넣기')}
                </button>
                <button
                  className="cursor-pointer border border-foreground/30 bg-transparent px-4 py-2 text-sm text-foreground/60 transition-colors duration-200 hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:opacity-50 md:w-full md:py-2.5 md:text-xs"
                  onClick={commonActions.handleReCreate}
                >
                  {t('다른 문제 생성')}
                </button>
                <button
                  className="cursor-pointer border border-foreground bg-foreground px-4 py-2 text-sm text-background transition-colors duration-200 hover:bg-transparent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 md:w-full md:py-2.5 md:text-xs"
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

export default MakeQuizDesign_A;
