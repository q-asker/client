# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

Q-Asker는 PDF, PPT, Word 파일을 업로드하면 AI가 퀴즈를 자동 생성해주는 웹 서비스의 프론트엔드 클라이언트이다. 다국어(ko/en) 지원, OAuth 로그인, 퀴즈 히스토리 관리 기능을 포함한다.

## 기술 스택

- **언어**: TypeScript 5.9
- **프레임워크**: React 19 + Vite 6
- **스타일링**: Tailwind CSS 4 (Vite 플러그인)
- **UI 컴포넌트**: Shadcn UI (new-york 스타일) + MagicUI (blur-fade, marquee, shimmer-button 등)
- **상태 관리**: Zustand 5
- **라우팅**: React Router DOM 7
- **HTTP 클라이언트**: Axios (인터셉터 기반 인증/리프레시 토큰 처리)
- **다국어**: i18nexus
- **애니메이션**: Framer Motion 12
- **PDF 뷰어**: react-pdf + pdfjs-dist
- **분석**: Google Analytics 4 (react-ga4)
- **마크다운**: react-markdown + remark-gfm
- **알림**: react-toastify
- **포맷터**: Prettier 3
- **린터**: ESLint 9 (eslint-config-prettier 통합)
- **패키지 매니저**: npm
- **Node.js**: v24

## 명령어 (Scripts)

```bash
npm run dev        # 로컬 개발 서버 (--mode dev)
npm run remote     # 원격 API 연결 개발 (--mode remote)
npm run build      # 프로덕션 빌드 (--mode prod, prerender 포함)
npm run lint       # ESLint 검사
npm run preview    # 빌드 결과 프리뷰 (port 5173)

# 포맷팅
npx prettier --check .    # 포맷 검증
npx prettier --write .    # 포맷 적용
```

## 아키텍처

FSD(Feature-Sliced Design) 아키텍처를 따른다.

```
src/
├── app/              # 앱 진입점, 라우팅, 전역 설정 (App.tsx, main.tsx, globals.css)
│   ├── model/        # GA 초기화, 페이지 타이틀 관리
│   └── ui/           # PageViewTracker
├── pages/            # 라우트별 페이지 컴포넌트
│   ├── make-quiz/    # 퀴즈 생성 (메인 페이지, / /ko /en)
│   ├── solve-quiz/   # 퀴즈 풀기 (/quiz/:problemSetId)
│   ├── quiz-result/  # 결과 확인 (/result/:problemSetId)
│   ├── quiz-explanation/ # 해설 (/explanation/:problemSetId)
│   ├── quiz-history/ # 히스토리 (/history)
│   ├── board*/       # 게시판 (/boards, /boards/:boardId, /boards/write)
│   ├── login-*/      # 로그인 (/login, /login/redirect)
│   └── ...
├── widgets/          # 페이지 조합 위젯 (header, footer, help, recent-changes)
├── features/         # 비즈니스 로직 훅 (prepare-quiz, solve-quiz, quiz-generation 등)
├── entities/         # 도메인 모델 (auth — store, service, types)
└── shared/           # 공유 유틸리티
    ├── api/          # Axios 인스턴스 + 인터셉터 (인증 토큰 자동 첨부/리프레시)
    ├── i18n/         # 다국어 번역 JSON (ko.json, en.json)
    ├── lib/          # 유틸 훅/함수 (analytics, timer, useClickOutside)
    ├── toast/        # 커스텀 토스트
    └── ui/           # Shadcn/MagicUI 컴포넌트, 로고
        ├── components/  # button, card, dialog, input, select, tabs, skeleton 등
        └── lib/         # cn() 유틸 (utils.ts)
```

### 모듈 임포트 규칙

`package.json`의 `imports` 필드로 경로 별칭을 정의한다:

- `#app/*` → `src/app/*`
- `#pages/*` → `src/pages/*/index.tsx`
- `#features/*` → `src/features/*/index.ts`
- `#entities/*` → `src/entities/*/index.ts`
- `#widgets/*` → `src/widgets/*/index.tsx`
- `#shared/*` → `src/shared/*/index.ts`
- `@/*` → `src/*` (tsconfig paths, Shadcn 컴포넌트 내부 참조용)

### 디자인 변형 패턴

위젯/페이지에 `DesignA`, `DesignB`, `MagicA`, `MagicB` 등 디자인 변형 컴포넌트가 존재한다. `index.tsx`에서 현재 활성 변형을 export한다.

### 디자인 토큰 (tweakcn 스펙 준수)

`src/app/globals.css`의 `@theme` 블록에 브랜드 색상, Shadcn 시맨틱 토큰, 그림자, 애니메이션을 정의한다. 폰트는 Pretendard (400/500/700).

테마 CSS 변수는 [tweakcn](https://tweakcn.com/) 스펙을 따른다:

- **색공간**: OKLch (`oklch()`) 사용 — HEX/RGB 대신 OKLch로 색상을 정의한다
- **필수 시맨틱 변수**: `--background`, `--foreground`, `--primary`, `--secondary`, `--accent`, `--muted`, `--destructive`, `--card`, `--popover`, `--border`, `--input`, `--ring` 및 각 `*-foreground` 쌍
- **사이드바 변수**: `--sidebar-background`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-accent`, `--sidebar-border`, `--sidebar-ring` 등
- **차트 색상**: `--chart-1` ~ `--chart-5`
- **기하학**: `--radius` (모서리 반경), `--spacing` (간격 단위)
- **그림자**: `--shadow-color`, `--shadow-opacity`, `--shadow-blur`, `--shadow-spread`, `--shadow-offset-x`, `--shadow-offset-y`
- **타이포그래피**: `--font-sans`, `--font-serif`, `--font-mono`, `--letter-spacing`
- **다크 모드**: 라이트/다크 모드 각각 별도의 OKLch 값 정의
- 새로운 컴포넌트 추가 시 tweakcn 에디터에서 생성한 테마 코드를 기반으로 CSS 변수를 정의한다

### 디자인 변형 표준화

모든 페이지는 **Design A-H, Magic A-D** 12개 디자인 변형을 지원한다. 각 변형은 lazy-loaded 컴포넌트로 구현되며, query parameter로 활성화된다. 규칙: `.claude/rules/design-variants-rules.md` 및 `.claude/rules/{page}-design-rules.md` 참조.

## 환경 변수

`.env.dev`, `.env.remote`, `.env.prod` 파일 사용 (gitignored):

- `VITE_BASE_URL` — API 서버 URL
- `VITE_GA_MEASUREMENT_ID` — Google Analytics 측정 ID

## 개발 도구 및 설정

- **Prettier**: `.prettierrc` — singleQuote, printWidth 100, trailingComma all
- **ESLint**: `eslint.config.js` — flat config, TypeScript + React Hooks + React Refresh
- **Shadcn CLI**: `components.json` — 컴포넌트 경로 `@/shared/ui/components`, 유틸 경로 `@/shared/ui/lib/utils`
- **Git Hooks** (`.githooks/`):
  - `prepare-commit-msg`: 브랜치에서 JIRA 티켓 감지 → 커밋 메시지 접두사 자동 추가
  - `pre-commit`: `npx prettier --check .` — 포맷 위반 시 커밋 차단
  - `pre-push`: `npx prettier --check .` — push 전 포맷 안전망
- **Prerender**: `vite-plugin-prerender` — 빌드 시 `/`, `/ko`, `/en` 프리렌더링
- **SEO**: `index.html` + `App.tsx`에서 JSON-LD 구조화 데이터, Open Graph, 다국어 alternate 관리
