// src/pages/MakeQuiz.jsx
import axiosInstance from "#shared/api";
import CustomToast from "#shared/toast";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { trackMakeQuizEvents } from "../utils/analytics";
import "./MakeQuiz.css";

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

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const MakeQuiz = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [quizData, setQuizData] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [questionType, setQuestionType] = useState("객관식");
  const [questionCount, setQuestionCount] = useState(5);
  const [isProcessing, setIsProcessing] = useState(false);
  const [version, setVersion] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [problemSetId, setProblemSetId] = useState(null);
  const [quizLevel, setQuizLevel] = useState("RECALL"); // 기본 난이도 설정
  const [pageMode, setPageMode] = useState("전체"); // "전체" 또는 "사용자 지정"
  const [startPage, setStartPage] = useState(""); // 시작 페이지
  const [endPage, setEndPage] = useState(""); // 끝 페이지
  const [countText, setCountText] = useState(""); // 로딩 점 애니메이션용
  const [showWaitMessage, setShowWaitMessage] = useState(false); // 5초 후 대기 메시지 표시용

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
    if (!["pptx", "pdf"].includes(ext)) {
      CustomToast.error("PPTX 또는 PDF 파일만 업로드 가능합니다.");
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

    setIsProcessing(true);
    try {
      const { uploadedUrl } = await uploadFileToServer(f);
      setUploadedUrl(uploadedUrl);
      setFile(f);

      // 파일 업로드 완료 추적
      const uploadTime = Date.now() - uploadStartTime;
      trackMakeQuizEvents.completeFileUpload(f.name, uploadTime);
    } finally {
      setIsProcessing(false);
    }
  };

  // Simulate processing
  const generateQuestions = async () => {
    if (!uploadedUrl) {
      CustomToast.error("파일을 먼저 업로드해주세요.");
      return;
    }

    // 문제 생성 시작 추적
    const generationStartTime = Date.now();
    trackMakeQuizEvents.startQuizGeneration(
      questionCount,
      questionType,
      quizLevel,
      pageMode,
      startPage,
      endPage
    );

    const pageSelected = pageMode === "전체" ? false : true;
    try {
      setIsProcessing(true);
      const response = await axiosInstance.post(`/generation`, {
        uploadedUrl: uploadedUrl,
        quizCount: questionCount,
        quizType: "MULTIPLE",
        difficultyType: quizLevel,
        pageSelected: pageMode === "사용자 지정",
        startPageNumber: startPage,
        endPageNumber: endPage,
      });
      const result = response.data;
      console.log("생성된 문제 데이터:", result);
      setProblemSetId(result.problemSetId);
      setVersion((prev) => prev + 1);

      // 문제 생성 완료 추적
      const generationTime = Date.now() - generationStartTime;
      trackMakeQuizEvents.completeQuizGeneration(
        result.problemSetId,
        generationTime
      );
    } finally {
      setIsProcessing(false);
    }
  };
  const getQuiz = async () => {
    if (!problemSetId) {
      CustomToast.error("먼저 문제 세트를 생성해주세요.");
      return;
    }
    try {
      setIsProcessing(true);
      const response = await axiosInstance.get(`/problem-set/${problemSetId}`);
      const result = response.data;
      console.log("가져온 문제 데이터:", result);
      setQuizData(result);
      navigate("/quiz", { state: { quizData: result } });
    } finally {
      setIsProcessing(false);
    }
  };

  // 점 애니메이션 효과
  useEffect(() => {
    if (isProcessing) {
      const dots = [".", "..", "..."];
      let index = 0;

      const interval = setInterval(() => {
        setCountText(dots[index]);
        index = (index + 1) % dots.length;
      }, 500); // 0.5초마다 변경

      return () => clearInterval(interval);
    } else {
      setCountText("");
    }
  }, [isProcessing]);

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

  return (
    <>
      <Header
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <main className="main">
        <section
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
              <p>파일 업로드 중{countText}</p>
            </div>
          ) : !uploadedUrl ? (
            <>
              <div className="upload-icon">☁️</div>
              <h3>파일을 여기에 드래그하세요</h3>
              <p>또는</p>
              <label className="upload-button">
                파일 선택하기
                <input
                  type="file"
                  accept=".pptx, .pdf"
                  onChange={handleFileInput}
                />
              </label>
              <p className="hint">지원 파일 형식: PPTX, PDF</p>
              <p className="hint">
                파일 크기 제한: {MAX_FILE_SIZE / 1024 / 1024}MB
              </p>
            </>
          ) : (
            <>
              <div className="file-icon">📄</div>
              <h3>{file.name}</h3>
              <p>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              <button
                className="remove-button"
                onClick={() => {
                  if (file) {
                    trackMakeQuizEvents.deleteFile(file.name);
                  }
                  setFile(null);
                  window.location.reload();
                }}
              >
                ✕ 파일 삭제
              </button>
            </>
          )}
        </section>
        {/* Options Panel */}
        {uploadedUrl && !problemSetId && (
          <section className="options-panel">
            <h3>퀴즈 생성 옵션</h3>
            {/* 문제 유형 세그먼티드 */}
            <div className="segmented-control question-type">
              {["객관식", "빈칸"].map((type) => (
                <button
                  key={type}
                  className={questionType === type ? "active" : ""}
                  onClick={() => {
                    if (type === "빈칸") {
                      CustomToast.error("개발중입니다!");
                      // 빈칸 클릭 시 다시 객관식으로 복원
                      setQuestionType("객관식");
                    } else {
                      if (questionType !== type) {
                        trackMakeQuizEvents.changeQuizOption(
                          "question_type",
                          type
                        );
                        setQuestionType(type);
                      }
                    }
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
            {/* 문제 수량 슬라이더 */}
            <div className="slider-control">
              <label>문제 수량: {questionCount}문제</label>
              <input
                type="range"
                min="5"
                max="50"
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

            <h3>특정 페이지를 지정하고 싶으신가요?</h3>
            <div className="page-decide">
              <input
                type="number"
                min="1"
                value={startPage}
                disabled={pageMode === "전체"}
                onChange={(e) => setStartPage(e.target.value)}
              />
              <span>부터</span>

              <input
                type="number"
                min="1"
                value={endPage}
                disabled={pageMode === "전체"}
                onChange={(e) => setEndPage(e.target.value)}
              />
              <span>까지</span>

              <select
                value={pageMode}
                onChange={(e) => {
                  const mode = e.target.value;
                  if (pageMode !== mode) {
                    trackMakeQuizEvents.changeQuizOption("page_mode", mode);
                    setPageMode(mode);
                    if (mode === "전체") {
                      setStartPage("");
                      setEndPage("");
                    }
                  }
                }}
              >
                <option value="전체">전체</option>
                <option value="사용자 지정">사용자 지정</option>
              </select>
            </div>

            <h3>문제 난이도 설정하기</h3>
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
                <option value="RECALL">Recall</option>
                <option value="SKILLS">Skills</option>
                <option value="STRATEGIC">Strategic</option>
              </select>

              {/* ② 선택한 난이도에 해당하는 설명을 옆에 출력 */}
              <div className="level-counter-wrapper">
                <pre className="level-description">
                  {levelDescriptions[quizLevel]}
                </pre>
              </div>
            </div>
          </section>
        )}
        {/* ① 문서 미리보기 */}
        {uploadedUrl && (
          <section className="document-preview">
            <h2>문서 미리보기</h2>
            <div className="preview-content">
              {isProcessing ? (
                <div className="processing">
                  <div className="spinner" />
                  <p>문제 생성 중{countText}</p>
                  {showWaitMessage && (
                    <p className="wait-message">
                      현재 생성중입니다 조금만 더 기다려주세요!
                    </p>
                  )}
                </div>
              ) : !problemSetId ? (
                <p>문서를 분석하고 문제를 생성하려면 아래 버튼을 클릭하세요.</p>
              ) : (
                <div className="problem-card">
                  <div className="problem-icon">📝</div>
                  <div className="problem-details">
                    <h3>
                      {file.name}
                      {version > 0 && `.ver${version}`}
                    </h3>
                  </div>
                  <div className="problem-actions">
                    <button
                      className="btn cancle"
                      onClick={() => {
                        if (file) {
                          trackMakeQuizEvents.deleteFile(file.name);
                        }
                        setFile(null);
                        setUploadedUrl(null);
                        setVersion(0);
                        window.location.reload();
                      }}
                    >
                      다른 파일 넣기
                    </button>
                    <button className="btn manage" onClick={generateQuestions}>
                      다른 문제 생성
                    </button>
                    <button
                      className="btn mapping"
                      onClick={() => {
                        trackMakeQuizEvents.navigateToQuiz(problemSetId);
                        navigate(`/quiz/${problemSetId}`, {
                          state: { uploadedUrl },
                        });
                      }}
                    >
                      문제로 이동하기
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {uploadedUrl && !problemSetId && (
          <div className="action-buttons">
            <button
              className="primary-button large"
              onClick={generateQuestions}
              disabled={!uploadedUrl || isProcessing}
            >
              {isProcessing ? "생성 중..." : "문제 생성하기"}
            </button>
            <button
              className="secondary-button"
              onClick={() => navigate("/help?source=makeQuiz")}
            >
              도움말
            </button>
          </div>
        )}
      </main>
      {/* Footer */}
      <footer className="footer">© 2025 Q-Asker. All rights reserved.</footer>
    </>
  );
};

export default MakeQuiz;
