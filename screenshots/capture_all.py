from playwright.sync_api import sync_playwright
import json

OUTPUT_DIR = "/Users/ohyoungje/Desktop/Project/q-asker/client/screenshots"

ROUTES = [
    {"slug": "ko", "url": "https://www.q-asker.com/"},
    {"slug": "en", "url": "https://www.q-asker.com/en"},
]

VIEWPORTS = [
    {"name": "desktop", "width": 1920, "height": 1080},
    {"name": "laptop",  "width": 1366, "height": 768},
    {"name": "tablet",  "width": 768,  "height": 1024},
    {"name": "mobile",  "width": 375,  "height": 812},
]


def capture_and_measure(page, url, slug, vp_name, width, height):
    page.set_viewport_size({"width": width, "height": height})
    page.goto(url, wait_until="load", timeout=60000)
    page.wait_for_timeout(1500)

    # Above-the-fold 스크린샷
    atf_path = f"{OUTPUT_DIR}/{slug}_{vp_name}_atf.png"
    page.screenshot(path=atf_path, full_page=False)

    # 풀 페이지 스크린샷
    full_path = f"{OUTPUT_DIR}/{slug}_{vp_name}_full.png"
    page.screenshot(path=full_path, full_page=True)

    # 메트릭 수집
    metrics = page.evaluate(f"""() => {{
        const vh = {height};
        const vw = {width};

        const viewportMeta = document.querySelector('meta[name="viewport"]');
        const h1 = document.querySelector('h1');
        const h1Rect = h1 ? h1.getBoundingClientRect() : null;

        // 화면에 보이는 버튼/링크
        const allButtons = Array.from(document.querySelectorAll('button, a[href]'));
        const visibleButtons = allButtons.filter(el => {{
            const r = el.getBoundingClientRect();
            return r.top < vh && r.bottom > 0 && r.width > 0 && r.height > 0;
        }});

        // 터치 타겟 48px 미만 항목
        const smallTouchTargets = visibleButtons.filter(el => {{
            const r = el.getBoundingClientRect();
            return (r.width < 48 || r.height < 48);
        }}).map(el => ({{
            tag: el.tagName,
            text: el.innerText?.trim().slice(0, 40),
            w: Math.round(el.getBoundingClientRect().width),
            h: Math.round(el.getBoundingClientRect().height),
        }}));

        // 14px 미만 폰트 (ATF 영역만)
        const allText = Array.from(document.querySelectorAll('p, span, li, a, button, h1, h2, h3'));
        const smallFonts = allText.filter(el => {{
            const r = el.getBoundingClientRect();
            if (r.top > vh || r.width === 0) return false;
            const fs = parseFloat(window.getComputedStyle(el).fontSize);
            return fs > 0 && fs < 14;
        }}).map(el => ({{
            tag: el.tagName,
            text: el.innerText?.trim().slice(0, 40),
            fs: parseFloat(window.getComputedStyle(el).fontSize),
        }}));

        // 수평 스크롤 여부
        const hasHorizontalScroll = document.documentElement.scrollWidth > window.innerWidth;

        // 주요 CTA 텍스트 (버튼 중 첫 3개)
        const topCTAs = visibleButtons
            .filter(el => el.tagName === 'BUTTON' || (el.tagName === 'A' && el.innerText?.trim().length > 1))
            .slice(0, 5)
            .map(el => ({{
                tag: el.tagName,
                text: el.innerText?.trim().slice(0, 60),
                w: Math.round(el.getBoundingClientRect().width),
                h: Math.round(el.getBoundingClientRect().height),
                top: Math.round(el.getBoundingClientRect().top),
            }}));

        // 이미지
        const imgs = Array.from(document.querySelectorAll('img'))
            .filter(el => {{
                const r = el.getBoundingClientRect();
                return r.top < vh && r.bottom > 0;
            }})
            .map(el => ({{
                src: el.src.split('/').pop(),
                alt: el.alt,
                w: Math.round(el.getBoundingClientRect().width),
                h: Math.round(el.getBoundingClientRect().height),
            }}));

        return {{
            pageTitle: document.title,
            metaDescription: (document.querySelector('meta[name="description"]') || {{}}).content || '',
            viewportMeta: viewportMeta ? viewportMeta.getAttribute('content') : null,
            h1Text: h1 ? h1.innerText?.trim().slice(0, 100) : null,
            h1AboveFold: h1Rect ? h1Rect.top < vh && h1Rect.bottom > 0 : false,
            h1Top: h1Rect ? Math.round(h1Rect.top) : null,
            visibleButtonCount: visibleButtons.length,
            topCTAs,
            smallTouchTargets: smallTouchTargets.slice(0, 10),
            smallTouchTargetCount: smallTouchTargets.length,
            smallFontCount: smallFonts.length,
            smallFontSamples: smallFonts.slice(0, 5),
            hasHorizontalScroll,
            scrollWidth: document.documentElement.scrollWidth,
            innerWidth: window.innerWidth,
            visibleImages: imgs.slice(0, 5),
        }};
    }}""")

    return {"atf": atf_path, "full": full_path, "metrics": metrics}


all_results = {}

with sync_playwright() as p:
    browser = p.chromium.launch()

    for route in ROUTES:
        slug = route["slug"]
        url = route["url"]
        all_results[slug] = {}
        print(f"\n=== [{slug.upper()}] {url} ===")

        for vp in VIEWPORTS:
            vp_name = vp["name"]
            width = vp["width"]
            height = vp["height"]
            print(f"  캡처: {vp_name} ({width}x{height})")

            if vp_name == "mobile":
                context = browser.new_context(
                    viewport={"width": width, "height": height},
                    user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
                    is_mobile=True,
                    has_touch=True,
                )
            elif vp_name == "tablet":
                context = browser.new_context(
                    viewport={"width": width, "height": height},
                    user_agent="Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
                    is_mobile=True,
                    has_touch=True,
                )
            else:
                context = browser.new_context(
                    viewport={"width": width, "height": height},
                )

            page = context.new_page()
            result = capture_and_measure(page, url, slug, vp_name, width, height)
            all_results[slug][vp_name] = result
            context.close()

    browser.close()

# JSON 리포트 저장
report_path = f"{OUTPUT_DIR}/analysis_report.json"
with open(report_path, "w", encoding="utf-8") as f:
    json.dump(all_results, f, ensure_ascii=False, indent=2)

print(f"\n리포트 저장 완료: {report_path}")
print(json.dumps(all_results, ensure_ascii=False, indent=2))
