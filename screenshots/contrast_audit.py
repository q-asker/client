"""
색상 대비 감사 스크립트
#1e9df1 (rgb 30, 157, 241) 계열 색상과 흰 배경의 대비 비율 분석
"""

from playwright.sync_api import sync_playwright
import json

def capture(url, output_path, viewport_width=1920, viewport_height=1080):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={'width': viewport_width, 'height': viewport_height})
        page.goto(url, wait_until='networkidle')
        page.screenshot(path=output_path, full_page=False)
        browser.close()

def relative_luminance(r, g, b):
    """sRGB 채널을 선형 값으로 변환 후 상대 휘도 계산 (WCAG 2.1)"""
    def linearize(c):
        c = c / 255.0
        if c <= 0.04045:
            return c / 12.92
        return ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b)

def contrast_ratio(r1, g1, b1, r2, g2, b2):
    """두 색상의 대비 비율 계산 (WCAG 2.1)"""
    l1 = relative_luminance(r1, g1, b1)
    l2 = relative_luminance(r2, g2, b2)
    lighter = max(l1, l2)
    darker = min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)

def parse_rgb(color_str):
    """CSS color 문자열에서 RGB 값 추출"""
    import re
    # rgba(r, g, b, a) 또는 rgb(r, g, b) 파싱
    m = re.match(r'rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)', color_str)
    if m:
        return int(m.group(1)), int(m.group(2)), int(m.group(3))
    return None

def is_blue_ish(r, g, b):
    """#1e9df1 (30, 157, 241) 계열 파란색인지 확인"""
    # 파란색 성분이 강하고, 빨간색은 낮은 경우
    if b > 150 and b > r * 1.5:
        return True
    # 특히 타깃 색상 범위: r 0-100, g 100-220, b 150-255
    if r < 100 and g > 80 and b > 150:
        return True
    return False

JS_AUDIT = """
() => {
    function relativeLuminance(r, g, b) {
        function linearize(c) {
            c = c / 255.0;
            if (c <= 0.04045) return c / 12.92;
            return Math.pow((c + 0.055) / 1.055, 2.4);
        }
        return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
    }

    function contrastRatio(r1, g1, b1, r2, g2, b2) {
        var l1 = relativeLuminance(r1, g1, b1);
        var l2 = relativeLuminance(r2, g2, b2);
        var lighter = Math.max(l1, l2);
        var darker = Math.min(l1, l2);
        return (lighter + 0.05) / (darker + 0.05);
    }

    function parseRgb(str) {
        var m = str.match(/rgba?\\(\\s*(\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)/);
        if (m) return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])];
        return null;
    }

    function isBlueIsh(r, g, b) {
        // #1e9df1 계열: r 낮음, g 중간, b 높음
        if (b > 150 && b > r * 1.5) return true;
        if (r < 100 && g > 80 && b > 150) return true;
        return false;
    }

    function getEffectiveBg(el) {
        // 배경색이 투명이면 부모를 따라 올라감
        var node = el;
        while (node && node !== document.body) {
            var bg = window.getComputedStyle(node).backgroundColor;
            var parsed = parseRgb(bg);
            if (parsed) {
                var [r, g, b] = parsed;
                // 완전 투명이 아닌 경우
                var alphaMatch = bg.match(/rgba?\\(\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*\\d+\\s*(?:,\\s*([\\d.]+))?/);
                var alpha = alphaMatch && alphaMatch[1] !== undefined ? parseFloat(alphaMatch[1]) : 1;
                if (alpha > 0.5 && !(r === 0 && g === 0 && b === 0 && alpha < 0.01)) {
                    return parsed;
                }
            }
            node = node.parentElement;
        }
        return [255, 255, 255]; // 기본값: 흰 배경
    }

    var issues = [];
    var allBlueElements = [];

    // 텍스트를 가진 모든 요소 수집
    var elements = document.querySelectorAll('*');
    var seen = new Set();

    elements.forEach(function(el) {
        // 텍스트 노드가 있는 요소만
        var hasText = false;
        for (var i = 0; i < el.childNodes.length; i++) {
            if (el.childNodes[i].nodeType === 3 && el.childNodes[i].textContent.trim().length > 0) {
                hasText = true;
                break;
            }
        }
        if (!hasText) return;

        var style = window.getComputedStyle(el);
        var color = style.color;
        var fontSize = parseFloat(style.fontSize);
        var fontWeight = style.fontWeight;

        var fgRgb = parseRgb(color);
        if (!fgRgb) return;

        var [fr, fg, fb] = fgRgb;

        // 파란색 계열인지 확인
        if (!isBlueIsh(fr, fg, fb)) return;

        var bgRgb = getEffectiveBg(el);
        var [br, bg2, bb] = bgRgb;

        var ratio = contrastRatio(fr, fg, fb, br, bg2, bb);

        var rect = el.getBoundingClientRect();
        var isLargeText = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700));
        var threshold = isLargeText ? 3.0 : 4.5;

        var info = {
            tag: el.tagName,
            text: el.textContent.trim().substring(0, 80),
            color: color,
            background: 'rgb(' + br + ',' + bg2 + ',' + bb + ')',
            ratio: Math.round(ratio * 100) / 100,
            threshold: threshold,
            passes: ratio >= threshold,
            fontSize: fontSize,
            isLargeText: isLargeText,
            top: Math.round(rect.top + window.scrollY),
            left: Math.round(rect.left)
        };

        allBlueElements.push(info);
        if (!info.passes) {
            issues.push(info);
        }
    });

    return {
        issues: issues,
        allBlueElements: allBlueElements.slice(0, 50)
    };
}
"""

def main():
    base_url = "http://localhost:5173/"
    screenshots_dir = "/Users/ohyoungje/Desktop/Project/q-asker/client/screenshots"

    with sync_playwright() as p:
        browser = p.chromium.launch()

        # 데스크톱 스크린샷
        print("=== 데스크톱 스크린샷 캡처 (1920x1080) ===")
        page = browser.new_page(viewport={'width': 1920, 'height': 1080})
        page.goto(base_url, wait_until='networkidle')
        page.screenshot(path=f"{screenshots_dir}/desktop_above_fold.png", full_page=False)
        print(f"저장: {screenshots_dir}/desktop_above_fold.png")

        # 색상 대비 감사
        print("\n=== 색상 대비 감사 실행 ===")
        result = page.evaluate(JS_AUDIT)

        issues = result.get('issues', [])
        all_blue = result.get('allBlueElements', [])

        print(f"\n파란색 계열 요소 총 {len(all_blue)}개 감지")
        print(f"대비 기준 미달 요소: {len(issues)}개\n")

        if all_blue:
            print("--- 파란색 계열 요소 전체 목록 ---")
            for el in all_blue:
                status = "FAIL" if not el['passes'] else "PASS"
                print(f"  [{status}] <{el['tag']}> ratio={el['ratio']}:1 (threshold={el['threshold']}:1)")
                print(f"         색상: {el['color']}  배경: {el['background']}")
                print(f"         텍스트: {el['text'][:60]}")
                print(f"         위치: top={el['top']}px, left={el['left']}px")
                print()

        # 스크롤 후 스크린샷
        page.evaluate("window.scrollTo(0, document.body.scrollHeight / 2)")
        page.wait_for_timeout(500)
        page.screenshot(path=f"{screenshots_dir}/desktop_mid_scroll.png", full_page=False)
        print(f"저장: {screenshots_dir}/desktop_mid_scroll.png")

        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(500)
        page.screenshot(path=f"{screenshots_dir}/desktop_bottom.png", full_page=False)
        print(f"저장: {screenshots_dir}/desktop_bottom.png")

        # 전체 페이지 스크린샷
        page.evaluate("window.scrollTo(0, 0)")
        page.wait_for_timeout(300)
        page.screenshot(path=f"{screenshots_dir}/desktop_full.png", full_page=True)
        print(f"저장: {screenshots_dir}/desktop_full.png")

        # 모바일 스크린샷
        print("\n=== 모바일 스크린샷 캡처 (375x812) ===")
        mobile_page = browser.new_page(viewport={'width': 375, 'height': 812})
        mobile_page.goto(base_url, wait_until='networkidle')
        mobile_page.screenshot(path=f"{screenshots_dir}/mobile_above_fold.png", full_page=False)
        print(f"저장: {screenshots_dir}/mobile_above_fold.png")

        mobile_result = mobile_page.evaluate(JS_AUDIT)
        mobile_issues = mobile_result.get('issues', [])
        print(f"모바일 대비 미달 요소: {len(mobile_issues)}개")

        # CSS 소스에서 파란색 계열 색상 값 추출
        print("\n=== CSS에서 파란색 계열 색상 검색 ===")
        css_colors = page.evaluate("""
        () => {
            var found = [];
            // 스타일시트 순회
            try {
                for (var ss of document.styleSheets) {
                    try {
                        for (var rule of ss.cssRules || []) {
                            var text = rule.cssText || '';
                            // #1e9df1 또는 유사 파란색 HEX 탐지
                            var hexMatches = text.match(/#[0-9a-fA-F]{3,6}/g) || [];
                            for (var hex of hexMatches) {
                                // HEX to RGB
                                var h = hex.replace('#', '');
                                if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
                                if (h.length === 6) {
                                    var r = parseInt(h.substring(0,2),16);
                                    var g = parseInt(h.substring(2,4),16);
                                    var b = parseInt(h.substring(4,6),16);
                                    if (b > 150 && b > r * 1.5) {
                                        found.push({type: 'hex', value: hex, r: r, g: g, b: b, rule: text.substring(0,100)});
                                    }
                                }
                            }
                        }
                    } catch(e) {}
                }
            } catch(e) {}
            return found;
        }
        """)

        if css_colors:
            print("CSS 파란색 계열 색상 발견:")
            for c in css_colors[:20]:
                print(f"  {c['value']} → rgb({c['r']},{c['g']},{c['b']})")
                print(f"    규칙: {c['rule'][:80]}")
        else:
            print("CSS 스타일시트에서 파란색 HEX 색상 없음 (인라인/변수 방식 사용 중)")

        # 계산된 스타일에서 --primary, --chart 등 CSS 변수 확인
        print("\n=== CSS 변수 색상 값 확인 ===")
        css_vars = page.evaluate("""
        () => {
            var root = document.documentElement;
            var style = getComputedStyle(root);
            var vars = [
                '--color-primary', '--primary', '--color-accent', '--accent',
                '--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5',
                '--color-chart-1', '--color-chart-2', '--color-ring', '--ring',
                '--color-sidebar-primary', '--sidebar-primary'
            ];
            var result = {};
            for (var v of vars) {
                result[v] = style.getPropertyValue(v).trim();
            }
            return result;
        }
        """)
        print("CSS 변수 값:")
        for k, v in css_vars.items():
            if v:
                print(f"  {k}: {v}")

        browser.close()

    print("\n=== 감사 완료 ===")
    print(f"스크린샷 저장 위치: {screenshots_dir}/")

if __name__ == '__main__':
    main()
