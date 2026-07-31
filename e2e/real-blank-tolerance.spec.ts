import { test, expect, type Page } from '@playwright/test';

/**
 * REAL_BLANK 관용 채점 기능 e2e (로그인·로컬 백엔드·시드 세트 필요).
 *
 * 스모크(smoke.spec.ts)와 분리한다: 실 백엔드의 `POST /grade`·`GET /history`가 동작하고
 * 유효한 액세스 토큰이 있어야 의미가 있으므로, 토큰이 없으면 SKIP 한다.
 *
 * 실행:
 *   E2E_ACCESS_TOKEN="$(curl -s 'http://localhost:8080/local/token?userId=e2e-realblank')" \
 *     npm run e2e:feature -- real-blank-tolerance
 *
 * 시드 세트(@backend 제공): problemSetId=d2M1pa8v, 3문항, 오답 선택지 없음(FR-008).
 *  1(단일)     정답 "미토콘드리아"  — 영↔한 "mitochondria"·표기차 인정 / "엽록체"·"미토콘트리아" 오답
 *  2(다중2빈칸) 정답 "감수분열, 체세포분열" — 동의어 인정 / 순서역전·빈칸부족 오답
 *  3(단일,폴백) 정답 "운동량" — 표기차 폴백(FR-009) / "운동에너지" 오답
 */

const ACCESS_TOKEN = process.env.E2E_ACCESS_TOKEN ?? '';
const PSID = 'd2M1pa8v';
/** 다중 빈칸 입력 직렬화 구분자 (U+001F) — SolveQuizDesign 저장 규칙과 동일 */
const US = '';

type Answers = Record<number, string>;

/** 관용 범위(동의어·영↔한) — 3문항 모두 정답이어야 함 */
const TOLERANT: Answers = { 1: 'mitochondria', 2: `meiosis${US}유사분열`, 3: '운동량' };
/** 표기 차이(공백)·기존 문항 폴백 — 정답이어야 함 (FR-001, FR-009) */
const NOTATION: Answers = { 1: ' 미토콘드리아 ', 2: `감수분열${US}체세포분열`, 3: ' 운동량 ' };
/** 인접 개념·순서 역전·무관 — 모두 오답이어야 함 (FR-005) */
const WRONG: Answers = { 1: '엽록체', 2: `체세포분열${US}감수분열`, 3: '운동에너지' };
/** 오탈자·빈칸 부족·빈 답 — 모두 오답이어야 함 (FR-003, Edge) */
const TYPO: Answers = { 1: '미토콘트리아', 2: '감수분열', 3: '' };

/** 로그인 + 응시 답안(localStorage)을 주입해, 결과·해설 화면이 서버 재채점하도록 만든다. */
async function seed(page: Page, answers: Answers): Promise<void> {
  await page.addInitScript(
    ({ token, psid, answers }) => {
      localStorage.setItem(
        'auth-storage',
        JSON.stringify({ state: { accessToken: token, user: null }, version: 0 }),
      );
      localStorage.setItem(
        `solveQuizResult:${psid}`,
        JSON.stringify({
          answers,
          inReview: {},
          totalTime: '00:01:00',
          title: 'E2E REAL_BLANK 관용 채점 세트',
          savedAt: Date.now(),
        }),
      );
    },
    { token: ACCESS_TOKEN, psid: PSID, answers },
  );
}

/** PR 캡처용 스크린샷을 captures/에 저장 */
async function shot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `captures/real-blank-${name}.png`, fullPage: true });
}

/** 결과 스코어보드 렌더 완료 대기 (REAL_BLANK는 서버 채점 도착 후에만 렌더된다) */
async function waitResult(page: Page): Promise<void> {
  await expect(page.getByRole('button', { name: '해설 보기' })).toBeVisible();
}

/** 히어로의 백분율 점수 텍스트 (예: "100점"/"0점") */
function scoreHero(page: Page) {
  return page.locator('.text-6xl').first();
}

test.describe('REAL_BLANK 관용 채점', () => {
  test.describe.configure({ mode: 'serial' });
  test.skip(!ACCESS_TOKEN, 'E2E_ACCESS_TOKEN(로컬 백엔드 /local/token)이 있을 때만 실행');

  test('US1·US3·US4: 관용 범위 답 → 3문항 정답, 결과·해설·기록 판정 일치', async ({ page }) => {
    await seed(page, TOLERANT);

    // 결과 화면: 서버 재채점(POST /grade) 후 3문항 모두 정답 → 100점
    await page.goto(`/result/${PSID}`, { waitUntil: 'domcontentloaded' });
    await waitResult(page);
    await expect(scoreHero(page)).toContainText('100');
    await shot(page, 'result-tolerant');

    // 해설 화면: 동일 판정 + 대표정답(answer) 노출
    await page.goto(`/explanation/${PSID}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('미토콘드리아').first()).toBeVisible();
    await shot(page, 'explanation-tolerant');

    // 기록 상세: 서버 판정(GET /history)로 동일하게 정답 표시 (US3 화면 일치)
    const historyId = await resolveHistoryId(page);
    expect(historyId, '결과 화면이 POST /history로 저장한 기록 id').not.toBeNull();
    await page.goto(`/history/${historyId}`, { waitUntil: 'domcontentloaded' });
    await expect(scoreHero(page)).toContainText('100');
    await shot(page, 'history-tolerant');
  });

  test('US1: 표기 차이·기존 문항 폴백(FR-001·FR-009) → 정답', async ({ page }) => {
    await seed(page, NOTATION);
    await page.goto(`/result/${PSID}`, { waitUntil: 'domcontentloaded' });
    await waitResult(page);
    await expect(scoreHero(page)).toContainText('100');
  });

  test('US2: 인접 개념·순서 역전·무관(FR-005) → 3문항 오답', async ({ page }) => {
    await seed(page, WRONG);
    await page.goto(`/result/${PSID}`, { waitUntil: 'domcontentloaded' });
    await waitResult(page);
    await expect(scoreHero(page)).toHaveText(/^0/);
    await shot(page, 'result-wrong');
  });

  test('US2: 오탈자·빈칸 부족·빈 답(FR-003·Edge) → 오답', async ({ page }) => {
    await seed(page, TYPO);
    await page.goto(`/result/${PSID}`, { waitUntil: 'domcontentloaded' });
    await waitResult(page);
    await expect(scoreHero(page)).toHaveText(/^0/);
  });

  test('US4·FR-008: REAL_BLANK 세트는 오답 선택지 없이 제공된다', async ({ page }) => {
    await seed(page, TOLERANT);
    const res = await page.request.get(`http://localhost:8080/problem-set/${PSID}`, {
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.quizType).toBe('REAL_BLANK');
    for (const q of body.quiz) {
      expect(q.selections).toEqual([]);
    }
  });
});

/** 로그인 사용자의 현재 세트 기록 id를 조회 (결과 화면이 POST /history로 저장한 뒤 존재) */
async function resolveHistoryId(page: Page): Promise<string | null> {
  try {
    const res = await page.request.get(`http://localhost:8080/history/check/${PSID}`, {
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
    });
    if (!res.ok()) return null;
    const body = await res.json();
    return body.exists ? (body.historyId as string) : null;
  } catch {
    return null;
  }
}
