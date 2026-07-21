import { test, expect, type Page } from '@playwright/test';

/**
 * 퀴즈 기록 폴더 분류 기능 e2e (로그인·백엔드 필요).
 *
 * 스모크 게이트(smoke.spec.ts)와 분리한다: 이 스펙은 실제 백엔드와 유효한 액세스 토큰이
 * 있어야 의미가 있으므로, 기본적으로 SKIP 하고 `E2E_FOLDERS=1` 일 때만 실행한다.
 *
 * 실행 예:
 *   E2E_FOLDERS=1 E2E_ACCESS_TOKEN=<jwt> npx playwright test quiz-history-folders
 *
 * 전제: 로그인한 사용자에게 최소 1개 이상의 퀴즈 기록이 있어야 한다(기록 이동 시나리오).
 * UI: 폴더 네비게이션은 통계와 목록 사이에 한 줄로 상시 노출된다(드롭다운 아님).
 */

const ENABLED = process.env.E2E_FOLDERS === '1';
const ACCESS_TOKEN = process.env.E2E_ACCESS_TOKEN ?? '';
// 시드로 심어진 퀴즈 기록 제목(backend e2e 시드 기준). 없으면 env로 오버라이드.
const SEED_TITLE = process.env.E2E_SEED_TITLE ?? 'E2E 기록';

// 고유 폴더 이름(중복 허용 스펙이지만 조회 단순화 + 재실행 충돌 방지를 위해 유니크하게)
let seq = 0;
const runId = process.env.E2E_RUN_ID ?? String(Date.now());
const uniq = (prefix: string): string => `${prefix}-${runId}-${seq++}`;

/** 로그인 상태를 zustand persist(localStorage 'auth-storage')에 주입 */
async function seedAuth(page: Page): Promise<void> {
  await page.addInitScript((token) => {
    localStorage.setItem(
      'auth-storage',
      JSON.stringify({ state: { accessToken: token, user: null }, version: 0 }),
    );
  }, ACCESS_TOKEN);
}

/** 폴더 바에서 범위(전체/미분류/특정 폴더) 칩을 클릭해 필터 전환 */
async function selectScope(page: Page, nameRe: RegExp): Promise<void> {
  await page.getByRole('button', { name: nameRe }).click();
}

/** 이동 다이얼로그에서 대상 폴더(또는 '미분류로 빼기')를 클릭 */
async function moveInDialog(page: Page, nameRe: RegExp): Promise<void> {
  await page.getByRole('dialog').getByRole('button', { name: nameRe }).click();
}

test.describe('퀴즈 기록 폴더 분류', () => {
  // 단일 시드 기록을 공유하므로 병렬 경쟁을 막기 위해 직렬 실행(스모크 spec은 무관)
  test.describe.configure({ mode: 'serial' });
  test.skip(!ENABLED, 'E2E_FOLDERS=1 및 백엔드/토큰이 있을 때만 실행');

  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await page.goto('/history', { waitUntil: 'domcontentloaded' });
    // 폴더 바(통계와 목록 사이)의 '전체' 항목이 뜨면 인증·데이터 준비됨
    await expect(page.getByRole('button', { name: /전체 \(/ })).toBeVisible();
  });

  test('폴더 생성 → 폴더 바에 노출', async ({ page }) => {
    const name = uniq('폴더생성');
    await page.getByRole('button', { name: '새 폴더' }).click();
    await page.getByPlaceholder('폴더 이름').fill(name);
    await page.getByRole('button', { name: '만들기' }).click();

    // 폴더 바에 새 폴더가 개수 0으로 상시 노출된다
    await expect(page.getByRole('button', { name: new RegExp(`${name} \\(0\\)`) })).toBeVisible();
  });

  test('기록을 폴더로 이동 → 전체뷰 배지 · 폴더뷰 노출 · 미분류에서 제외', async ({ page }) => {
    const name = uniq('이동');
    await page.getByRole('button', { name: '새 폴더' }).click();
    await page.getByPlaceholder('폴더 이름').fill(name);
    await page.getByRole('button', { name: '만들기' }).click();

    // 첫 기록을 폴더로 이동
    const firstRow = page.locator('[class*="group/row"]').first();
    await firstRow.getByRole('button', { name: '폴더로 이동' }).click();
    await moveInDialog(page, new RegExp(name));

    // 전체 뷰에서 해당 폴더 배지가 보인다
    await expect(page.getByText(name).first()).toBeVisible();

    // 폴더 뷰로 좁히면 그 기록이 보인다(1건=데스크톱+모바일 2행이므로 제목 가시성으로 검증)
    await selectScope(page, new RegExp(`${name} \\(1\\)`));
    await expect(page.getByText(SEED_TITLE).first()).toBeVisible();

    // 미분류 뷰로 전환하면 그 기록은 빠져 빈 상태가 된다
    await selectScope(page, /미분류 \(/);
    await expect(page.getByText('미분류 기록이 없습니다.')).toBeVisible();
  });

  test('다른 폴더로 재이동 → 단일 소속(이전 폴더에서 빠짐)', async ({ page }) => {
    const a = uniq('A');
    const b = uniq('B');
    for (const n of [a, b]) {
      await page.getByRole('button', { name: '새 폴더' }).click();
      await page.getByPlaceholder('폴더 이름').fill(n);
      await page.getByRole('button', { name: '만들기' }).click();
    }
    const firstRow = page.locator('[class*="group/row"]').first();
    // A로 이동
    await firstRow.getByRole('button', { name: '폴더로 이동' }).click();
    await moveInDialog(page, new RegExp(a));
    // B로 재이동
    await firstRow.getByRole('button', { name: '폴더로 이동' }).click();
    await moveInDialog(page, new RegExp(b));

    // A 폴더는 비고(단일 소속: 이전 폴더에서 빠짐), B 폴더에 그 기록이 있다
    await selectScope(page, new RegExp(`${a} \\(0\\)`));
    await expect(page.getByText('이 폴더에 기록이 없습니다.')).toBeVisible();
    await selectScope(page, new RegExp(`${b} \\(1\\)`));
    await expect(page.getByText(SEED_TITLE).first()).toBeVisible();
  });

  test('폴더 이름 변경 → 폴더 바 갱신', async ({ page }) => {
    const before = uniq('이름전');
    const after = uniq('이름후');
    await page.getByRole('button', { name: '새 폴더' }).click();
    await page.getByPlaceholder('폴더 이름').fill(before);
    await page.getByRole('button', { name: '만들기' }).click();

    // 폴더 칩 선택 → 우측에 노출되는 이름 변경 액션 클릭
    await selectScope(page, new RegExp(before));
    await page.getByRole('button', { name: '폴더 이름 변경' }).click();
    await page.getByPlaceholder('폴더 이름').fill(after);
    await page.getByRole('button', { name: '저장' }).click();

    await expect(page.getByRole('button', { name: new RegExp(after) })).toBeVisible();
  });

  test('폴더 삭제 → 기록은 미분류로 복귀', async ({ page }) => {
    const name = uniq('삭제');
    await page.getByRole('button', { name: '새 폴더' }).click();
    await page.getByPlaceholder('폴더 이름').fill(name);
    await page.getByRole('button', { name: '만들기' }).click();

    // 기록을 이 폴더로 이동
    const firstRow = page.locator('[class*="group/row"]').first();
    await firstRow.getByRole('button', { name: '폴더로 이동' }).click();
    await moveInDialog(page, new RegExp(name));

    // 폴더 칩 선택 → 우측 삭제 액션(confirm 자동 수락)
    page.on('dialog', (d) => d.accept());
    await selectScope(page, new RegExp(`${name} \\(1\\)`));
    await page.getByRole('button', { name: '폴더 삭제' }).click();

    // 폴더 바에서 그 폴더가 사라진다
    await expect(page.getByRole('button', { name: new RegExp(name) })).toHaveCount(0);
  });
});
