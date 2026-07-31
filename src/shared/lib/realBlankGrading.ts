/**
 * REAL_BLANK 채점 서버 SSOT 클라이언트.
 *
 * 채점 판정은 서버 `RealBlankGrader`가 유일 소스다(FR-006). 프론트는 사용자 입력을
 * `POST /grade`(무상태·공개·저장 안 함)로 보내 문항별 판정과 대표정답을 받아 표시만 한다.
 * REAL_BLANK 세트에서만 호출한다(타 유형 불변 — FR-007).
 */
import axiosInstance from '#shared/api';

/** 서버로 보내는 빈칸별 입력 (다중 빈칸은 U+001F 직렬화, 단일은 raw) */
export interface GradeAnswerInput {
  number: number;
  textAnswer: string;
}

/** 서버 판정 결과 (answer = 대표정답 표시용, 다중은 ", " 결합) */
export interface GradeResultItem {
  number: number;
  isCorrect: boolean;
  answer: string;
  /**
   * 빈칸별 허용 정답 목록 (바깥 index = 빈칸 등장순서, index 0 = canonical 모범답, 1..n = 통용 변형).
   * 채점 후 결과·해설에서 노출한다(FR-006·008). 좁게 저장된 과거 세트는 빈칸별 [모범답] 단일이거나
   * 필드 자체가 없을 수 있다(FR-009) — 있는 만큼만 표시한다.
   */
  acceptedAnswers?: string[][];
}

interface GradeResponse {
  results: GradeResultItem[];
}

/**
 * userAnswer(선택지 ID 저장 포맷과 공유되는 필드)를 서버 전송용 텍스트로 정규화한다.
 * 서버는 미응답을 0("0")으로 내려보내므로 빈 문자열로 맞춘다.
 */
export const toTextAnswer = (userAnswer: string | number | null | undefined): string => {
  if (userAnswer == null) return '';
  const s = String(userAnswer);
  return s === '0' ? '' : s;
};

/**
 * REAL_BLANK 세트를 서버에서 채점한다.
 * @returns 문항 번호 → 판정 결과 맵
 */
export const gradeRealBlankSet = async (
  problemSetId: string,
  answers: GradeAnswerInput[],
): Promise<Map<number, GradeResultItem>> => {
  const { data } = await axiosInstance.post<GradeResponse>('/grade', { problemSetId, answers });
  return new Map(data.results.map((r) => [r.number, r]));
};
