import { useTranslation } from 'i18nexus';
import { useEffect, useState } from 'react';
import axiosInstance from '#shared/api';

export interface UpdateLog {
  id: string;
  dateTime: string;
  updateText: string;
}

interface UseRecentChangesReturn {
  state: {
    changes: UpdateLog[];
  };
  actions: {
    formatDate: (isoString: string) => string;
  };
}

const formatDate = (isoString: string): string => {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(date)
    .replace(/\. /g, '.')
    .replace(/\.$/, '');
};

export const useRecentChanges = (): UseRecentChangesReturn => {
  const { t } = useTranslation();
  const [changes, setChanges] = useState<UpdateLog[]>([]);

  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        const res = await axiosInstance.get<{ updateLogs: UpdateLog[] }>('/updateLog');
        const data = res.data;
        setChanges(data.updateLogs || []);
      } catch (err) {
        console.error(t('변경사항 로드 실패:'), err);
      }
    };

    fetchUpdates();
  }, []);

  return {
    state: { changes },
    actions: { formatDate },
  };
};
