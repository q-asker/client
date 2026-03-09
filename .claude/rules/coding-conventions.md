# 코딩 컨벤션

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
- **각 모듈의 public API**: `index.js` (또는 `index.jsx`)를 통해 노출
- **외부에서는 반드시 index를 통해 import** — 내부 파일 직접 import 금지

## Import 규칙

- **모든 import는 `#` prefix alias 사용** — 상대 경로(`../../../`) 금지
- 순서:
  1. 외부 라이브러리 (`react`, `axios`, `zustand` 등)
  2. 내부 모듈 (`#app/*`, `#features/*`, `#shared/*` 등)
  3. 스타일 (`./index.css`)

## 상태 관리

- Zustand store는 `entities/` 또는 `features/` 레이어의 `store.js`에 정의
- persist middleware로 localStorage 연동 시 `partialize`로 필요한 필드만 저장

## 기타

- 비동기: async/await 사용
- HTTP 요청: `shared/api/`의 Axios 인스턴스 사용 (직접 axios.create 금지)
- 알림: `shared/toast/`의 CustomToast 사용
