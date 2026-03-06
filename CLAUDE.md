# CLAUDE.md

<!-- TODO: docs/PRD.md 생성 후 활성화 -->
<!-- > 제품 요구사항은 docs/PRD.md 참조. -->
<!-- TODO: docs/roadmaps/ 생성 후 활성화 -->
<!-- > 로드맵은 docs/roadmaps/ROADMAP_v*.md 참조. -->

## 프로젝트 개요

Q-Asker는 PDF, PPT, Word 파일을 업로드하면 AI가 퀴즈(빈칸, OX, 객관식)를 자동 생성해주는 웹 서비스의 프론트엔드 클라이언트이다.

## 기술 스택

| 카테고리        | 기술                                                       |
| --------------- | ---------------------------------------------------------- |
| 언어            | JavaScript (JSX) — TypeScript 미사용                       |
| 프레임워크      | React 19 + Vite 6                                          |
| 라우팅          | react-router-dom v7 (BrowserRouter, 클라이언트 사이드)     |
| 상태 관리       | Zustand 5                                                  |
| HTTP 클라이언트 | Axios (인스턴스: `src/shared/api/index.js`)                |
| SSE             | @microsoft/fetch-event-source                              |
| PDF 뷰어        | react-pdf + pdfjs-dist                                     |
| i18n            | i18nexus (ko/en, 기본: ko)                                 |
| 린터/포맷터     | ESLint 9 (flat config) + Prettier + eslint-config-prettier |
| Git hooks       | Husky                                                      |
| 분석            | react-ga4 (Google Analytics 4)                             |
| 빌드 최적화     | vite-plugin-prerender (`/`, `/ko`, `/en` 프리렌더링)       |

## 명령어 (Scripts)

| 명령어            | 설명                                             |
| ----------------- | ------------------------------------------------ |
| `npm run dev`     | 로컬 개발 서버 (dev 모드, Vite proxy로 API 연결) |
| `npm run remote`  | 원격 서버 연결 개발 모드                         |
| `npm run build`   | 프로덕션 빌드 (prod 모드)                        |
| `npm run lint`    | ESLint 실행                                      |
| `npm run preview` | 빌드 결과 미리보기 (포트 5173)                   |

## 아키텍처

### FSD (Feature-Sliced Design) 구조

```
src/
  app/          # 앱 진입점, 라우터, GA 초기화, SEO 메타 동기화
  pages/        # 페이지 컴포넌트 (라우트 단위)
  widgets/      # 조합 컴포넌트 (header, footer, help, recent-changes)
  features/     # 비즈니스 로직 단위 (prepare-quiz, solve-quiz, quiz-result 등)
  entities/     # 도메인 엔티티 (auth)
  shared/       # 공유 유틸리티, API 인스턴스, i18n, UI 컴포넌트, toast
```

### 경로 alias (Node.js subpath imports)

`package.json`의 `imports` 필드로 정의. `#` 접두사 사용:

- `#app/*` → `src/app/*`
- `#pages/*` → `src/pages/*/index.jsx`
- `#features/*` → `src/features/*/index.js`
- `#entities/*` → `src/entities/*/index.js`
- `#widgets/*` → `src/widgets/*/index.jsx`
- `#shared/*` → `src/shared/*/index.js`
- `#shared/lib/*` → `src/shared/lib/*.js`

### 라우팅 구조

| 경로                         | 페이지          |
| ---------------------------- | --------------- |
| `/`, `/ko`, `/en`            | MakeQuiz (메인) |
| `/login`                     | LoginSelect     |
| `/login/redirect`            | LoginRedirect   |
| `/quiz/:problemSetId`        | SolveQuiz       |
| `/result/:problemSetId`      | QuizResult      |
| `/explanation/:problemSetId` | QuizExplanation |
| `/history`                   | QuizHistory     |
| `/privacy-policy`            | PrivacyPolicy   |

### 핵심 데이터 플로우

1. **파일 업로드 → 퀴즈 생성**: `prepare-quiz` feature에서 파일 업로드 + 옵션 설정 → `quiz-generation` feature에서 SSE로 퀴즈 수신
2. **퀴즈 풀기 → 결과**: `solve-quiz` feature → `quiz-result` feature → `quiz-explanation` feature
3. **인증**: `entities/auth`의 Zustand store + `features/auth`의 로그인 로직, Axios 인터셉터로 토큰 자동 첨부
4. **API 통신**: `shared/api`의 Axios 인스턴스 (baseURL: `VITE_BASE_URL`, 401 시 자동 로그아웃)
5. **Vite proxy**: 개발 모드에서 `/api` 경로를 백엔드로 프록시

### 환경 변수

| 변수                     | 용도                     |
| ------------------------ | ------------------------ |
| `VITE_BASE_URL`          | API 서버 베이스 URL      |
| `VITE_GA_MEASUREMENT_ID` | Google Analytics 측정 ID |

## 개발 도구 및 설정

- 패키지 매니저: npm
- ESLint: flat config (`eslint.config.js`), Prettier와 통합
- Husky: Git hooks (`prepare` 스크립트)
- i18n 번역 관리: i18nexus (Google Sheets 연동, `i18nexus.config.json`)

## 프로젝트 초기화 체크

- `CLAUDE.md` 없음 → `/init` 안내
- `.claude/rules/` 없거나 비어있음 → `/init-rules` 안내
- `docs/PRD.md` 없음 → `/plan-feature` 안내

## CLAUDE.md 유지 규칙

이 파일은 프로젝트의 Single Source of Truth이다.
아래 변경 발생 시 CLAUDE.md를 반드시 함께 갱신한다.

| 변경 사항                       | 갱신 대상 섹션    |
| ------------------------------- | ----------------- |
| 명령어(scripts) 추가/변경/삭제  | 명령어 (Scripts)  |
| 기술 스택/주요 패키지 추가/변경 | 기술 스택         |
| 아키텍처, 라우팅 구조 변경      | 아키텍처          |
| 환경 변수 추가/변경             | 환경 변수         |
| 개발 도구 및 설정 변경          | 개발 도구 및 설정 |
| 디렉토리 구조/컨벤션 변경       | 아키텍처          |
