---
description: 'PascalCase/camelCase 네이밍, FSD 레이어 간 import 방향 제한, # alias 필수, Zustand store 위치, 절대 금지 항목'
globs: 'src/**'
---

# 코드 규칙

## 네이밍

- 컴포넌트: PascalCase (`MakeQuiz`, `SolveQuiz`)
- 함수/변수: camelCase (`usePrepareQuiz`, `quizTitle`)
- 상수: SCREAMING_SNAKE_CASE (`MAX_RETRY_COUNT`)
- 파일: 컴포넌트는 PascalCase 또는 `index.jsx`, 유틸리티는 camelCase
- 코드 주석: 한국어

## 컴포넌트

- 함수형 컴포넌트만 사용
- default export 사용
- 커스텀 훅은 `model/` 디렉토리에 `use*.js`로 작성

## FSD (Feature-Sliced Design) 구조

- **레이어 간 import 규칙**: 상위 레이어만 하위 레이어를 import 가능
  - `app` → `pages` → `widgets` → `features` → `entities` → `shared`
- **역방향 import 금지** — 하위 레이어가 상위 레이어를 import 불가
- **각 모듈의 public API**: `index.js` (또는 `index.jsx`)를 통해 노출
- **모듈 내부 파일 직접 import 금지** — 반드시 index를 통해 접근

## Import 규칙

- **모든 import는 `#` prefix alias 사용** — 상대 경로(`../../../`) 금지
- 순서:
  1. 외부 라이브러리 (`react`, `axios`, `zustand` 등)
  2. 내부 모듈 (`#app/*`, `#features/*`, `#shared/*` 등)
  3. 스타일 (`./index.css`)

## 상태 관리

- Zustand store는 `entities/` 또는 `features/` 레이어의 `store.js`에 정의
- persist middleware로 localStorage 연동 시 `partialize`로 필요한 필드만 저장

## 제약 사항

- **CLAUDE.md 수정 없이 기술 스택 변경** 금지
- **환경 변수를 코드에 하드코딩** 금지 — `.env.*` 파일 + `import.meta.env`로 관리
- 비동기: async/await 사용
- HTTP 요청: `shared/api/`의 Axios 인스턴스 사용 (직접 axios.create 금지)
- 알림: `shared/toast/`의 CustomToast 사용
