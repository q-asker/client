# Development Guidelines

## 프로젝트 개요

- **프로젝트**: Q-Asker Client — AI 기반 퀴즈 생성/풀이 웹 애플리케이션 프론트엔드
- **기술 스택**: JavaScript (JSX), React 19, Vite 6, Zustand 5, Axios, React Router DOM 7
- **아키텍처**: FSD (Feature-Sliced Design)
- **마이그레이션 진행 중**: TypeScript + Tailwind CSS v4 + Shadcn UI + MagicUI
- **언어**: 코드 주석, 커밋 메시지, 문서 모두 **한국어**

## 프로젝트 아키텍처

### 디렉토리 구조

```
src/
├── app/          # 앱 진입점, 전역 설정, GA 추적
├── pages/        # 라우트별 페이지 (12개)
├── widgets/      # 조합 컴포넌트 (header, footer, help, recent-changes)
├── features/     # 비즈니스 기능 (auth, prepare-quiz, quiz-generation 등 7개)
├── entities/     # 도메인 엔티티 (auth)
├── shared/       # 공유 유틸리티 (api, i18n, lib, toast, ui)
└── assets/       # 정적 자산
```

### FSD 레이어 의존성 규칙

```
app → pages → widgets → features → entities → shared
```

- **역방향 의존 금지**: shared에서 features를 import하지 않는다
- **같은 레이어 횡단 참조 금지**: feature A가 feature B를 직접 import하지 않는다
- **공유 로직은 shared로**: 여러 레이어에서 사용하는 로직은 `shared/`에 배치

### Import 별칭 (package.json imports)

| 별칭            | 경로                         |
| --------------- | ---------------------------- |
| `#app/*`        | `./src/app/*`                |
| `#pages/*`      | `./src/pages/*/index.jsx`    |
| `#features/*`   | `./src/features/*/index.js`  |
| `#entities/*`   | `./src/entities/*/index.js`  |
| `#widgets/*`    | `./src/widgets/*/index.jsx`  |
| `#shared/*`     | `./src/shared/*/index.js`    |
| `#shared/lib/*` | `./src/shared/lib/*.js`      |
| `#shared/i18n`  | `./src/shared/i18n/index.js` |

- 레이어 간 import 시 반드시 별칭 사용
- 레이어 내부는 상대 경로 사용 (예: `./model/useQuizGeneration`)

## 코드 규칙

### 네이밍

| 대상           | 규칙                 | 예시                               |
| -------------- | -------------------- | ---------------------------------- |
| 컴포넌트       | PascalCase           | `QuizForm.jsx`, `HeaderWidget.jsx` |
| 함수/변수      | camelCase            | `handleSubmit`, `quizTitle`        |
| 상수           | SCREAMING_SNAKE_CASE | `MAX_RETRY_COUNT`                  |
| 디렉토리       | kebab-case           | `quiz-generation`, `solve-quiz`    |
| 컴포넌트 파일  | PascalCase.jsx       | `PageViewTracker.jsx`              |
| 유틸/모델 파일 | camelCase.js         | `useQuizHistory.js`                |

### 포맷팅

- **Prettier**: `singleQuote: true`, `printWidth: 100`, `trailingComma: all`
- **ESLint**: 9 flat config (`eslint.config.js`)
- 사용하지 않는 import 금지

### 컴포넌트 구조

- **함수형 컴포넌트만** 사용 (클래스 컴포넌트 금지)
- 각 feature/page/widget의 진입점: `index.js` 또는 `index.jsx`에서 public API만 export

### 상태 관리

- **전역 상태**: Zustand store (해당 feature의 `model/` 디렉토리에 배치)
- **서버 상태**: Axios + 커스텀 훅
- **로컬 상태**: React useState/useReducer

## 기능 구현 규칙

### 새 feature 추가 시

1. `src/features/{feature-name}/` 디렉토리 생성 (kebab-case)
2. `model/` — 훅, 스토어, 비즈니스 로직
3. `ui/` — UI 컴포넌트 (있을 경우)
4. `index.js` — public API export
5. FSD 레이어 의존성 준수 확인

### 새 page 추가 시

1. `src/pages/{page-name}/` 디렉토리 생성
2. `index.jsx` — 페이지 컴포넌트 (features/widgets 조합)
3. `index.css` — 페이지 스타일 (마이그레이션 후 Tailwind로 전환)
4. `App.jsx`의 Routes에 라우트 추가

### API 호출

- **반드시** `shared/api/`의 Axios 인스턴스를 통해서만 수행
- 직접 `axios.get()`, `fetch()` 사용 금지
- 인터셉터에서 인증 토큰 자동 처리

### 환경 변수

- `import.meta.env.VITE_*` 사용
- 하드코딩 금지
- 환경 파일: `.env.dev`, `.env.prod`, `.env.remote`

## 문서 연동 규칙 (핵심)

### 코드 변경 시 반드시 갱신할 문서

| 코드 변경                       | 갱신 대상                     |
| ------------------------------- | ----------------------------- |
| `package.json` 의존성 추가/삭제 | `CLAUDE.md` 기술 스택         |
| `src/` 디렉토리 구조 변경       | `CLAUDE.md` 아키텍처          |
| `.env*` 변수 추가/삭제          | `CLAUDE.md` 환경 변수         |
| `vite.config.*` 변경            | `CLAUDE.md` 개발 도구         |
| Task 완료/추가                  | `docs/roadmaps/ROADMAP_v*.md` |
| PRD 변경                        | `docs/PRD.md`                 |

- **코드 변경과 문서 갱신은 동일 작업 단위**로 수행
- CLAUDE.md 갱신 누락 채 커밋 금지

## 빌드/검증 명령어

```bash
npm run dev        # 로컬 개발 서버
npm run build      # 프로덕션 빌드 — 항상 성공해야 함
npm run lint       # ESLint 실행
npx prettier --check .  # 포맷 검증 — 항상 통과해야 함
npx prettier --write .  # 포맷 자동 적용
```

- **모든 Task 완료 후** `npm run build`와 `npx prettier --check .` 통과 확인 필수

## 마이그레이션 규칙 (현재 진행 중)

### JS/TS 공존 원칙

- `allowJs: true` — 기존 JS/JSX 파일 정상 동작 유지
- 새 파일은 `.ts`/`.tsx`로 생성
- 기존 파일은 해당 Phase의 Task에서만 `.ts`/`.tsx`로 전환
- `index.html`의 진입점(`/src/app/main.jsx`)은 Phase 7까지 유지

### CSS/Tailwind 공존 원칙

- 기존 `.css` 파일은 해당 Phase의 Task에서만 Tailwind로 전환
- 전환 전까지 기존 CSS import 유지
- `globals.css`는 Phase 1에서 생성, 기존 CSS 제거는 각 레이어 마이그레이션 시 수행

### Shadcn UI 컴포넌트 배치

- `src/shared/ui/components/` — Shadcn 컴포넌트
- `src/shared/ui/lib/utils.ts` — `cn()` 유틸리티 함수
- `components.json`의 aliases가 FSD 구조와 일치해야 함

### 마이그레이션 Phase 순서

```
Phase 1: 빌드 환경 → Phase 2: shared → Phase 3: entities →
Phase 4: features → Phase 5: widgets → Phase 6: pages →
Phase 7: app → Phase 8: 정리/검증 → Phase 9: MagicUI
```

- 하위 레이어부터 상위 레이어로 순차 전환
- 각 Phase 완료 후 빌드 검증 필수

## 금지 사항

- **역방향 FSD 의존**: shared → features, entities → features 등
- **횡단 참조**: feature A → feature B 직접 import
- **환경변수 하드코딩**: URL, API 키 등을 코드에 직접 작성
- **클래스 컴포넌트**: 함수형 컴포넌트만 사용
- **직접 API 호출**: `fetch()`, `axios.get()` 대신 `shared/api/` 인스턴스 사용
- **CLAUDE.md 미갱신 커밋**: 기술 스택/아키텍처 변경 시 문서 동기화 필수
- **Phase 순서 위반**: 하위 레이어 마이그레이션 완료 전 상위 레이어 전환 금지
- **기존 파일 임의 삭제**: 마이그레이션 대상 파일은 해당 Task에서만 처리

## 주요 파일 상호작용

| 변경 파일                   | 함께 확인/수정할 파일                         |
| --------------------------- | --------------------------------------------- |
| `vite.config.ts`            | `CLAUDE.md` (개발 도구), `tsconfig.json`      |
| `package.json`              | `CLAUDE.md` (기술 스택)                       |
| `eslint.config.js`          | `.prettierrc`, `CLAUDE.md` (개발 도구)        |
| `src/shared/api/index.*`    | 모든 API 호출 feature/page                    |
| `src/entities/auth/store.*` | `src/widgets/header/`, `src/features/auth/`   |
| `src/app/App.jsx`           | 라우트 변경 시 모든 page 컴포넌트             |
| `components.json`           | `src/shared/ui/` 디렉토리 구조                |
| `src/app/globals.css`       | `src/app/main.jsx` (import), `vite.config.ts` |
