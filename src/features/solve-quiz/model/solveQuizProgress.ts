const PROGRESS_KEY = 'solveQuizProgress';
const EXPIRATION_MS = 24 * 60 * 60 * 1000;

export interface SavedProgress {
  problemSetId: string;
  answers: Record<number, string | null>;
  checks: Record<number, boolean>;
  currentQuestion: number;
  elapsedMs: number;
  savedAt: number;
}

/** localStorage에서 진행 상태 읽기 */
export const loadProgress = (problemSetId: string): SavedProgress | null => {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as SavedProgress;
    if (saved.problemSetId !== problemSetId || Date.now() - saved.savedAt > EXPIRATION_MS) {
      localStorage.removeItem(PROGRESS_KEY);
      return null;
    }
    return saved;
  } catch {
    return null;
  }
};

/** localStorage에 진행 상태 저장 */
export const saveProgress = (progress: SavedProgress): void => {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // localStorage 에러 무시
  }
};

/** 진행 상태 삭제 */
export const clearProgress = (): void => {
  try {
    localStorage.removeItem(PROGRESS_KEY);
  } catch {
    // localStorage 에러 무시
  }
};

// ── 채점 결과 저장 ──

const RESULT_KEY_PREFIX = 'solveQuizResult:';

export interface SavedResult {
  answers: Record<number, string | null>;
  inReview: Record<number, boolean>;
  totalTime: string;
  title: string;
  savedAt: number;
}

/** 채점 결과 저장 */
export const saveResult = (problemSetId: string, result: SavedResult): void => {
  try {
    localStorage.setItem(`${RESULT_KEY_PREFIX}${problemSetId}`, JSON.stringify(result));
  } catch {
    // localStorage 에러 무시
  }
};

/** 채점 결과 읽기 */
export const loadResult = (problemSetId: string): SavedResult | null => {
  try {
    const raw = localStorage.getItem(`${RESULT_KEY_PREFIX}${problemSetId}`);
    if (!raw) return null;
    const saved = JSON.parse(raw) as SavedResult;
    if (Date.now() - saved.savedAt > EXPIRATION_MS) {
      localStorage.removeItem(`${RESULT_KEY_PREFIX}${problemSetId}`);
      return null;
    }
    return saved;
  } catch {
    return null;
  }
};

// ── ESSAY 채점 결과 저장 ──

import type { GradeResult } from '#features/quiz-generation';

const ESSAY_GRADE_KEY_PREFIX = 'essayGradeResults:';

interface SavedEssayData<T> {
  data: T;
  savedAt: number;
}

/** ESSAY 문제별 채점 결과 저장 */
export const saveEssayGradeResult = (
  problemSetId: string,
  quizNumber: number,
  result: GradeResult,
): void => {
  try {
    const key = `${ESSAY_GRADE_KEY_PREFIX}${problemSetId}`;
    const raw = localStorage.getItem(key);
    const existing: SavedEssayData<Record<string, GradeResult>> = raw
      ? JSON.parse(raw)
      : { data: {}, savedAt: Date.now() };
    existing.data[quizNumber] = result;
    existing.savedAt = Date.now();
    localStorage.setItem(key, JSON.stringify(existing));
  } catch {
    // localStorage 에러 무시
  }
};

/** ESSAY 채점 결과 전체 조회 (24시간 만료) */
export const loadEssayGradeResults = (problemSetId: string): Record<number, GradeResult> => {
  try {
    const key = `${ESSAY_GRADE_KEY_PREFIX}${problemSetId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    const saved = JSON.parse(raw) as SavedEssayData<Record<number, GradeResult>>;
    if (Date.now() - saved.savedAt > EXPIRATION_MS) {
      localStorage.removeItem(key);
      return {};
    }
    return saved.data ?? {};
  } catch {
    return {};
  }
};

/** ESSAY 채점 결과 벌크 저장 (히스토리에서 해설 진입 시 사용) */
export const saveEssayGradeResults = (
  problemSetId: string,
  results: Record<number, GradeResult>,
): void => {
  try {
    const key = `${ESSAY_GRADE_KEY_PREFIX}${problemSetId}`;
    const saved: SavedEssayData<Record<number, GradeResult>> = {
      data: results,
      savedAt: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(saved));
  } catch {
    // localStorage 에러 무시
  }
};

/** ESSAY 채점 결과 전체 삭제 (다시풀기 시 사용) */
export const clearEssayGradeResults = (problemSetId: string): void => {
  try {
    localStorage.removeItem(`${ESSAY_GRADE_KEY_PREFIX}${problemSetId}`);
  } catch {
    // localStorage 에러 무시
  }
};

// ── ESSAY 시도 횟수 저장 ──

const ESSAY_ATTEMPTS_KEY_PREFIX = 'essayAttempts:';

/** ESSAY 문제별 시도 횟수 저장 (24시간 만료) */
export const saveEssayAttempts = (problemSetId: string, attempts: Record<number, number>): void => {
  try {
    const key = `${ESSAY_ATTEMPTS_KEY_PREFIX}${problemSetId}`;
    const saved: SavedEssayData<Record<number, number>> = { data: attempts, savedAt: Date.now() };
    localStorage.setItem(key, JSON.stringify(saved));
  } catch {
    // localStorage 에러 무시
  }
};

/** ESSAY 시도 횟수 전체 조회 (24시간 만료) */
export const loadEssayAttempts = (problemSetId: string): Record<number, number> => {
  try {
    const key = `${ESSAY_ATTEMPTS_KEY_PREFIX}${problemSetId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    const saved = JSON.parse(raw) as SavedEssayData<Record<number, number>>;
    if (Date.now() - saved.savedAt > EXPIRATION_MS) {
      localStorage.removeItem(key);
      return {};
    }
    return saved.data ?? {};
  } catch {
    return {};
  }
};

/** ESSAY 시도 횟수 전체 삭제 (다시풀기 시 사용) */
export const clearEssayAttempts = (problemSetId: string): void => {
  try {
    localStorage.removeItem(`${ESSAY_ATTEMPTS_KEY_PREFIX}${problemSetId}`);
  } catch {
    // localStorage 에러 무시
  }
};

// ── 만료 항목 일괄 정리 ──

const CLEANUP_KEY = 'solve_last_cleanup';
const EXPIRING_PREFIXES = [RESULT_KEY_PREFIX, ESSAY_GRADE_KEY_PREFIX, ESSAY_ATTEMPTS_KEY_PREFIX];

/** 만료된 localStorage 항목 일괄 삭제 (하루 1회) */
export const cleanupExpiredItems = (): void => {
  try {
    const lastCleanup = Number(localStorage.getItem(CLEANUP_KEY) || 0);
    if (Date.now() - lastCleanup < EXPIRATION_MS) return;

    const now = Date.now();
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !EXPIRING_PREFIXES.some((p) => key.startsWith(p))) continue;
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw) as { savedAt?: number };
        if (parsed.savedAt && now - parsed.savedAt > EXPIRATION_MS) {
          keysToRemove.push(key);
        }
      } catch {
        // 파싱 실패 항목도 정리
        keysToRemove.push(key);
      }
    }

    // 레거시 키 정리 (전역화 이전의 per-problemSetId 키들)
    const LEGACY_PREFIXES = ['solve_show_selections_', 'solve_show_note_', 'solve_note_'];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (LEGACY_PREFIXES.some((p) => key.startsWith(p))) {
        keysToRemove.push(key);
      }
    }

    // solveQuizProgress도 체크
    try {
      const raw = localStorage.getItem(PROGRESS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { savedAt?: number };
        if (parsed.savedAt && now - parsed.savedAt > EXPIRATION_MS) {
          keysToRemove.push(PROGRESS_KEY);
        }
      }
    } catch {
      keysToRemove.push(PROGRESS_KEY);
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
    localStorage.setItem(CLEANUP_KEY, String(now));
  } catch {
    // localStorage 에러 무시
  }
};
