import { defineConfig } from 'vitest/config';

// 채점 순수 함수(blank-scoring) 단위 테스트 전용 최소 구성.
// DOM 불필요(node 환경), 앱 vite 플러그인 로드 없이 *.test.ts만 수집한다.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
