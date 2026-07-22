import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * 동일 재현(feedback #7) 기능 흐름 e2e. 백엔드 없이 route 목킹으로 결과 화면 → "이 조건으로 문제 더 만들기"의
 * 두 갈래(조건 온전 → 즉시 재생성 / 조건 소실 → 옵션 화면 폴백)를 브라우저에서 검증한다. feature 프로젝트(스모크와 분리).
 */

const SET_ID = 'test-set-1';

const problemSetBody = {
  quiz: [
    {
      number: 1,
      title: '문항 1',
      type: 'MULTIPLE',
      selections: [
        { id: '1', content: 'A', correct: true },
        { id: '2', content: 'B', correct: false },
      ],
      userAnswer: '1',
    },
  ],
  title: '샘플 세트',
  quizType: 'MULTIPLE',
};

/** 결과 화면 로드에 필요한 공통 목킹 + 재생성 실행에 딸려오는 부수 요청 흡수. */
async function mockResultPage(page: Page) {
  // 생성 SSE는 연결만 열어두고 이벤트는 보내지 않는다(EventSource 재시도 무해).
  await page.route('**/generation/*/stream', (route) =>
    route.fulfill({ status: 200, contentType: 'text/event-stream', body: '' }),
  );
  // 토큰 리프레시는 백엔드 없이 실패해도 코드가 흡수하므로 목킹하지 않는다.
  // (넓은 글롭으로 auth 모듈 스크립트까지 가로채면 페이지가 죽는다.)
  // 결과 화면 데이터. regeneration-condition 라우트를 뒤에 등록해 우선 매칭시킨다.
  await page.route('**/problem-set/*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(problemSetBody),
    }),
  );
}

test('조건이 온전하면 재생성 버튼이 즉시 생성으로 직행한다', async ({ page }) => {
  await mockResultPage(page);

  let generationPosted = false;
  await page.route('**/generation', (route) => {
    generationPosted = true;
    return route.fulfill({ status: 202, body: '{}' });
  });
  await page.route('**/problem-set/*/regeneration-condition', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        quizType: 'MULTIPLE',
        quizCount: 5,
        pageNumbers: [1, 2],
        language: 'KO',
        customInstruction: null,
        uploadedUrl: 'https://cdn.example.com/doc.pdf',
        title: '샘플 세트',
        documentAvailable: true,
      }),
    }),
  );

  await page.goto(`/result/${SET_ID}`);
  const button = page.getByTestId('regenerate-quiz-button');
  await expect(button).toBeVisible();

  await button.click();

  // 옵션 재조립 없이 홈(생성 흐름)으로 직행하고 새 생성 요청이 나간다.
  await expect(page).toHaveURL(/\/(en|ko)?$/);
  await expect.poll(() => generationPosted).toBe(true);
});

test('조건이 소실되면(legacy 세트) 옵션 화면 폴백으로 이동하고 즉시 생성하지 않는다', async ({
  page,
}) => {
  await mockResultPage(page);

  let generationPosted = false;
  await page.route('**/generation', (route) => {
    generationPosted = true;
    return route.fulfill({ status: 202, body: '{}' });
  });
  // legacy 세트: pageNumbers·language 미저장 → 폴백.
  await page.route('**/problem-set/*/regeneration-condition', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        quizType: 'MULTIPLE',
        quizCount: 10,
        pageNumbers: null,
        language: null,
        customInstruction: null,
        uploadedUrl: 'https://cdn.example.com/doc.pdf',
        title: '샘플 세트',
        documentAvailable: true,
      }),
    }),
  );

  await page.goto(`/result/${SET_ID}`);
  const button = page.getByTestId('regenerate-quiz-button');
  await expect(button).toBeVisible();

  await button.click();

  // 옵션 화면(홈)으로 이동하되, 즉시 생성은 하지 않는다(사용자가 빠진 조건을 채워야 함).
  await expect(page).toHaveURL(/\/(en|ko)?$/);
  await page.waitForTimeout(500);
  expect(generationPosted).toBe(false);
});
