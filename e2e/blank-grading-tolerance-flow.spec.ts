import { test, expect, type Page } from '@playwright/test';

/**
 * REAL_BLANK 관용 채점 — 실백엔드 교차 화면 일치 e2e (feedback #20, FR-006).
 *
 * 스모크와 분리된 feature 프로젝트 스펙. **실백엔드 + 로그인 토큰 + 시드가 있을 때만** 실행하며,
 * `E2E_BLANK=1` 이 아니면 SKIP 한다(mock 스펙 blank-grading-tolerance.spec.ts 는 상시 실행).
 *
 * 목적: 같은 REAL_BLANK 응답을 결과·해설·히스토리 상세 3화면에서 채점할 때 판정이 동일함을 실데이터로 확인.
 * 방식: solve UI 다단계 대신 채점 결과(localStorage `solveQuizResult:<id>`)를 시드해 solve를 우회하고,
 *       실서버의 `/problem-set/{id}`(acceptedAnswers 포함)·`/history/{id}` 데이터로 클라 단일 함수가 재채점하게 한다.
 *
 * 실행 예(backend bootRun + 시드 후):
 *   E2E_BLANK=1 \
 *   E2E_ACCESS_TOKEN="$(curl -s 'http://localhost:8080/local/token?userId=<시드유저>')" \
 *   E2E_BLANK_PROBLEM_SET_ID=<시드 problemSetId> \
 *   E2E_BLANK_QUESTION=1 \
 *   E2E_BLANK_CORRECT_TEXT='동위원소' \
 *   E2E_BLANK_ACCEPT_ANSWER='isotope' \
 *   E2E_BLANK_WRONG_ANSWER='동소체' \
 *   npm run e2e:feature
 *
 * 전제: 시드 problemSetId 의 Q번째 문항이 REAL_BLANK 이고 정답 원문=CORRECT_TEXT, 인정 변형=ACCEPT_ANSWER,
 *       오답선지 텍스트=WRONG_ANSWER. (백엔드 e2e 시드 기준. env 로 오버라이드.)
 */

const ENABLED = process.env.E2E_BLANK === '1';
const TOKEN = process.env.E2E_ACCESS_TOKEN ?? '';
const PROBLEM_SET_ID = process.env.E2E_BLANK_PROBLEM_SET_ID ?? '';
const Q = Number(process.env.E2E_BLANK_QUESTION ?? '1');
// 기본값 = backend e2e 시드 설계(Q1 REAL_BLANK: 정답 "동위원소", accepted ["아이소토프","isotope"], 오답선지 "동소체").
// env로 오버라이드 가능.
const CORRECT_TEXT = process.env.E2E_BLANK_CORRECT_TEXT ?? '동위원소';
const ACCEPT_ANSWER = process.env.E2E_BLANK_ACCEPT_ANSWER ?? 'isotope';
const WRONG_ANSWER = process.env.E2E_BLANK_WRONG_ANSWER ?? '동소체';

/** 로그인 상태를 zustand persist(localStorage 'auth-storage')에 주입 */
async function seedAuth(page: Page): Promise<void> {
  await page.addInitScript((token) => {
    localStorage.setItem(
      'auth-storage',
      JSON.stringify({ state: { accessToken: token, user: null }, version: 0 }),
    );
  }, TOKEN);
}

/** solve 결과(localStorage 'solveQuizResult:<id>')를 주입 — solve UI를 우회하고 채점 화면으로 바로 진입 */
async function seedResult(page: Page, answers: Record<number, string>): Promise<void> {
  await page.addInitScript(
    ([id, ans]) => {
      localStorage.setItem(
        `solveQuizResult:${id as string}`,
        JSON.stringify({
          answers: ans,
          inReview: {},
          totalTime: '00:01:00',
          title: 'E2E BLANK',
          savedAt: Date.now(),
        }),
      );
    },
    [PROBLEM_SET_ID, answers] as const,
  );
}

test.describe('REAL_BLANK 관용 채점 — 실백엔드 교차 화면 일치(FR-006)', () => {
  test.describe.configure({ mode: 'serial' });
  test.skip(!ENABLED, 'E2E_BLANK=1 및 백엔드/토큰/시드가 있을 때만 실행');

  test('관용 인정 답: 결과·해설 모두 정답(정답 원문 미노출)', async ({ page }) => {
    await seedAuth(page);
    await seedResult(page, { [Q]: ACCEPT_ANSWER });

    // ── 결과 화면 ──
    await page.goto(`/result/${PROBLEM_SET_ID}`, { waitUntil: 'domcontentloaded' });
    // 입력한 관용 답이 보인다
    await expect(page.getByText(ACCEPT_ANSWER, { exact: true }).first()).toBeVisible();
    // 정답 처리 → "정답 답안:" 원문 노출이 없다(오답일 때만 원문을 보여줌)
    await expect(page.getByText(CORRECT_TEXT, { exact: true })).toHaveCount(0);
    await page.screenshot({
      path: 'captures/blank-tolerance-e2e-result-accept.png',
      fullPage: true,
    });

    // ── 해설 화면(결과와 동일 판정이어야 함) ──
    await page.getByRole('button', { name: '해설 보기' }).click();
    await page.waitForURL('**/explanation/**');
    await expect(page.getByText(ACCEPT_ANSWER, { exact: true }).first()).toBeVisible();
    // 해설 "내 답안" 박스가 정답(success) 스타일 → 결과와 동일 판정.
    // (해설 본문은 정답 용어를 언급할 수 있어 CORRECT_TEXT 부재 대신 판정 색으로 확인한다.)
    await expect(page.getByText('내 답안', { exact: true })).toHaveClass(/text-success/);
    await page.screenshot({
      path: 'captures/blank-tolerance-e2e-explanation-accept.png',
      fullPage: true,
    });
  });

  test('오답선지 답: 결과·해설 모두 오답(정답 원문 노출) — FR-005', async ({ page }) => {
    await seedAuth(page);
    await seedResult(page, { [Q]: WRONG_ANSWER });

    // ── 결과 화면 ──
    await page.goto(`/result/${PROBLEM_SET_ID}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(WRONG_ANSWER, { exact: true }).first()).toBeVisible();
    // 오답 처리 → 정답 원문이 노출된다
    await expect(page.getByText(CORRECT_TEXT, { exact: true }).first()).toBeVisible();
    await page.screenshot({
      path: 'captures/blank-tolerance-e2e-result-wrong.png',
      fullPage: true,
    });

    // ── 해설 화면(결과와 동일 판정이어야 함) ──
    await page.getByRole('button', { name: '해설 보기' }).click();
    await page.waitForURL('**/explanation/**');
    // 오답 처리 → 정답 원문 노출 + "내 답안" 박스가 오답(destructive) 스타일
    await expect(page.getByText(CORRECT_TEXT, { exact: true }).first()).toBeVisible();
    await expect(page.getByText('내 답안', { exact: true })).toHaveClass(/text-destructive/);
  });
});
