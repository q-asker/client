const SHOW_SELECTIONS_KEY = 'solve_show_selections';

/**
 * BLANK 문제의 선택지 공개 여부 사용자 설정.
 *
 * 아직 토글한 적이 없으면 null을 반환한다 — 호출부가 기본값(펼침)을 적용한다.
 * 저장소 접근이 막힌 환경(사파리 시크릿 모드 등)에서도 null로 떨어져 렌더가 깨지지 않는다.
 */
export const loadShowSelections = (): boolean | null => {
  try {
    const raw = localStorage.getItem(SHOW_SELECTIONS_KEY);
    return raw === null ? null : raw === 'true';
  } catch {
    return null;
  }
};

/** 선택지 공개 여부를 저장한다. 문제를 넘겨도 유지된다. */
export const saveShowSelections = (show: boolean): void => {
  try {
    localStorage.setItem(SHOW_SELECTIONS_KEY, String(show));
  } catch {
    // localStorage 에러 무시
  }
};
