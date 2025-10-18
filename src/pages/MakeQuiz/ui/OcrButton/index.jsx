import { useTranslation } from "i18nexus";
import "./index.css";

const OcrButton = () => {
  const { t } = useTranslation();
  return (
    <div className="ocr-section">
      <p>{t("텍스트가 선택되지 않는 PDF는 OCR 변환이 필요합니다!")}</p>
      <button
        className="ocr-button"
        onClick={() =>
          window.open("https://tools.pdf24.org/ko/ocr-pdf", "_blank")
        }
      >
        {t("OCR 변환하기")}
      </button>
      <div className="tooltip">
        <span className="tooltip-text">
          {t("이미지나 스캔된 PDF를 텍스트로 변환하여")}

          <br />
          {t("더 정확한 문제 생성이 가능합니다")}
        </span>
      </div>
    </div>
  );
};

export default OcrButton;
