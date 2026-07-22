import { test, expect, type Page, type Request } from '@playwright/test';

/**
 * 동일 재현(feedback #7) 실백엔드 통합 검증. 목킹 spec(quiz-regeneration.spec.ts)과 달리
 * 실제 백엔드/실 토큰/실 seed problemSetId 를 태워 GET /problem-set/{id}/regeneration-condition
 * 응답으로 프론트 판정식(documentAvailable && pageNumbers && language)이 즉시생성 분기를 도는지 확인한다.
 *
 * 기본 SKIP. 실행 예:
 *   E2E_REGEN=1 E2E_ACCESS_TOKEN=<jwt> E2E_SEED_PROBLEM_SET_ID=<id> \
 *     npx playwright test quiz-regeneration.realbackend --project=feature
 *
 * 전제(즉시생성 분기): seed 세트의 regeneration-condition 이 documentAvailable=true,
 * pageNumbers(1개 이상), language 를 모두 갖춰야 한다(legacy/문서소실 세트면 폴백 분기로 빠짐).
 */

const ENABLED = process.env.E2E_REGEN === '1';
const ACCESS_TOKEN = process.env.E2E_ACCESS_TOKEN ?? '';
const SEED_ID = process.env.E2E_SEED_PROBLEM_SET_ID ?? '';

/** 로그인 상태를 zustand persist(localStorage 'auth-storage')에 주입 */
async function seedAuth(page: Page): Promise<void> {
  await page.addInitScript((token) => {
    localStorage.setItem(
      'auth-storage',
      JSON.stringify({ state: { accessToken: token, user: null }, version: 0 }),
    );
  }, ACCESS_TOKEN);
}

test.describe('동일 재현 실백엔드 통합', () => {
  test.skip(!ENABLED, 'E2E_REGEN=1 및 백엔드/토큰/seed 세트가 있을 때만 실행');

  test('실 seed 세트: 결과 화면에서 재생성 버튼 → 실 regeneration-condition → 즉시생성 분기', async ({
    page,
  }) => {
    expect(ACCESS_TOKEN, 'E2E_ACCESS_TOKEN 필요').not.toBe('');
    expect(SEED_ID, 'E2E_SEED_PROBLEM_SET_ID 필요').not.toBe('');

    await seedAuth(page);

    // 실 엔드포인트 요청/응답을 관찰한다(목킹 없음).
    const conditionRequests: Request[] = [];
    let conditionBody: Record<string, unknown> | null = null;
    let generationTriggered = false;

    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('/regeneration-condition')) conditionRequests.push(req);
      // 즉시생성 분기의 증거: 생성 SSE 스트림 연결 또는 POST /generation.
      if (/\/generation(\/[^/]+\/stream)?(\?|$)/.test(url)) generationTriggered = true;
    });
    page.on('response', async (res) => {
      if (res.url().includes('/regeneration-condition') && res.ok()) {
        try {
          conditionBody = await res.json();
        } catch {
          /* 본문 파싱 실패는 아래 단언에서 드러난다 */
        }
      }
    });

    await page.goto(`/result/${SEED_ID}`, { waitUntil: 'domcontentloaded' });

    const button = page.getByTestId('regenerate-quiz-button');
    await expect(button).toBeVisible();
    await button.click();

    // 실 regeneration-condition 이 실제로 나갔는지.
    await expect.poll(() => conditionRequests.length, { timeout: 10_000 }).toBeGreaterThan(0);

    // 옵션 재조립 없이 홈(생성 흐름)으로 직행.
    await expect(page).toHaveURL(/\/(en|ko)?$/, { timeout: 10_000 });

    // 응답 본문의 프론트 판정식이 즉시생성(reproducible)이어야 하고, 실제 생성이 트리거돼야 한다.
    expect(conditionBody, 'regeneration-condition 응답 본문').not.toBeNull();
    const body = conditionBody as unknown as {
      documentAvailable?: boolean;
      pageNumbers?: number[] | null;
      language?: string | null;
    };
    const reproducible = !!body.documentAvailable && !!body.pageNumbers?.length && !!body.language;
    expect(
      reproducible,
      `seed 세트가 즉시생성 조건을 갖춰야 함(documentAvailable=${body.documentAvailable}, pageNumbers=${JSON.stringify(body.pageNumbers)}, language=${body.language})`,
    ).toBe(true);
    await expect.poll(() => generationTriggered, { timeout: 15_000 }).toBe(true);
  });
});
