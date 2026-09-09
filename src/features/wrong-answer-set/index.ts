import { useCallback, useState } from 'react';
import axiosInstance from '#shared/api';
import { generateUUID } from '#features/quiz-generation';
import type { QuizType } from '#features/quiz-generation';

// ── 타입 정의 (contract.md §7.1) ──

/** 모아풀기로 만들어진 문제집 하나 */
export interface WrongAnswerSetItem {
  problemSetId: string;
  historyId: string;
  quizType: QuizType;
  title: string;
  questionCount: number;
  /** 100문제 상한에 걸려 일부만 담겼는지 (FR-012). 유형별로 독립 */
  truncated: boolean;
}

/** 만들어진 문제집이 0개일 때의 사유 */
export type WrongAnswerEmptyReason = 'NO_HISTORY' | 'ESSAY_ONLY' | 'SOURCE_DELETED' | 'ALL_CORRECT';

/**
 * 모아풀기 응답. 빈 결과·상한 초과·부분 실패·서술형 제외는 전부 200으로 오고,
 * 안내 문구는 이 구조화된 사실로 프론트가 만든다(contract.md §7.3).
 */
export interface WrongAnswerSetResponse {
  createdSets: WrongAnswerSetItem[];
  /** 제외된 서술형 "문항" 수(정오답 무관 — ESSAY는 정오답 개념이 없다). 0이면 안내하지 않는다 */
  excludedEssayCount: number;
  /** 원본 세트가 삭제돼 건너뛴 수. 사용자가 손쓸 수 없으므로 렌더하지 않는다 */
  deletedSourceCount: number;
  /** 일부 유형만 생성에 실패한 경우 (FR-018) */
  failedTypes: QuizType[];
  emptyReason: WrongAnswerEmptyReason | null;
}

interface UseWrongAnswerSetReturn {
  /** 요청 진행 중. 진입점 비활성화에 쓴다 */
  submitting: boolean;
  /** 마지막 실행 결과. 결과 다이얼로그·빈 결과 안내의 근거 */
  result: WrongAnswerSetResponse | null;
  /** 폴더의 오답을 모아 유형별 문제집을 만든다. 실패하면 null */
  collect: (folderId: string) => Promise<WrongAnswerSetResponse | null>;
  clearResult: () => void;
}

// ── 오답 모아풀기 훅 ──

/**
 * 선택된 폴더의 틀린 문항을 모아 유형별 새 문제집을 만든다(FR-001·FR-015).
 *
 * 단일 비행으로 연타를 막고, 그것만으로 못 막는 새로고침·다중 탭 재시도는 `Idempotency-Key`로
 * 서버가 흡수한다(contract.md §7.1·§7.4). 오류 토스트는 axios 인터셉터가 이미 띄우므로
 * 여기서 다시 띄우지 않는다.
 */
export const useWrongAnswerSet = (): UseWrongAnswerSetReturn => {
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<WrongAnswerSetResponse | null>(null);

  const collect = useCallback(
    async (folderId: string): Promise<WrongAnswerSetResponse | null> => {
      if (submitting) return null;
      setSubmitting(true);
      try {
        const { data } = await axiosInstance.post<WrongAnswerSetResponse>(
          '/problem-set/wrong-answers',
          { folderId },
          { headers: { 'Idempotency-Key': generateUUID() } },
        );
        setResult(data);
        return data;
      } catch {
        // 인터셉터가 사용자에게 알린다. 여기서는 결과를 남기지 않는다.
        return null;
      } finally {
        setSubmitting(false);
      }
    },
    [submitting],
  );

  const clearResult = useCallback(() => setResult(null), []);

  return { submitting, result, collect, clearResult };
};
