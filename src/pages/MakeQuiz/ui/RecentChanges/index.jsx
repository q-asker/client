import { useTranslation } from "i18nexus";
import "./index.css";

const RecentChanges = () => {
  const { t } = useTranslation();
  return (
    <div className="recent-changes-section">
      <h3>{t("최근 변경사항")}</h3>
      <ul className="changes-list">
        <li>
          <span className="date">2025.12.17</span>
          <span className="change-text">{t("문제 가독성 개선")}</span>
        </li>
        <li>
          <span className="date">2025.12.14</span>
          <span className="change-text">
            {t("페이지 제한 100pages → 150pages 변경")}
          </span>
        </li>
      </ul>
    </div>
  );
};

export default RecentChanges;
