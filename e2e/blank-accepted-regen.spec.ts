import { test, expect, type Page } from '@playwright/test';

/**
 * 007 빈칸 허용 정답 노출(US3) + 이어풀기 결함 수리(US1) 기능 E2E.
 *
 * 006(repeat-generation.spec.ts)이 놓친 두 축을 메운다:
 *  - US1: REAL_BLANK 이어풀기 흐름 + **2회차 반복**(Acceptance#3·FR-003).
 *  - US3: 채점 후 **허용 정답 목록 노출**(결과·해설), **빈칸별 구분**(FR-008),
 *         **풀이화면 비노출**(FR-007).
 *
 * 실 백엔드(REAL_BLANK 목업 지원 mockai 프로파일)와 유효 토큰이 있어야 의미가 있으므로,
 * 토큰이 없으면 SKIP 한다.
 *
 * 시드 세트: `real-blank-tolerance.spec.ts`와 동일한 정규 REAL_BLANK 세트 `d2M1pa8v`
 * (3문항, page_numbers·language 채워진 즉시 재생성 경로).
 *  1(단일)      "미토콘드리아" (+영↔한 mitochondria 등)
 *  2(다중 2빈칸) "감수분열 / 체세포분열"  ← FR-008 빈칸별 구분 렌더 검증
 *  3(단일,폴백)  "운동량" (FR-009)
 * → 채점 후 `/grade` 응답의 acceptedAnswers(2차원)를 목록으로 노출한다.
 *
 * 실행:
 *   E2E_ACCESS_TOKEN="$(curl -s 'http://localhost:8080/local/token?userId=e2e-realblank')" \
 *     npm run e2e:feature -- blank-accepted-regen
 *
 * 주: 재현 자료의 "대용량(39쪽·10문항)·TTFQ 무음→절단" 타이밍은 mockai 즉시반환으로 재현 불가 —
 *     실 Gemini 대용량 시나리오(리드 게이트) + BE 단위/통합(중복 메커니즘)으로 분담(contract §D·E).
 */

const ACCESS_TOKEN = process.env.E2E_ACCESS_TOKEN ?? '';
const PSID = 'd2M1pa8v';

/** "인정된 답" 목록 헤더 — ko/en 양쪽 대응(Playwright 기본 로케일이 en일 수 있음). */
const ACCEPTED_LABEL = /인정된 답|Accepted answers/;
/** 모범답 뱃지 — ko/en. */
const MODEL_LABEL = /모범답|Model answer/;
/** 다중빈칸 2번째 빈칸 라벨 — ko/en. */
const SECOND_BLANK_LABEL = /빈칸\s*2|Blank\s*2/;

/** 로그인 + 응시 답안(localStorage)을 주입해, REAL_BLANK 결과 화면이 채점·렌더되게 한다. */
async function seed(page: Page, psid: string): Promise<void> {
  await page.addInitScript(
    ({ token, id }) => {
      localStorage.setItem(
        'auth-storage',
        JSON.stringify({ state: { accessToken: token, user: null }, version: 0 }),
      );
      localStorage.setItem(
        `solveQuizResult:${id}`,
        JSON.stringify({
          answers: { 1: 'test' },
          inReview: {},
          totalTime: '00:01:00',
          title: 'E2E 007 빈칸 허용 정답 세트',
          savedAt: Date.now(),
        }),
      );
    },
    { token: ACCESS_TOKEN, id: psid },
  );
}

/** PR 캡처용 스크린샷을 captures/에 저장 */
async function shot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `captures/blank-${name}.png`, fullPage: true });
}

test.describe('007 US3 — 채점 후 허용 정답 목록 노출', () => {
  test.skip(!ACCESS_TOKEN, 'E2E_ACCESS_TOKEN(로컬 백엔드 /local/token)이 있을 때만 실행');

  test('FR-006·008: 결과 화면에 빈칸별 허용 정답 목록(모범답 강조)이 노출된다', async ({
    page,
  }) => {
    await seed(page, PSID);
    await page.goto(`/result/${PSID}`, { waitUntil: 'domcontentloaded' });

    // 서버 채점(/grade) 결과가 도착하면 아코디언(기본 펼침)에 "인정된 답" 목록이 렌더된다.
    const acceptedHeader = page.getByText(ACCEPTED_LABEL).first();
    await expect(acceptedHeader).toBeVisible({ timeout: 20_000 });
    // 모범답 뱃지(index 0 강조) 노출.
    await expect(page.getByText(MODEL_LABEL).first()).toBeVisible();
    // FR-008: 다중빈칸 문항이 있으면 "빈칸 2" 라벨로 빈칸별 구분 표시.
    await expect(page.getByText(SECOND_BLANK_LABEL).first()).toBeVisible();
    await shot(page, 'accepted-result');
  });

  test('FR-006: 해설 화면에도 허용 정답 목록이 노출된다', async ({ page }) => {
    await seed(page, PSID);
    await page.goto(`/explanation/${PSID}`, { waitUntil: 'domcontentloaded' });

    await expect(page.getByText(ACCEPTED_LABEL).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(MODEL_LABEL).first()).toBeVisible();
    await shot(page, 'accepted-explanation');
  });

  test('FR-007: 채점 전 풀이 화면에는 허용 정답 목록이 노출되지 않는다', async ({ page }) => {
    await seed(page, PSID);
    await page.goto(`/quiz/${PSID}`, { waitUntil: 'domcontentloaded' });

    // 풀이 화면 렌더 대기(문항 진행 버튼).
    await page
      .getByRole('button', { name: /다음|제출하기|Next|Submit/ })
      .first()
      .waitFor({ timeout: 20_000 });
    await expect(page.getByText(ACCEPTED_LABEL)).toHaveCount(0);
    await shot(page, 'solve-no-accepted');
  });
});

test.describe('007 US1 — REAL_BLANK 이어풀기 흐름 + 2회차 반복', () => {
  test.skip(!ACCESS_TOKEN, 'E2E_ACCESS_TOKEN(로컬 백엔드 /local/token)이 있을 때만 실행');

  test('FR-003·SC-001: 이어풀기가 새 세트 생성→풀이 진입으로 이어지고, 2회차도 반복된다', async ({
    page,
  }) => {
    await seed(page, PSID);

    // ── 1회차: 결과 → 이어풀기 → 새 세트 B 풀이 진입 ──
    await page.goto(`/result/${PSID}`, { waitUntil: 'domcontentloaded' });
    const cta1 = page.getByRole('button', { name: /이 조건으로 더 풀기|Practice more/ });
    await expect(cta1).toBeVisible({ timeout: 20_000 });
    await cta1.click();

    await page.waitForURL(/\/quiz\/[^/]+$/, { timeout: 60_000 });
    const idB = page.url().split('/quiz/')[1];
    expect(idB, '1회차 새 세트 id').toBeTruthy();
    expect(idB, '원본과 다른 독립 세트').not.toBe(PSID);
    await page
      .getByRole('button', { name: /다음|제출하기|Next|Submit/ })
      .first()
      .waitFor({ timeout: 30_000 });
    await shot(page, 'repeat-1-solve');

    // ── 2회차: 새 세트 B 결과 → 다시 이어풀기 → 또 다른 새 세트 C (드릴 루프 무결) ──
    await page.goto(`/result/${idB}`, { waitUntil: 'domcontentloaded' });
    const cta2 = page.getByRole('button', { name: /이 조건으로 더 풀기|Practice more/ });
    await expect(cta2).toBeVisible({ timeout: 20_000 });
    await cta2.click();

    await page.waitForURL(/\/quiz\/[^/]+$/, { timeout: 60_000 });
    const idC = page.url().split('/quiz/')[1];
    expect(idC, '2회차 새 세트 id').toBeTruthy();
    expect(idC, 'FR-003: 매 회차 독립된 새 세트').not.toBe(idB);
    expect(idC, '2회차도 원본과 다름').not.toBe(PSID);
    await page
      .getByRole('button', { name: /다음|제출하기|Next|Submit/ })
      .first()
      .waitFor({ timeout: 30_000 });
    await shot(page, 'repeat-2-solve');
  });
});
