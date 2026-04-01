// 빌드 후 프리렌더링 스크립트
// 사용: node scripts/prerender.cjs
const path = require('path');
const fs = require('fs');
const Prerenderer = require('@prerenderer/prerenderer');
const PuppeteerRenderer = require('@prerenderer/renderer-puppeteer');

const ROUTES = ['/', '/ko', '/en'];
const DIST_DIR = path.resolve(__dirname, '..', 'dist');

async function prerender() {
  const pre = new Prerenderer({
    staticDir: DIST_DIR,
    renderer: new PuppeteerRenderer({
      headless: true,
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

      fs.writeFileSync(filePath, route.html);
      console.log(`[prerender] ✓ ${route.route} → ${filePath} (${route.html.length} bytes)`);
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
