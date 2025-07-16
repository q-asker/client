import "./index.css";

const OcrButton = () => {
  return (
    <div className="ocr-section">
      <p>PDF 파일에서 텍스트가 선택되지 않나요? </p>
      <button
        className="ocr-button"
        onClick={() =>
          window.open("https://tools.pdf24.org/ko/ocr-pdf", "_blank")
        }
      >
        OCR 변환하기
      </button>
      <div className="tooltip">
        <span className="tooltip-text">
          이미지나 스캔된 PDF를 텍스트로 변환하여
          <br />더 정확한 문제 생성이 가능합니다
        </span>
      </div>
    </div>
  );
};

export default OcrButton;
