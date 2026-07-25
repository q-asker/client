/**
 * REAL_BLANK(주관식 빈칸) 채점을 위한 순수 함수 모음.
 *
 * - 외부 의존성 없음 (React/Zustand/Axios 미사용).
 * - 채점 관용도(feedback #20): 표기 정규화 + 문항별 인정 답 목록(동의어·통용약어·한↔영).
 *   판정 = 빈칸별로 normalize(사용자입력) 이 (정답 토큰 ∪ acceptedAnswers[i]) 정규화 집합에 속하면 정답.
 * - 정규화 규칙은 contract.md §7.3 계약 스펙(backend sanitize와 문자 단위 동일):
 *   NFKC → 소문자 → 공백 전부 제거 → \p{P} 문장부호 제거(\p{S} 심볼 보존). 오탈자 불허(완전 일치).
 */

/**
 * 정답 비교용 정규화 (contract §7.3).
 * 1) NFKC(전각→반각·호환문자, U+3000·U+00A0 등 특수공백을 일반 공백으로)
 * 2) 소문자화 (JS toLowerCase는 로캘 무관 — 백엔드는 Locale.ROOT로 맞춤)
 * 3) 공백 전부 제거
 * 4) \p{P} 문장부호 제거 — \p{S} 심볼(+ < = > | ~ ^ $)은 보존해 C++↔C 등 구분 유지.
 *    주의: # @ % & - . 는 유니코드상 \p{P}(문장부호)라 제거된다(C# → c).
 */
export const normalizeBlankAnswer = (s: string): string =>
  s
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\s+/gu, '')
    .replace(/\p{P}+/gu, '');

/**
 * REAL_BLANK 다중 빈칸 직렬화 구분자.
 *
 * - 사용자가 직접 입력하기 어려운 비가시 문자(U+001F: UNIT SEPARATOR)를 선택.
 * - localStorage round-trip이 가능해야 하므로 string 형식 유지.
 * - String.fromCharCode로 정의해 파일 편집 시 원시 제어문자가 유실되지 않게 한다.
 */
export const REAL_BLANK_TOKEN_SEPARATOR = String.fromCharCode(0x1f);

/** 토큰 배열을 단일 문자열로 직렬화 (userAnswer 저장 포맷). */
export const serializeRealBlankTokens = (tokens: string[]): string =>
  tokens.join(REAL_BLANK_TOKEN_SEPARATOR);

/** 단일 문자열을 토큰 배열로 역직렬화. */
export const deserializeRealBlankTokens = (raw: string | null | undefined): string[] => {
  if (raw == null || raw === '') return [];
  return raw.split(REAL_BLANK_TOKEN_SEPARATOR);
};

/** 정답 텍스트(다중 빈칸은 콤마 구분) → 빈칸별 토큰 배열. */
const parseCorrectTokens = (content: string): string[] => content.split(',').map((s) => s.trim());

/** 서버는 미응답 상태를 0("0")으로 내려보내므로 채점용으로 빈 문자열로 정규화한다. */
const resolveUserRaw = (userAnswer: string | null | undefined): string => {
  const raw = userAnswer == null ? '' : String(userAnswer);
  return raw === '0' ? '' : raw;
};

/**
 * 빈칸 1개 판정: 사용자 입력이 (정답 토큰 ∪ 인정 답)의 정규화 집합에 속하면 정답.
 * 빈/공백-only 입력은 관용과 무관하게 항상 오답.
 */
const isBlankCorrect = (
  userToken: string,
  correctToken: string,
  acceptedForBlank: string[] | undefined,
): boolean => {
  const userNorm = normalizeBlankAnswer(userToken);
  if (userNorm === '') return false;
  if (userNorm === normalizeBlankAnswer(correctToken)) return true;
  return (acceptedForBlank ?? []).some((a) => normalizeBlankAnswer(a) === userNorm);
};

/** 채점에 필요한 최소 형태 — features의 Quiz가 구조적으로 대입된다(FSD: shared는 features를 import하지 않음). */
export interface RealBlankGradable {
  selections: { content: string; correct?: boolean }[];
  userAnswer?: string | null;
  /** 빈칸 위치별 인정 답(동의어·통용약어·한↔영). 기존 세트/비REAL_BLANK는 없음 → 표기 정규화만 적용. */
  acceptedAnswers?: string[][] | null;
}

/**
 * REAL_BLANK 문항 1개 채점 (결과·해설·점수 세 화면의 단일 진실원 — FR-005).
 * 다중 빈칸은 토큰 수 불일치 시 즉시 오답, 빈칸별 독립 판정.
 */
export const isRealBlankQuizCorrect = (quiz: RealBlankGradable): boolean => {
  const correctSel = quiz.selections.find((s) => s.correct === true);
  if (!correctSel) return false;

  const correctTokens = parseCorrectTokens(correctSel.content);
  const userRaw = resolveUserRaw(quiz.userAnswer);
  const accepted = quiz.acceptedAnswers ?? null;

  if (correctTokens.length <= 1) {
    return isBlankCorrect(userRaw, correctTokens[0] ?? correctSel.content, accepted?.[0]);
  }

  const userTokens = deserializeRealBlankTokens(userRaw);
  if (userTokens.length !== correctTokens.length) return false;
  return correctTokens.every((ct, i) => isBlankCorrect(userTokens[i] ?? '', ct, accepted?.[i]));
};
