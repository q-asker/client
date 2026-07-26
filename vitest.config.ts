import { defineConfig } from 'vitest/config';

/**
 * 순수 함수(REAL_BLANK 채점) 단위 테스트 전용 설정.
 * - 앱 vite.config(rolldown/react/tailwind)를 끌어오지 않도록 별도 파일로 분리.
 * - blank-scoring은 외부 의존 0이므로 node 환경으로 충분.
 */
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
