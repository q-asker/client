---
name: 디자인 변형 표준 규칙
description: 모든 페이지의 Design A-H, Magic A-D 12개 디자인 변형에 대한 전사 표준 규칙
type: reference
globs: 'src/pages/**'
---

# 디자인 변형 표준 규칙

## 개요

모든 페이지는 **Design A-H, Magic A-D** 12개 디자인 변형을 표준으로 지원한다:

- **기본**: 원본 구현 (쿼리 파라미터 없음)
- **DesignA-D**: 4개 기본 디자인 변형 (query parameter: 1-4)
- **DesignE-H**: 4개 추가 디자인 변형 (query parameter: 5-8)
- **MagicA-B**: 2개 애니메이션 변형 (query parameter: 9-10)
- **MagicC-D**: 2개 고급 애니메이션 변형 (query parameter: 11-12)

각 변형은 **lazy-loaded 컴포넌트**로 구현되며, query parameter로 활성화된다.

## 공통 레이아웃 원칙

변형마다 고유한 시각적 표현을 가지되, 다음 기본 원칙을 따른다:

### 레이아웃 구조

페이지 특성에 따라 상이하지만, 일반적으로:

```
주요 콘텐츠 영역 (flex / grid 레이아웃)
  ├─ 좌측 또는 헤더: 메타 정보/네비게이션
  └─ 우측 또는 메인: 핵심 콘텐츠
```

### 반응형 설계

- **Mobile** (< 768px): 1열 또는 스택 레이아웃
- **Tablet** (768px-1024px): 2열 레이아웃
- **Desktop** (≥ 1024px): 3열 이상 또는 사이드바 포함

## 신규 변형 작성 지침

### 핵심 원칙: 완전히 독립적인 디자인

**기존 변형을 "참조"하지 말 것**. 새로운 변형을 만들 때는:

1. **구조 독립성**: 페이지의 핵심 구조만 유지하고, 카드/컴포넌트 구조는 처음부터 설계
2. **시각적 차별성**: 색상, 타이포그래피, 아이콘, 레이아웃 등 모든 요소를 새롭게 표현
3. **애니메이션 독립성**: 기존 애니메이션을 그냥 갖다 쓰지 말고, 고유한 스타일 개발
4. **컴포넌트 재사용**: Shadcn/MagicUI를 사용할 수 있지만, 조합/스타일링은 완전히 다르게
5. **색상/그래디언트**: tweakcn 색공간(OKLch) 기반 CSS 변수 사용. HEX/RGB 금지

### 체크리스트

새 변형 추가 시:

- [ ] 기존 변형의 코드를 보지 않고 처음부터 설계
- [ ] 시각적 계층 구조 명확 (색상, 크기, 가중치로 차별화)
- [ ] 고유한 진입/상호작용 애니메이션 (copy-paste 금지)
- [ ] 색상: `oklch()` 기반 CSS 변수만 사용
- [ ] `npm run build` 성공
- [ ] `npx prettier --check .` 성공
- [ ] 비교 페이지에 버튼 추가
- [ ] 비교 페이지에서 시각적 차별성 확인

## tweakcn 스펙 준수

### CSS 변수 정의 (globals.css @theme)

모든 색상은 OKLch 색공간으로 정의된 CSS 변수 사용:

```css
@theme {
  /* 예시 */
  --color-primary: oklch(0.5 0.1 270);
  --color-primary-hover: oklch(0.55 0.1 270);
  --color-success: oklch(0.65 0.15 142);
  --color-destructive: oklch(0.65 0.18 25);
}
```

### 금지 사항

- ❌ HEX 색상 (`#ffffff`)
- ❌ RGB 색상 (`rgb(255, 255, 255)`)
- ❌ 절대 Tailwind 클래스 (`bg-slate-900`, `text-white/30`)

### 올바른 방식

- ✅ CSS 변수 클래스 (`bg-background`, `text-foreground`)
- ✅ Tailwind 투명도 수정자 (`bg-muted/60`)
- ✅ 인라인 CSS 변수 (`style={{ backgroundColor: 'var(--color-primary)' }}`)

## 성능 고려사항

### 코드 분할 (Code Splitting)

모든 변형은 `lazy()` 로딩으로 초기 번들 크기 감소:

```tsx
const DesignA = lazy(() => import('./DesignA'));
const DesignB = lazy(() => import('./DesignB'));
// ...

const VARIANTS = {
  '1': DesignA,
  '2': DesignB,
  // ...
};
```

### 애니메이션 최적화

- **CSS 기반 애니메이션**: 성능 우선 (transition, animation)
- **Framer Motion**: 복잡한 인터랙션에만 사용 (필요할 때만)
- **GPU 가속**: `transform`, `opacity` 사용 (성능 최적)

## 페이지별 규칙 참조

각 페이지는 고유한 디자인 변형 규칙을 정의한다:

- [quiz-result-design-rules.md](quiz-result-design-rules.md) — Quiz Result (12개 변형)
- [make-quiz-design-rules.md](make-quiz-design-rules.md) — Make-Quiz (8개 변형)
- [solve-quiz-design-rules.md](solve-quiz-design-rules.md) — Solve-Quiz (8개 변형)
- [quiz-explanation-design-rules.md](quiz-explanation-design-rules.md) — Quiz-Explanation (8개 변형)
- [quiz-history-design-rules.md](quiz-history-design-rules.md) — Quiz-History (8개 변형)
- [board-design-rules.md](board-design-rules.md) — Board (8개 변형)
- [board-detail-design-rules.md](board-detail-design-rules.md) — Board-Detail (8개 변형)
- [board-write-design-rules.md](board-write-design-rules.md) — Board-Write (8개 변형)
- [login-redirect-design-rules.md](login-redirect-design-rules.md) — Login-Redirect (8개 변형)
- [login-select-design-rules.md](login-select-design-rules.md) — Login-Select (8개 변형)
- [maintenance-design-rules.md](maintenance-design-rules.md) — Maintenance (8개 변형)
- [privacy-policy-design-rules.md](privacy-policy-design-rules.md) — Privacy-Policy (8개 변형)

---

## 참고 자료

- tweakcn 스펙: code-rules.md
- Framer Motion 문서: https://www.framer.com/motion/
- Shadcn UI 컴포넌트: @/shared/ui/components/
- MagicUI 컴포넌트: @/shared/ui/components/
