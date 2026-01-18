import { useEffect, useState } from "react";
import { useTranslation } from "i18nexus";
import axiosInstance from "#shared/api";
import "./index.css";

const RecentChanges = () => {
  const { t } = useTranslation();
  const [changes, setChanges] = useState([]);

  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        const res = await axiosInstance.get("/updateLog");

        const data = res.data;

        setChanges(data.updateLogs || []);
      } catch (err) {
        console.error("변경사항 로드 실패:", err);
      }
    };

    fetchUpdates();
  }, []);

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat("ko-KR", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .format(date)
      .replace(/\. /g, ".")
      .replace(/\.$/, "");
  };

  return (
    <div className="recent-changes-section">
      <h3>{t("최근 변경사항")}</h3>
      <ul className="changes-list">
        {changes.map((log, index) => (
          <li key={log.id || index}>
            <span className="date">{formatDate(log.dateTime)}</span>
            <span className="change-text">{t(log.updateText)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecentChanges;
