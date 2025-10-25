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
    </div>
  );
};

export default OcrButton;
