#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 환경 변수에서 도메인 가져오기
const domain = process.env.SITE_DOMAIN || "https://your-domain.com";

// 정적 사이트맵 생성
const generateSitemap = () => {
  const currentDate = new Date().toISOString();

  const urls = [
    {
      loc: `${domain}/`,
      lastmod: currentDate,
      changefreq: "daily",
      priority: "1.0",
    },
    {
      loc: `${domain}/history`,
      lastmod: currentDate,
      changefreq: "weekly",
      priority: "0.8",
    },
  ];

  // 동적 URL들은 실제 데이터베이스나 API에서 가져와야 함
  // 예시: 기존 퀴즈 데이터가 있다면 추가
  // const existingQuizIds = getExistingQuizIds(); // 실제 구현 필요
  // existingQuizIds.forEach(id => {
  //   urls.push({
  //     loc: `${domain}/quiz/${id}`,
  //     lastmod: currentDate,
  //     changefreq: 'monthly',
  //     priority: '0.7'
  //   });
  //   urls.push({
  //     loc: `${domain}/result/${id}`,
  //     lastmod: currentDate,
  //     changefreq: 'monthly',
  //     priority: '0.6'
  //   });
  //   urls.push({
  //     loc: `${domain}/explanation/${id}`,
  //     lastmod: currentDate,
  //     changefreq: 'monthly',
  //     priority: '0.6'
  //   });
  // });

  const urlsXML = urls
    .map(
      (url) => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
    )
    .join("\n");

  const sitemapXML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
                            http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urlsXML}
</urlset>`;

  return sitemapXML;
};

// 사이트맵 파일 생성
const writeSitemap = () => {
  const sitemap = generateSitemap();
  const outputPath = path.join(__dirname, "../public/sitemap.xml");

  fs.writeFileSync(outputPath, sitemap, "utf8");
  console.log("✅ Sitemap generated successfully at:", outputPath);
  console.log("📊 Domain:", domain);
  console.log(
    "🔗 URLs included: 2 static pages (+ dynamic quiz pages when available)"
  );
};

// robots.txt 업데이트
const updateRobotsTxt = () => {
  const robotsPath = path.join(__dirname, "../public/robots.txt");
  const robotsContent = `User-agent: *
Allow: /

# 사이트맵 위치
Sitemap: ${domain}/sitemap.xml

# 파비콘 위치
Allow: /favicon.ico
Allow: /favicon-*.png
Allow: /favicon.svg`;

  fs.writeFileSync(robotsPath, robotsContent, "utf8");
  console.log("✅ robots.txt updated with sitemap URL");
};

// 메인 실행
const main = () => {
  try {
    console.log("🚀 Generating sitemap...");
    writeSitemap();
    updateRobotsTxt();
    console.log("✨ Sitemap generation completed!");
  } catch (error) {
    console.error("❌ Failed to generate sitemap:", error);
    process.exit(1);
  }
};

// 스크립트 직접 실행 시 메인 함수 호출
main();

export { generateSitemap, updateRobotsTxt, writeSitemap };
