// src/pages/MakeQuiz.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./MakeQuiz.css";
import Header from "../components/Header";

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
  const baseUrl = import.meta.env.VITE_BASE_URL;

  async function uploadFileToServer(file) {
    const formData = new FormData();
    // 백엔드 @RequestPart("file") 과 동일한 키
    formData.append("file", file);
    const res = await fetch(`${baseUrl}/s3/upload`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(`파일 업로드 실패: ${err.message}`);
    }
    return res.json(); // { uploadedUrl: "…" }
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
      selectFile(e.dataTransfer.files[0]);
    }
  };

  // File selection
  const handleFileInput = (e) => {
    if (e.target.files.length > 0) selectFile(e.target.files[0]);
  };
  const selectFile = async (f) => {
    const ext = f.name.split(".").pop().toLowerCase();
    if (["docx", "pptx", "pdf"].includes(ext)) {
      setIsProcessing(true);
      try {
        const { uploadedUrl } = await uploadFileToServer(f);
        console.log("s3 url:", uploadedUrl);
        setUploadedUrl(uploadedUrl);
        setFile(f);
      } catch (err) {
        console.error(err);
        alert(err.message);
      } finally {
        setIsProcessing(false);
      }
    } else {
      alert("DOCX, PPTX 또는 PDF 파일만 업로드 가능합니다.");
    }
  };

  // Simulate processing
  const generateQuestions = async () => {
    if (!uploadedUrl) {
      alert("파일을 먼저 업로드해주세요.");
      return;
    }
    setIsProcessing(true);

    try {
      const response = await fetch(`${baseUrl}/generation`, {
        // ⚠️ 엔드포인트를 실제 경로로 변경하세요
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uploadedUrl: uploadedUrl,
          quizCount: questionCount,
          type: "MULTIPLE",
        }),
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "문제 생성에 실패했습니다.");
      }
      const result = await response.json();
      console.log("생성된 문제 데이터:", result);
      setProblemSetId(result.problemSetId);
      setVersion((prev) => prev + 1);
      // TODO: result를 상태에 저장하거나, 페이지 이동 처리
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setIsProcessing(false);
    }
  };
  const getQuiz = async () => {
    if (!problemSetId) {
      alert("먼저 문제 세트를 생성해주세요.");
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(`${baseUrl}/problem-set/${problemSetId}`, {
        method: "GET",
        // GET 요청엔 보통 body가 없으니 headers도 생략 가능
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "문제 세트 조회에 실패했습니다.");
      }

      const result = await response.json();
      console.log("가져온 문제 데이터:", result);
      setQuizData(result);
      navigate("/quiz", { state: { quizData: result } });
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

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
              <p>파일 업로드 중...</p>
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
                  accept=".docx, .pptx, .pdf"
                  onChange={handleFileInput}
                />
              </label>
              <p className="hint">지원 파일 형식: DOCX, PPTX, PDF</p>
            </>
          ) : (
            <>
              <div className="file-icon">📄</div>
              <h3>{file.name}</h3>
              <p>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              <button
                className="remove-button"
                onClick={() => {
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
                      alert("개발중입니다!");
                      // 빈칸 클릭 시 다시 객관식으로 복원
                      setQuestionType("객관식");
                    } else {
                      setQuestionType("객관식");
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
                onChange={(e) => setQuestionCount(+e.target.value)}
              />
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
                  <p>문제 생성 중...</p>
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
                        navigate(`/quiz/${problemSetId}`);
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
            <button className="secondary-button">도움말</button>
          </div>
        )}
      </main>
      {/* Footer */}
      <footer className="footer">© 2025 Q-Asker. All rights reserved.</footer>
    </>
  );
};

export default MakeQuiz;
