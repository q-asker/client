import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 스모크 설정 (하네스).
 * - 목적: 프론트 작업 마무리 시, 백엔드 없이도 앱이 기동되고 공개 라우트가
 *   치명적 오류 없이 렌더되는지 강제 검증한다. (.claude/hooks/playwright-gate.sh 에서 호출)
 * - webServer: vite dev 를 자동 기동하고, 이미 떠 있으면 재사용한다.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['line']],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    // 1단 스모크: 백엔드 불요 공개 라우트. 종료 게이트가 항상 실행.
    { name: 'smoke', testMatch: /smoke\.spec\.ts$/, use: { ...devices['Desktop Chrome'] } },
    // 2단 기능 E2E: 백엔드+로그인 필요. 종료 게이트 opt-in(fail-closed). smoke 외 전 스펙.
    {
      name: 'feature',
      testMatch: /.*\.spec\.ts$/,
      testIgnore: /smoke\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
