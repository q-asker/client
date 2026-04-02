"""
심층 색상 대비 감사
--primary oklch(0.6723 0.1606 244.9955) 를 실제 RGB로 변환하여 대비 비율 측정
모든 파란/청록 계열 색상을 포함해 폭넓게 감사
"""

from playwright.sync_api import sync_playwright

JS_DEEP_AUDIT = """
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
        if (!str) return null;
        var m = str.match(/rgba?\\(\\s*(\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)/);
        if (m) return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])];
        return null;
    }

    function getEffectiveBg(el) {
        var node = el;
        var maxDepth = 20;
        while (node && node !== document.html && maxDepth-- > 0) {
            var bg = window.getComputedStyle(node).backgroundColor;
            if (!bg) { node = node.parentElement; continue; }
            var m = bg.match(/rgba?\\(\\s*(\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)\\s*(?:,\\s*([\\d.]+))?/);
            if (m) {
                var alpha = m[4] !== undefined ? parseFloat(m[4]) : 1;
                var r = parseInt(m[1]), g = parseInt(m[2]), b = parseInt(m[3]);
                if (alpha > 0.5 && !(r === 0 && g === 0 && b === 0 && alpha < 0.01)) {
                    return [r, g, b];
                }
            }
            node = node.parentElement;
        }
        return [255, 255, 255];
    }

    // 모든 텍스트 요소를 순회하여 색상이 중간 밝기인 경우 대비 측정
    // (회색, 파란색, 주황색 등 흰 배경에서 대비 위험군)
    var results = [];
    var elements = document.querySelectorAll('a, button, p, span, h1, h2, h3, h4, h5, h6, li, label, td, th, div, small, caption');

    elements.forEach(function(el) {
        // 텍스트 노드 직접 포함 여부
        var hasDirectText = false;
        for (var i = 0; i < el.childNodes.length; i++) {
            if (el.childNodes[i].nodeType === 3 && el.childNodes[i].textContent.trim().length > 0) {
                hasDirectText = true;
                break;
            }
        }
        if (!hasDirectText) return;

        var style = window.getComputedStyle(el);
        var color = style.color;
        var display = style.display;
        if (display === 'none' || style.visibility === 'hidden') return;

        var fgRgb = parseRgb(color);
        if (!fgRgb) return;

        var [fr, fg, fb] = fgRgb;

        // 흰색(255,255,255)이나 검정(0,0,0)은 제외, 중간 밝기만
        var isWhite = fr > 240 && fg > 240 && fb > 240;
        var isBlack = fr < 30 && fg < 30 && fb < 30;
        if (isWhite || isBlack) return;

        var bgRgb = getEffectiveBg(el);
        var [br, bg2, bb] = bgRgb;

        var ratio = contrastRatio(fr, fg, fb, br, bg2, bb);

        // 4.5:1 미만인 경우만 기록
        if (ratio >= 4.5) return;

        var fontSize = parseFloat(style.fontSize);
        var fontWeight = style.fontWeight;
        var isLargeText = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700));
        var threshold = isLargeText ? 3.0 : 4.5;
        var passes = ratio >= threshold;

        var rect = el.getBoundingClientRect();

        results.push({
            tag: el.tagName,
            text: el.textContent.trim().substring(0, 60),
            color: color,
            colorRgb: [fr, fg, fb],
            background: 'rgb(' + br + ',' + bg2 + ',' + bb + ')',
            bgRgb: [br, bg2, bb],
            ratio: Math.round(ratio * 100) / 100,
            threshold: threshold,
            passes: passes,
            fontSize: Math.round(fontSize),
            isLargeText: isLargeText,
            top: Math.round(rect.top + window.scrollY),
            left: Math.round(rect.left)
        });
    });

    // ratio 낮은 순 정렬
    results.sort(function(a, b) { return a.ratio - b.ratio; });
    return results.slice(0, 100);
}
"""

JS_COLOR_SNAPSHOT = """
() => {
    // 현재 페이지에서 primary 버튼, 링크 요소의 실제 렌더링 색상 스냅샷
    var snapshot = [];
    var targets = document.querySelectorAll(
        'button, a, [class*="primary"], [class*="btn"], .text-primary, [class*="text-blue"]'
    );
    targets.forEach(function(el) {
        var style = window.getComputedStyle(el);
        var text = el.textContent.trim().substring(0, 40);
        if (!text) return;
        snapshot.push({
            tag: el.tagName,
            text: text,
            color: style.color,
            background: style.backgroundColor,
            className: (el.className || '').substring(0, 80)
        });
    });
    return snapshot.slice(0, 30);
}
"""

def main():
    screenshots_dir = "/Users/ohyoungje/Desktop/Project/q-asker/client/screenshots"
    base_url = "http://localhost:5173/"

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={'width': 1920, 'height': 1080})
        page.goto(base_url, wait_until='networkidle')

        # 심층 대비 감사
        print("=== 심층 색상 대비 감사 (4.5:1 미만 전체) ===\n")
        issues = page.evaluate(JS_DEEP_AUDIT)

        if not issues:
            print("대비 미달 요소가 없습니다.")
        else:
            print(f"총 {len(issues)}개 저대비 요소 발견:\n")
            for el in issues:
                status = "FAIL" if not el['passes'] else "WARN(large text pass)"
                print(f"  [{status}] ratio={el['ratio']}:1 / threshold={el['threshold']}:1")
                print(f"  <{el['tag']}> '{el['text'][:50]}'")
                print(f"  FG: {el['color']}  BG: {el['background']}")
                print(f"  font-size: {el['fontSize']}px  large-text: {el['isLargeText']}")
                print(f"  위치: top={el['top']}px\n")

        # 버튼/링크 색상 스냅샷
        print("\n=== 버튼 / 링크 색상 스냅샷 ===\n")
        snapshot = page.evaluate(JS_COLOR_SNAPSHOT)
        for s in snapshot:
            print(f"  <{s['tag']}> '{s['text']}'")
            print(f"  color={s['color']}  bg={s['background']}")
            print(f"  class={s['className']}\n")

        # --primary oklch를 실제 RGB로 변환
        print("\n=== CSS 변수 실제 렌더링 색상 확인 ===\n")
        rendered = page.evaluate("""
        () => {
            var dummy = document.createElement('div');
            dummy.style.cssText = 'position:fixed;top:-9999px;color:oklch(0.6723 0.1606 244.9955);background:white;';
            document.body.appendChild(dummy);
            var style = window.getComputedStyle(dummy);
            var color = style.color;
            document.body.removeChild(dummy);

            // primary 버튼 직접 찾기
            var btn = document.querySelector('button');
            var btnStyle = btn ? window.getComputedStyle(btn) : null;

            return {
                primaryOklchRendered: color,
                firstButtonColor: btnStyle ? btnStyle.color : 'N/A',
                firstButtonBg: btnStyle ? btnStyle.backgroundColor : 'N/A',
                firstButtonText: btn ? btn.textContent.trim().substring(0, 30) : 'N/A'
            };
        }
        """)
        print(f"--primary oklch(0.6723 0.1606 244.9955) 렌더링: {rendered['primaryOklchRendered']}")
        print(f"첫 번째 버튼 텍스트: '{rendered['firstButtonText']}'")
        print(f"첫 번째 버튼 색상: {rendered['firstButtonColor']}")
        print(f"첫 번째 버튼 배경: {rendered['firstButtonBg']}")

        # 실제 primary 색상의 대비 비율 계산
        import re
        m = re.match(r'rgb\((\d+),\s*(\d+),\s*(\d+)\)', rendered['primaryOklchRendered'].replace(' ', ''))
        if m:
            r, g, b = int(m.group(1)), int(m.group(2)), int(m.group(3))
            print(f"\n--primary 실제 RGB: rgb({r}, {g}, {b})")

            def rel_lum(rv, gv, bv):
                def lin(c):
                    c /= 255.0
                    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
                return 0.2126 * lin(rv) + 0.7152 * lin(gv) + 0.0722 * lin(bv)

            def cr(r1, g1, b1, r2, g2, b2):
                l1, l2 = rel_lum(r1, g1, b1), rel_lum(r2, g2, b2)
                lighter, darker = max(l1, l2), min(l1, l2)
                return (lighter + 0.05) / (darker + 0.05)

            ratio_on_white = cr(r, g, b, 255, 255, 255)
            ratio_on_black = cr(r, g, b, 0, 0, 0)
            print(f"--primary on white: {ratio_on_white:.2f}:1 {'FAIL' if ratio_on_white < 4.5 else 'PASS'}")
            print(f"--primary on black: {ratio_on_black:.2f}:1 {'FAIL' if ratio_on_black < 4.5 else 'PASS'}")

            # #1e9df1 (30, 157, 241) 직접 계산
            ratio_target = cr(30, 157, 241, 255, 255, 255)
            print(f"\n#1e9df1 on white: {ratio_target:.2f}:1 {'FAIL' if ratio_target < 4.5 else 'PASS'}")

        # 스크롤하며 숨겨진 요소 스크린샷
        page.evaluate("window.scrollTo(0, 600)")
        page.wait_for_timeout(400)
        page.screenshot(path=f"{screenshots_dir}/desktop_600px.png", full_page=False)

        browser.close()

    print(f"\n스크린샷: {screenshots_dir}/desktop_600px.png")

if __name__ == '__main__':
    main()
