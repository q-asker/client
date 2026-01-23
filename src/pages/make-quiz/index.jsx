import { useTranslation } from "i18nexus";
import Header from "#widgets/header";
import Help from "#widgets/help";
import { useMakeQuiz, levelDescriptions, MAX_FILE_SIZE } from "#features/make-quiz";
import { Document, Page } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { useNavigate } from "react-router-dom";
import "./index.css";
import RecentChanges from "#widgets/recent-changes";

const MakeQuiz = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
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
      pageMode,
      numPages,
      selectedPages,
      hoveredPage,
      visiblePageCount,
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
      handlePageMouseEnter,
      handlePageMouseLeave,
      generateQuestions,
      handleQuestionTypeChange,
      handleQuestionCountChange,
      handlePageModeChange,
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
                  accept=".ppt, .pptx, .pdf"
                  onChange={handleFileInput}
                />
              </div>
              <p className="hint">
                {t("지원 파일 형식: PPT, PPTX, PDF")}
                <br></br>
                {t("파일 크기 제한:")} {MAX_FILE_SIZE / 1024 / 1024}MB <br></br>
              </p>
            </>
          ) : (
            <>
              <div className="file-icon">📄</div>
              <div className="file-name">{file.name}</div>
              {file.size && <p>{(file.size / 1024 / 1024).toFixed(2)} MB</p>}
              <button className="remove-button" onClick={handleRemoveFile}>
                {t("✕ 파일 삭제")}
              </button>
            </>
          )}
          <p className="hint">
            <p className="hint">
              {t("파일 page  제한: 선택했을 때")} <strong>150pages 이하</strong>
            </p>
            {t("🚨파일은 상업적 목적, AI 학습 목적으로 사용되지 않습니다.")}
            <br></br>{" "}
            {t("24시간 후 자동 삭제되며 별도로 저장, 공유되지 않습니다.")}
            <br></br>{" "}
            {t("생성된 문제의 개수는 간혹 지정한 개수와 맞지 않을 수 있습니다")}
          </p>
        </div>
        {/* Options Panel */}
        {uploadedUrl && !problemSetId && (
          <div className="options-panel">
            <div className="options-title">{t("퀴즈 생성 옵션")}</div>
            {/* 문제 유형 세그먼티드 */}
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
                <pre className="level-description">
                  {levelDescriptions[quizLevel]}
                </pre>
              </div>
            </div>
            {/* 문제 수량 슬라이더 */}
            <div className="slider-control">
              <label>
                {t("문제 수량: ")}
                {questionCount}
                {t("문제")}
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

            <div className="page-title">
              {t("특정 페이지를 지정하고 싶으신가요?")}
            </div>
            <div className="page-decide">
              <select
                value={pageMode}
                onChange={(e) => {
                  const mode = e.target.value;
                  handlePageModeChange(mode);
                }}
              >
                <option value="ALL">{t("전체")}</option>
                <option value="CUSTOM">{t("사용자 지정")}</option>
              </select>
            </div>

            {uploadedUrl && (
              <div className="pdf-preview-container" ref={pdfPreviewRef}>
                <div className="pdf-preview-header">
                  <div className="preview-title">
                    {t("미리보기 및 페이지 선택")}
                  </div>
                  <button
                    onClick={handleSelectAllPages}
                    disabled={pageMode === "ALL"}
                  >
                    {selectedPages.length === numPages
                      ? t("전체 선택")
                      : t("전체 선택")}
                  </button>
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
                        (el, index) => (
                          <div
                            key={`page_${index + 1}`}
                            className={`pdf-page-item ${
                              selectedPages.includes(index + 1)
                                ? "selected"
                                : ""
                            } ${pageMode === "ALL" ? "disabled" : ""} ${
                              hoveredPage &&
                              hoveredPage.pageNumber === index + 1
                                ? "hover-active"
                                : ""
                            }`}
                            onClick={() => {
                              if (pageMode !== "ALL") {
                                handlePageSelection(index + 1);
                              }
                            }}
                            onMouseEnter={(e) =>
                              handlePageMouseEnter(e, index + 1)
                            }
                          >
                            <Page
                              pageNumber={index + 1}
                              width={150}
                              renderTextLayer={false}
                              renderAnnotationLayer={false}
                            />

                            <p>
                              {t("페이지")}
                              {index + 1}
                            </p>
                          </div>
                        )
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

                    {hoveredPage && (
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
        )}
        {/* ① 문서 미리보기 */}
        {uploadedUrl && (
          <div className="document-preview">
            <div className="document-title">{t("문제 생성결과")}</div>
            <div className="preview-content">
              {isProcessing ? (
                <div className="processing">
                  <div className="spinner" />
                  <p>
                    {t("문제 생성 중...")}
                    {Math.floor(generationElapsedTime / 1000)}
                    {t("초")}
                  </p>
                  {showWaitMessage && (
                    <p className="wait-message">
                      {t("현재 생성중입니다 조금만 더 기다려주세요!")}
                    </p>
                  )}
                </div>
              ) : !problemSetId ? (
                <p>
                  {t(
                    "문서를 분석하고 문제를 생성하려면 아래 버튼을 클릭하세요."
                  )}
                </p>
              ) : (
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
                    <button
                      className="btn mapping"
                      onClick={handleNavigateToQuiz}
                    >
                      {t("문제 풀기")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {uploadedUrl && !problemSetId && (
          <div className="action-buttons">
            <button
              className="primary-button large"
              onClick={generateQuestions}
              disabled={!uploadedUrl || isProcessing}
            >
              {isProcessing ? t("생성 중...") : t("문제 생성하기")}
            </button>
          </div>
        )}
        <RecentChanges />
        {showHelp && <Help />}
      </div>

      {/* Footer */}
      <div className="footer">
        © 2025 Q-Asker. All rights reserved.
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
