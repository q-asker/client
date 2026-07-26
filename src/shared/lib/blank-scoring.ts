/**
 * REAL_BLANK(직접 입력 단답) 채점을 위한 순수 함수 모음.
 *
 * - 외부 의존성 없음 (React/Zustand/Axios 미사용).
 * - 결과·해설·히스토리 상세 3화면이 모두 `gradeRealBlankQuiz` 하나만 호출한다 →
 *   같은 입력이면 언제/어디서나 동일 판정(FR-006 구조적 보장).
 * - 관용 경계: 표기 차이(공백·문장부호·대소문자·전각/반각) + 오탈자(길이비례 편집거리)
 *   + 동의어(생성 시 백엔드가 확정·저장한 허용변형 목록). 채점 시점 외부 호출 0(재현성).
 */

/** 문항(REAL_BLANK)에 부착되는 빈칸별 허용답안. answer=모범답안, accepted=동의어(오답선지 제외 보장분). */
export interface AcceptedAnswer {
  answer: string;
  accepted: string[];
}

/**
 * 정답 비교를 위한 정규화.
 * NFKC(전각/반각·호환문자 통일) → 소문자 → 모든 공백 제거 → 문장부호 제거.
 * 표기 차이(FR-001)를 흡수해 뜻이 같은 표기를 같은 문자열로 만든다.
 */
export const normalizeBlankAnswer = (s: string): string =>
  s
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[\p{P}]/gu, '');

/** 두 문자열의 Levenshtein 편집거리. */
const levenshtein = (a: string, b: string): number => {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    prev = curr;
  }
  return prev[b.length];
};

/**
 * 오탈자 허용 편집거리 상한(정규화된 정답 후보 길이 기준).
 * 짧은 답일수록 좁혀 다른 개념과의 우연 일치(오탐)를 막는다(FR-002).
 * len≤2 → 0(완전일치만), 3~9 → 1, 10+ → 2.
 */
const typoThreshold = (len: number): number => (len <= 2 ? 0 : len <= 9 ? 1 : 2);

/** 사용자 토큰(정규화)이 후보(원본)와 완전일치 또는 오탈자 허용 범위 내인가. */
const matchesCandidate = (userNorm: string, candidateRaw: string): boolean => {
  const candNorm = normalizeBlankAnswer(candidateRaw);
  if (candNorm === '') return false;
  if (userNorm === candNorm) return true;
  return levenshtein(userNorm, candNorm) <= typoThreshold(candNorm.length);
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

/** REAL_BLANK 채점에 필요한 최소 형태(결과·해설의 Quiz, 히스토리 상세의 Problem 모두 이 형태로 전달). */
export interface RealBlankGradable {
  /** 사용자 원본 입력. 단일=raw 문자열, 다중=U+001F 직렬화. 히스토리는 textAnswer를 넘긴다. */
  userAnswer?: string | number | null;
  /** 정답(correct===true)·오답선지(correct===false) content를 모두 담은 선택지 목록. */
  selections: { content: string; correct?: boolean }[];
  /** 빈칸 index 순서의 허용답안. null/빈 배열이면 구문항 폴백(모범답안 콤마토큰 + 표기/오탈자만). */
  acceptedAnswers?: AcceptedAnswer[] | null;
}

/**
 * REAL_BLANK 문항 1개의 정답/오답 판정 — 전 화면 공용 단일 오케스트레이터.
 *
 * 규칙:
 * - 미응답("0" 센티넬/빈 입력)·공백만 입력 → 오답.
 * - 빈칸 후보 = [answer, ...accepted](허용목록 있을 때) 또는 모범답안 콤마토큰(구문항 폴백).
 * - 사용자 토큰 수가 빈칸 수와 다르면 오답(다중 빈칸 G).
 * - 각 빈칸: 후보와 완전일치 → 정답. 아니면 D-guard(오답선지 정규화 완전일치 → 즉시 오답).
 *   그다음 오탈자 허용(C). 모든 빈칸이 통과해야 문항 정답.
 */
export const gradeRealBlankQuiz = (q: RealBlankGradable): boolean => {
  const rawInput = q.userAnswer == null ? '' : String(q.userAnswer);
  // 서버는 미응답 REAL_BLANK를 0("0")으로 내려보내므로 빈 문자열로 정규화한다.
  const userRaw = rawInput === '0' ? '' : rawInput;

  // 빈칸별 후보 구성: 허용목록 우선, 없으면 정답 content 콤마분리 폴백(F).
  let blanks: AcceptedAnswer[];
  if (q.acceptedAnswers && q.acceptedAnswers.length > 0) {
    blanks = q.acceptedAnswers;
  } else {
    const correctSel = q.selections.find((s) => s.correct === true);
    const tokens = correctSel ? correctSel.content.split(',').map((s) => s.trim()) : [];
    blanks = tokens.map((answer) => ({ answer, accepted: [] }));
  }
  const blankCount = blanks.length;
  if (blankCount === 0) return false;

  // 사용자 토큰 분해 후 빈칸 수와 대조(G).
  const userTokens = blankCount <= 1 ? [userRaw] : deserializeRealBlankTokens(userRaw);
  if (userTokens.length !== blankCount) return false;

  // D-guard용 오답선지 정규화 집합(선택지 전체 + 콤마 토큰 단위 모두).
  const distractorNorms = new Set<string>();
  for (const s of q.selections) {
    if (s.correct === false) {
      const whole = normalizeBlankAnswer(s.content);
      if (whole) distractorNorms.add(whole);
      for (const tok of s.content.split(',')) {
        const n = normalizeBlankAnswer(tok);
        if (n) distractorNorms.add(n);
      }
    }
  }

  for (let i = 0; i < blankCount; i++) {
    const userNorm = normalizeBlankAnswer(userTokens[i] ?? '');
    if (userNorm === '') return false; // 미응답/공백만 → 오답

    const candidates = [blanks[i].answer, ...(blanks[i].accepted ?? [])];
    const candidateNorms = candidates.map(normalizeBlankAnswer);

    // 1) 후보와 완전일치면 무조건 정답(진짜 정답이 D-guard에 걸리지 않도록 최우선).
    if (candidateNorms.includes(userNorm)) continue;
    // 2) D-guard: 오답선지와 정규화 완전일치 → 오탈자 관용 건너뛰고 즉시 오답(FR-005).
    if (distractorNorms.has(userNorm)) return false;
    // 3) 오탈자 허용(C).
    if (!candidates.some((c) => matchesCandidate(userNorm, c))) return false;
  }
  return true;
};
