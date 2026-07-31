import { test, expect, type Page } from '@playwright/test';

/**
 * 006 이어풀기(같은 조건으로 문제 이어서 더 풀기) 기능 E2E.
 * (로그인·로컬 백엔드·V18 조건이 채워진 시드 세트 필요 — mockai 프로파일 권장)
 *
 * 스모크(smoke.spec.ts)와 분리한다: 실 백엔드의
 *   `GET /problem-set/{id}/regeneration-condition` + `POST /generation`(SSE) 이 동작하고
 * 유효한 액세스 토큰이 있어야 의미가 있으므로, 토큰이 없으면 SKIP 한다.
 *
 * 실행:
 *   E2E_ACCESS_TOKEN="$(curl -s 'http://localhost:8080/local/token?userId=<시드유저>')" \
 *     E2E_REPEAT_PSID=<V18 조건이 채워진 시드 세트 id> \
 *     npm run e2e:feature -- repeat-generation
 *
 * 시드 세트(@backend 제공): problemSetId=E2E_REPEAT_PSID.
 *  - page_numbers·language 가 채워진(V18 이후 생성) 세트여야 "즉시 재생성" 경로가 검증된다.
 *  - 조건이 null 인 legacy 세트라면 US2 폴백(옵션 화면 이동)으로 분기한다.
 */

const ACCESS_TOKEN = process.env.E2E_ACCESS_TOKEN ?? '';
const PSID = process.env.E2E_REPEAT_PSID ?? '';

/** 로그인 + 응시 답안(localStorage)을 주입해, 결과 화면이 정상 렌더되게 한다. */
async function seed(page: Page): Promise<void> {
  await page.addInitScript(
    ({ token, psid }) => {
      localStorage.setItem(
        'auth-storage',
        JSON.stringify({ state: { accessToken: token, user: null }, version: 0 }),
      );
      localStorage.setItem(
        `solveQuizResult:${psid}`,
        JSON.stringify({
          answers: { 1: '1' },
          inReview: {},
          totalTime: '00:01:00',
          title: 'E2E 이어풀기 시드 세트',
          savedAt: Date.now(),
        }),
      );
    },
    { token: ACCESS_TOKEN, psid: PSID },
  );
}

/** PR 캡처용 스크린샷을 captures/에 저장 */
async function shot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `captures/repeat-${name}.png`, fullPage: true });
}

test.describe('006 이어풀기 — 같은 조건으로 이어서 더 풀기', () => {
  test.skip(!ACCESS_TOKEN || !PSID, 'E2E_ACCESS_TOKEN·E2E_REPEAT_PSID 가 있을 때만 실행');

  test('FR-001·FR-008: 결과·해설 확인 지점에 "이 조건으로 더 풀기" 진입 수단이 노출된다', async ({
    page,
  }) => {
    await seed(page);

    // 결과 화면 CTA
    await page.goto(`/result/${PSID}`, { waitUntil: 'domcontentloaded' });
    const resultCta = page.getByRole('button', { name: '이 조건으로 더 풀기' });
    await expect(resultCta).toBeVisible();
    await shot(page, 'cta-result');

    // 해설 화면 CTA
    await page.goto(`/explanation/${PSID}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: '이 조건으로 더 풀기' })).toBeVisible();
    await shot(page, 'cta-explanation');
  });

  test('US1·FR-002·FR-003·SC-001: 한 번의 동작으로 같은 조건의 새 세트를 즉시 생성해 풀이로 진입한다', async ({
    page,
  }) => {
    await seed(page);
    await page.goto(`/result/${PSID}`, { waitUntil: 'domcontentloaded' });

    const cta = page.getByRole('button', { name: '이 조건으로 더 풀기' });
    await expect(cta).toBeVisible();
    await cta.click();

    // 진행 오버레이 노출(FR-004) — 생성이 매우 빠르면 놓칠 수 있어 실패로 보지 않는다.
    // 완료 시 곧바로 새 세트 풀이(/quiz/{newId})로 자동 진입한다.
    await page.waitForURL(/\/quiz\/[^/]+$/, { timeout: 60_000 });

    const newId = page.url().split('/quiz/')[1];
    expect(newId, '새 세트 id').toBeTruthy();
    expect(newId, 'FR-005: 원본과 다른 독립된 새 세트').not.toBe(PSID);

    // 새 세트 풀이 화면이 실제로 렌더될 때까지 대기 후 캡처 (풀이 진입 완결 확인)
    await page
      .getByRole('button', { name: /다음|제출하기/ })
      .first()
      .waitFor({ timeout: 30_000 });
    await page.waitForLoadState('networkidle');
    await shot(page, 'solve-new-set');
  });
});
