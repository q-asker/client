// 동적 사이트맵 생성 유틸리티

// 사이트맵에 새로운 퀴즈 URL 추가
export const addQuizToSitemap = async (problemSetId) => {
  if (!problemSetId) return;

  const domain = window.location.origin;
  const currentDate = new Date().toISOString();

  // 새로운 퀴즈 관련 URL들
  const newUrls = [
    {
      loc: `${domain}/quiz/${problemSetId}`,
      lastmod: currentDate,
      changefreq: "monthly",
      priority: "0.7",
    },
    {
      loc: `${domain}/result/${problemSetId}`,
      lastmod: currentDate,
      changefreq: "monthly",
      priority: "0.6",
    },
    {
      loc: `${domain}/explanation/${problemSetId}`,
      lastmod: currentDate,
      changefreq: "monthly",
      priority: "0.6",
    },
  ];

  // 실제 구현에서는 서버에 요청을 보내서 사이트맵 업데이트
  // 여기서는 콘솔에 로그만 출력
  console.log("Adding to sitemap:", newUrls);

  // 서버에 사이트맵 업데이트 요청 (예시)
  try {
    await fetch("/api/sitemap", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ urls: newUrls }),
    });
  } catch (error) {
    console.error("Failed to update sitemap:", error);
  }
};

// 정적 사이트맵 생성 (빌드 시 사용)
export const generateStaticSitemap = (domain = "https://your-domain.com") => {
  const staticUrls = [
    {
      loc: `${domain}/`,
      lastmod: new Date().toISOString(),
      changefreq: "daily",
      priority: "1.0",
    },
    {
      loc: `${domain}/history`,
      lastmod: new Date().toISOString(),
      changefreq: "weekly",
      priority: "0.8",
    },
  ];

  return generateSitemapXML(staticUrls);
};

// XML 사이트맵 생성
export const generateSitemapXML = (urls) => {
  const urlsXML = urls
    .map(
      (url) => `
  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
                            http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urlsXML}
</urlset>`;
};

// Google Search Console에 사이트맵 제출 알림
export const notifyGoogleSearchConsole = (sitemapUrl) => {
  const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(
    sitemapUrl
  )}`;

  // 실제로는 서버에서 처리해야 함
  console.log("Ping Google with sitemap:", pingUrl);

  // 서버에서 Google에 ping 요청 보내기 (예시)
  fetch("/api/ping-google", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sitemapUrl }),
  }).catch((error) => {
    console.error("Failed to ping Google:", error);
  });
};

// 사이트맵 유효성 검사
export const validateSitemap = (xmlContent) => {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, "text/xml");

    // 파싱 에러 체크
    const parseError = xmlDoc.querySelector("parsererror");
    if (parseError) {
      throw new Error("Invalid XML format");
    }

    // 필수 요소 체크
    const urlset = xmlDoc.querySelector("urlset");
    if (!urlset) {
      throw new Error("Missing urlset element");
    }

    const urls = xmlDoc.querySelectorAll("url");
    if (urls.length === 0) {
      throw new Error("No URLs found in sitemap");
    }

    return { valid: true, urlCount: urls.length };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};
