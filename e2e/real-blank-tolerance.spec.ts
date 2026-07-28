import { test, expect, type Page } from '@playwright/test';

/**
 * REAL_BLANK 관용 채점 기능 e2e (로그인·백엔드·시드 세트 필요).
 *
 * 스모크(smoke.spec.ts)와 분리한다: 실 백엔드의 `POST /grade`·`GET /history`가 동작하고
 * 유효한 액세스 토큰과 시드된 REAL_BLANK 세트가 있어야 의미가 있으므로, 기본 SKIP 하고
 * `E2E_REAL_BLANK=1` 일 때만 실행한다.
 *
 * 전제 (마무리 [4]에서 @backend가 제공):
 *  - E2E_ACCESS_TOKEN     : 로그인 사용자 JWT (`/local/token`)
 *  - E2E_REAL_BLANK_PSID  : 시드된 REAL_BLANK 세트의 problemSetId
 *  - 시드 문항의 모범답안과 인정 범위(동의어·표기 차이) → 아래 CASES에 실제 값 주입
 *
 * 실행 예:
 *   E2E_REAL_BLANK=1 E2E_ACCESS_TOKEN=<jwt> E2E_REAL_BLANK_PSID=<id> \
 *     npm run e2e:feature -- real-blank-tolerance
 */

const ENABLED = process.env.E2E_REAL_BLANK === '1';
const ACCESS_TOKEN = process.env.E2E_ACCESS_TOKEN ?? '';
const PSID = process.env.E2E_REAL_BLANK_PSID ?? '';

/**
 * [4] TODO: 시드 REAL_BLANK 세트의 실제 문항으로 채운다.
 * - inputs: 빈칸별 입력(다중 빈칸은 배열 길이 = 빈칸 수)
 * - expectCorrect: 서버 관용 채점의 기대 판정
 * 예) 모범답안 "서울"에 대해 영↔한 표기 "Seoul" → 정답 / 오탈자 "서울시청" → 오답
 */
interface Case {
  number: number;
  inputs: string[];
  expectCorrect: boolean;
  label: string;
}
const TOLERANT_CASES: Case[] = [
  // { number: 1, inputs: ['<동의어/표기차이 입력>'], expectCorrect: true, label: '동의어-정답' },
];
const WRONG_CASES: Case[] = [
  // { number: 2, inputs: ['<오탈자/인접개념 입력>'], expectCorrect: false, label: '오탈자-오답' },
];

/** 로그인 상태를 zustand persist(localStorage 'auth-storage')에 주입 */
async function seedAuth(page: Page): Promise<void> {
  await page.addInitScript((token) => {
    localStorage.setItem(
      'auth-storage',
      JSON.stringify({ state: { accessToken: token, user: null }, version: 0 }),
    );
  }, ACCESS_TOKEN);
}

/** 현재 문제의 빈칸들에 입력한다(단일/다중 공통, input#blank-input-i). */
async function fillBlanks(page: Page, inputs: string[]): Promise<void> {
  for (let i = 0; i < inputs.length; i++) {
    await page.locator(`#blank-input-${i}`).fill(inputs[i]);
  }
}

/** PR 캡처용 스크린샷을 captures/에 저장한다(디렉터리는 자동 생성). */
async function shot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `captures/real-blank-${name}.png`, fullPage: true });
}

test.describe('REAL_BLANK 관용 채점', () => {
  test.describe.configure({ mode: 'serial' });
  test.skip(!ENABLED, 'E2E_REAL_BLANK=1 및 백엔드/토큰/시드 세트가 있을 때만 실행');

  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
  });

  test('관용 범위 답 → 정답 처리 · 결과/해설/기록 판정 일치', async ({ page }) => {
    // 1) 풀이: 각 문항에 관용 범위(동의어·표기차이) 답 입력 후 제출
    await page.goto(`/quiz/${PSID}`, { waitUntil: 'domcontentloaded' });
    for (const c of TOLERANT_CASES) {
      await fillBlanks(page, c.inputs);
      // [4] TODO: 다음 문제 이동. 마지막 문항 후 '제출하기' 클릭
    }
    // await page.getByRole('button', { name: '제출하기' }).click();

    // 2) 결과 화면: 관용 정답이 '정답' 처리되는지 + 캡처
    await page.goto(`/result/${PSID}`, { waitUntil: 'domcontentloaded' });
    // [4] TODO: TOLERANT_CASES마다 해당 문항 뱃지가 '정답'인지 단언
    await shot(page, 'result-tolerant');

    // 3) 해설 화면: 동일 판정 + 대표정답(answer) 표시 + 캡처
    await page.goto(`/explanation/${PSID}`, { waitUntil: 'domcontentloaded' });
    // [4] TODO: 결과와 판정 일치, 정답 텍스트(answer) 노출 단언
    await shot(page, 'explanation-tolerant');

    // placeholder 단언 — [4]에서 실제 판정 단언으로 대체
    expect(PSID, '시드 세트 problemSetId(E2E_REAL_BLANK_PSID) 필요').not.toBe('');
  });

  test('오탈자·인접 개념 → 오답 처리', async ({ page }) => {
    await page.goto(`/quiz/${PSID}`, { waitUntil: 'domcontentloaded' });
    for (const c of WRONG_CASES) {
      await fillBlanks(page, c.inputs);
      // [4] TODO: 다음 문제 이동 + 제출
    }
    // 결과 화면에서 '오답' 처리 확인 + 캡처
    await page.goto(`/result/${PSID}`, { waitUntil: 'domcontentloaded' });
    // [4] TODO: WRONG_CASES마다 해당 문항 뱃지가 '오답'인지 단언
    await shot(page, 'result-wrong');
    expect(PSID).not.toBe('');
  });
});
