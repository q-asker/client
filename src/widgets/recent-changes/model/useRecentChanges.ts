import { useTranslation } from 'i18nexus';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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

const MOCK_CHANGES: UpdateLog[] = [
  {
    id: 'mock-1',
    dateTime: '2026-03-13T09:00:00+09:00',
    updateText: '퀴즈 해설 페이지 UI 개선 및 레이아웃 최적화',
  },
  {
    id: 'mock-2',
    dateTime: '2026-03-12T14:30:00+09:00',
    updateText: '문의 게시판 답변 알림 기능 추가 및 이메일 발송',
  },
  {
    id: 'mock-3',
    dateTime: '2026-03-11T11:00:00+09:00',
    updateText: 'PDF 업로드 속도 최적화 및 파일 용량 압축',
  },
  {
    id: 'mock-4',
    dateTime: '2026-03-10T16:00:00+09:00',
    updateText: '퀴즈 기록 통계 차트 추가 및 분석 기능 개선',
  },
  {
    id: 'mock-5',
    dateTime: '2026-03-09T10:00:00+09:00',
    updateText: '다크 모드 지원 시작 (베타) 및 전체 테마 통일',
  },
];

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
  const { t } = useTranslation('make-quiz');
  const [searchParams] = useSearchParams();
  const isMock = searchParams.get('mock') === 'true';
  const [changes, setChanges] = useState<UpdateLog[]>(isMock ? MOCK_CHANGES : []);

  useEffect(() => {
    if (isMock) return;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMock]);

  return {
    state: { changes },
    actions: { formatDate },
  };
};
