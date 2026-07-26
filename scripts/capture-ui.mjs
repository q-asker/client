// 중요한 UI 순간을 내구 저장하는 캡처 도구 (프론트 앱 전용).
// 프론트 팀원이 "중요하다"고 스스로 판단한 순간에 호출한다 — 훅 자동이 아니라 판단 기반.
// cmux feed 처럼 휘발·리댁션되는 관측과 달리, 실행 중인 앱 화면을 타임스탬프 PNG로 박제한다.
//
// 사용:
//   node scripts/capture-ui.mjs "<label>" [url]
//   예) node scripts/capture-ui.mjs "폴더 첫 렌더" http://localhost:5173/history
//   로그인 상태가 필요하면 토큰을 env로: E2E_ACCESS_TOKEN=<jwt> node scripts/capture-ui.mjs "미분류 탭" http://localhost:5173/history
//   (토큰은 백엔드 local 프로파일의 GET /local/token?userId=<시드유저> 로 발급)
//
// 산출물: captures/<ISO타임스탬프>_<slug>.png + captures/index.md 에 한 줄 인덱스.

import { chromium } from '@playwright/test';
import { mkdirSync, appendFileSync } from 'node:fs';
import { resolve } from 'node:path';

const label = process.argv[2];
const url = process.argv[3] || 'http://localhost:5173';
if (!label) {
  console.error('usage: node scripts/capture-ui.mjs "<label>" [url]');
  process.exit(1);
}

const token = process.env.E2E_ACCESS_TOKEN || '';
const dir = resolve(process.cwd(), 'captures');
mkdirSync(dir, { recursive: true });

const ts = new Date().toISOString().replace(/[:.]/g, '-');
const slug = label
  .trim()
  .replace(/\s+/g, '_')
  .replace(/[^\w가-힣_-]/g, '')
  .slice(0, 60);
const file = `${ts}_${slug}.png`;
const outPath = resolve(dir, file);

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

// 로그인 상태 주입(zustand persist 'auth-storage') — 토큰이 있을 때만.
if (token) {
  await page.addInitScript((t) => {
    localStorage.setItem(
      'auth-storage',
      JSON.stringify({ state: { accessToken: t, user: null }, version: 0 }),
    );
  }, token);
}

try {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });
} catch {
  // networkidle 안 잡히면(SSE 등) domcontentloaded 로 폴백
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
}
await page.waitForTimeout(500); // 애니메이션/렌더 settle
await page.screenshot({ path: outPath, fullPage: true });
await browser.close();

const line = `- ${ts} — ${label} — ${file} — ${url}${token ? ' — (로그인)' : ''}\n`;
appendFileSync(resolve(dir, 'index.md'), line);
console.log(`captured: captures/${file}`);
