// 빌드 시 sitemap.xml을 자동 생성하는 스크립트
// lastmod는 해당 경로의 소스 파일 최종 git 커밋 날짜를 사용한다.
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DIST_DIR = path.resolve(__dirname, '..', 'dist');
const BASE_URL = 'https://www.q-asker.com';

// 경로 → 관련 소스 파일 매핑 (git log로 lastmod 추출)
const ROUTES = [
  { loc: '/', sources: ['src/pages/make-quiz/', 'index.html'], hreflang: true },
  { loc: '/ko', sources: ['src/pages/make-quiz/', 'src/shared/i18n/ko.json'], hreflang: true },
  { loc: '/en', sources: ['src/pages/make-quiz/', 'src/shared/i18n/en.json'], hreflang: true },
  { loc: '/history', sources: ['src/pages/quiz-history/'] },
  { loc: '/privacy-policy', sources: ['src/pages/privacy-policy/'] },
  { loc: '/terms-of-service', sources: ['src/pages/terms-of-service/'] },
  { loc: '/boards', sources: ['src/pages/board/'] },
];

function getLastmod(sources) {
  for (const src of sources) {
    try {
      const date = execSync(`git log -1 --format="%ai" -- "${src}"`, { encoding: 'utf-8' }).trim();
      if (date) return date.slice(0, 10); // YYYY-MM-DD
    } catch {
      // 무시
    }
  }
  // 폴백: 오늘 날짜
  return new Date().toISOString().slice(0, 10);
}

function buildSitemap() {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
                            http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">`;

  for (const route of ROUTES) {
    const lastmod = getLastmod(route.sources);
    const loc = route.loc === '/' ? `${BASE_URL}/` : `${BASE_URL}${route.loc}`;

    xml += `\n  <url>`;
    xml += `\n    <loc>${loc}</loc>`;

    if (route.hreflang) {
      xml += `\n    <xhtml:link rel="alternate" hreflang="ko" href="${BASE_URL}/ko" />`;
      xml += `\n    <xhtml:link rel="alternate" hreflang="en" href="${BASE_URL}/en" />`;
      xml += `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}/" />`;
    }

    xml += `\n    <lastmod>${lastmod}</lastmod>`;
    xml += `\n  </url>`;
  }

  xml += `\n</urlset>\n`;
  return xml;
}

const sitemap = buildSitemap();
const outPath = path.join(DIST_DIR, 'sitemap.xml');

// dist가 없으면 public에도 작성 (개발용)
if (fs.existsSync(DIST_DIR)) {
  fs.writeFileSync(outPath, sitemap);
  console.log(`[sitemap] ✓ ${outPath} 생성 완료`);
} else {
  const publicPath = path.resolve(__dirname, '..', 'public', 'sitemap.xml');
  fs.writeFileSync(publicPath, sitemap);
  console.log(`[sitemap] ✓ ${publicPath} 생성 완료 (dist 없음, public에 작성)`);
}
