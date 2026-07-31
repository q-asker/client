/**
 * REAL_BLANK(주관식 빈칸) 사용자 입력의 직렬화 유틸.
 *
 * 채점 판정은 서버 SSOT(`RealBlankGrader` / `POST /grade`)가 담당한다(FR-006).
 * 여기서는 다중 빈칸 입력을 단일 문자열로 담고 되돌리는 직렬화만 제공한다.
 */

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
