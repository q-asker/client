// 빌드 후 프리렌더링 스크립트
// 사용: node scripts/prerender.cjs
const path = require('path');
const fs = require('fs');
const Prerenderer = require('@prerenderer/prerenderer');
const PuppeteerRenderer = require('@prerenderer/renderer-puppeteer');

const ROUTES = ['/', '/ko', '/en', '/history', '/boards', '/privacy-policy', '/terms-of-service'];
const DIST_DIR = path.resolve(__dirname, '..', 'dist');

async function prerender() {
  const pre = new Prerenderer({
    staticDir: DIST_DIR,
    renderer: new PuppeteerRenderer({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      renderAfterDocumentEvent: 'prerender-ready',
    }),
  });

  try {
    await pre.initialize();
    console.log(`[prerender] 렌더링 시작: ${ROUTES.join(', ')}`);

    const renderedRoutes = await pre.renderRoutes(ROUTES);

    for (const route of renderedRoutes) {
      const filePath =
        route.route === '/'
          ? path.join(DIST_DIR, 'index.html')
          : path.join(DIST_DIR, route.route, 'index.html');

      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      // 렌더 중 런타임에 삽입된 <link>는 프리렌더 서버 절대 URL로 직렬화된다. 루트 상대 경로로 되돌린다.
      const html = route.html.replace(/https?:\/\/(?:127\.0\.0\.1|localhost):\d+/g, '');

      fs.writeFileSync(filePath, html);
      console.log(`[prerender] ✓ ${route.route} → ${filePath} (${html.length} bytes)`);
    }

    console.log('[prerender] 완료!');
  } catch (e) {
    console.error('[prerender] 실패:', e.message);
    process.exit(1);
  } finally {
    await pre.destroy();
  }
}

prerender();
