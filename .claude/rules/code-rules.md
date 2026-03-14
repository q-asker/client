---
description: 'React/TypeScript 코딩 컨벤션, FSD 아키텍처 규칙, 네이밍, 제약 사항'
globs: '**/*.{ts,tsx,js,jsx,css}'
---

# 코드 규칙

## 네이밍

- 컴포넌트: PascalCase (`MakeQuiz`, `HeaderDesignA`)
- 훅: camelCase, `use` 접두사 (`useHeader`, `usePrepareQuiz`)
- 변수/함수: camelCase (`quizTitle`, `handleSubmit`)
- 상수: SCREAMING_SNAKE_CASE (`GA_MEASUREMENT_ID`, `SUPPORTED_LANGUAGES`)
- 타입/인터페이스: PascalCase (`QuizOption`, `AuthConfig`)
- 파일: 컴포넌트는 PascalCase (`MakeQuizDesignA.tsx`), 훅/유틸은 camelCase (`useHeader.ts`)
- 코드 주석: 한국어

## FSD 아키텍처 규칙

- **의존 방향**: `app` → `pages` → `widgets` → `features` → `entities` → `shared`
- **역방향 의존 금지**: 하위 레이어가 상위 레이어를 참조하지 않는다
- **횡단 참조 금지**: 같은 레이어 내 슬라이스 간 직접 import 금지
- **shared**: 비즈니스 로직 없이 재사용 가능한 유틸, UI 컴포넌트, API 인스턴스만 포함

## Import 규칙

- FSD 슬라이스 간: `#` 별칭 사용 (`#features/auth`, `#widgets/header`, `#shared/api`)
- Shadcn/내부 참조: `@/` 별칭 사용 (`@/shared/ui/components/button`)
- 각 슬라이스의 `index.ts(x)`가 public API 역할 — 내부 파일 직접 import 금지

## 컴포넌트 구조

- **페이지**: `src/pages/{page-name}/index.tsx`가 진입점, 디자인 변형은 같은 디렉토리에 위치
- **위젯**: `src/widgets/{widget-name}/index.tsx`가 진입점, `model/` 하위에 훅 분리
- **Shadcn UI**: `src/shared/ui/components/`에 위치, `components.json` 설정에 따라 shadcn CLI로 추가
- **디자인 변형**: `DesignA/B`, `MagicA/B` 패턴으로 여러 변형 관리, `index.tsx`에서 활성 변형 export

## 상태 관리

- 전역 상태: Zustand store (`entities/auth/store.ts` 등)
- 페이지/기능 상태: 커스텀 훅 (`features/*/model/use*.ts`)
- 서버 상태: Axios 직접 호출 (React Query 미사용)

## 포맷팅

- **Prettier** 적용 — singleQuote, printWidth 100, trailingComma all
- 파일 끝 개행 필수
- 사용하지 않는 import 금지

## 제약 사항

- **CLAUDE.md 수정 없이 기술 스택 변경** 금지
- **환경 변수를 코드에 하드코딩** 금지 — `.env.*` + `import.meta.env.VITE_*` 사용
- **API 호출**: `shared/api`의 axiosInstance 사용 (axios 직접 생성 금지)
- **스타일링**: Tailwind CSS 유틸리티 클래스 우선, 인라인 스타일 지양
- **CSS 파일**: 커스텀 CSS는 반드시 `src/app/globals.css`에만 작성 — 컴포넌트별 `.css` 파일 생성 금지, 별도 CSS 모듈 금지
- **다국어**: 사용자 노출 텍스트는 `i18nexus` 번역 키 사용

## tweakcn 스펙 준수 (테마 색상)

**핵심 원칙:**

- 모든 색상은 CSS 변수 (`--color-*`) 로 `src/app/globals.css`의 `@theme` 블록에 정의
- 색공간: **OKLch** (`oklch()` 함수만 사용)
- 컴포넌트: HEX/RGB/절대값 금지 — `bg-background`, `text-foreground` 같은 CSS 변수 클래스만 사용

**CSS 변수 정의 방식:**

```css
@theme {
  /* ❌ 절대 금지 */
  --color-wrong: #ffffff; /* HEX */
  --color-wrong: rgb(255, 255); /* RGB */

  /* ✅ 올바른 방식 */
  --color-my-color: oklch(1 0 0); /* 완전 불투명 흰색 */
  --color-my-color-hover: oklch(1 0 0 / 0.9); /* 투명도 포함 */
}
```

**컴포넌트에서 사용:**

```tsx
/* ❌ 절대 금지 */
<div className="bg-slate-900 text-white/30 dark:bg-white/50">

/* ✅ 올바른 방식 - CSS 변수 클래스 사용 */
<div className="bg-background text-foreground dark:bg-card">

/* ✅ 기존 변수 조합 (반투명도 필요 시) */
<div className="bg-muted/60 backdrop-blur-md">
```

**새 색상 추가 절차 (예: 다크 테마):**

1. `globals.css @theme` 블록에 CSS 변수 정의:

```css
@theme {
  --color-surface-dark: oklch(0.15 0.05 264.66);
  --color-surface-dark-hover: oklch(0.22 0.05 264.66);
}
```

2. 컴포넌트에서 Tailwind 클래스로 사용:

```tsx
<div className="bg-surface-dark hover:bg-surface-dark-hover">
```

**반투명/투명도 처리:**

- CSS 변수에 포함: `oklch(0.5 0.1 270 / 0.3)` (0.3 = 30% 투명도)
- Tailwind 수정자: `bg-surface-dark/60` (60% 투명도)
- 두 방식 병행 가능하되, 색상값은 항상 `oklch()` 형식
