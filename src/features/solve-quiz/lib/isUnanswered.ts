import type { QuizSelection } from '#features/quiz-generation';

/**
 * 사용자가 아직 답을 선택/입력하지 않았는지 판별한다.
 * - answer가 빈 값이거나 "0"이면 미응답으로 판정한다. 선택지 ID는 1부터 시작하고,
 *   REAL_BLANK(선택지 없는 직접입력)의 미응답도 서버가 0으로 내려주므로 "0" = 미응답이다.
 * - selections가 유효할 경우, answer가 선택지 id와 일치하는지 확인한다.
 */
export const isUnanswered = (
  answer: string | number | null | undefined,
  selections: QuizSelection[],
): boolean => {
  const normalized = answer == null ? '' : String(answer);
  if (normalized === '' || normalized === '0') {
    return true;
  }

  if (!Array.isArray(selections) || selections.length === 0) {
    return false;
  }

  return !selections.some((selection) => String(selection.id) === String(answer));
};
