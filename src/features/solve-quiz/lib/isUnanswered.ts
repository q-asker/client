import type { QuizSelection } from '#features/quiz-generation';

/**
 * 사용자가 아직 답을 선택하지 않았는지 판별한다.
 * - answer가 빈 값이면 미응답으로 판정
 * - selections가 유효할 경우, answer가 선택지 id와 일치하는지 확인
 */
export const isUnanswered = (
  answer: string | null | undefined,
  selections: QuizSelection[],
): boolean => {
  if (answer === undefined || answer === null || answer === '') {
    return true;
  }

  if (!Array.isArray(selections) || selections.length === 0) {
    return false;
  }

  return !selections.some((selection) => String(selection.id) === String(answer));
};
