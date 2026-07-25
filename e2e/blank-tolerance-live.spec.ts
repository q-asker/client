import { test, expect, type Page, type APIRequestContext } from '@playwright/test';

/**
 * 주관식 빈칸 채점 관용도 — 실서버 통합 E2E (feedback #20).
 *
 * 목킹 없이 로컬 백엔드(`.env.dev`의 VITE_BASE_URL=http://localhost:8080)를 직접 때려,
 * **서버가 실제로 `acceptedAnswers`를 payload에 싣는지 + FE 채점(관용 인정 + 함정 거부)**을 통합 검증한다.
 * 입력→기대 표는 `specs/003-blank-grading-tolerance/seed-manifest.md`.
 *
 * 세트 A(990001, 인정답 있음): 동의어 `event loop`/`meiosis`+`mitosis` 인정, 함정 `C`(정답 C++/C#)는 거부
 *   → 4문항 중 2 정답(50%). 인정 인정(SC-001) + 심볼 보존 거부(SC-002)를 한 번에.
 * 세트 B(990002, 인정답 없음·FR-006): 같은 `event loop` 입력이 목록이 없어 오답 → 0/1.
 *   A-1 정답 vs B-1 오답 대비가 인정 목록 역할 + FR-006 폴백을 동시 증명.
 *
 * 기본 SKIP. 필요 env:
 *   E2E_ACCESS_TOKEN   : GET /local/token?userId=e2e-blank-user 로 발급한 JWT
 *   E2E_BLANK_SET_A    : 세트 A hashid (인정답 있음)
 *   E2E_BLANK_SET_B    : (선택) 세트 B hashid (FR-006 기존 세트)
 *
 * 실행:
 *   E2E_ACCESS_TOKEN="$(curl -s 'http://localhost:8080/local/token?userId=e2e-blank-user')" \
 *   E2E_BLANK_TOLERANCE_LIVE=1 E2E_BLANK_SET_A=<hashidA> E2E_BLANK_SET_B=<hashidB> npm run e2e:feature
 */

const ENABLED = process.env.E2E_BLANK_TOLERANCE_LIVE === '1';
const TOKEN = process.env.E2E_ACCESS_TOKEN ?? '';
const SET_A = process.env.E2E_BLANK_SET_A ?? '';
const SET_B = process.env.E2E_BLANK_SET_B ?? '';
const API_BASE = process.env.E2E_API_BASE ?? 'http://localhost:8080';
const SEP = String.fromCharCode(0x1f);

interface Selection {
  id: string;
  content: string;
  correct?: boolean;
}
interface QuizItem {
  number: number;
  type?: string;
  selections: Selection[];
  acceptedAnswers?: string[][] | null;
}

/** §7.3 정규화(테스트 측 판정용 — 문항 매칭에만 사용) */
const norm = (s: string): string =>
  s
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\s+/gu, '')
    .replace(/\p{P}/gu, (ch) => (ch === '#' ? ch : ''));

const correctContent = (q: QuizItem): string =>
  q.selections.find((s) => s.correct === true)?.content ?? '';

async function fetchQuiz(request: APIRequestContext, id: string): Promise<QuizItem[]> {
  const res = await request.get(`${API_BASE}/problem-set/${id}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  expect(res.ok(), `GET /problem-set/${id} 실패: ${res.status()}`).toBeTruthy();
  return (await res.json()).quiz as QuizItem[];
}

const hasAccepted = (quiz: QuizItem[]): boolean =>
  quiz.some((q) => Array.isArray(q.acceptedAnswers) && q.acceptedAnswers.some((b) => b?.length));

async function seedResult(
  page: Page,
  id: string,
  answers: Record<number, string>,
  title: string,
): Promise<void> {
  await page.addInitScript(
    ([token, setId, ans, t]) => {
      localStorage.setItem(
        'auth-storage',
        JSON.stringify({ state: { accessToken: token, user: null }, version: 0 }),
      );
      localStorage.setItem(
        `solveQuizResult:${setId}`,
        JSON.stringify({
          answers: ans,
          inReview: {},
          totalTime: '00:01:00',
          title: t,
          savedAt: Date.now(),
        }),
      );
    },
    [TOKEN, id, answers, title] as const,
  );
}

/** 매니페스트 입력을 문항 정답 content 기준으로 매핑(번호 순서에 의존하지 않음). */
function buildAnswersByContent(
  quiz: QuizItem[],
  plan: { match: string; input: string[] }[],
): Record<number, string> {
  const answers: Record<number, string> = {};
  for (const q of quiz) {
    const cn = norm(correctContent(q));
    const hit = plan.find((p) => cn === norm(p.match));
    if (!hit) continue;
    answers[q.number] = hit.input.length > 1 ? hit.input.join(SEP) : (hit.input[0] ?? '');
  }
  return answers;
}

test.describe('REAL_BLANK 채점 관용도 — 실서버 통합', () => {
  test.skip(!ENABLED, 'E2E_BLANK_TOLERANCE_LIVE=1 일 때만 실행');
  test.skip(!TOKEN || !SET_A, 'E2E_ACCESS_TOKEN / E2E_BLANK_SET_A 필요');

  test('세트 A: 서버가 acceptedAnswers를 싣고, 동의어 인정 + 함정 거부(SC-001/SC-002)', async ({
    page,
    request,
  }) => {
    const quiz = await fetchQuiz(request, SET_A);
    expect(quiz.length, '세트 A 문항 존재').toBeGreaterThan(0);
    // (통합 핵심) 서버 payload에 acceptedAnswers가 실려야 한다
    expect(hasAccepted(quiz), '세트 A는 acceptedAnswers가 실려야 함').toBe(true);

    // 매니페스트 입력: 동의어 2문항 정답 + 함정 C 2문항 오답 → 2/4(50%)
    const answers = buildAnswersByContent(quiz, [
      { match: '이벤트 루프', input: ['event loop'] }, // A-1 목록 동의어 → 정답
      { match: '감수분열, 체세포분열', input: ['meiosis', 'mitosis'] }, // A-2 빈칸별 목록 → 정답
      { match: 'C++', input: ['C'] }, // A-3 심볼 보존 → C는 오답
      { match: 'C#', input: ['C'] }, // A-4 (ii)#보존 → C는 오답
    ]);
    await seedResult(page, SET_A, answers, 'E2E 빈칸 관용(인정답 있음)');

    // 결과: 2/4 = 50%
    await page.goto(`/result/${SET_A}`, { waitUntil: 'networkidle' });
    await expect(page.getByText('50', { exact: false }).first()).toBeVisible();
    await page.screenshot({ path: 'captures/blank-tolerance-live-result.png', fullPage: true });

    // 해설: 같은 판정 2/4 정답 → FR-005
    await page.goto(`/explanation/${SET_A}`, { waitUntil: 'networkidle' });
    await expect(page.getByText('2/4', { exact: false })).toBeVisible();
    await page.screenshot({
      path: 'captures/blank-tolerance-live-explanation.png',
      fullPage: true,
    });
  });

  test('세트 B(FR-006): 인정답 없음 → 동의어 `event loop` 오답, 정규화만 적용', async ({
    page,
    request,
  }) => {
    test.skip(!SET_B, 'E2E_BLANK_SET_B 미제공 — 생략');

    const quiz = await fetchQuiz(request, SET_B);
    expect(hasAccepted(quiz), '세트 B(기존)는 acceptedAnswers가 없어야 함').toBe(false);

    // 같은 `event loop` 입력 — 목록이 없으니 오답 → 0/1 (A-1과 대비)
    const answers = buildAnswersByContent(quiz, [{ match: '이벤트 루프', input: ['event loop'] }]);
    await seedResult(page, SET_B, answers, 'E2E 빈칸 관용(인정답 없음·기존)');

    await page.goto(`/explanation/${SET_B}`, { waitUntil: 'networkidle' });
    await expect(page.getByText('0/1', { exact: false })).toBeVisible();
    await page.screenshot({ path: 'captures/blank-tolerance-live-legacy.png', fullPage: true });
  });
});
