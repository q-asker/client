import { test, expect, type Page, type Response } from '@playwright/test';

/**
 * 008 오답 모아풀기 — 틀린 문제로 새 문제집 만들기 기능 E2E (로그인·로컬 백엔드·시드 필요).
 *
 * 스모크(smoke.spec.ts)와 분리한다: 실 백엔드의 `POST /problem-set/wrong-answers` 와
 * 시드 폴더가 있어야 의미가 있으므로, 토큰이 없으면 SKIP 한다.
 *
 * 실행:
 *   E2E_ACCESS_TOKEN="$(curl -s 'http://localhost:8080/local/token?userId=e2e-008-user')" \
 *     bash <루트>/scripts/run-feature-e2e.sh wrong-answer-set
 *
 * 시드(@backend 가 SQL 로 심는다 — contract.md §7.8):
 *   폴더 `E2E-WRONG-ANSWER` 안: MULTIPLE(5문항/3오답) · OX(5/2) · REAL_BLANK(3/2) · ESSAY(3)
 *   폴더 밖 MULTIPLE(5/4오답) · 타인 소유 MULTIPLE(5/4오답)  ← 범위 오염 함정
 * 기대: createdSets 3개 = 객관식 3문제 / OX 2문제 / 빈칸 직접입력 2문제, 서술형 3문항 제외.
 *   **함정이 새면 객관식이 3이 아니라 7이 된다 — SC-003 이 숫자 하나로 관측된다.**
 *
 * 재실행 안전성: 만들어진 오답 문제집은 같은 폴더에 미완료로 들어가지만(확정 제품 결정 5),
 * 수집 대상은 "완료 + 답안 있는 기록"뿐이라 몇 번을 돌려도 위 기대값이 그대로다.
 * 다만 폴더 카운트와 목록 길이는 실행할 때마다 늘어나므로 그 둘은 단언하지 않는다.
 */

const ACCESS_TOKEN = process.env.E2E_ACCESS_TOKEN ?? '';
/** 시드 폴더 이름(고정). hashid 가 필요하면 E2E_WRONG_FOLDER_ID 로 넘길 수 있다 */
const SEED_FOLDER = process.env.E2E_WRONG_FOLDER ?? 'E2E-WRONG-ANSWER';

const COLLECT_URL = /\/problem-set\/wrong-answers$/;

let seq = 0;
const runId = process.env.E2E_RUN_ID ?? String(Date.now());
const uniq = (prefix: string): string => `${prefix}-${runId}-${seq++}`;

interface CreatedSet {
  problemSetId: string;
  quizType: string;
  questionCount: number;
  truncated: boolean;
}
interface CollectResponse {
  createdSets: CreatedSet[];
  excludedEssayCount: number;
  failedTypes: string[];
  emptyReason: string | null;
}

/** 로그인 상태를 zustand persist(localStorage 'auth-storage')에 주입 */
async function seedAuth(page: Page): Promise<void> {
  await page.addInitScript((token) => {
    localStorage.setItem(
      'auth-storage',
      JSON.stringify({ state: { accessToken: token, user: null }, version: 0 }),
    );
  }, ACCESS_TOKEN);
}

/** PR 캡처용 스크린샷 */
async function shot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `captures/wrong-answer-${name}.png`, fullPage: true });
}

async function gotoHistory(page: Page): Promise<void> {
  await page.goto('/history', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: /전체 \(/ })).toBeVisible();
}

/** 폴더 바에서 이름으로 폴더를 고른다(개수는 실행마다 늘어나므로 이름만 본다) */
async function selectFolder(page: Page, name: string): Promise<void> {
  await page.getByRole('button', { name: new RegExp(`${name} \\(`) }).click();
}

const collectButton = (page: Page) => page.getByRole('button', { name: '틀린 문제 모아풀기' });

/** 모아풀기를 실행하고 서버 응답을 돌려준다 */
async function collect(page: Page): Promise<CollectResponse> {
  const waitResponse = page.waitForResponse(
    (res: Response) =>
      COLLECT_URL.test(new URL(res.url()).pathname) && res.request().method() === 'POST',
  );
  await collectButton(page).click();
  const response = await waitResponse;
  expect(response.status()).toBe(200);
  return (await response.json()) as CollectResponse;
}

test.describe('008 오답 모아풀기', () => {
  // 시드 폴더를 공유하므로 직렬 실행
  test.describe.configure({ mode: 'serial' });
  test.skip(!ACCESS_TOKEN, 'E2E_ACCESS_TOKEN 이 있을 때만 실행');

  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
  });

  test('FR-015·SC-003·SC-004a: 유형별로 나뉘어 만들어지고 폴더 밖·타인 오답은 섞이지 않는다', async ({
    page,
  }) => {
    await gotoHistory(page);
    await selectFolder(page, SEED_FOLDER);
    await shot(page, 'entry-folder-selected');

    const result = await collect(page);

    // 유형이 섞인 문제집이 0건이고, 제외 유형(서술형)의 문제집도 0건이다 (SC-004a)
    expect(result.createdSets).toHaveLength(3);
    expect(result.createdSets.map((s) => s.quizType).sort()).toEqual([
      'MULTIPLE',
      'OX',
      'REAL_BLANK',
    ]);

    // 폴더 밖(4오답)·타인(4오답) 기록이 새면 MULTIPLE 이 3이 아니라 7이 된다 (SC-003)
    const byType = Object.fromEntries(result.createdSets.map((s) => [s.quizType, s.questionCount]));
    expect(byType.MULTIPLE).toBe(3);
    expect(byType.OX).toBe(2);
    expect(byType.REAL_BLANK).toBe(2);
    expect(result.emptyReason).toBeNull();
    expect(result.failedTypes).toEqual([]);

    // 2개 이상이므로 선택 다이얼로그가 뜬다 (FR-007)
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('오답 문제집이 만들어졌어요')).toBeVisible();
    await expect(dialog.getByRole('button', { name: /객관식/ })).toBeVisible();
    await expect(dialog.getByRole('button', { name: /OX 퀴즈/ })).toBeVisible();
    // 빈칸 두 유형을 구별해 표기한다 (확정 제품 결정 6)
    await expect(dialog.getByRole('button', { name: /빈칸 직접입력/ })).toBeVisible();
    await shot(page, 'result-choice');
  });

  test('FR-016·FR-016a: 서술형은 수집되지 않고 제외 사실을 함께 알린다', async ({ page }) => {
    await gotoHistory(page);
    await selectFolder(page, SEED_FOLDER);
    const result = await collect(page);

    expect(result.createdSets.some((s) => s.quizType === 'ESSAY')).toBe(false);
    expect(result.excludedEssayCount).toBe(3);

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('서술형 3문제는 아직 모아풀기 대상이 아니에요.')).toBeVisible();
    await expect(dialog.getByRole('button', { name: /서술형/ })).toHaveCount(0);
  });

  test('FR-007·FR-004: 고른 오답 문제집의 풀이가 곧바로 시작된다', async ({ page }) => {
    await gotoHistory(page);
    await selectFolder(page, SEED_FOLDER);
    const result = await collect(page);
    const target = result.createdSets.find((s) => s.quizType === 'MULTIPLE');
    expect(target).toBeTruthy();

    await page
      .getByRole('dialog')
      .getByRole('button', { name: /객관식/ })
      .click();
    await expect(page).toHaveURL(new RegExp(`/quiz/${target!.problemSetId}$`));
    // 로딩이 아니라 실제 풀이 화면이 떴는지 — 풀이 UI의 고정 요소로 확인한다
    await expect(page.getByRole('button', { name: '제출하기' })).toBeVisible();
    await expect(page.getByRole('button', { name: '다음' })).toBeVisible();
    await shot(page, 'solve-first-screen');
  });

  test('FR-013: 목록에서 오답 문제집이 자료 기반 문제집과 구별된다', async ({ page }) => {
    await gotoHistory(page);
    await selectFolder(page, SEED_FOLDER);
    await collect(page);
    // 다이얼로그를 닫고 목록을 확인한다
    await page.keyboard.press('Escape');

    // '오답 모음' 은 백엔드가 만든 제목에도 들어 있으므로 exact 로 배지만 집는다
    const badges = page.getByText('오답 모음', { exact: true });
    await expect(badges.first()).toBeVisible();

    // 구별이 성립하려면 배지가 붙지 않은 자료 기반 행도 함께 있어야 한다 (FR-013)
    const rowCount = await page.locator('[class*="group/row"]').count();
    expect(await badges.count()).toBeGreaterThan(0);
    expect(await badges.count()).toBeLessThan(rowCount);
    await shot(page, 'list-badge');
  });

  test('FR-014: 오답 문제집에는 "이 조건으로 더 풀기"가 노출되지 않는다', async ({ page }) => {
    await gotoHistory(page);
    await selectFolder(page, SEED_FOLDER);
    const result = await collect(page);
    const psid = result.createdSets[0].problemSetId;

    // 결과·해설 화면이 정상 렌더되도록 응시 답안을 심는다(다른 기능 E2E와 동일 방식)
    await page.addInitScript((id) => {
      localStorage.setItem(
        `solveQuizResult:${id}`,
        JSON.stringify({
          answers: { 1: '1' },
          inReview: {},
          totalTime: '00:01:00',
          title: 'E2E 오답 문제집',
          savedAt: Date.now(),
        }),
      );
    }, psid);

    await page.goto(`/result/${psid}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: '해설 보기' })).toBeVisible();
    await expect(page.getByRole('button', { name: '이 조건으로 더 풀기' })).toHaveCount(0);

    await page.goto(`/explanation/${psid}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: '이 조건으로 더 풀기' })).toHaveCount(0);
    // 원본 자료가 없으므로 "참조 자료" 패널(및 만료 문구)도 뜨지 않는다
    await expect(page.getByText('파일 링크가 만료되었습니다.')).toHaveCount(0);
  });

  test('FR-017: 폴더를 고르지 않으면 시도 전에 실행할 수 없음이 드러난다', async ({ page }) => {
    await gotoHistory(page);

    // 기본 진입은 '전체' — 눌러보기 전에 비활성 + 사유가 보인다
    await expect(collectButton(page)).toBeDisabled();
    await expect(page.getByText('폴더를 선택하면 그 폴더의 오답을 모을 수 있어요')).toBeVisible();
    await shot(page, 'guard-no-folder');

    // 미분류에서도 마찬가지
    await page.getByRole('button', { name: /미분류 \(/ }).click();
    await expect(collectButton(page)).toBeDisabled();

    // 폴더를 고르면 활성화된다
    await selectFolder(page, SEED_FOLDER);
    await expect(collectButton(page)).toBeEnabled();
  });

  test('FR-011: 모을 오답이 없으면 문제집을 만들지 않고 사유를 알린다', async ({ page }) => {
    await gotoHistory(page);

    // 기록이 하나도 없는 빈 폴더를 만들어 실행한다
    const name = uniq('빈폴더');
    await page.getByRole('button', { name: '새 폴더' }).click();
    await page.getByPlaceholder('폴더 이름').fill(name);
    await page.getByRole('button', { name: '만들기' }).click();
    await selectFolder(page, name);

    const result = await collect(page);
    expect(result.createdSets).toHaveLength(0);
    expect(result.emptyReason).toBe('NO_HISTORY');

    await expect(page.getByText('모을 오답이 없어요.')).toBeVisible();
    // 어떤 문제집도 만들어지지 않았으므로 선택 다이얼로그는 뜨지 않는다
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await shot(page, 'empty-result');
  });

  /**
   * FR-012 상한 안내 — **렌더 전용 검사**다.
   * 상한 100·"가장 최근에 틀린 순"·중복제거 로직의 증명 책임은 전적으로 @backend 테스트에 있다
   * (사용자 결정: 기능 E2E 에 101문항 시드를 만들지 않는다 — contract.md §7.0-7).
   * 여기서는 서버가 `truncated: true` 를 보냈을 때 화면이 그 사실을 알리는지만 확인한다.
   */
  test('FR-012: 상한에 걸린 유형에만 일부만 담겼다는 안내가 붙는다 (렌더 전용)', async ({
    page,
  }) => {
    await page.route(COLLECT_URL, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          createdSets: [
            {
              problemSetId: 'stubMult',
              historyId: 'stubHistA',
              quizType: 'MULTIPLE',
              title: '오답 모음 · 객관식',
              questionCount: 100,
              truncated: true,
            },
            {
              problemSetId: 'stubOx',
              historyId: 'stubHistB',
              quizType: 'OX',
              title: '오답 모음 · OX 퀴즈',
              questionCount: 2,
              truncated: false,
            },
          ],
          excludedEssayCount: 0,
          deletedSourceCount: 0,
          failedTypes: [],
          emptyReason: null,
        }),
      });
    });

    await gotoHistory(page);
    await selectFolder(page, SEED_FOLDER);
    await collectButton(page).click();

    const dialog = page.getByRole('dialog');
    const truncatedRow = dialog.getByRole('button', { name: /객관식/ });
    const intactRow = dialog.getByRole('button', { name: /OX 퀴즈/ });

    // 걸린 유형에만 붙고, 걸리지 않은 유형에는 붙지 않는다 (FR-012)
    await expect(truncatedRow.getByText('최근 100문제만 담겼어요')).toBeVisible();
    await expect(intactRow.getByText('최근 100문제만 담겼어요')).toHaveCount(0);
    await shot(page, 'truncated-notice');
  });
});
