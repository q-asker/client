import { useTranslation } from "i18nexus";
import Header from "#widgets/header";
import Help from "#widgets/help";
import {
  useMakeQuiz,
  levelDescriptions,
  MAX_FILE_SIZE,
  MAX_SELECT_PAGES,
  SUPPORTED_EXTENSIONS,
} from "#features/make-quiz";
import { Document, Page } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Link, useNavigate } from "react-router-dom";
import "./index.css";
import RecentChanges from "#widgets/recent-changes";

const MakeQuiz = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const acceptExtensions = SUPPORTED_EXTENSIONS.map((ext) => `.${ext}`).join(
    ", "
  );
  const {
    state: {
      file,
      uploadedUrl,
      isDragging,
      questionType,
      questionCount,
      isProcessing,
      version,
      isSidebarOpen,
      problemSetId,
      quizLevel,
      numPages,
      selectedPages,
      hoveredPage,
      visiblePageCount,
      pageRangeStart,
      pageRangeEnd,
      isPreviewVisible,
      pdfPreviewRef,
      showWaitMessage,
      uploadElapsedTime,
      generationElapsedTime,
      fileExtension,
      showHelp,
      pdfOptions,
    },
    actions: {
      toggleSidebar,
      setIsSidebarOpen,
      setShowHelp,
      handleDragOver,
      handleDragEnter,
      handleDragLeave,
      handleDrop,
      handleFileInput,
      handleRemoveFile,
      handleReCreate,
      handleNavigateToQuiz,
      onDocumentLoadSuccess,
      handlePageSelection,
      handleSelectAllPages,
      handleClearAllPages,
      handleApplyPageRange,
      setPageRangeStart,
      setPageRangeEnd,
      setIsPreviewVisible,
      handlePageMouseEnter,
      handlePageMouseLeave,
      generateQuestions,
      handleQuestionTypeChange,
      handleQuestionCountChange,
    },
  } = useMakeQuiz({ t, navigate });

  return (
    <div className="page-wrapper">
      <Header
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        setIsSidebarOpen={setIsSidebarOpen}
        setShowHelp={setShowHelp}
      />

      <div className="main">
        <div
          className={`upload-section ${isDragging ? "dragging" : ""}`}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* 파일 업로드 중일 때 */}
          {isProcessing && !uploadedUrl ? (
            <div className="processing">
              <div className="spinner" />
              <div className="upload-status">
                <div className="upload-title-animated">
                  {t("파일 업로드 중...")}
                  {Math.floor(uploadElapsedTime / 1000)}
                  {t("초")}
                </div>
              </div>
              {fileExtension && fileExtension !== "pdf" && (
                <div className="conversion-message">
                  <div className="conversion-text">
                    <strong>{fileExtension.toUpperCase()}</strong>
                    {t("파일을 PDF로 변환하고 있어요")}
                    <br />
                    <span className="conversion-subtext">
                      {t("파일 크기에 따라 시간이 소요될 수 있습니다")}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : !uploadedUrl ? (
            <>
              <div className="upload-icon">☁️</div>
              <div className="upload-title">
                {t("파일을 여기에 드래그하세요")}
              </div>
              <p>{t("또는")}</p>
              <div className="upload-button">
                {t("파일 선택하기")}

                <input
                  type="file"
                  accept={acceptExtensions}
                  onChange={handleFileInput}
                />
              </div>
            </>
          ) : (
            <>
              <div className="file-icon">📄</div>
              <div className="file-meta">
                <div className="file-name">{file.name}</div>
                {file.size && (
                  <span className="file-size">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                )}
              </div>
              <button className="remove-button" onClick={handleRemoveFile}>
                {t("✕ 파일 삭제")}
              </button>
            </>
          )}
          {!uploadedUrl && (
            <>
              <div className="hint">
                <ul className="hint-list">
                  <br></br>{" "}
                  <li>
                    <span className="hint-label">{t("크기 제한")}</span>
                    <span className="hint-value">
                      📦 {MAX_FILE_SIZE / 1024 / 1024}MB
                    </span>
                  </li>
                  <li>
                    <span className="hint-label">{t("지원하는 파일")}</span>
                    <span className="hint-value">
                      ✅ {SUPPORTED_EXTENSIONS.join(", ")}
                    </span>
                  </li>
                </ul>
              </div>
              <div className="hint-subtext">
                <br></br>{" "}
                {t("파일은 상업적 목적, AI 학습 목적으로 사용되지 않습니다.")}
                <br></br>{" "}
                {t("24시간 후 자동 삭제되며 별도로 저장, 공유되지 않습니다.")}
              </div>
            </>
          )}
        </div>
        {/* Options Panel */}
        {uploadedUrl && !problemSetId && (
          <div className="options-panel">
            <>
              <div className="option-section">
                {/* 문제 유형 세그먼티드 */}
                <div className="section-title">
                  {t("1. 퀴즈 타입을 선택하세요!")}
                </div>
                <div className="segmented-control question-type">
                  {[
                    { key: "MULTIPLE", label: t("객관식") },
                    { key: "BLANK", label: t("빈칸 넣기") },
                    { key: "OX", label: t("OX 퀴즈") },
                  ].map((type) => {
                    return (
                      <button
                        key={type.key}
                        className={questionType === type.key ? "active" : ""}
                        onClick={() => {
                          handleQuestionTypeChange(type.key, type.label);
                        }}
                      >
                        {type.label}
                      </button>
                    );
                  })}
                </div>
                <div className="level-selector-row">
                  {/* ② 선택한 난이도에 해당하는 설명을 옆에 출력 */}
                  <div className="level-counter-wrapper">
                    <div className="quiz-example-card">
                      <div className="quiz-example-title">
                        {levelDescriptions[quizLevel]?.title}
                      </div>
                      <div className="quiz-example-question">
                        <p className="quiz-example-question-text">
                          {levelDescriptions[quizLevel]?.question}
                        </p>
                      </div>
                      {levelDescriptions[quizLevel]?.options?.length > 0 && (
                        <div className="quiz-example-options">
                          {levelDescriptions[quizLevel].options.map(
                            (option, index) => (
                              <div
                                key={`${option}-${index}`}
                                className="quiz-example-option"
                              >
                                <span className="quiz-example-option-index">
                                  {index + 1}
                                </span>
                                <span className="quiz-example-option-text">
                                  {option}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {/* 문제 개수 슬라이더 */}
              <div className="option-section">
                <div className="section-title">
                  {t("2. 문제 개수를 지정하세요!")}
                </div>
                <div className="slider-control">
                  <label>
                    <strong>{t("문제 개수: ")}</strong>
                    <span className="count-badge">
                      {questionCount}
                      {t("문제")}
                    </span>
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="25"
                    step="5"
                    value={questionCount}
                    onChange={(e) => {
                      const newCount = +e.target.value;
                      handleQuestionCountChange(newCount);
                    }}
                  />
                </div>
              </div>

              <div className="option-section">
                <div className="page-decide page-decide-custom">
                  <div className="page-title-group">
                    <div className="section-title">
                      {t("3. 특정 페이지를 지정하세요!")}
                    </div>
                    <div className="preview-subtitle">
                      <span className="preview-badge">
                        {t("최대 ")}
                        {MAX_SELECT_PAGES}
                        {t(" 페이지")}
                      </span>
                      <span className="preview-subtitle-text">
                        <strong>{t("선택할 수 있어요")}</strong>
                      </span>
                    </div>
                  </div>
                  <div className="page-range-panel">
                    <div className="page-input-row">
                      <span className="page-input-label">
                        {t("원하는 페이지 입력:")}
                      </span>
                      <div className="page-input-controls">
                        <input
                          type="number"
                          min="1"
                          max={numPages ?? 1}
                          value={pageRangeStart}
                          onChange={(e) => setPageRangeStart(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleApplyPageRange();
                            }
                          }}
                          disabled={!numPages}
                        />
                        <span className="page-range-separator">~</span>
                        <input
                          type="number"
                          min="1"
                          max={numPages ?? 1}
                          value={pageRangeEnd}
                          onChange={(e) => setPageRangeEnd(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleApplyPageRange();
                            }
                          }}
                          disabled={!numPages}
                        />
                        <button
                          type="button"
                          className="apply-range-button"
                          onClick={handleApplyPageRange}
                          disabled={!numPages}
                        >
                          {t("적용")}
                        </button>
                      </div>
                    </div>
                    <div className="preview-actions">
                      <button
                        className="select-all-button"
                        onClick={handleSelectAllPages}
                      >
                        {selectedPages.length === numPages
                          ? t("전체 선택")
                          : t("전체 선택")}
                      </button>
                      <button
                        className="clear-all-button"
                        onClick={handleClearAllPages}
                      >
                        {t("전체 해제")}
                      </button>
                      <button
                        className={`preview-toggle-button ${
                          isPreviewVisible ? "is-active" : ""
                        }`}
                        type="button"
                        onClick={() => setIsPreviewVisible((prev) => !prev)}
                      >
                        {isPreviewVisible
                          ? t("미리보기 끄기")
                          : t("미리보기 켜기")}
                      </button>
                    </div>
                  </div>
                </div>
                {uploadedUrl && (
                  <div className="pdf-preview-container" ref={pdfPreviewRef}>
                    <div className="selected-count preview-subtitle">
                      <strong>{t("선택된 페이지 수: ")}</strong>
                      <span className="preview-badge">
                        {selectedPages.length}/{numPages ?? 0}
                      </span>
                    </div>
                    <Document
                      file={uploadedUrl}
                      onLoadSuccess={onDocumentLoadSuccess}
                      onLoadError={console.error}
                      options={pdfOptions}
                    >
                      <div className="pdf-grid-and-preview-wrapper">
                        <div
                          className="pdf-preview-grid"
                          onMouseLeave={handlePageMouseLeave}
                        >
                          {Array.from(
                            new Array(Math.min(visiblePageCount, numPages)),
                            (el, index) => {
                              const pageNumber = index + 1;
                              const isDisabled = false;

                              return (
                                <div
                                  key={`page_${pageNumber}`}
                                  className={`pdf-page-item ${
                                    selectedPages.includes(pageNumber)
                                      ? "selected"
                                      : ""
                                  } ${isDisabled ? "disabled" : ""} ${
                                    hoveredPage &&
                                    hoveredPage.pageNumber === pageNumber
                                      ? "hover-active"
                                      : ""
                                  }`}
                                  onClick={() => {
                                    if (!isDisabled) {
                                      handlePageSelection(pageNumber);
                                    }
                                  }}
                                  onMouseEnter={(e) => {
                                    handlePageMouseEnter(e, pageNumber);
                                  }}
                                >
                                  <Page
                                    pageNumber={pageNumber}
                                    width={150}
                                    renderTextLayer={false}
                                    renderAnnotationLayer={false}
                                  />

                                  <p>
                                    {t("페이지")}
                                    {pageNumber}
                                  </p>
                                </div>
                              );
                            }
                          )}
                          {visiblePageCount < numPages && (
                            <div className="loading-more-pages">
                              <div className="spinner" />
                              <p>
                                {t("더 많은 페이지 로딩 중... (")}
                                {visiblePageCount}/{numPages})
                              </p>
                            </div>
                          )}
                        </div>

                        {isPreviewVisible && hoveredPage && (
                          <div
                            className="pdf-side-preview"
                            style={hoveredPage.style}
                          >
                            <Page
                              pageNumber={hoveredPage.pageNumber}
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
            </>
            {/* ④ 문서 미리보기 */}
            <div className="option-section document-preview">
              <div className="section-title">{t("4. 문제를 생성하세요!")}</div>
              <div className="preview-content">
                {isProcessing ? (
                  <div className="processing">
                    <div className="spinner" />
                    <p>
                      {t("문제 생성 중...")}
                      {Math.floor(generationElapsedTime / 1000)}
                      {t("초")}
                      <br></br>{" "}
                      {t(
                        "생성된 문제의 개수는 간혹 지정한 개수와 맞지 않을 수 있습니다."
                      )}
                    </p>
                    {showWaitMessage && (
                      <p className="wait-message">
                        {t("현재 생성중입니다 조금만 더 기다려주세요!")}
                      </p>
                    )}
                  </div>
                ) : (
                  <p>
                    {t(
                      "문서를 분석하고 문제를 생성하려면 아래 버튼을 클릭하세요."
                    )}
                  </p>
                )}
              </div>
              <div className="action-buttons">
                <button
                  className="primary-button large"
                  onClick={generateQuestions}
                  disabled={
                    !uploadedUrl || isProcessing || !selectedPages.length
                  }
                >
                  {isProcessing ? t("생성 중...") : t("문제 생성하기")}
                </button>
                {!isProcessing && !selectedPages.length && (
                  <p className="action-guide">
                    {t("페이지 정보를 불러오는 중입니다. 잠시만 기다려주세요.")}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        {uploadedUrl && problemSetId && (
          <div className="option-section document-preview">
            <div className="section-title">{t("생성된 문제")}</div>
            <div className="problem-card">
              <div className="problem-icon">📝</div>
              <div className="problem-details">
                <div className="problem-title">
                  {file.name}
                  {version > 0 && `.ver${version}`}
                </div>
              </div>
              <div className="problem-actions">
                <button className="btn cancle" onClick={handleRemoveFile}>
                  {t("다른 파일 넣기")}
                </button>
                <button className="btn manage" onClick={handleReCreate}>
                  {t("다른 문제 생성")}
                </button>
                <button className="btn mapping" onClick={handleNavigateToQuiz}>
                  {t("문제 풀기")}
                </button>
              </div>
            </div>
          </div>
        )}
        <RecentChanges />
        {showHelp && <Help />}
      </div>

      {/* Footer */}
      <div className="footer">
        © 2025 Q-Asker{" | "}
        <Link to="/privacy-policy" className="policy-link">
          {t("개인정보 처리방침")}
        </Link>
        <br></br>
        {t("문의 및 피드백")}
        <span>: </span>
        <a
          href="https://docs.google.com/forms/d/e/1FAIpQLSfibmR4WmBghb74tM0ugldhiutitTsJJx3KN5wYHINpr5GRnw/viewform?usp=dialog"
          target="_blank"
        >
          {t("구글 폼 링크")}
        </a>
        <span>, </span>
        <a
          href="mailto:inhapj01@gmail.com"
          aria-label={t("Q-Asker 이메일 문의")}
        >
          inhapj01@gmail.com
        </a>
      </div>
    </div>
  );
};

export default MakeQuiz;
