import { test, expect } from '@playwright/test';

/**
 * REAL_BLANK 미응답 표시 회귀 — 아무것도 입력하지 않은 REAL_BLANK 문항이 풀이 화면 "문제 목록"에
 * 응답(강조)으로 표시되던 버그(isUnanswered가 userAnswer=0을 응답으로 오판) 재발 방지.
 *
 * 서버는 REAL_BLANK 미응답을 userAnswer=0(primitive int)으로 내려주므로 `/quiz/{id}` 신선 로드만으로
 * 재현된다. 수정 전: 답변한 문제 = 전체(전 문항 강조). 수정 후: 답변한 문제 0 / 안푼 문제 = 전체.
 *
 * 실행:
 *   E2E_ACCESS_TOKEN="$(curl -s 'http://localhost:8090/local/token?userId=e2e-realblank')" \
 *     E2E_REPEAT_PSID=58Ow4V3x npm run e2e:feature -- realblank-unanswered
 */

const ACCESS_TOKEN = process.env.E2E_ACCESS_TOKEN ?? '';
const PSID = process.env.E2E_REPEAT_PSID ?? 'd2M1pa8v';

test.describe('REAL_BLANK 미응답 표시', () => {
  test.skip(!ACCESS_TOKEN, 'E2E_ACCESS_TOKEN(로컬 백엔드 /local/token)이 있을 때만 실행');

  test('신선 REAL_BLANK 풀이화면: 미입력 문항이 응답으로 집계·표시되지 않는다', async ({
    page,
  }) => {
    await page.addInitScript((token) => {
      localStorage.setItem(
        'auth-storage',
        JSON.stringify({ state: { accessToken: token, user: null }, version: 0 }),
      );
    }, ACCESS_TOKEN);

    await page.goto(`/quiz/${PSID}`, { waitUntil: 'domcontentloaded' });

    // 풀이 화면(진행 현황) 렌더 대기
    await page.getByText('진행 현황').first().waitFor({ timeout: 20_000 });

    // 신선 상태 → 응시 전이므로 "답변한 문제 0개". (수정 전엔 REAL_BLANK userAnswer=0을 응답으로 오판해 전체로 집계.)
    await expect(page.getByText('답변한 문제:').first().locator('..')).toContainText('0개', {
      timeout: 10_000,
    });

    // REAL_BLANK 입력창은 응답 여부와 무관하게 자동 포커스된다(미응답=응답 오판 제거 후에도 포커스 유지).
    await expect(page.getByPlaceholder('답을 직접 입력하세요')).toBeFocused({ timeout: 5_000 });

    await page.screenshot({ path: 'captures/realblank-unanswered-after.png', fullPage: true });
  });
});
