import { test, expect, type Page } from '@playwright/test';

/**
 * 문제 본문 마크다운 렌더링 기능 e2e (로그인·로컬 백엔드 필요).
 *
 * 스펙 005: 생성된 문제 본문의 표·인용·코드·수식 등 마크다운이 원시 문법으로 깨져
 * 보이지 않고 서식대로 렌더되는지를 "문제 본문이 노출되는 화면"에서 검증한다(FR-001~004, SC-001~003).
 *
 * 시드 방식(자체 완결): 로컬 백엔드를 local,mock,mockai 프로파일로 띄우면, 이 스펙이 앱과 동일한
 * 생성 흐름(SSE 구독 → POST /generation)을 직접 태워 마크다운 대표 문항(GFM 표·blockquote·
 * 코드펜스·인라인 `$...$`/블록 `$$...$$` 수식)이 담긴 세트를 결정론적으로 생성하고(@backend
 * MockAIServerAdapter, Gemini 불필요), SSE가 돌려준 encoded problemSetId로 화면을 검증한다.
 * 블록 수식이 display 모드(.katex-display)로 렌더되려면 `$$` 구분자가 각각 독립된 줄에 있어야
 * 한다(한 줄 `$$...$$`는 인라인 처리) — 픽스처가 이 형태를 포함한다.
 *
 * 실행:
 *   # 백엔드: SPRING_PROFILES_ACTIVE=local,mock,mockai ./gradlew :app:bootRun
 *   #  (mockai 없으면 생성이 롤백 스텁이라 시드가 안 생긴다)
 *   E2E_ACCESS_TOKEN="$(curl -s 'http://localhost:8080/local/token?userId=<시드유저>')" \
 *     npm run e2e:feature -- markdown-rendering
 *   # 이미 생성해 둔 세트를 재사용하려면 E2E_MD_PSID=<encoded id> 를 함께 지정(생성 생략).
 *
 * 검증 표면: 검토(결과) 화면은 전 문항을 기본 펼침으로 동시 렌더하므로(QuizScoreBoard),
 * 한 화면에서 표·인용·코드·수식이 모두 렌더되는지 확인할 수 있다. 해설·풀이 화면도 함께 확인한다.
 */

const API_BASE = process.env.E2E_API_BASE ?? 'http://localhost:8080';
const ACCESS_TOKEN = process.env.E2E_ACCESS_TOKEN ?? '';
/** 지정 시 생성을 생략하고 이 세트로 검증(선택적 우회). 미지정이면 스펙이 직접 생성한다. */
const PSID_OVERRIDE = process.env.E2E_MD_PSID ?? '';

/** 생성으로 확보한 세트 id를 스펙 내에서 1회만 만들고 재사용 */
let sharedPsid = '';

/**
 * 앱과 동일한 흐름(SSE 'created'/'complete' + POST /generation)으로 마크다운 세트를 생성하고
 * encoded problemSetId를 반환한다. 브라우저 컨텍스트에서 실행해 네이티브 EventSource를 쓴다
 * (스트림은 sessionId 기반, POST가 JWT를 싣는다 — 앱 startGeneration과 동일).
 */
async function generateMarkdownSet(page: Page): Promise<string> {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  return await page.evaluate(
    ({ apiBase, token }) =>
      new Promise<string>((resolve, reject) => {
        const sessionId =
          typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
        const body = {
          sessionId,
          uploadedUrl: 'mock://seed',
          title: 'MD E2E',
          quizCount: 5,
          quizType: 'MULTIPLE',
          pageNumbers: [1],
          language: 'KO',
          customInstruction: '',
        };
        const es = new EventSource(`${apiBase}/generation/${sessionId}/stream`, {
          withCredentials: true,
        });
        let psid = '';
        const done = (fn: () => void) => {
          es.close();
          fn();
        };
        const timer = setTimeout(() => done(() => reject(new Error('SSE 타임아웃(30s)'))), 30_000);
        es.addEventListener('created', (ev) => {
          try {
            const d = JSON.parse((ev as MessageEvent).data as string);
            if (d.problemSetId) psid = d.problemSetId;
          } catch {
            /* 중간 이벤트 파싱 실패는 무시 */
          }
        });
        es.addEventListener('complete', () => {
          clearTimeout(timer);
          done(() => (psid ? resolve(psid) : reject(new Error('problemSetId 미수신'))));
        });
        es.addEventListener('error-finish', (ev) => {
          clearTimeout(timer);
          done(() => reject(new Error(`생성 에러: ${(ev as MessageEvent).data}`)));
        });
        es.onopen = () => {
          fetch(`${apiBase}/generation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(body),
          }).catch((e) => done(() => reject(e)));
        };
      }),
    { apiBase: API_BASE, token: ACCESS_TOKEN },
  );
}

/** 세트 id 확보(1회) — 우회 지정이 있으면 그것을, 없으면 생성. */
async function resolvePsid(page: Page): Promise<string> {
  if (PSID_OVERRIDE) return PSID_OVERRIDE;
  if (!sharedPsid) sharedPsid = await generateMarkdownSet(page);
  return sharedPsid;
}

/** 로그인 + 응시 답안(localStorage) 주입 — 결과/해설 화면이 세트를 로드해 렌더하게 만든다. */
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
          answers: {},
          inReview: {},
          totalTime: '00:01:00',
          title: 'E2E 마크다운 렌더링 세트',
          savedAt: Date.now(),
        }),
      );
    },
    { token: ACCESS_TOKEN, id: psid },
  );
}

/** PR 캡처용 스크린샷을 captures/에 저장 */
async function shot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `captures/markdown-${name}.png`, fullPage: true });
}

/** 마크다운 렌더 컨테이너 안에서 요소 조회 */
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
    !ACCESS_TOKEN,
    'E2E_ACCESS_TOKEN(로컬 /local/token)이 있을 때만 실행. 백엔드는 local,mock,mockai 프로파일 필요.',
  );

  test('US1·US2·FR-004: 검토(결과) 화면에서 표·인용·코드·수식이 서식대로 렌더된다', async ({
    page,
  }) => {
    const psid = await resolvePsid(page);
    await seed(page, psid);
    await page.goto(`/result/${psid}`, { waitUntil: 'domcontentloaded' });

    // 문항 아코디언은 기본 펼침 → 전 본문이 동시 렌더된다.
    await expect(md(page, 'table').first()).toBeVisible();
    // 표 구조(행·열): 헤더 셀과 본문 셀이 실제 <th>/<td>로 존재
    expect(await md(page, 'table th').count()).toBeGreaterThan(0);
    expect(await md(page, 'table td').count()).toBeGreaterThan(0);
    // 인용
    await expect(md(page, 'blockquote').first()).toBeVisible();
    // 수식(KaTeX) — 인라인 `$...$`
    await expect(md(page, '.katex').first()).toBeVisible();
    // 수식(KaTeX) — 블록 `$$...$$`은 display 모드로 렌더
    await expect(md(page, '.katex-display').first()).toBeVisible();
    // 코드 블록
    await expect(md(page, 'pre code').first()).toBeVisible();
    // 원시 문법 미노출(SC-001)
    await expectNoRawTableSyntax(page);

    await shot(page, 'review');
  });

  test('FR-004·SC-003: 해설 화면에서도 동일 본문이 서식대로 렌더된다', async ({ page }) => {
    const psid = await resolvePsid(page);
    await seed(page, psid);
    await page.goto(`/explanation/${psid}`, { waitUntil: 'domcontentloaded' });

    // 해설 화면도 문제 본문(title)·해설을 마크다운으로 렌더한다.
    await expect(md(page, 'table, blockquote, .katex, pre code').first()).toBeVisible();
    await expectNoRawTableSyntax(page);

    await shot(page, 'explanation');
  });

  test('US1·SC-005: 풀이 화면에서 문제 본문이 원시 파이프 없이 렌더된다', async ({ page }) => {
    const psid = await resolvePsid(page);
    await seed(page, psid);
    await page.goto(`/quiz/${psid}`, { waitUntil: 'domcontentloaded' });

    // 풀이 화면은 문항을 한 개씩 보여준다 — 최소한 첫 문항 본문이 마크다운 컨테이너로 렌더되고
    // 원시 표 구분선이 노출되지 않아야 한다(깨진 표의 원시 파이프 노출 = 재현 버그).
    await expect(page.locator('.markdown-text').first()).toBeVisible();
    await expectNoRawTableSyntax(page);

    await shot(page, 'solve');
  });
});
