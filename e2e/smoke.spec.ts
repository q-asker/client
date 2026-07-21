import { test, expect } from '@playwright/test';

/**
 * 공개 라우트 스모크 (백엔드 불필요).
 * - 로그인·API 없이도 통과해야 하는 최소 게이트.
 * - 검증: 앱이 #root 에 마운트되고, 페이지 런타임 에러(pageerror)가 없어야 한다.
 * - 폴더 기능 등 로그인/백엔드가 필요한 e2e 는 구현 단계에서 별도 spec 으로 추가한다.
 */
const publicRoutes = ['/', '/privacy-policy', '/terms-of-service'];

for (const route of publicRoutes) {
  test(`공개 라우트 렌더: ${route}`, async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    const res = await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(res, `응답 없음: ${route}`).not.toBeNull();
    expect(res!.status(), `HTTP 상태 ${res!.status()} @ ${route}`).toBeLessThan(400);

    // React 앱이 실제로 마운트되어 내용이 채워졌는지 (auto-retry 어서션)
    await expect(page.locator('#root')).not.toBeEmpty();

    expect(pageErrors, `런타임 에러 @ ${route}:\n${pageErrors.join('\n')}`).toHaveLength(0);
  });
}
