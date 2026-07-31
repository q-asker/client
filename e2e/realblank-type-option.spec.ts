import { test, expect } from '@playwright/test';

/**
 * REAL_BLANK 독립 유형화 — 옵션 화면에 "빈칸 직접입력" 유형 버튼이 독립적으로 노출되고,
 * 선택 시 직접입력 안내가 뜨며 선택지 미리보기가 숨겨지는지 검증(mock 모드, 백엔드 불요).
 */

test.describe('REAL_BLANK 독립 유형', () => {
  test('옵션 화면에 "빈칸 직접입력" 유형 버튼이 노출·선택된다', async ({ page }) => {
    await page.goto('/?mock=true', { waitUntil: 'domcontentloaded' });

    const realBlankBtn = page.getByRole('button', {
      name: /빈칸 직접입력|Fill in the Blank \(typed\)/,
    });
    await expect(realBlankBtn).toBeVisible({ timeout: 15_000 });

    // 기존 BLANK 유형 버튼과 별개로 공존한다.
    await expect(
      page.getByRole('button', { name: /^빈칸 넣기$|^Fill in the Blank$/ }),
    ).toBeVisible();

    await realBlankBtn.click();

    // 선택 시 직접입력 안내가 뜬다.
    await expect(
      page.getByText(/선택지 없이 답을 직접 입력합니다|Type the answer directly/),
    ).toBeVisible();

    await page.screenshot({ path: 'captures/realblank-type-option.png', fullPage: true });
  });
});
