"""
oklch 색상을 RGB로 변환하여 대비 비율 계산
--primary: oklch(0.6723 0.1606 244.9955)
#1e9df1: rgb(30, 157, 241)
"""

import math

def oklch_to_oklab(L, C, h_deg):
    h_rad = math.radians(h_deg)
    a = C * math.cos(h_rad)
    b = C * math.sin(h_rad)
    return L, a, b

def oklab_to_linear_srgb(L, a, b):
    l_ = L + 0.3963377774 * a + 0.2158037573 * b
    m_ = L - 0.1055613458 * a - 0.0638541728 * b
    s_ = L - 0.0894841775 * a - 1.2914855480 * b

    l = l_ ** 3
    m = m_ ** 3
    s = s_ ** 3

    r =  4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
    g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
    b_out = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s

    return r, g, b_out

def linear_to_srgb(c):
    if c <= 0:
        return 0
    if c >= 1:
        return 255
    if c <= 0.0031308:
        return round(c * 12.92 * 255)
    return round((1.055 * (c ** (1/2.4)) - 0.055) * 255)

def oklch_to_rgb(L, C, h):
    lab_L, lab_a, lab_b = oklch_to_oklab(L, C, h)
    lr, lg, lb = oklab_to_linear_srgb(lab_L, lab_a, lab_b)
    r = linear_to_srgb(lr)
    g = linear_to_srgb(lg)
    b = linear_to_srgb(lb)
    return r, g, b

def relative_luminance(r, g, b):
    def lin(c):
        c /= 255.0
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)

def contrast_ratio(r1, g1, b1, r2, g2, b2):
    l1 = relative_luminance(r1, g1, b1)
    l2 = relative_luminance(r2, g2, b2)
    lighter = max(l1, l2)
    darker = min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)

print("=" * 60)
print("WCAG 2.1 색상 대비 감사 보고서")
print("=" * 60)

# --primary: oklch(0.6723 0.1606 244.9955)
pr, pg, pb = oklch_to_rgb(0.6723, 0.1606, 244.9955)
print(f"\n--primary oklch(0.6723, 0.1606, 244.9955)")
print(f"  변환 RGB: rgb({pr}, {pg}, {pb})")
print(f"  HEX 근사: #{pr:02x}{pg:02x}{pb:02x}")

ratio_white = contrast_ratio(pr, pg, pb, 255, 255, 255)
ratio_black = contrast_ratio(pr, pg, pb, 0, 0, 0)
print(f"  on white (255,255,255): {ratio_white:.2f}:1  {'PASS' if ratio_white >= 4.5 else 'FAIL (< 4.5)'}")
print(f"  on black (0,0,0):       {ratio_black:.2f}:1  {'PASS' if ratio_black >= 4.5 else 'FAIL'}")

# bg-primary/10 배경색 계산 (흰 배경에 10% primary 오버레이)
# 혼합: bg = white * 0.9 + primary * 0.1
bg_r = round(255 * 0.9 + pr * 0.1)
bg_g = round(255 * 0.9 + pg * 0.1)
bg_b = round(255 * 0.9 + pb * 0.1)
ratio_primary10 = contrast_ratio(pr, pg, pb, bg_r, bg_g, bg_b)
print(f"\n  on bg-primary/10 (rgb({bg_r},{bg_g},{bg_b})): {ratio_primary10:.2f}:1  {'PASS' if ratio_primary10 >= 4.5 else 'FAIL (< 4.5)'}")
print(f"  (숫자 배지: text-primary on bg-primary/10)")

# --ring: oklch(0.6818 0.1584 243.354)
rr, rg, rb = oklch_to_rgb(0.6818, 0.1584, 243.354)
print(f"\n--ring oklch(0.6818, 0.1584, 243.354)")
print(f"  변환 RGB: rgb({rr}, {rg}, {rb})")
ratio_ring_white = contrast_ratio(rr, rg, rb, 255, 255, 255)
print(f"  on white: {ratio_ring_white:.2f}:1  {'PASS' if ratio_ring_white >= 4.5 else 'FAIL'}")

# #1e9df1 (30, 157, 241) — 직접 대비 계산
print(f"\n#1e9df1 rgb(30, 157, 241)")
ratio_1e9df1 = contrast_ratio(30, 157, 241, 255, 255, 255)
print(f"  on white: {ratio_1e9df1:.2f}:1  {'PASS' if ratio_1e9df1 >= 4.5 else 'FAIL (< 4.5)'}")
ratio_1e9df1_black = contrast_ratio(30, 157, 241, 0, 0, 0)
print(f"  on black: {ratio_1e9df1_black:.2f}:1  {'PASS' if ratio_1e9df1_black >= 4.5 else 'FAIL'}")

# 로그인 링크: text-primary on 헤더 배경
print(f"\n--- 로그인 링크 (text-primary) ---")
# 헤더 배경이 흰색이라 가정
print(f"  '로그인' 텍스트: primary rgb({pr},{pg},{pb}) on white")
print(f"  대비: {ratio_white:.2f}:1  {'PASS' if ratio_white >= 4.5 else 'FAIL (< 4.5)'}")

# accent: oklch(0.9392 0.0166 250.8453)
ar, ag, ab = oklch_to_rgb(0.9392, 0.0166, 250.8453)
print(f"\n--accent oklch(0.9392, 0.0166, 250.8453)")
print(f"  변환 RGB: rgb({ar}, {ag}, {ab})")
ratio_acc_white = contrast_ratio(ar, ag, ab, 255, 255, 255)
print(f"  on white: {ratio_acc_white:.2f}:1  (배경용 색상, 텍스트 대비 무관)")

print("\n" + "=" * 60)
print("요약")
print("=" * 60)

checks = [
    ("--primary on white", ratio_white, 4.5, f"rgb({pr},{pg},{pb})", "흰 배경에 primary 텍스트/링크"),
    ("--primary on bg-primary/10", ratio_primary10, 4.5, f"rgb({pr},{pg},{pb})", "숫자 배지 (1~6단계 아이콘)"),
    ("#1e9df1 on white", ratio_1e9df1, 4.5, "rgb(30,157,241)", "요청된 타깃 색상"),
    ("--ring on white", ratio_ring_white, 4.5, f"rgb({rr},{rg},{rb})", "포커스 링"),
]

print()
for name, ratio, threshold, color, desc in checks:
    status = "PASS" if ratio >= threshold else "FAIL"
    print(f"  [{status}] {name}: {ratio:.2f}:1 (기준 {threshold}:1)")
    print(f"         색상: {color}  / {desc}")
    print()
