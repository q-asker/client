import { useEffect, useState } from "react";
import axiosInstance from "#shared/api";

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

export const useRecentChanges = () => {
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

  return {
    state: { changes },
    actions: { formatDate },
  };
};
