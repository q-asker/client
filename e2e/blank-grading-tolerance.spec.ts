import { test, expect } from '@playwright/test';

/**
 * REAL_BLANK(직접 입력 단답) 관용 채점 결과 화면 e2e (feedback #20).
 *
 * 스모크 게이트(smoke.spec.ts)와 분리된 feature 프로젝트 스펙이다.
 * 백엔드 불요 — `?mock=true&real_blank=true` 로 MOCK_REAL_BLANK_RESULT_QUIZZES 를 렌더해
 * 클라이언트 단일 관용 채점 함수(gradeRealBlankQuiz)의 판정이 결과 화면에 올바르게 반영되는지 검증한다.
 *
 * 검증 대상(mock 4문항):
 *  1) 동의어·이표기(이벤트루프 ← Event Loop)  → 정답 인정 (FR-003/FR-001)
 *  2) 오탈자(polymorphysm ← polymorphism)      → 정답 인정 (FR-002)
 *  3) 표기 차이(http ← HTTP)                    → 정답 인정 (FR-001)
 *  4) 오답선지(OOP, 정답 OCP와 편집거리 1)      → 오답 유지 (FR-005, D-guard)
 * → 3정답/1오답 = 75점. 결과·해설·히스토리 공용 함수이므로 이 판정이 세 화면에서 동일하다(FR-006).
 */

test.describe('REAL_BLANK 관용 채점 — 결과 화면', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/result/mock-real-blank?mock=true&real_blank=true', {
      waitUntil: 'domcontentloaded',
    });
    // 스코어보드 히어로가 뜨면 렌더 완료
    await expect(page.getByText('점', { exact: false }).first()).toBeVisible();
  });

  test('동의어·오탈자·표기 차이는 정답, 오답선지는 오답으로 유지된다', async ({ page }) => {
    // 4문항 중 3정답(동의어·오탈자·표기) 1오답(오답선지) → 75점
    await expect(page.getByText('75').first()).toBeVisible();

    // (FR-005) 오답선지 'OOP' 입력 문항: 오답 유지 → 정답 'OCP'가 노출된다(오답일 때만 정답 답안 표시)
    await expect(page.getByText('OOP')).toBeVisible();
    await expect(page.getByText('OCP')).toBeVisible();

    // (FR-002) 오탈자 'polymorphysm' 입력 문항: 정답 인정 → 정답 답안(polymorphism)은 노출되지 않는다
    await expect(page.getByText('polymorphysm')).toBeVisible();
    await expect(page.getByText('polymorphism', { exact: true })).toHaveCount(0);

    // (FR-003/FR-001) 동의어·표기 입력도 화면에 표시된다
    await expect(page.getByText('이벤트루프')).toBeVisible();
    await expect(page.getByText('http')).toBeVisible();

    // 관용 채점이 반영된 결과 화면 박제(정답 인정 vs 오답 유지 대비).
    // mock 환경에선 백엔드 없이 POST /history가 실패해 네트워크 오류 토스트가 뜨므로(기능과 무관),
    // PR 캡처 품질을 위해 토스트만 제거하고 촬영한다.
    await page
      .evaluate(() => document.querySelectorAll('[class*="Toastify"]').forEach((el) => el.remove()))
      .catch(() => {});
    await page.screenshot({
      path: 'captures/blank-tolerance-result.png',
      fullPage: true,
    });
  });
});
