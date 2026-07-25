import { test, expect, type Page } from '@playwright/test';

/**
 * 주관식 빈칸(REAL_BLANK) 채점 관용도 기능 E2E (feedback #20).
 *
 * 채점은 100% 클라이언트에서 수행되므로 백엔드 없이 검증한다 —
 * `page.route`로 `/problem-set/:id`(정답 selections + acceptedAnswers)와 `/explanation/:id`를
 * 목킹하고, 사용자의 관용 입력을 localStorage(`solveQuizResult:<id>`)에 주입한다.
 * 결과 화면과 해설 화면이 **같은 판정**(FR-005)으로 관용 정답을 인정하는지 확인한다.
 *
 * 스모크(smoke.spec.ts)와 분리 — 기본 SKIP, `E2E_BLANK_TOLERANCE=1` 일 때만 실행.
 *   실행: E2E_BLANK_TOLERANCE=1 npx playwright test blank-tolerance
 *
 * 시나리오(4문항 중 관용으로 3 정답, 함정 1 오답):
 *  1) 정답 '서울'   + 인정답 [Seoul, 서울특별시]  → 입력 'Seoul'      = 정답(한↔영)
 *  2) 정답 'Event Loop' + 인정답 [이벤트 루프]     → 입력 '이벤트 루프' = 정답(한↔영)
 *  3) 정답 'SYN, SYN+ACK'(다중) + 인정답 [[],[SYNACK]] → 입력 ['SYN','SYNACK'] = 정답(심볼탈락)
 *  4) 정답 'C++'   (인정답 없음)                   → 입력 'C'          = 오답(심볼 구분, SC-002)
 *  관용이 없으면 완전 일치가 하나도 없어 0/4 = 0% → 관용 적용 시 3/4 = 75%.
 */

const ENABLED = process.env.E2E_BLANK_TOLERANCE === '1';
const PROBLEM_SET_ID = 'e2e-blank';
const SEP = String.fromCharCode(0x1f); // REAL_BLANK 다중 빈칸 직렬화 구분자(U+001F)

const QUIZ = [
  {
    number: 1,
    title: '대한민국의 수도는 _______이다.',
    type: 'REAL_BLANK',
    selections: [{ id: '1', content: '서울', correct: true }],
    acceptedAnswers: [['Seoul', '서울특별시']],
  },
  {
    number: 2,
    title: 'JavaScript의 단일 스레드 이벤트 모델을 처리하는 메커니즘은 _______이다.',
    type: 'REAL_BLANK',
    selections: [{ id: '1', content: 'Event Loop', correct: true }],
    acceptedAnswers: [['이벤트 루프']],
  },
  {
    number: 3,
    title: 'TCP 3-Way Handshake는 _______ → _______ → ACK 순서로 진행된다.',
    type: 'REAL_BLANK',
    selections: [{ id: '1', content: 'SYN, SYN+ACK', correct: true }],
    acceptedAnswers: [[], ['SYNACK']],
  },
  {
    number: 4,
    title: '.NET 진영의 대표적인 객체지향 언어는 _______이다.',
    type: 'REAL_BLANK',
    selections: [{ id: '1', content: 'C++', correct: true }],
    acceptedAnswers: null,
  },
];

/** 사용자의 관용 입력 (3번은 다중 빈칸 직렬화) */
const USER_ANSWERS: Record<number, string> = {
  1: 'Seoul',
  2: '이벤트 루프',
  3: ['SYN', 'SYNACK'].join(SEP),
  4: 'C',
};

async function primeApp(page: Page): Promise<void> {
  // 로그인 상태 + 채점 결과(사용자 답) 주입
  await page.addInitScript(
    ([id, answers]) => {
      localStorage.setItem(
        'auth-storage',
        JSON.stringify({ state: { accessToken: 'e2e-token', user: null }, version: 0 }),
      );
      localStorage.setItem(
        `solveQuizResult:${id}`,
        JSON.stringify({
          answers,
          inReview: {},
          totalTime: '00:01:00',
          title: '관용 채점 E2E',
          savedAt: Date.now(),
        }),
      );
    },
    [PROBLEM_SET_ID, USER_ANSWERS] as const,
  );

  // 백엔드 응답 목킹 (채점은 클라이언트라 정답 데이터만 주면 됨).
  // ⚠️ 글롭이 SPA 라우트 네비게이션(document)까지 잡으면 JSON이 문서로 뜬다 — API XHR/fetch만 목킹.
  const jsonOnlyForXhr =
    (body: string) =>
    (route: import('@playwright/test').Route): unknown => {
      if (route.request().resourceType() === 'document') return route.fallback();
      return route.fulfill({ status: 200, contentType: 'application/json', body });
    };

  await page.route(
    `**/problem-set/${PROBLEM_SET_ID}`,
    jsonOnlyForXhr(
      JSON.stringify({
        generationStatus: 'COMPLETED',
        quizType: 'REAL_BLANK',
        quiz: QUIZ,
        totalCount: QUIZ.length,
        sessionId: 's',
        title: '관용 채점 E2E',
      }),
    ),
  );
  await page.route(
    `**/explanation/${PROBLEM_SET_ID}`,
    jsonOnlyForXhr(
      JSON.stringify({
        results: QUIZ.map((q) => ({ number: q.number, explanation: '해설(E2E)' })),
      }),
    ),
  );
  // 결과 화면이 mount 시 기록 저장(POST /history)을 시도 — 흡수
  await page.route('**/history**', jsonOnlyForXhr('{}'));
}

test.describe('REAL_BLANK 채점 관용도', () => {
  test.skip(!ENABLED, 'E2E_BLANK_TOLERANCE=1 일 때만 실행');

  test('결과·해설 두 화면이 관용 정답을 동일하게 인정한다 (FR-005)', async ({ page }) => {
    await primeApp(page);

    // ── 결과 화면: 관용으로 3/4 정답 → 75% ──
    await page.goto(`/result/${PROBLEM_SET_ID}`, { waitUntil: 'networkidle' });
    await expect(page.getByText('75', { exact: false })).toBeVisible();
    // 사용자의 관용 입력이 화면에 노출된다
    await expect(page.getByText('Seoul', { exact: false }).first()).toBeVisible();
    await page.screenshot({ path: 'captures/blank-tolerance-result.png', fullPage: true });

    // ── 해설 화면: 같은 판정(3/4 정답) → FR-005 일관성 ──
    await page.goto(`/explanation/${PROBLEM_SET_ID}`, { waitUntil: 'networkidle' });
    await expect(page.getByText('3/4', { exact: false })).toBeVisible();
    await page.screenshot({ path: 'captures/blank-tolerance-explanation.png', fullPage: true });
  });
});
