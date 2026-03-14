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
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { useNavigate } from 'react-router-dom';
import RecentChanges from '#widgets/recent-changes';
import { cn } from '@/shared/ui/lib/utils';
import type { QuestionType, QuizLevel } from '#features/prepare-quiz';

/** 퀴즈 유형 옵션 */
interface QuizTypeOption {
  key: QuestionType;
  label: string;
}

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

  /** 퀴즈 유형 목록 */
  const quizTypes: QuizTypeOption[] = [
    { key: 'MULTIPLE', label: t('객관식') },
    { key: 'BLANK', label: t('빈칸 넣기') },
    { key: 'OX', label: t('OX 퀴즈') },
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

      <div className="mx-auto mt-8 flex-1 px-4 md:mt-6 md:w-[90%] lg:w-[70%]">
        <div
          className={cn(
            'rounded-lg border-2 border-dashed border-gray-300 p-10 text-center transition-colors duration-200 hover:border-violet-400 md:p-6',
            upload.isDragging && 'border-indigo-500 bg-indigo-50',
          )}
          onDragOver={uploadActions.handleDragOver}
          onDragEnter={uploadActions.handleDragEnter}
          onDragLeave={uploadActions.handleDragLeave}
          onDrop={uploadActions.handleDrop}
        >
          {/* 파일 업로드 중일 때 */}
          {isWaitingForFirstQuiz && !upload.uploadedUrl ? (
            <div className="flex flex-col items-center p-8">
              <div className="mb-4 size-12 animate-spin rounded-full border-4 border-black/10 border-t-gray-800" />
              <div className="flex flex-col items-center gap-2">
                <div className="text-lg font-semibold text-gray-700 md:text-base">
                  {t('파일 업로드 중...')}
                  {Math.floor(upload.uploadElapsedTime / 1000)}
                  {t('초')}
                </div>
              </div>
              {upload.fileExtension && upload.fileExtension !== 'pdf' && (
                <div className="mt-4 flex max-w-[400px] animate-fade-in-scale items-center gap-3 px-5 py-3 md:max-w-[90%] md:flex-col md:text-center">
                  <div className="text-left text-sm leading-relaxed text-gray-700 md:text-center md:text-[13px]">
                    <strong className="text-[15px] font-semibold md:text-sm">
                      {upload.fileExtension.toUpperCase()}
                    </strong>
                    {t('파일을 PDF로 변환하고 있어요')}
                    <br />
                    <span className="text-xs italic text-gray-500 md:text-[11px]">
                      {t('파일 크기에 따라 시간이 소요될 수 있습니다')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : !upload.uploadedUrl ? (
            <>
              <div className="mb-4 text-5xl md:mb-3 md:text-4xl">☁️</div>
              <div className="my-2 text-lg font-bold text-gray-900">
                {t('파일을 여기에 드래그하세요')}
              </div>
              <p>{t('또는')}</p>
              <div className="relative inline-block cursor-pointer rounded-lg bg-indigo-500 px-4 py-2 text-white transition-all duration-200 hover:scale-[1.02] hover:bg-violet-500 md:px-3 md:py-1.5 md:text-sm">
                {t('파일 선택하기')}
                <input
                  type="file"
                  accept={acceptExtensions}
                  onChange={uploadActions.handleFileInput}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
              </div>
            </>
          ) : (
            <>
              <div className="mb-4 text-5xl md:mb-3 md:text-4xl">📄</div>
              <div className="flex flex-col flex-wrap items-center justify-center">
                <div className="my-2 text-lg font-bold text-gray-900">{safeFileName}</div>
                {safeFileSize && (
                  <span className="text-sm font-medium text-gray-400">
                    ({(safeFileSize / 1024 / 1024).toFixed(2)} MB)
                  </span>
                )}
              </div>
              <button
                className="mt-4 cursor-pointer rounded-lg border-none bg-red-500 px-4 py-2 text-white md:px-3 md:py-1.5 md:text-sm"
                onClick={commonActions.handleRemoveFile}
              >
                {t('✕ 파일 삭제')}
              </button>
            </>
          )}
          {!upload.uploadedUrl && (
            <>
              <div className="flex justify-center text-gray-500 md:text-sm">
                <ul className="mx-auto mt-2 grid list-none gap-1.5 p-0 text-left">
                  <br />
                  <li className="flex flex-wrap items-baseline justify-start gap-1.5 md:flex-col md:items-start md:gap-0.5">
                    <span className="min-w-[72px] text-xs tracking-wide md:block md:w-full">
                      {t('크기 제한')}
                    </span>
                    <span className="font-semibold text-gray-700 md:block md:w-full">
                      📦 {MAX_FILE_SIZE / 1024 / 1024}MB
                    </span>
                  </li>
                  <li className="flex flex-wrap items-baseline justify-start gap-1.5 md:flex-col md:items-start md:gap-0.5">
                    <span className="min-w-[72px] text-xs tracking-wide md:block md:w-full">
                      {t('지원하는 파일')}
                    </span>
                    <span className="font-semibold text-gray-700 md:block md:w-full">
                      ✅ {SUPPORTED_EXTENSIONS.join(', ')}
                    </span>
                  </li>
                </ul>
              </div>
              <div className="mt-2 text-sm leading-relaxed text-gray-400">
                <br /> {t('파일은 상업적 목적, AI 학습 목적으로 사용되지 않습니다.')}
                <br /> {t('24시간 후 자동 삭제되며 별도로 저장, 공유되지 않습니다.')}
              </div>
            </>
          )}
        </div>
        {/* 옵션 패널 */}
        {upload.uploadedUrl && !generation.problemSetId && (
          <div className="my-8 md:my-6">
            <div className="rounded-[10px] border border-gray-200 bg-gray-50 p-5">
              {/* 문제 유형 세그먼티드 */}
              <div className="text-lg font-semibold text-gray-900 md:mb-4 md:text-base md:font-semibold">
                {t('1. 퀴즈 타입을 선택하세요!')}
              </div>
              <div className="my-6 flex overflow-hidden rounded-lg bg-gray-100 md:my-4">
                {quizTypes.map((type) => (
                  <button
                    key={type.key}
                    className={cn(
                      'flex-1 cursor-pointer border-none bg-transparent py-3 font-medium text-gray-500 transition-colors duration-200 md:py-2 md:text-sm',
                      options.questionType === type.key && 'bg-indigo-500 text-white',
                    )}
                    onClick={() => {
                      optionActions.handleQuestionTypeChange(type.key, type.label);
                    }}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
              <div className="flex items-start gap-4 md:flex-col md:items-stretch md:gap-2">
                {/* 선택한 난이도에 해당하는 설명 */}
                <div className="mb-4 w-full text-center">
                  <div className="w-full max-w-full rounded-[10px] border border-border bg-card p-3 shadow-sm md:p-3.5">
                    <div className="mb-2 text-[13px] font-semibold text-muted-foreground">
                      {currentLevel?.title}
                    </div>
                    <div className="rounded-lg bg-muted px-3 py-2.5">
                      <p className="m-0 whitespace-pre-wrap break-keep text-[13px] leading-relaxed md:break-words">
                        {currentLevel?.question}
                      </p>
                    </div>
                    {currentLevel?.options && currentLevel.options.length > 0 && (
                      <div className="mt-2.5 flex flex-col gap-2">
                        {currentLevel.options.map((option: string, index: number) => (
                          <div
                            key={`${option}-${index}`}
                            className="flex items-center rounded-lg border border-border bg-card px-2.5 py-2 md:px-3 md:py-2.5"
                          >
                            <span className="mr-2.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-gray-700">
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
            </div>
            {/* 문제 개수 슬라이더 */}
            <div className="mt-5 rounded-[10px] border border-gray-200 bg-gray-50 p-5">
              <div className="text-lg font-semibold text-gray-900 md:text-base md:font-semibold">
                {t('2. 문제 개수를 지정하세요!')}
              </div>
              <div className="my-6 md:my-4">
                <label className="mb-3 block text-sm font-medium text-gray-700 md:mb-2 md:text-sm">
                  <strong>{t('문제 개수: ')}</strong>
                  <span className="ml-2 inline-flex items-center justify-center rounded-full bg-indigo-50 px-3 py-1 text-sm font-bold text-indigo-900">
                    {options.questionCount}
                    {t('문제')}
                  </span>
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
                  className="h-1 w-full accent-indigo-500 md:h-[3px]"
                />
              </div>
            </div>

            <div className="mt-5 rounded-[10px] border border-gray-200 bg-gray-50 p-5">
              <div className="flex flex-col items-start gap-3 md:mt-3 md:flex-col md:items-stretch md:gap-2">
                <div className="flex flex-col gap-1">
                  <div className="text-lg font-semibold text-gray-900 md:text-base md:font-semibold">
                    {t('3. 특정 페이지를 지정하세요!')}
                  </div>
                  <div className="flex items-center gap-1.5 pb-1.5 pl-1.5 text-sm font-medium text-gray-700">
                    <span className="inline-flex items-center justify-center rounded-full bg-indigo-50 px-3 py-1 text-sm font-bold text-indigo-900">
                      {t('최대 ')}
                      {MAX_SELECT_PAGES}
                      {t(' 페이지')}
                    </span>
                    <span className="font-semibold text-gray-900">
                      <strong>{t('선택할 수 있어요')}</strong>
                    </span>
                  </div>
                </div>
                <div className="flex w-full flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 text-center md:flex-col md:items-stretch md:p-3">
                  <div className="flex flex-1 flex-wrap items-center gap-2 text-center md:flex-col md:items-start md:flex-nowrap md:gap-1.5">
                    <span className="text-left font-medium text-gray-700 md:mb-0.5 md:w-full">
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
                        className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-center text-base transition-all duration-200 focus:border-brand focus:shadow-focus-ring-sm focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 md:w-15 md:px-2 md:py-1.5 md:text-sm"
                      />
                      <span className="text-center text-gray-500 md:inline-flex md:items-center md:px-0.5 md:text-sm">
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
                        className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-center text-base transition-all duration-200 focus:border-brand focus:shadow-focus-ring-sm focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 md:w-15 md:px-2 md:py-1.5 md:text-sm"
                      />
                      <button
                        type="button"
                        className="cursor-pointer rounded-lg border border-indigo-500 bg-indigo-500 px-3.5 py-2 text-[0.95rem] text-white transition-colors duration-200 hover:border-indigo-600 hover:bg-indigo-600 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-200 disabled:text-gray-400 md:h-8 md:min-w-11 md:whitespace-nowrap md:px-2.5 md:py-0 md:text-sm md:leading-none"
                        onClick={pageActions.handleApplyPageRange}
                        disabled={!pages.numPages}
                      >
                        {t('적용')}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-wrap items-center justify-end gap-2 md:w-full md:flex-col md:items-stretch md:gap-2.5">
                    <button
                      className="cursor-pointer rounded-lg border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-[0.95rem] text-indigo-800 transition-colors duration-200 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-200 disabled:text-gray-400 md:w-full"
                      onClick={pageActions.handleSelectAllPages}
                    >
                      {pages.selectedPages.length === pages.numPages
                        ? t('전체 선택')
                        : t('전체 선택')}
                    </button>
                    <button
                      className="cursor-pointer rounded-lg border border-red-200 bg-white px-3.5 py-2 text-[0.95rem] text-red-500 transition-colors duration-200 hover:bg-red-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-200 disabled:text-gray-400 md:w-full"
                      onClick={pageActions.handleClearAllPages}
                    >
                      {t('전체 해제')}
                    </button>
                    <button
                      className={cn(
                        'cursor-pointer rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-[0.95rem] text-gray-900 transition-colors duration-200 hover:bg-gray-100 md:hidden',
                        pages.isPreviewVisible && 'border-gray-800 bg-gray-800 text-white',
                      )}
                      type="button"
                      onClick={() => pageActions.setIsPreviewVisible((prev: boolean) => !prev)}
                    >
                      {pages.isPreviewVisible ? t('미리보기 끄기') : t('미리보기 켜기')}
                    </button>
                  </div>
                </div>
              </div>
              {upload.uploadedUrl && (
                <div
                  className="mt-6 rounded-lg border border-gray-300 p-4"
                  ref={pages.pdfPreviewRef}
                >
                  <div className="flex items-center gap-1.5 pb-1.5 pl-1.5 text-sm font-medium text-gray-700">
                    <strong>{t('선택된 페이지 수: ')}</strong>
                    <span className="inline-flex items-center justify-center rounded-full bg-indigo-50 px-3 py-1 text-sm font-bold text-indigo-900">
                      {pages.selectedPages.length}/{pages.numPages ?? 0}
                    </span>
                  </div>
                  {isMock ? (
                    /* mock 모드: PDF 뷰어 대신 페이지 목록 표시 */
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3 p-1.5">
                      {Array.from({ length: pages.numPages ?? 0 }, (_, index) => {
                        const pageNumber = index + 1;
                        const isSelected = pages.selectedPages.includes(pageNumber);
                        return (
                          <div
                            key={`mock_page_${pageNumber}`}
                            className={cn(
                              'flex h-[200px] cursor-pointer items-center justify-center rounded-md border bg-gray-100 text-center transition-all duration-200 hover:scale-[1.02]',
                              isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200',
                            )}
                            onClick={() => pageActions.handlePageSelection(pageNumber)}
                          >
                            <div className="flex flex-col items-center gap-2">
                              <span className="text-3xl text-gray-300">📄</span>
                              <span className="text-sm font-medium text-gray-600">
                                {t('페이지')} {pageNumber}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
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
                                    'relative cursor-pointer overflow-hidden rounded-md border border-gray-200 text-center transition-all duration-200 hover:z-10 hover:scale-[1.02] hover:shadow-md',
                                    isSelected && 'border-indigo-500',
                                    isHovered && 'border-indigo-300 shadow-focus-ring-sm',
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
                                      "before:mr-2 before:inline-block before:size-4 before:rounded-[3px] before:border before:border-gray-300 before:bg-white before:content-['']",
                                      isSelected &&
                                        "before:border-indigo-500 before:bg-indigo-500 before:bg-[url(\"data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2016%2016'%3e%3cpath%20fill='none'%20stroke='white'%20stroke-linecap='round'%20stroke-linejoin='round'%20stroke-width='2'%20d='M4%208l3%203%205-5'/%3e%3c/svg%3e\")]",
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
                            <div className="col-span-full mt-4 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-5 text-gray-500">
                              <div className="mb-2 size-6 animate-spin rounded-full border-2 border-gray-200 border-t-indigo-500" />
                              <p className="m-0 text-sm font-medium">
                                {t('더 많은 페이지 로딩 중... (')}
                                {pages.visiblePageCount}/{pages.numPages})
                              </p>
                            </div>
                          )}
                        </div>

                        {pages.isPreviewVisible && pages.hoveredPage && (
                          <div
                            className="pointer-events-none absolute z-30 rounded-lg bg-white p-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.3)] transition-[opacity,top] duration-200"
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
            {/* 문서 미리보기 */}
            <div className="mt-8 rounded-[10px] border border-gray-200 bg-gray-50 p-5">
              <div className="text-lg font-semibold text-gray-900 md:text-base md:font-semibold">
                {t('4. 문제를 생성하세요!')}
              </div>
              <div className="mt-5 flex min-h-[150px] items-center justify-center rounded-lg bg-white p-5 text-center border border-gray-200 md:min-h-[100px] md:p-4">
                {isWaitingForFirstQuiz ? (
                  <div className="flex min-h-[150px] flex-col items-center justify-center">
                    <div className="mb-4 size-12 animate-spin rounded-full border-4 border-black/10 border-t-gray-800" />
                    <p className="m-0 py-0.5 md:text-sm">
                      {t('문제 생성 중...')}
                      {Math.floor(generation.generationElapsedTime / 1000)}
                      {t('초')}
                      <br />{' '}
                      <span className="mt-1.5 inline-block text-[13px] tracking-tight text-gray-600 opacity-90">
                        {t('생성된 문제의 개수는 간혹 지정한 개수와 맞지 않을 수 있습니다.')}
                      </span>
                    </p>
                    {generation.showWaitMessage && (
                      <p className="animate-fade-in-slide-down pt-2.5 text-sm text-gray-500 opacity-0">
                        {t('현재 생성중입니다 조금만 더 기다려주세요!')}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="m-0 text-gray-500 md:text-sm">
                    {t('문서를 분석하고 문제를 생성하려면 아래 버튼을 클릭하세요.')}
                  </p>
                )}
              </div>
              <div className="mt-5 flex flex-col items-center justify-center gap-4 md:mb-8 md:gap-3">
                <button
                  className="mt-6 cursor-pointer rounded-lg border-none bg-indigo-500 px-8 py-4 text-base text-white disabled:cursor-not-allowed disabled:bg-gray-400 md:w-full md:px-0 md:py-3 md:text-sm"
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
                    <p className="mt-1 text-center text-sm text-gray-500">
                      {t('페이지 정보를 불러오는 중입니다. 잠시만 기다려주세요.')}
                    </p>
                  )}
              </div>
            </div>
          </div>
        )}
        {generation.problemSetId && (
          <div className="mt-8 rounded-[10px] border border-gray-200 bg-gray-50 p-5">
            <div className="text-lg font-semibold text-gray-900">{t('생성된 문제')}</div>
            <div className="flex w-full flex-wrap items-center gap-6 rounded-lg bg-white p-6 shadow-sm transition-shadow duration-200 hover:shadow-md md:flex-col md:items-start md:gap-2 md:p-4">
              <div className="shrink-0 text-3xl md:text-2xl">📝</div>
              <div className="min-w-0 grow-0">
                <div className="mb-1 break-words text-lg font-semibold text-gray-900 md:text-[0.95rem]">
                  {safeFileName}
                </div>
              </div>
              <div className="ml-auto flex max-w-full shrink-0 flex-wrap items-center gap-3 md:ml-0 md:w-full md:flex-col md:gap-2">
                <button
                  className="cursor-pointer rounded-md border border-red-200 bg-red-100 px-4 py-2 font-medium text-red-600 transition-colors duration-200 hover:bg-red-300 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50 md:w-full md:whitespace-nowrap md:py-2.5 md:text-sm"
                  onClick={commonActions.handleRemoveFile}
                >
                  {t('다른 파일 넣기')}
                </button>
                <button
                  className="cursor-pointer rounded-md border border-blue-200 bg-blue-100 px-4 py-2 font-medium text-blue-600 transition-colors duration-200 hover:bg-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50 md:w-full md:whitespace-nowrap md:py-2.5 md:text-sm"
                  onClick={commonActions.handleReCreate}
                >
                  {t('다른 문제 생성')}
                </button>
                <button
                  className="cursor-pointer rounded-md border border-transparent bg-indigo-500 px-4 py-2 font-medium text-white transition-colors duration-200 hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 md:w-full md:whitespace-nowrap md:py-2.5 md:text-sm"
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
