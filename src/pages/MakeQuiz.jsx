// src/pages/MakeQuiz.jsx
import { useState, useEffect } from "react";
import "./MakeQuiz.css";
import Header from "../components/Header";

const MakeQuiz = () => {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [questionType, setQuestionType] = useState("객관식");
  const [questionCount, setQuestionCount] = useState(5);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
    if (["ppt", "pptx", "pdf"].includes(ext)) {
      setIsProcessing(true);
      try {
        const { uploadedUrl } = await uploadFileToServer(f);
        console.log("s3 url:", uploadedUrl);
        setFile(f);
      } catch (err) {
        console.error(err);
        alert(err.message);
      } finally {
        setIsProcessing(false);
      }
    } else {
      alert("PPT, PPTX 또는 PDF 파일만 업로드 가능합니다.");
    }
  };

  // Simulate processing
  const generateQuestions = () => {
    if (!file) {
      alert("파일을 먼저 업로드해주세요.");
      return;
    }
    setIsProcessing(true);
    let counter = 0;
    const interval = setInterval(() => {
      counter += 5;
      setProgress(counter);
      if (counter >= 100) {
        clearInterval(interval);
        setIsProcessing(false);
      }
    }, 200);
  };

  return (
    <>
      <Header
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      <main className="main">
        {/* Upload Section */}
        <section
          className={`upload-section ${isDragging ? "dragging" : ""}`}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {!file ? (
            <>
              <div className="upload-icon">☁️</div>
              <h3>파일을 여기에 드래그하세요</h3>
              <p>또는</p>
              <label className="upload-button">
                파일 선택하기
                <input
                  type="file"
                  accept=".ppt, .pptx, .pdf"
                  onChange={handleFileInput}
                />
              </label>
              <p className="hint">지원 파일 형식: PPT, PPTX, PDF</p>
            </>
          ) : (
            <>
              <div className="file-icon">📄</div>
              <h3>{file.name}</h3>
              <p>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              <button className="remove-button" onClick={() => setFile(null)}>
                ✕ 파일 삭제
              </button>
            </>
          )}
        </section>
        {/* Options Panel */}
        {file && (
          <section className="options-panel">
            <h3>퀴즈 생성 옵션</h3>

            {/* 문제 유형 세그먼티드 */}
            <div className="segmented-control question-type">
              {["객관식", "빈칸"].map((type) => (
                <button
                  key={type}
                  className={questionType === type ? "active" : ""}
                  onClick={() => setQuestionType(type)}
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
        {/* Preview Panel */}
        {file && (
          <section className="preview-panel">
            <h3>문서 미리보기</h3>
            {isProcessing ? (
              <div className="processing">
                <div className="spinner" />
                <p>문서 분석 중... {progress}%</p>
                <div className="progress-bar">
                  <div style={{ width: `${progress}%` }} />
                </div>
              </div>
            ) : (
              <div className="placeholder">
                <p>문서를 분석하고 문제를 생성하려면 아래 버튼을 클릭하세요.</p>
              </div>
            )}
          </section>
        )}
        {/* Action Buttons */}
        {file && (
          <div className="action-buttons">
            <button
              className="primary-button large"
              onClick={generateQuestions}
              disabled={!file || isProcessing}
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
