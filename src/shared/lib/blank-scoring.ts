/**
 * REAL_BLANK(주관식 빈칸) 채점을 위한 순수 함수 모음.
 *
 * - 외부 의존성 없음 (React/Zustand/Axios 미사용).
 * - normalize 규칙: 모든 공백 제거 + 소문자 변환.
 * - 다중 빈칸은 토큰 수 불일치 시 즉시 전체 오답.
 */

/** 정답 비교를 위한 정규화: 공백 전부 제거 + 소문자. */
export const normalizeBlankAnswer = (s: string): string => s.replace(/\s+/g, '').toLowerCase();

/** 단일 빈칸 채점: normalize 후 완전 일치 시 true. */
export const gradeRealBlank = (userAnswer: string, correctAnswer: string): boolean => {
  return normalizeBlankAnswer(userAnswer) === normalizeBlankAnswer(correctAnswer);
};

/**
 * 다중 빈칸 채점: 토큰 수가 다르면 즉시 false,
 * 같은 인덱스끼리 normalize 비교하여 모두 일치할 때만 true.
 */
export const gradeRealBlankMulti = (userTokens: string[], correctTokens: string[]): boolean => {
  if (userTokens.length !== correctTokens.length) return false;
  for (let i = 0; i < correctTokens.length; i++) {
    if (!gradeRealBlank(userTokens[i] ?? '', correctTokens[i] ?? '')) return false;
  }
  return true;
};

/**
 * REAL_BLANK 다중 빈칸 직렬화 구분자.
 *
 * - 사용자가 직접 입력하기 어려운 비가시 문자(U+001F: UNIT SEPARATOR)를 선택.
 * - localStorage round-trip이 가능해야 하므로 string 형식 유지.
 */
export const REAL_BLANK_TOKEN_SEPARATOR = '';

/** 토큰 배열을 단일 문자열로 직렬화 (userAnswer 저장 포맷). */
export const serializeRealBlankTokens = (tokens: string[]): string =>
  tokens.join(REAL_BLANK_TOKEN_SEPARATOR);

/** 단일 문자열을 토큰 배열로 역직렬화. */
export const deserializeRealBlankTokens = (raw: string | null | undefined): string[] => {
  if (raw == null || raw === '') return [];
  return raw.split(REAL_BLANK_TOKEN_SEPARATOR);
};
