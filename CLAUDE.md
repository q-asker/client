# Q-Asker Client

AI 기반 퀴즈 생성 및 풀이 웹 애플리케이션의 프론트엔드 클라이언트.

## 기술 스택

- **언어/프레임워크**: TypeScript 5, React 19
- **빌드 도구**: Vite 6
- **CSS 프레임워크**: Tailwind CSS v4 (`@tailwindcss/vite`)
- **UI 컴포넌트**: Shadcn UI (clsx, tailwind-merge, class-variance-authority, lucide-react)
- **상태 관리**: Zustand 5
- **라우팅**: React Router DOM 7
- **HTTP 클라이언트**: Axios
- **국제화**: i18nexus
- **PDF**: react-pdf (pdfjs-dist)
- **알림**: react-toastify
- **분석**: react-ga4 (Google Analytics 4)
- **린터**: ESLint 9 (eslint-plugin-react-hooks, eslint-plugin-react-refresh, eslint-config-prettier, @typescript-eslint/parser, @typescript-eslint/eslint-plugin)
- **포맷터**: Prettier 3 (`singleQuote: true`, `printWidth: 100`, `trailingComma: all`)
- **Git Hook**: Husky 9 + .githooks/ (pre-commit: Prettier check, prepare-commit-msg: JIRA 접두사)

## 명령어 (Scripts)

```bash
npm run dev        # 로컬 개발 서버 (Vite --mode dev)
npm run remote     # 원격 개발 서버 (Vite --mode remote)
npm run build      # 프로덕션 빌드 (Vite --mode prod)
npm run lint       # ESLint 실행
npm run preview    # 빌드 결과 미리보기 (포트 5173)

# 포맷팅
npx prettier --check .    # 포맷 검증
npx prettier --write .    # 포맷 자동 적용
```

## 아키텍처

Feature-Sliced Design (FSD) 아키텍처 적용.

### 디렉토리 구조

```
src/
├── app/          # 앱 진입점, 전역 설정, GA 추적
│   ├── main.tsx
│   ├── App.tsx
│   ├── model/    # GA 초기화, 페이지 뷰 추적, 페이지 타이틀
│   └── ui/       # PageViewTracker
├── pages/        # 페이지 컴포넌트 (라우트별)
│   ├── board/
│   ├── board-detail/
│   ├── board-write/
│   ├── login-redirect/
│   ├── login-select/
│   ├── maintenance/
│   ├── make-quiz/
│   ├── privacy-policy/
│   ├── quiz-explanation/
│   ├── quiz-history/
│   ├── quiz-result/
│   └── solve-quiz/
├── features/     # 비즈니스 기능 (모델 + UI)
│   ├── auth/
│   ├── prepare-quiz/
│   ├── quiz-explanation/
│   ├── quiz-generation/
│   ├── quiz-history/
│   ├── quiz-result/
│   └── solve-quiz/
├── entities/     # 도메인 엔티티
│   └── auth/
├── widgets/      # 조합 컴포넌트
│   ├── footer/
│   ├── header/
│   ├── help/
│   └── recent-changes/
├── shared/       # 공유 유틸리티
│   ├── api/      # Axios 인스턴스
│   ├── i18n/     # 국제화 설정 (ko, en)
│   ├── lib/      # 유틸 함수 (analytics, timer, useClickOutside 등)
│   ├── toast/    # 토스트 알림
│   └── ui/       # 공통 UI 컴포넌트 (logo, Shadcn 컴포넌트)
│       ├── components/  # Shadcn UI 컴포넌트 (button 등)
│       └── lib/         # cn() 유틸리티 함수
└── assets/       # 정적 자산
```

### Import 경로 별칭 (이중 시스템)

**`#` 별칭** — package.json `imports` 필드, FSD 레이어 barrel 해석용:

```
#app/*        → ./src/app/*
#pages/*      → ./src/pages/*/index.tsx
#features/*   → ./src/features/*/index.ts
#entities/*   → ./src/entities/*/index.ts
#widgets/*    → ./src/widgets/*/index.tsx
#shared/*     → ./src/shared/*/index.ts
#shared/lib/* → ./src/shared/lib/*.ts
#shared/i18n  → ./src/shared/i18n/index.ts
```

**`@/` 별칭** — tsconfig.json `paths` + vite.config.ts `resolve.alias`, Shadcn UI용:

```
@/*           → ./src/*
```

### FSD 레이어 의존성 규칙

```
app → pages → widgets → features → entities → shared
```

상위 레이어만 하위 레이어를 import할 수 있다. 역방향 의존 금지.

## 환경 변수

| 변수 | 설명 |
|---|---|
| `VITE_BASE_URL` | 백엔드 API 서버 URL |
| `VITE_GA_MEASUREMENT_ID` | Google Analytics 측정 ID |

환경 파일: `.env.dev`, `.env.prod`, `.env.remote`

## 개발 도구 및 설정

- **런타임**: Node.js v24.x, npm 11.x
- **포맷터**: Prettier 3 (`.prettierrc` 설정)
- **린터**: ESLint 9 (flat config, `eslint.config.js`, TypeScript 파서/플러그인 포함)
- **TypeScript**: `tsconfig.json` (strict, allowJs — 전체 TS 전환 완료)
- **Shadcn UI**: `components.json` (aliases → `@/shared/ui/components`)
- **Vite 설정**: `vite.config.ts` (TypeScript 전환 완료)
- **Git Hooks**: `.githooks/` 디렉토리 사용 (`git config core.hooksPath .githooks`)
  - `pre-commit`: `npx prettier --check .` (포맷 위반 시 커밋 차단)
  - `prepare-commit-msg`: 브랜치명에서 JIRA 티켓 번호 자동 추출 및 접두사 추가
- **CI/CD**: GitHub Actions (`dev_deploy.yml`, `prod_deploy.yml`)
- **Vite 프록시**: 개발 환경에서 `/api` 요청을 백엔드로 프록시
- **Prerender**: 프로덕션 빌드 시 `vite-plugin-prerender`로 `/`, `/ko`, `/en` SSG
