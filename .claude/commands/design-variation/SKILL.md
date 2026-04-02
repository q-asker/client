---
description: '디자인 바리에이션 생성 — MagicUI 채용 버전과 일반 버전을 분할 생성'
---

# /design-variation — 디자인 바리에이션 분할 생성

사용자가 디자인 바리에이션을 요청하면, **MagicUI 채용 버전**과 **일반 버전**으로 분할하여 `/frontend-design` 스킬로 각각 생성한다.

## 입력 파싱

사용자 요청에서 다음을 추출한다:

1. **총 바리에이션 수** (N) — 명시하지 않으면 기본값 2
2. **디자인 대상** — 어떤 컴포넌트/페이지/섹션을 디자인할지

## 분할 규칙

총 N개 바리에이션을 아래 비율로 분할한다:

| 총 개수 (N) | MagicUI 버전 | 일반 버전 |
| ----------- | ------------ | --------- |
| 1           | 1            | 0         |
| 2           | 1            | 1         |
| 3           | 1            | 2         |
| 4           | 2            | 2         |
| 5           | 2            | 3         |
| 6+          | ⌊N/2⌋        | ⌈N/2⌉     |

**원칙**: 일반 버전 ≥ MagicUI 버전 (홀수일 때 일반이 1개 더 많음)

## 실행 절차

### STEP 1 — 디자인 대상 분석

- 대상 컴포넌트/페이지의 기존 코드를 읽고 구조를 파악한다
- 프로젝트의 디자인 토큰(`src/app/globals.css` @theme)을 확인한다
- 기존 Shadcn/MagicUI 컴포넌트 활용 가능 여부를 확인한다

### STEP 2 — 각 바리에이션을 `/frontend-design` 스킬로 생성

분할 규칙에 따라 N개의 바리에이션을 순서대로 생성한다. **각 바리에이션마다 `/frontend-design` 스킬을 호출**하되, MagicUI 여부에 따라 프롬프트를 다르게 구성한다.

#### MagicUI 버전 프롬프트 구성

`/frontend-design` 스킬 호출 시 아래 지침을 프롬프트에 포함한다:

```
{사용자의 원래 디자인 요청}

추가 지침:
- MagicUI 컴포넌트를 적극 활용하여 디자인한다
- 이미 설치된 MagicUI: blur-fade, marquee, shimmer-button
- 새 MagicUI 컴포넌트가 필요하면 설치한다:
  npx shadcn@latest add "https://magicui.design/r/{컴포넌트명}"
- MagicUI 컴포넌트를 최소 2개 이상 조합하여 사용한다
- 활용 가능한 MagicUI 컴포넌트 카탈로그:
  · 텍스트: aurora-text, animated-shiny-text, animated-gradient-text, hyper-text, sparkles-text, typing-animation, text-animate, morphing-text, line-shadow-text
  · 배경: grid-pattern, dot-pattern, retro-grid, particles, meteors, flickering-grid, ripple, animated-grid-pattern
  · 카드: magic-card, neon-gradient-card, warp-background, shine-border, border-beam
  · 버튼: shimmer-button, shiny-button, pulsating-button, rainbow-button, interactive-hover-button
  · 리스트: animated-list, bento-grid, marquee, number-ticker
  · 전환: blur-fade, text-reveal, scroll-based-velocity, confetti
  · 기타: dock, scroll-progress, orbiting-circles, icon-cloud, avatar-circles
```

#### 일반 버전 프롬프트 구성

`/frontend-design` 스킬 호출 시 아래 지침을 프롬프트에 포함한다:

```
{사용자의 원래 디자인 요청}

추가 지침:
- MagicUI 컴포넌트를 사용하지 않는다
- CSS-only 애니메이션 또는 Framer Motion만 사용한다
- Shadcn UI 컴포넌트를 기반으로 한다
```

#### 바리에이션 간 차별화

- 각 바리에이션은 서로 **확연히 다른 미학적 방향**을 가져야 한다
- `/frontend-design` 스킬 호출 시 이전 바리에이션과 다른 톤을 지정한다 (예: 미니멀 → 맥시멀 → 레트로 → 오가닉)

### STEP 3 — Compare HTML 업데이트

바리에이션 생성 후, `public/des/{page}-compare.html` 파일의 `ALL_VARIANTS` 배열에 새 바리에이션을 등록한다.

#### 규칙

1. **대상 파일 확인**: `public/des/` 디렉토리에서 해당 페이지의 compare HTML 파일을 찾는다
   - 파일명 패턴: `{page-name}-compare.html` (예: `board-detail-compare.html`, `solve-quiz-compare.html`)
   - 파일이 없으면 기존 compare HTML을 템플릿으로 복사하여 새로 생성한다

2. **ALL_VARIANTS 배열 업데이트**: 기존 배열에 새 바리에이션 항목을 추가한다. key는 1부터 증가하는 번호를 사용한다.

   ```javascript
   var ALL_VARIANTS = [
     { key: '', label: 'Original — 기존 디자인' },
     { key: '1', label: '1 — {미학적 방향} ({사용 컴포넌트})' },
     { key: '2', label: '2 — {미학적 방향} ({사용 컴포넌트})' },
     // ... 생성된 바리에이션 모두 추가
   ];
   ```

3. **라벨 형식**: `{key} — {미학적 방향} ({주요 컴포넌트 나열})`
   - 예: `MagicA — Glass Elegance (BlurFade, TextAnimate, MagicCard)`

4. **기존 항목 유지**: 이미 존재하는 바리에이션은 삭제하지 않는다. 새 항목만 추가한다

5. **buildSrc 함수 확인**: 쿼리 파라미터 키가 해당 페이지의 variant 스위칭 파라미터와 일치하는지 확인한다
   - `index.tsx`의 `VARIANTS` 객체에서 사용하는 쿼리 파라미터 키 확인 (예: `bdd`, `bd`, `sq` 등)

### STEP 4 — 결과 정리

모든 바리에이션 생성 후, 비교 요약을 제공한다:

```
| # | 미학적 방향 | MagicUI | 사용 컴포넌트 |
|---|---|---|---|
| 1 | {방향} | ✅ | {목록} |
| 2 | {방향} | ❌ | Shadcn only |
```

Compare 페이지 URL도 함께 안내한다: `http://localhost:5173/des/{page}-compare.html`

## 프로젝트 제약 사항 (모든 바리에이션에 공통 적용)

`/frontend-design` 스킬 호출 시 아래 제약을 항상 프롬프트에 포함한다:

- **색상**: tweakcn CSS 변수만 사용 — HEX/RGB 직접 지정 금지, Tailwind 기본 팔레트 금지
- **Import**: FSD 아키텍처 별칭 사용 (`#features/*`, `#shared/*`, `@/shared/ui/components/*`)
- **CSS**: 커스텀 CSS는 `src/app/globals.css`에만 — 컴포넌트별 CSS 파일 생성 금지
- **다국어**: 사용자 노출 텍스트는 i18nexus 번역 키 사용
- **포맷팅**: Prettier 규칙 준수 (singleQuote, printWidth 100, trailingComma all)
