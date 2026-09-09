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
 * 마지막 시나리오(페이지 이동)는 일부러 목록을 20건 너머로 밀어 올린다. 그래서 **파일 맨 끝에 둔다** —
 * 앞선 시나리오의 캡처가 오답 세트로만 가득한 화면으로 덮이지 않게 하기 위해서다.
 *
 * 재실행 안전성: 만들어진 오답 문제집은 같은 폴더에 미완료로 들어가지만(확정 제품 결정 5),
 * 수집 대상은 "완료 + 답안 있는 기록"뿐이라 몇 번을 돌려도 위 기대값이 그대로다.
 *
 * 다만 **시드 폴더의 목록은 실행할 때마다 길어진다.** 목록 페이지 크기가 20이고 이 화면에는
 * 페이지네이션 UI 가 없어서, 여러 번 돌리면 1페이지가 오답 세트로만 채워진다. 그래서
 * **목록 화면의 구성(행 수·무엇이 같은 페이지에 함께 보이는지)에 기대는 단언을 쓰지 않는다.**
 * FR-013 의 음성 사례는 시드 폴더가 아니라 항상 1건뿐인 함정 폴더에서 확인한다.
 */

const ACCESS_TOKEN = process.env.E2E_ACCESS_TOKEN ?? '';
/** 시드 폴더 이름(고정). hashid 가 필요하면 E2E_WRONG_FOLDER 로 넘길 수 있다 */
const SEED_FOLDER = process.env.E2E_WRONG_FOLDER ?? 'E2E-WRONG-ANSWER';
/**
 * 시드의 "폴더 밖" 함정 폴더(contract §7.8 표 5행). 자료 기반 기록 1건만 들어 있어
 * 목록이 아무리 쌓여도 항상 1페이지에 보인다 — FR-013 의 음성 사례로 쓴다.
 */
const OTHER_FOLDER = process.env.E2E_OTHER_FOLDER ?? 'E2E-OTHER-FOLDER';
/**
 * 시드 폴더의 자료 기반 원본 제목들. 목록이 기록 생성 시각 내림차순이라 이 넷은 **늘 맨 뒤**에 모여 있고,
 * 따라서 마지막 페이지에는 항상 이 중 하나 이상이 있다. 어느 것인지는 총 건수에 따라 달라지므로
 * 특정 제목 하나를 지목하지 않는다.
 */
const SEED_DOCUMENT_TITLE = /E2E .+ 원본 풀이/;

const COLLECT_URL = /\/problem-set\/wrong-answers$/;
/** 로컬 백엔드 주소(앱의 VITE_BASE_URL 과 같아야 한다). 기동 여부 선확인에만 쓴다 */
const API_BASE = process.env.E2E_API_BASE ?? 'http://localhost:8080';

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

  /**
   * 백엔드가 떠 있는지 먼저 본다. 서버가 죽은 채로 돌리면 앱이 조용히 폴백 렌더를 해서
   * "CTA 가 보인다" 같은 **엉뚱한 단언 실패**로 나타나 원인 파악에 시간이 든다.
   */
  test.beforeAll(async ({ request }) => {
    const reachable = await request
      .get(`${API_BASE}/local/token?userId=e2e-008-user`)
      .then((res) => res.ok())
      .catch(() => false);
    expect(reachable, `로컬 백엔드(${API_BASE})에 연결할 수 없다 — 서버 기동을 먼저 확인해라`).toBe(
      true,
    );
  });

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

    // (양성) 오답 문제집에는 배지가 붙는다
    await expect(badges.first()).toBeVisible();

    // contract §7.2·§7.7-4: takenAt 은 이제 "완료 시각"이라 아직 풀지 않은 오답 세트의 '완료일'은
    // 비어야 한다. 매핑이 created_at 으로 남아 있으면 풀지도 않은 날짜가 찍히므로 여기서 잡는다.
    // **미완료 행만** 본다 — 이전 실행에서 풀린 오답 세트는 완료일이 있는 게 정상이다.
    const unsolvedWrongRows = page
      .locator('div.md\\:grid')
      .filter({ has: page.getByText('오답 모음', { exact: true }) })
      .filter({ has: page.getByText('미완료', { exact: true }) });
    const unsolvedCount = await unsolvedWrongRows.count();
    expect(unsolvedCount).toBeGreaterThan(0); // 방금 만든 것들이 여기 잡힌다
    for (let i = 0; i < unsolvedCount; i++) {
      await expect(unsolvedWrongRows.nth(i).locator('div.text-center.text-xs').last()).toHaveText(
        '-',
      );
    }

    await shot(page, 'list-badge');

    // (음성) 자료 기반 문제집에는 붙지 않는다.
    // 시드 폴더가 아니라 함정 폴더에서 본다 — 자료 기반 1건뿐이라 목록이 아무리 쌓여도 1페이지에 보인다.
    await selectFolder(page, OTHER_FOLDER);
    await expect(page.locator('[class*="group/row"]').first()).toBeVisible();
    await expect(page.getByText('오답 모음', { exact: true })).toHaveCount(0);
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

  /**
   * 목록이 한 페이지(20건)를 넘으면 그 너머 기록에 닿을 수단이 있어야 한다.
   * 모아풀기는 1회에 최대 4건을 그 폴더에 더하므로 이 한계에 빨리 닿는다 — 그래서 이번 스코프에 들어왔다.
   * **목록을 일부러 20건 너머로 밀기 때문에 반드시 마지막에 둔다.**
   */
  test('목록이 20건을 넘으면 페이지를 넘겨 나머지 기록에 닿을 수 있다', async ({ page }) => {
    await gotoHistory(page);
    await selectFolder(page, SEED_FOLDER);

    // 한 페이지를 넘길 때까지 모아풀기를 반복한다(1회에 3건씩 늘어난다)
    const nextButton = page.getByRole('button', { name: '다음 페이지' });
    for (let i = 0; i < 8 && (await nextButton.count()) === 0; i++) {
      await collect(page);
      await page.keyboard.press('Escape');
    }
    await expect(nextButton).toBeVisible();

    // 1페이지 맨 위 행을 기억해 둔다. 페이지를 넘겨 내용이 실제로 바뀌는지 볼 기준이다.
    // (특정 기록이 1페이지에 있는지 없는지는 총 건수에 따라 달라지므로 단언하지 않는다)
    const firstRow = page.locator('div.md\\:grid').filter({ has: page.getByRole('button') });
    const page1Top = await firstRow.first().innerText();
    await shot(page, 'pagination-page1');

    // 마지막 페이지까지 넘긴다. "n / m" 표시기가 바뀌는 것을 기다려 한 페이지씩 확실히 넘어간다
    // (버튼은 목록을 다시 읽는 동안 비활성이라, 활성 여부로 루프를 돌리면 전환 중에 빠져나간다)
    const indicator = page.getByText(/^\d+ \/ \d+$/);
    const readPage = async (): Promise<[number, number]> => {
      const [cur, total] = (await indicator.innerText()).split('/').map((v) => Number(v.trim()));
      return [cur, total];
    };
    let [current, totalPages] = await readPage();
    expect(totalPages).toBeGreaterThan(1);
    while (current < totalPages) {
      await nextButton.click();
      await expect(indicator).toHaveText(`${current + 1} / ${totalPages}`);
      [current, totalPages] = await readPage();
    }

    // 내용이 실제로 바뀌었다 = 1페이지만으로는 닿을 수 없던 행에 닿았다
    expect(await firstRow.first().innerText()).not.toBe(page1Top);
    // 마지막 페이지에는 자료 기반 원본이 있다 — 페이지 이동이 없으면 닿을 수 없던 행이다
    await expect(page.getByText(SEED_DOCUMENT_TITLE).first()).toBeVisible();
    await shot(page, 'pagination-after');
  });
});
