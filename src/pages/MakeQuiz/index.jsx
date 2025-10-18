import { useTranslation } from "i18nexus";
import Header from "#components/header";
import Help from "#components/help";
import axiosInstance from "#shared/api";
import CustomToast from "#shared/toast";
import { trackMakeQuizEvents } from "#utils/analytics";
import Timer from "#utils/timer";
import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { useNavigate } from "react-router-dom";
import "./index.css";
import { OcrButton } from "./ui";

const levelDescriptions = {
  RECALL:
    "순수 암기나 단순 이해를 묻는 문제\n" +
    '예) "OO의 정의는 무엇인가?", "다음 함수의 출력값을 고르시오(정답만 요구)"',

  SKILLS:
    "주어진 개념을 간단한 맥락에 적용하거나 비교·분석하게 하는 문제\n" +
    '예) "OO 개념을 사용해 다음 예제에서 오류를 찾아내시오", "아래 두 개념(A, B)의 차이를 고르시오"',

  STRATEGIC:
    "한 단계 더 깊은 추론, 문제 해결, 자료 해석, 간단한 설계 등을 요구\n" +
    '예) "OO 알고리즘을 사용해 특정 상황을 해결하는 방식을 고르시오", "제시된 코드 조각에서 발생할 수 있는 최악의 시간 복잡도를 판단하고, 이유를 선택하시오"',
};

const MAX_FILE_SIZE = 30 * 1024 * 1024;

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const MakeQuiz = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [quizData, setQuizData] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [questionType, setQuestionType] = useState(t("객관식"));
  const [questionCount, setQuestionCount] = useState(5);
  const [isProcessing, setIsProcessing] = useState(false);
  const [version, setVersion] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [problemSetId, setProblemSetId] = useState(null);
  const [quizLevel, setQuizLevel] = useState("RECALL"); // 기본 난이도 설정
  const [pageMode, setPageMode] = useState(t("전체")); // "전체" 또는 "사용자 지정"
  const [numPages, setNumPages] = useState(null);
  const [selectedPages, setSelectedPages] = useState([]);
  const [hoveredPage, setHoveredPage] = useState(null); // { pageNumber: number, style: object }
  const [visiblePageCount, setVisiblePageCount] = useState(50); // 점진적 로딩을 위한 가시적 페이지 수
  const pdfPreviewRef = useRef(null);
  const hoverTimeoutRef = useRef(null);
  const [showWaitMessage, setShowWaitMessage] = useState(false); // 5초 후 대기 메시지 표시용
  const [latestQuiz, setLatestQuiz] = useState(null); // 최신 퀴즈 미리보기용
  const [uploadElapsedTime, setUploadElapsedTime] = useState(0); // 업로드 경과 시간
  const [generationElapsedTime, setGenerationElapsedTime] = useState(0); // 문제 생성 경과 시간
  const [fileExtension, setFileExtension] = useState(null); // 파일 확장자
  const uploadTimerRef = useRef(null); // 업로드 타이머
  const generationTimerRef = useRef(null); // 문제 생성 타이머

  async function uploadFileToServer(file) {
    const formData = new FormData();
    // 백엔드 @RequestPart("file") 과 동일한 키
    formData.append("file", file);
    const res = await axiosInstance.post(`/s3/upload`, formData, {
      isMultipart: true,
    });
    return res.data;
  }
  // Sidebar toggle & click-outside
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  useEffect(() => {
    const handler = (e) => {
      const sidebar = document.getElementById("sidebar");
      const btn = document.getElementById("menuButton");
      if (
        sidebar &&
        !sidebar.contains(e.target) &&
        btn &&
        !btn.contains(e.target)
      ) {
        setIsSidebarOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Drag & Drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragEnter = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      selectFile(e.dataTransfer.files[0], "drag_drop");
    }
  };

  // File selection
  const handleFileInput = (e) => {
    if (e.target.files.length > 0) selectFile(e.target.files[0], "click");
  };
  const selectFile = async (f, method = "click") => {
    const ext = f.name.split(".").pop().toLowerCase();

    if (!["ppt", "pptx", "pdf"].includes(ext)) {
      CustomToast.error(t("지원하지 않는 파일 형식입니다"));
      return;
    }

    if (f.size > MAX_FILE_SIZE) {
      CustomToast.error(
        `파일 크기는 ${MAX_FILE_SIZE / 1024 / 1024}MB를 초과할 수 없습니다.`
      );
      return;
    }

    // 파일 업로드 시작 추적
    const uploadStartTime = Date.now();
    if (method === "drag_drop") {
      trackMakeQuizEvents.dragDropFileUpload(f.name, f.size, ext);
    } else {
      trackMakeQuizEvents.startFileUpload(f.name, f.size, ext);
    }

    // 타이머 시작
    uploadTimerRef.current = new Timer((elapsed) => {
      setUploadElapsedTime(elapsed);
    });
    uploadTimerRef.current.start();

    setFileExtension(ext);
    setIsProcessing(true);
    try {
      const { uploadedUrl } = await uploadFileToServer(f);
      setUploadedUrl(uploadedUrl);
      setFile(f);

      // 타이머 정지 및 업로드 완료 추적
      const uploadTime = uploadTimerRef.current.stop();
      trackMakeQuizEvents.completeFileUpload(f.name, uploadTime);
    } catch (error) {
      // 에러 발생 시 타이머 정지
      if (uploadTimerRef.current) {
        uploadTimerRef.current.stop();
      }
      throw error;
    } finally {
      setFileExtension(null);
      setIsProcessing(false);
      setUploadElapsedTime(0);
    }
  };

  // Simulate processing
  const generateQuestions = async () => {
    if (!uploadedUrl) {
      CustomToast.error(t("파일을 먼저 업로드해주세요."));
      return;
    }

    try {
      generationTimerRef.current = new Timer((elapsed) => {
        setGenerationElapsedTime(elapsed);
      });
      generationTimerRef.current.start();
      setIsProcessing(true);
      console.log("selectedPages", selectedPages);
      const response = await axiosInstance.post(`/generation`, {
        uploadedUrl: uploadedUrl,
        quizCount: questionCount,
        quizType: questionType === t("객관식") ? "MULTIPLE" : "OX",
        difficultyType: quizLevel,
        pageNumbers: selectedPages,
      });
      const result = response.data;
      console.log(t("생성된 문제 데이터:"), result);
      setProblemSetId(result.problemSetId);
      setVersion((prev) => prev + 1);

      // 퀴즈 기록을 localStorage에 저장
      saveQuizToHistory(result.problemSetId, file.name);

      // 문제 생성 완료 추적
      const generationTime = generationTimerRef.current.stop();
      trackMakeQuizEvents.completeQuizGeneration(
        result.problemSetId,
        generationTime
      );
    } catch (error) {
      if (generationTimerRef.current) {
        generationTimerRef.current.stop();
      }
      resetAllStates();
    } finally {
      setIsProcessing(false);
      setGenerationElapsedTime(0);
    }
  };

  // 퀴즈 기록을 localStorage에 저장하는 함수
  const saveQuizToHistory = (problemSetId, fileName) => {
    try {
      const existingHistory = JSON.parse(
        localStorage.getItem("quizHistory") || "[]"
      );

      const newQuizRecord = {
        problemSetId,
        fileName,
        fileSize: file.size,
        questionCount,
        quizLevel,
        createdAt: new Date().toISOString(),
        uploadedUrl,
        status: "created", // created, completed
        score: null,
        correctCount: null,
        totalTime: null,
      };

      // 중복 확인 (같은 problemSetId가 있으면 업데이트하지 않음)
      const existingIndex = existingHistory.findIndex(
        (item) => item.problemSetId === problemSetId
      );
      if (existingIndex === -1) {
        existingHistory.unshift(newQuizRecord); // 최신 항목을 맨 앞에 추가

        // 최대 20개까지만 저장
        if (existingHistory.length > 20) {
          existingHistory.splice(20);
        }

        localStorage.setItem("quizHistory", JSON.stringify(existingHistory));

        // 최신 퀴즈 상태 업데이트
        setLatestQuiz(newQuizRecord);
      }
    } catch (error) {
      console.error(t("퀴즈 기록 저장 실패:"), error);
    }
  };

  // 최신 퀴즈 정보를 로드하는 함수
  const loadLatestQuiz = () => {
    try {
      const history = JSON.parse(localStorage.getItem("quizHistory") || "[]");
      if (history.length > 0) {
        const latest = history[0];
        setLatestQuiz(latest);

        if (!uploadedUrl) {
          setProblemSetId(latest.problemSetId);
          // 파일 정보도 복원 (가상의 파일 객체 생성)
          const virtualFile = {
            name: latest.fileName,
            size: latest.fileSize,
          };
          setFile(virtualFile);
          setUploadedUrl(latest.uploadedUrl);
        }
      }
    } catch (error) {
      console.error(t("최신 퀴즈 로딩 실패:"), error);
    }
  };

  // 5초 후 대기 메시지 표시
  useEffect(() => {
    let timer;
    if (isProcessing && uploadedUrl && !problemSetId) {
      timer = setTimeout(() => {
        setShowWaitMessage(true);
      }, 5000); // 5초 후
    } else {
      setShowWaitMessage(false);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isProcessing, uploadedUrl, problemSetId]);

  // 컴포넌트 마운트 시 최신 퀴즈 로드
  useEffect(() => {
    loadLatestQuiz();
    // 페이지 진입 트래킹
    trackMakeQuizEvents.viewMakeQuiz();
  }, []);

  // PDF 페이지 점진적 로딩
  const pageCountToLoad = 50;
  const loadInterval = 2500;
  useEffect(() => {
    if (!numPages || numPages <= pageCountToLoad) return;

    setVisiblePageCount(pageCountToLoad);

    const interval = setInterval(() => {
      setVisiblePageCount((prev) => {
        const nextCount = prev + pageCountToLoad;
        if (nextCount >= numPages) {
          clearInterval(interval);
          return numPages;
        }
        return nextCount;
      });
    }, loadInterval);

    return () => clearInterval(interval);
  }, [numPages]);

  const handleRemoveFile = () => {
    if (file) {
      trackMakeQuizEvents.deleteFile(file.name);
    }
    resetAllStates();
  };

  const resetAllStates = () => {
    // 타이머 정리
    if (uploadTimerRef.current) {
      uploadTimerRef.current.reset();
      uploadTimerRef.current = null;
    }

    setFile(null);
    setUploadedUrl(null);
    setQuizData(null);
    setIsDragging(false);
    setQuestionType(t("객관식"));
    setQuestionCount(5);
    setIsProcessing(false);
    setVersion(0);
    setIsSidebarOpen(false);
    setProblemSetId(null);
    setQuizLevel("RECALL");
    setPageMode(t("전체"));
    setNumPages(null);
    setSelectedPages([]);
    setHoveredPage(null);
    setVisiblePageCount(100);
    setShowWaitMessage(false);
    setLatestQuiz(null);
    setUploadElapsedTime(0);
    setGenerationElapsedTime(0);
    setFileExtension(null);
  };

  const handleReCreate = () => {
    setProblemSetId(null);
    setQuizData(null);
    setPageMode(t("전체"));
    setNumPages(null);
    setSelectedPages([]);
    setHoveredPage(null);
    setVisiblePageCount(100);
    setShowWaitMessage(false);
    setLatestQuiz(null);
    setUploadElapsedTime(0);
    setGenerationElapsedTime(0);
  };

  const handleNavigateToQuiz = () => {
    trackMakeQuizEvents.navigateToQuiz(problemSetId);
    navigate(`/quiz/${problemSetId}`, {
      state: { uploadedUrl },
    });
  };

  const onDocumentLoadSuccess = ({ numPages: nextNumPages }) => {
    setNumPages(nextNumPages);
    setSelectedPages(Array.from({ length: nextNumPages }, (_, i) => i + 1));
    setPageMode(t("전체"));
  };

  const handlePageSelection = (pageNumber) => {
    setSelectedPages((prevSelectedPages) => {
      if (prevSelectedPages.includes(pageNumber)) {
        return prevSelectedPages.filter((p) => p !== pageNumber);
      } else {
        return [...prevSelectedPages, pageNumber].sort((a, b) => a - b);
      }
    });
  };

  const handleSelectAllPages = () => {
    if (selectedPages.length === numPages) {
      setSelectedPages([]);
    } else {
      setSelectedPages(Array.from({ length: numPages }, (_, i) => i + 1));
    }
  };

  const handlePageMouseEnter = (e, pageNumber) => {
    // 모바일 너비에서는 미리보기 기능을 비활성화
    if (window.innerWidth <= 768) return;

    if (pageMode === t("전체") || !pdfPreviewRef.current) return;

    const containerRect = pdfPreviewRef.current.getBoundingClientRect();
    const itemRect = e.currentTarget.getBoundingClientRect();
    const itemWidth = itemRect.width;
    const midpoint = containerRect.left + containerRect.width / 2;

    const PREVIEW_WIDTH = 660; // CSS에 정의된 너비 + 패딩
    const GAP = 10; // 컴포넌트와 미리보기 사이 간격

    // 수직 위치를 아이템보다 조금 더 높게 조정 (e.g., 100px 위로)
    let top = itemRect.top - containerRect.top - 100;
    // 단, 그리드 상단 밖으로 벗어나지 않도록 최소 위치를 0으로 설정
    if (top < 0) {
      top = 0;
    }

    const style = {
      top: `${top}px`,
      width: `${PREVIEW_WIDTH}px`,
    };

    if (itemRect.left < midpoint) {
      // Item is on the left, show preview on the right
      style.left = `${itemRect.left - containerRect.left + itemWidth + GAP}px`;
    } else {
      // Item is on the right, show preview on the left
      style.left = `${
        itemRect.left - containerRect.left - PREVIEW_WIDTH - GAP
      }px`;
    }

    setHoveredPage({ pageNumber, style });
  };

  const handlePageMouseLeave = () => {
    setHoveredPage(null);
  };

  return (
    <>
      <Header
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        setIsSidebarOpen={setIsSidebarOpen}
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
              <p className="hint">
                {t("파일 page  제한: 선택했을 때 100page 이하")}
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
            {t("🚨파일은 상업적 목적, AI 학습 목적으로 사용되지 않습니다.")}
            <br></br>{" "}
            {t("24시간 후 자동 삭제되며 별도로 저장, 공유되지 않습니다.")}
          </p>
        </div>
        {/* Options Panel */}
        {uploadedUrl && !problemSetId && (
          <div className="options-panel">
            <div className="options-title">{t("퀴즈 생성 옵션")}</div>
            {/* 문제 유형 세그먼티드 */}
            <div className="segmented-control question-type">
              {[t("객관식"), t("OX 퀴즈")].map((type) => (
                <button
                  key={type}
                  className={questionType === type ? "active" : ""}
                  onClick={() => {
                    if (questionType !== type) {
                      trackMakeQuizEvents.changeQuizOption(
                        "question_type",
                        type
                      );
                      setQuestionType(type);
                    }
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
            {/* 문제 수량 슬라이더 */}
            <div className="slider-control">
              <label>
                {t("문제 수량:")}
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
                  if (questionCount !== newCount) {
                    trackMakeQuizEvents.changeQuizOption(
                      "question_count",
                      newCount
                    );
                    setQuestionCount(newCount);
                  }
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
                  setPageMode(mode);
                  if (mode === t("전체")) {
                    setSelectedPages(
                      Array.from({ length: numPages }, (_, i) => i + 1)
                    );
                  } else {
                    setSelectedPages([]);
                  }
                  trackMakeQuizEvents.changeQuizOption("page_mode", mode);
                }}
              >
                <option value={t("전체")}>{t("전체")}</option>
                <option value={t("사용자 지정")}>{t("사용자 지정")}</option>
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
                    disabled={pageMode === t("전체")}
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
                            } ${pageMode === t("전체") ? "disabled" : ""} ${
                              hoveredPage &&
                              hoveredPage.pageNumber === index + 1
                                ? "hover-active"
                                : ""
                            }`}
                            onClick={() => {
                              if (pageMode !== t("전체")) {
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

            <div className="level-title">{t("문제 단계 설정하기")}</div>
            <div className="level-selector-row">
              {/* ① 난이도 선택박스 */}
              <select
                value={quizLevel}
                onChange={(e) => {
                  const newLevel = e.target.value;
                  if (quizLevel !== newLevel) {
                    trackMakeQuizEvents.changeQuizOption(
                      "quiz_level",
                      newLevel
                    );
                    setQuizLevel(newLevel);
                  }
                }}
              >
                <option value="RECALL">Easy</option>
                <option value="SKILLS">Normal</option>
                <option value="STRATEGIC">Hard</option>
              </select>

              {/* ② 선택한 난이도에 해당하는 설명을 옆에 출력 */}
              <div className="level-counter-wrapper">
                <pre className="level-description">
                  {levelDescriptions[quizLevel]}
                </pre>
              </div>
            </div>
          </div>
        )}
        {/* ① 문서 미리보기 */}
        {uploadedUrl && (
          <div className="document-preview">
            <div className="document-title">{t("문서 미리보기")}</div>
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
      </div>
      <OcrButton />
      <Help />
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
    </>
  );
};

export default MakeQuiz;
