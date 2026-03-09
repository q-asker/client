# CLAUDE.md

<!-- TODO: docs/PRD.md 생성 후 활성화 -->
<!-- TODO: docs/roadmaps/ 생성 후 활성화 -->

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

Q-Asker 클라이언트 — PDF, PPT, Word 파일을 업로드하면 AI가 퀴즈(빈칸, OX, 객관식)를 자동 생성하는 서비스의 프론트엔드 앱.

## 기술 스택

- **언어**: JavaScript (JSX, ES Module)
- **프레임워크**: React 19 + Vite 6
- **상태 관리**: Zustand 5 (persist middleware로 localStorage 연동)
- **라우팅**: React Router DOM 7
- **HTTP 클라이언트**: Axios (인터셉터로 JWT 토큰 자동 주입)
- **SSE**: @microsoft/fetch-event-source
- **국제화**: i18nexus (ko/en 지원)
- **PDF 처리**: pdfjs-dist, react-pdf
- **알림**: react-toastify
- **분석**: react-ga4 (Google Analytics)
- **빌드 시 프리렌더**: vite-plugin-prerender (`/`, `/ko`, `/en` 라우트)
- **린트/포맷**: ESLint 9 (flat config) + Prettier + eslint-config-prettier
- **Git 훅**: Husky + .githooks (prepare-commit-msg, pre-commit)

## 명령어 (Scripts)

```bash
npm run dev        # 로컬 개발 서버 (vite --mode dev, localhost:8080 프록시)
npm run remote     # 원격 API 대상 개발 서버 (vite --mode remote)
npm run build      # 프로덕션 빌드 (vite build --mode prod)
npm run lint       # ESLint 실행
npm run preview    # 빌드 결과 프리뷰 (port 5173)
```

## 아키텍처

### FSD (Feature-Sliced Design) 구조

```
src/
├── app/            # 앱 진입점, 라우팅, GA 초기화, SEO 메타 동기화
│   ├── App.jsx     # 라우트 정의, SEO_CONFIG, I18nProvider
│   ├── main.jsx    # ReactDOM 엔트리
│   ├── model/      # GA 초기화, 페이지뷰 트래커
│   └── ui/         # PageViewTracker
├── pages/          # 페이지 컴포넌트 (각 폴더에 index.jsx + index.css)
├── widgets/        # 독립적인 UI 블록 (header, footer, help, recent-changes)
├── features/       # 비즈니스 기능 단위
│   ├── auth/           # 로그인 처리
│   ├── prepare-quiz/   # 파일 업로드 및 퀴즈 옵션 설정
│   ├── quiz-generation/ # SSE 기반 퀴즈 스트리밍 수신
│   ├── solve-quiz/     # 퀴즈 풀기 (타이머, 답안, 제출)
│   ├── quiz-result/    # 결과 확인
│   ├── quiz-explanation/ # 해설 보기
│   └── quiz-history/   # 퀴즈 기록
├── entities/       # 도메인 엔티티 (auth store/service)
└── shared/         # 공유 모듈
    ├── api/        # Axios 인스턴스 (인터셉터, 토큰 자동 주입)
    ├── i18n/       # 다국어 번역 리소스 (ko.json, en.json)
    ├── lib/        # 유틸리티 (analytics, timer, useClickOutside)
    ├── toast/      # 커스텀 토스트
    └── ui/         # 공용 UI 컴포넌트 (logo)
```

### Import Alias (package.json `imports` 필드)

| Alias           | 경로                         |
| --------------- | ---------------------------- |
| `#app/*`        | `./src/app/*`                |
| `#pages/*`      | `./src/pages/*/index.jsx`    |
| `#features/*`   | `./src/features/*/index.js`  |
| `#entities/*`   | `./src/entities/*/index.js`  |
| `#widgets/*`    | `./src/widgets/*/index.jsx`  |
| `#shared/*`     | `./src/shared/*/index.js`    |
| `#shared/lib/*` | `./src/shared/lib/*.js`      |
| `#shared/i18n`  | `./src/shared/i18n/index.js` |

**모든 import는 `#` prefix alias를 사용한다.** 상대 경로(`../../../`) 대신 alias 사용.

### 라우팅 구조

현재 서비스 점검 모드 (`<Route path="*" element={<Maintenance />} />`)이며, 정상 운영 시:

| 경로                         | 페이지                     |
| ---------------------------- | -------------------------- |
| `/`, `/ko`, `/en`            | MakeQuiz (퀴즈 생성)       |
| `/login`                     | LoginSelect (로그인 선택)  |
| `/login/redirect`            | LoginRedirect (OAuth 콜백) |
| `/quiz/:problemSetId`        | SolveQuiz (퀴즈 풀기)      |
| `/result/:problemSetId`      | QuizResult (결과 확인)     |
| `/explanation/:problemSetId` | QuizExplanation (해설)     |
| `/history`                   | QuizHistory (퀴즈 기록)    |
| `/privacy-policy`            | PrivacyPolicy              |

### 주요 데이터 흐름

1. **인증**: `entities/auth/store.js`에서 Zustand persist로 accessToken 관리 → `shared/api/index.js`의 Axios 인터셉터가 자동 주입. 401 응답 시 인증 초기화 후 `/login` 리다이렉트.
2. **퀴즈 생성**: `features/prepare-quiz`에서 파일 업로드 및 옵션 설정 → SSE로 서버에서 퀴즈 스트리밍 수신 (`features/quiz-generation`)
3. **퀴즈 풀기**: `features/solve-quiz`에서 문제 풀기 상태 관리 (타이머, 답안, 제출)

### SEO

`App.jsx`에 `SEO_CONFIG` 객체로 한국어/영어 메타태그 및 JSON-LD 구조화 데이터 관리. `SeoMetaSync` 컴포넌트가 라우트 변경 시 동적 업데이트.

## 환경 변수

`.env.*` 파일은 `.gitignore`에 포함 — Git에 커밋하지 않는다.

| 키                       | 용도                     |
| ------------------------ | ------------------------ |
| `VITE_BASE_URL`          | 백엔드 API 기본 URL      |
| `VITE_GA_MEASUREMENT_ID` | Google Analytics 측정 ID |

모드별 파일: `.env.dev` (로컬), `.env.remote` (원격), `.env.prod` (프로덕션)

## 개발 도구 및 설정

- **패키지 매니저**: npm
- **Node.js**: 22.15.0
- **포맷터**: Prettier (`singleQuote`, `trailingComma: "all"`, `printWidth: 100`)
- **린터**: ESLint 9 flat config + eslint-config-prettier
- **Git Hooks**: `.githooks/` 디렉토리 (`core.hooksPath` 설정)
  - `prepare-commit-msg`: 브랜치에서 JIRA 티켓 감지 → 커밋 메시지 접두사 자동 추가
  - `pre-commit`: Prettier 포맷 검증 — 위반 시 커밋 차단
- **배포**: develop 브랜치 push → GitHub Actions → AWS S3 업로드 (`dist/`)
- **Vite 프록시**: 개발 모드에서 `/api` 요청을 `VITE_BASE_URL`로 프록시 (origin 헤더 제거)
