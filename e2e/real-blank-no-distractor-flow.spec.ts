import { test, expect, type Page } from '@playwright/test';

/**
 * 004(REAL_BLANK 전용 파이프라인 분리) — 오답선지 0개 REAL_BLANK 실백엔드 교차 화면 일치 e2e.
 *
 * 스모크와 분리된 feature 프로젝트 스펙. **실백엔드 + 로그인 토큰 + 시드가 있을 때만** 실행하며,
 * `E2E_REAL_BLANK_ND=1` 이 아니면 SKIP 한다(mock 스펙 real-blank-no-distractor.spec.ts 는 상시 실행).
 *
 * 003의 `blank-grading-tolerance-flow.spec.ts`와 같은 패턴이지만, 시드 문항이 **오답선지를
 * 전혀 갖지 않는(selections에 correct:false 항목 없음) 신규 REAL_BLANK**라는 점이 다르다 —
 * D-guard가 트리거될 데이터 자체가 없는 상태에서도 결과·해설(+선택적으로 히스토리 상세) 판정이
 * 동일함을 실데이터로 확인한다(FR-006, spec User Story 3 신규 문항 케이스).
 *
 * 실행 예(backend bootRun + 오답선지 없는 REAL_BLANK 시드 후):
 *   E2E_REAL_BLANK_ND=1 \
 *   E2E_ACCESS_TOKEN="$(curl -s 'http://localhost:8080/local/token?userId=<시드유저>')" \
 *   E2E_ND_PROBLEM_SET_ID=<시드 problemSetId> \
 *   E2E_ND_QUESTION=1 \
 *   E2E_ND_CORRECT_TEXT='캡슐화' \
 *   E2E_ND_ACCEPT_ANSWER='encapsulation' \
 *   E2E_ND_WRONG_ANSWER='상속' \
 *   npm run e2e:feature
 *
 * 전제: 시드 problemSetId 의 Q번째 문항이 REAL_BLANK 이고 selections에 correct:false 항목이
 * 없으며(오답선지 미생성), 정답 원문=CORRECT_TEXT, 인정 변형=ACCEPT_ANSWER. env로 오버라이드 가능.
 *
 * 히스토리 상세 화면 교차 검증(선택, `E2E_ND_HISTORY_ID` 세팅 시에만 추가 실행):
 * 이 변경 이전에 만들어진 오답선지 有 REAL_BLANK 기록이 아니라, 이 변경 이후 오답선지 無로
 * 생성·응시된 기록의 historyId를 넘기면 `/history/{id}` 화면에서도 결과·해설과 동일 판정인지 확인한다.
 */

const ENABLED = process.env.E2E_REAL_BLANK_ND === '1';
const TOKEN = process.env.E2E_ACCESS_TOKEN ?? '';
const PROBLEM_SET_ID = process.env.E2E_ND_PROBLEM_SET_ID ?? '';
const Q = Number(process.env.E2E_ND_QUESTION ?? '1');
const CORRECT_TEXT = process.env.E2E_ND_CORRECT_TEXT ?? '캡슐화';
const ACCEPT_ANSWER = process.env.E2E_ND_ACCEPT_ANSWER ?? 'encapsulation';
const WRONG_ANSWER = process.env.E2E_ND_WRONG_ANSWER ?? '상속';
const HISTORY_ID = process.env.E2E_ND_HISTORY_ID ?? '';

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
          title: 'E2E REAL_BLANK ND',
          savedAt: Date.now(),
        }),
      );
    },
    [PROBLEM_SET_ID, answers] as const,
  );
}

test.describe('REAL_BLANK 오답선지 0개 — 실백엔드 교차 화면 일치(FR-006, 004)', () => {
  test.describe.configure({ mode: 'serial' });
  test.skip(!ENABLED, 'E2E_REAL_BLANK_ND=1 및 백엔드/토큰/시드가 있을 때만 실행');

  test('관용 인정 답: 결과·해설 모두 정답(정답 원문 미노출)', async ({ page }) => {
    await seedAuth(page);
    await seedResult(page, { [Q]: ACCEPT_ANSWER });

    // ── 결과 화면 ──
    await page.goto(`/result/${PROBLEM_SET_ID}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(ACCEPT_ANSWER, { exact: true }).first()).toBeVisible();
    await expect(page.getByText(CORRECT_TEXT, { exact: true })).toHaveCount(0);
    await page.screenshot({
      path: 'captures/real-blank-no-distractor-e2e-result-accept.png',
      fullPage: true,
    });

    // ── 해설 화면(결과와 동일 판정이어야 함) ──
    await page.getByRole('button', { name: '해설 보기' }).click();
    await page.waitForURL('**/explanation/**');
    await expect(page.getByText(ACCEPT_ANSWER, { exact: true }).first()).toBeVisible();
    await expect(page.getByText('내 답안', { exact: true })).toHaveClass(/text-success/);
    await page.screenshot({
      path: 'captures/real-blank-no-distractor-e2e-explanation-accept.png',
      fullPage: true,
    });
  });

  test('무관한 답: 결과·해설 모두 오답(오답선지 없이도 무근거 정답 처리 없음) — FR-005', async ({
    page,
  }) => {
    await seedAuth(page);
    await seedResult(page, { [Q]: WRONG_ANSWER });

    // ── 결과 화면 ──
    await page.goto(`/result/${PROBLEM_SET_ID}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(WRONG_ANSWER, { exact: true }).first()).toBeVisible();
    await expect(page.getByText(CORRECT_TEXT, { exact: true }).first()).toBeVisible();
    await page.screenshot({
      path: 'captures/real-blank-no-distractor-e2e-result-wrong.png',
      fullPage: true,
    });

    // ── 해설 화면(결과와 동일 판정이어야 함, "오답 해설 영역"이 어색하게 남지 않는지 스크린샷으로 확인) ──
    await page.getByRole('button', { name: '해설 보기' }).click();
    await page.waitForURL('**/explanation/**');
    await expect(page.getByText(CORRECT_TEXT, { exact: true }).first()).toBeVisible();
    await expect(page.getByText('내 답안', { exact: true })).toHaveClass(/text-destructive/);
    await page.screenshot({
      path: 'captures/real-blank-no-distractor-e2e-explanation-wrong.png',
      fullPage: true,
    });
  });

  test('히스토리 상세: 결과·해설과 동일 판정(선택 — E2E_ND_HISTORY_ID 세팅 시에만)', async ({
    page,
  }) => {
    test.skip(!HISTORY_ID, 'E2E_ND_HISTORY_ID 시드가 있을 때만 실행');
    await seedAuth(page);

    await page.goto(`/history/${HISTORY_ID}`, { waitUntil: 'domcontentloaded' });
    // 스코어보드 히어로가 뜨면 렌더 완료(오답선지 없는 REAL_BLANK 기록도 오류 없이 채점·표시된다 — FR-006/User Story 3)
    await expect(page.getByText('점', { exact: false }).first()).toBeVisible();
    await page.screenshot({
      path: 'captures/real-blank-no-distractor-e2e-history-detail.png',
      fullPage: true,
    });
  });
});
