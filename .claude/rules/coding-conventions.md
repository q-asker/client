# 코딩 컨벤션

## 네이밍

- 컴포넌트: PascalCase (`MakeQuiz`, `QuizResult`)
- 함수/변수: camelCase (`handleSubmit`, `quizData`)
- 상수: SCREAMING_SNAKE_CASE (`MAX_RETRY_COUNT`, `SUPPORTED_LANGUAGES`)
- 파일명: kebab-case (디렉토리/파일), PascalCase (컴포넌트 JSX 파일)
- 코드 주석: 한국어

## 컴포넌트

- 함수형 컴포넌트만 사용 (클래스 컴포넌트 금지)
- 화살표 함수로 정의, default export 사용
- Props는 구조 분해 할당으로 받기

## FSD(Feature-Sliced Design) 구조

- `app/` — 앱 진입점, 전역 설정, 라우팅
- `pages/` — 페이지 컴포넌트 (각 페이지는 `index.jsx`로 export)
- `widgets/` — 조합형 UI (각 위젯은 `index.jsx`로 export)
- `features/` — 기능 단위 모듈 (각 기능은 `index.js`로 export)
- `entities/` — 도메인 엔티티 (각 엔티티는 `index.js`로 export)
- `shared/` — 공유 유틸리티, API, UI 컴포넌트

## Import 순서

1. 외부 라이브러리 (`react`, `react-router-dom`, `axios` 등)
2. 내부 모듈 — `#app/*`, `#pages/*`, `#features/*`, `#entities/*`, `#widgets/*`, `#shared/*` 별칭 사용
3. 상대경로 (`./`, `../`)

## Import 별칭

- `package.json`의 `imports` 필드로 정의된 별칭을 사용한다
- 새 모듈 추가 시 해당 레이어의 `index.js` (또는 `index.jsx`)에서 re-export 한다

## 상태 관리

- 전역 상태: Zustand store 사용
- 로컬 상태: `useState`, `useReducer`
- store는 각 feature의 `model/` 디렉토리에 배치

## 스타일링

- CSS 파일로 스타일링 (`.css`)
- 전역 스타일은 `app/` 레이어에 배치

## 비동기 처리

- API 호출: Axios 사용 (`shared/api/`)
- SSE: `@microsoft/fetch-event-source` 사용
- async/await 패턴 사용 (Promise chain 금지)

## 기타

- ES Module 사용 (`"type": "module"`)
- Prettier 포맷 준수 (singleQuote, trailingComma: all, printWidth: 100)
- ESLint 규칙 준수 (`eslint.config.js`)
