import { test, expect, type Page } from '@playwright/test';

/**
 * 문제 본문 마크다운 렌더링 기능 e2e (로그인·로컬 백엔드·마크다운 시드 세트 필요).
 *
 * 스펙 005: 생성된 문제 본문의 표·인용·코드·수식 등 마크다운이 원시 문법으로 깨져
 * 보이지 않고 서식대로 렌더되는지를 "문제 본문이 노출되는 화면"에서 검증한다(FR-001~004, SC-001~003).
 *
 * 시드(@backend 제공): local,mock 프로파일로 생성하면 마크다운 대표 문항(GFM 표·blockquote·
 * 코드펜스·인라인 `$...$`/블록 `$$...$$` 수식)을 담은 세트가 결정론적으로 생성된다.
 * 그 세트의 encoded problemSetId를 E2E_MD_PSID로 넘긴다.
 *
 * 실행:
 *   # 1) 백엔드: SPRING_PROFILES_ACTIVE=local,mock ./gradlew :app:bootRun
 *   # 2) mock 생성 흐름으로 세트 생성 후 problemSetId 확보(@backend 레시피)
 *   E2E_ACCESS_TOKEN="$(curl -s 'http://localhost:8080/local/token?userId=e2e-markdown')" \
 *     E2E_MD_PSID="<encoded problemSetId>" \
 *     npm run e2e:feature -- markdown-rendering
 *
 * 검증 표면: 검토(결과) 화면은 전 문항을 기본 펼침으로 동시 렌더하므로(QuizScoreBoard),
 * 한 화면에서 표·인용·코드·수식이 모두 렌더되는지 확인할 수 있다. 해설 화면도 함께 확인한다.
 */

const ACCESS_TOKEN = process.env.E2E_ACCESS_TOKEN ?? '';
const PSID = process.env.E2E_MD_PSID ?? '';

/** 로그인 + 응시 답안(localStorage) 주입 — 결과/해설 화면이 세트를 로드해 렌더하게 만든다. */
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
          answers: {},
          inReview: {},
          totalTime: '00:01:00',
          title: 'E2E 마크다운 렌더링 세트',
          savedAt: Date.now(),
        }),
      );
    },
    { token: ACCESS_TOKEN, psid: PSID },
  );
}

/** PR 캡처용 스크린샷을 captures/에 저장 */
async function shot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `captures/markdown-${name}.png`, fullPage: true });
}

/** 마크다운 렌더 컨테이너 안에서 요소 개수 */
function md(page: Page, selector: string) {
  return page.locator(`.markdown-text ${selector}`);
}

/**
 * 원시 마크다운 문법이 사용자에게 노출되지 않았는지 검증(SC-001).
 * 표 구분선(`:---`, `|---`)은 렌더되면 사라지므로, 화면 텍스트에 남아 있으면 파싱 실패 신호다.
 */
async function expectNoRawTableSyntax(page: Page): Promise<void> {
  const bodyText = await page.locator('body').innerText();
  expect(bodyText, '표 구분선 원시 문법이 화면에 노출되면 안 됨').not.toContain(':---');
  expect(bodyText).not.toContain('|---');
}

test.describe('문제 본문 마크다운 렌더링', () => {
  test.describe.configure({ mode: 'serial' });
  test.skip(
    !ACCESS_TOKEN || !PSID,
    'E2E_ACCESS_TOKEN(로컬 /local/token)과 E2E_MD_PSID(마크다운 시드 세트)가 있을 때만 실행',
  );

  test.beforeEach(async ({ page }) => {
    await seed(page);
  });

  test('US1·US2·FR-004: 검토(결과) 화면에서 표·인용·코드·수식이 서식대로 렌더된다', async ({
    page,
  }) => {
    await page.goto(`/result/${PSID}`, { waitUntil: 'domcontentloaded' });

    // 문항 아코디언은 기본 펼침 → 전 본문이 동시 렌더된다.
    await expect(md(page, 'table').first()).toBeVisible();
    // 표 구조(행·열): 헤더 셀과 본문 셀이 실제 <th>/<td>로 존재
    expect(await md(page, 'table th').count()).toBeGreaterThan(0);
    expect(await md(page, 'table td').count()).toBeGreaterThan(0);
    // 인용
    await expect(md(page, 'blockquote').first()).toBeVisible();
    // 수식(KaTeX)
    await expect(md(page, '.katex').first()).toBeVisible();
    // 코드 블록
    await expect(md(page, 'pre code').first()).toBeVisible();
    // 원시 문법 미노출(SC-001)
    await expectNoRawTableSyntax(page);

    await shot(page, 'review');
  });

  test('FR-004·SC-003: 해설 화면에서도 동일 본문이 서식대로 렌더된다', async ({ page }) => {
    await page.goto(`/explanation/${PSID}`, { waitUntil: 'domcontentloaded' });

    // 해설 화면도 문제 본문(title)·해설을 마크다운으로 렌더한다.
    await expect(md(page, 'table, blockquote, .katex, pre code').first()).toBeVisible();
    await expectNoRawTableSyntax(page);

    await shot(page, 'explanation');
  });

  test('US1·SC-005: 풀이 화면에서 문제 본문이 원시 파이프 없이 렌더된다', async ({ page }) => {
    await page.goto(`/quiz/${PSID}`, { waitUntil: 'domcontentloaded' });

    // 풀이 화면은 문항을 한 개씩 보여준다 — 최소한 첫 문항 본문이 마크다운 컨테이너로 렌더되고
    // 원시 표 구분선이 노출되지 않아야 한다(깨진 표의 원시 파이프 노출 = 재현 버그).
    await expect(page.locator('.markdown-text').first()).toBeVisible();
    await expectNoRawTableSyntax(page);

    await shot(page, 'solve');
  });
});
