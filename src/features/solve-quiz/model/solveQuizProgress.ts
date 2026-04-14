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

/** 채점 결과 삭제 */
export const clearResult = (problemSetId: string): void => {
  try {
    localStorage.removeItem(`${RESULT_KEY_PREFIX}${problemSetId}`);
  } catch {
    // localStorage 에러 무시
  }
};
