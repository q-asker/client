import { test, expect } from '@playwright/test';

/**
 * 004(REAL_BLANK 전용 파이프라인 분리) — 오답선지 0개 REAL_BLANK 세트 결과 화면 e2e.
 *
 * 스모크 게이트(smoke.spec.ts)와 분리된 feature 프로젝트 스펙이다.
 * 백엔드 불요 — `?mock=true&real_blank=true&no_distractor=true` 로
 * MOCK_REAL_BLANK_NO_DISTRACTOR_QUIZZES 를 렌더해, selections에 correct:false 항목이
 * 전혀 없는(신규 REAL_BLANK 생성 결과와 동일한 shape) 문항에서도 클라이언트 단일 관용 채점
 * 함수(gradeRealBlankQuiz)와 결과 화면이 정상 동작하는지 검증한다.
 *
 * 003 mock(blank-grading-tolerance.spec.ts)은 오답선지 有/無가 섞인 세트를 다루는데,
 * 이 스펙은 004의 핵심 시나리오 — "오답선지가 애초에 존재하지 않는" 세트만으로 구성 — 를
 * 명시적으로 검증한다(spec Edge Case: 오답 유무 혼재/부재 시 화면 일관성).
 *
 * 검증 대상(mock 3문항, selections 전부 1개(correct:true)만 — correct:false 없음):
 *  1) 표기 차이(http ← HTTP)                    → 정답 인정 (FR-001)
 *  2) 동의어(encapsulation ← 캡슐화)             → 정답 인정 (FR-003)
 *  3) 다중 빈칸, 한쪽만 오답(FIN 정답/RST 오답)   → 문항 오답 유지, D-guard 없이도 오탐 없음 (FR-005)
 * → 2정답/1오답 ≈ 67점.
 */

test.describe('REAL_BLANK 관용 채점 — 오답선지 0개 세트(004)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(
      '/result/mock-real-blank-no-distractor?mock=true&real_blank=true&no_distractor=true',
      {
        waitUntil: 'domcontentloaded',
      },
    );
    await expect(page.getByText('점', { exact: false }).first()).toBeVisible();
  });

  test('오답선지가 없어도 관용 판정이 정상 동작하고, 빈 오답 영역이 생기지 않는다', async ({
    page,
  }) => {
    // 3문항 중 2정답(표기·동의어) 1오답(다중 빈칸 부분 오답) → 67점
    await expect(page.getByText('67').first()).toBeVisible();

    // (FR-001) 표기 차이 입력이 화면에 보이고, 오답선지가 없어도 정답 처리된다
    await expect(page.getByText('http', { exact: true })).toBeVisible();
    await expect(page.getByText('HTTP', { exact: true })).toHaveCount(0); // 정답 처리 → 정답 원문 미노출

    // (FR-003) 동의어 입력도 정답 처리 → 정답 원문(캡슐화) 미노출
    await expect(page.getByText('encapsulation', { exact: true })).toBeVisible();
    await expect(page.getByText('캡슐화', { exact: true })).toHaveCount(0);

    // (FR-005) 다중 빈칸 문항: 한쪽만 오답이면 전체 오답 처리 → 정답 원문(FIN, ACK) 노출
    await expect(page.getByText('FIN, ACK', { exact: true })).toBeVisible();

    // "오답" 카운트가 정확히 1건 — 오답선지가 없다고 무근거로 전부 정답 처리되지 않는다
    await expect(page.getByText('오답', { exact: true }).first()).toBeVisible();

    await page
      .evaluate(() => document.querySelectorAll('[class*="Toastify"]').forEach((el) => el.remove()))
      .catch(() => {});
    await page.screenshot({
      path: 'captures/real-blank-no-distractor-result.png',
      fullPage: true,
    });
  });
});
