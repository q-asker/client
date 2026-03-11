# Q-Asker Client 마이그레이션 로드맵

JavaScript + 순수 CSS 코드베이스를 TypeScript + Tailwind CSS v4 + Shadcn UI로 마이그레이션하여 타입 안전성, 스타일링 생산성, UI 일관성을 확보한다.

## 개요

Q-Asker Client는 AI 기반 퀴즈 생성 및 풀이 웹 애플리케이션의 프론트엔드로, 다음 마이그레이션을 수행합니다:

- **TypeScript 전환**: JSX 21개 + JS 43개 파일을 .tsx/.ts로 전환하여 타입 안전성 확보
- **Tailwind CSS v4 도입**: 순수 CSS 18개 파일을 Tailwind 유틸리티 클래스로 대체
- **Shadcn UI 적용**: 공통 UI 컴포넌트(Button, Card, Input, Dialog 등)를 Shadcn으로 통일

## 개발 워크플로우

1. **작업 계획**

   - 기존 코드베이스를 학습하고 현재 상태를 파악
   - 새로운 작업을 포함하도록 활성 로드맵(`docs/roadmaps/`) 업데이트

2. **작업 생성**

   - `/tasks` 디렉토리에 새 작업 파일 생성
   - 명명 형식: `XXX-description.md` (예: `001-setup.md`)

3. **작업 구현**

   - 작업 파일의 명세서를 따름
   - 각 단계 후 작업 파일 내 진행 상황 업데이트

4. **로드맵 업데이트**

   - 로드맵에서 완료된 작업을 완료 표시로 갱신

## 개발 단계

### Phase 1: 빌드 환경 설정

> **순서 근거**: TypeScript, Tailwind CSS, Shadcn UI를 사용하려면 빌드 도구와 설정 파일이 먼저 준비되어야 한다. 이 Phase가 완료되어야 .ts/.tsx 파일 작성과 Tailwind 클래스 사용이 가능하므로 최우선으로 진행한다. ESLint와 Prettier도 함께 설정하여 마이그레이션 초기부터 일관된 코드 품질을 유지한다.

- **Task 001: TypeScript 빌드 환경 구성** - 완료 ✅
  - `typescript` devDependency 설치
  - `tsconfig.json` 생성 (strict 모드, jsx: react-jsx, baseUrl, paths 별칭 설정)
  - `vite.config.js` -> `vite.config.ts` 전환
  - Vite TypeScript 플러그인 설정 확인
  - `index.html`의 `<script src>` 엔트리포인트는 Phase 7에서 변경 (JS/TS 공존 기간 유지)
  - 기존 JS/JSX 파일이 정상 빌드되는지 검증 (`npm run build`)

- **Task 002: Tailwind CSS v4 빌드 환경 구성** - 완료 ✅
  - `tailwindcss` v4, `@tailwindcss/vite` 설치
  - `vite.config.ts`에 Tailwind Vite 플러그인 추가
  - `src/app/globals.css` 생성 (`@import "tailwindcss"` + 기존 CSS 변수/리셋 통합)
  - 기존 `index.css`, `App.css`의 전역 스타일을 `globals.css`로 이전 계획 수립
  - Tailwind 테마 커스터마이징 (색상, 폰트, 라운딩 등 기존 디자인 토큰 반영)
  - 빌드 검증 (`npm run build`)

- **Task 003: Shadcn UI 초기화** - 완료 ✅
  - `shadcn` CLI 설치 (devDependencies)
  - `clsx`, `tailwind-merge`, `class-variance-authority`, `lucide-react` 설치
  - `components.json` 설정 파일 생성 (aliases, style, rsc: false)
  - `src/shared/ui/lib/utils.ts`에 `cn()` 유틸리티 함수 작성 (clsx + tailwind-merge)
  - 프로젝트 테마 커스터마이징 (CSS 변수 기반 색상, 폰트, border-radius)
  - Shadcn 기본 컴포넌트 설치 확인 (Button 하나를 테스트로 추가)

- **Task 004: ESLint 및 Prettier TypeScript 대응** - 완료 ✅
  - `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin` 설치
  - `eslint.config.js`에 TypeScript 파서/플러그인/규칙 추가
  - 기존 ESLint 규칙 유지하면서 .ts/.tsx 파일 대응
  - Prettier 설정에 .ts/.tsx 파일 포함 확인
  - `.githooks/pre-commit` 훅이 TypeScript 파일도 검증하도록 갱신
  - 린트/포맷 검증 (`npm run lint`, `npx prettier --check .`)

### Phase 2: shared 레이어 마이그레이션

> **순서 근거**: shared는 FSD 아키텍처의 최하위 레이어로, entities/features/widgets/pages/app 모든 레이어에서 의존한다. 여기서 정의하는 API 클라이언트, 유틸리티, 공통 타입이 상위 레이어 마이그레이션의 기반이 되므로 가장 먼저 전환한다. 특히 API 응답 공통 타입(ApiResponse, ApiError)은 이후 모든 기능 모듈에서 재사용된다.

- **Task 005: shared/api TypeScript 전환** - 완료 ✅
  - `src/shared/api/index.js` -> `src/shared/api/index.ts` 전환
  - `src/shared/api/types.ts` 생성 (ApiResponse\<T\>, ApiError 인터페이스 정의)
  - Axios 인스턴스 타입 적용 (AxiosInstance, AxiosRequestConfig, AxiosResponse)
  - 요청/응답 인터셉터 타입 적용
  - 에러 핸들링 타입 적용
  - 관련 기능 ID: F005

- **Task 006: shared/lib TypeScript 전환** - 완료 ✅
  - `src/shared/lib/analytics.js` -> `.ts` (GA4 이벤트 전송 함수 타입 정의)
  - `src/shared/lib/timer.js` -> `.ts` (타이머 유틸 타입 정의)
  - `src/shared/lib/lastEndpointStorage.js` -> `.ts` (localStorage 래퍼 타입 정의)
  - `src/shared/lib/useClickOutside.js` -> `.ts` (RefObject 제네릭 타입 적용)
  - 관련 기능 ID: F006

- **Task 007: shared/ui Shadcn 컴포넌트 도입** - 완료 ✅
  - Shadcn CLI로 기본 컴포넌트 추가: Button, Card, Input, Dialog, Select, Tabs, Badge, Skeleton
  - `src/shared/ui/logo/index.jsx` -> `.tsx`, `index.js` -> `.ts` 전환
  - `src/shared/ui/logo/index.css` -> Tailwind 유틸리티 클래스 전환
  - 기존 Logo 컴포넌트 CSS 파일 제거
  - 관련 기능 ID: F007

- **Task 008: shared/i18n 및 shared/toast TypeScript 전환** - 완료 ✅
  - `src/shared/i18n/index.js` -> `.ts` (i18n 설정 타입 적용)
  - 번역 키 타입 정의 (필요 시 자동 생성 고려)
  - `src/shared/toast/index.js` -> `.ts` (토스트 옵션 인터페이스 정의)
  - react-toastify 타입 활용
  - 관련 기능 ID: F008, F009

### Phase 3: entities 레이어 마이그레이션

> **순서 근거**: entities는 shared 다음으로 하위에 위치하며, features 레이어에서 직접 의존한다. 현재 auth 엔티티만 존재하지만, 여기서 정의하는 User/AuthState 타입과 Zustand store 타입 패턴이 features 레이어 마이그레이션의 기준이 된다.

- **Task 009: entities/auth TypeScript 전환** - 완료 ✅
  - `src/entities/auth/types.ts` 생성 (User, AuthState 인터페이스 정의)
  - `src/entities/auth/store.js` -> `.ts` (Zustand store 타입 적용, StateCreator 활용)
  - `src/entities/auth/service.js` -> `.ts` (API 호출 함수 반환 타입 정의)
  - `src/entities/auth/index.js` -> `.ts` (re-export 타입 포함)
  - 관련 기능 ID: F010

### Phase 4: features 레이어 마이그레이션

> **순서 근거**: features는 비즈니스 로직의 핵심이며 7개 모듈로 구성된다. entities/shared에 의존하므로 Phase 2~3 완료 후 진행한다. 각 feature는 독립적이므로 병렬 작업이 가능하지만, auth -> prepare-quiz -> quiz-generation -> solve-quiz -> quiz-result -> quiz-explanation -> quiz-history 순으로 진행하면 데이터 흐름을 따라가며 자연스럽게 타입을 확장할 수 있다.

- **Task 010: features/auth TypeScript 전환** - 완료 ✅
  - `src/features/auth/model/constants.js` -> `.ts` (OAuth 상수 타입 정의)
  - `src/features/auth/model/useLogin.js` -> `.ts` (로그인 훅 타입 적용)
  - `src/features/auth/model/useLoginRedirect.js` -> `.ts` (리다이렉트 훅 타입 적용)
  - `src/features/auth/index.js` -> `.ts`
  - 관련 기능 ID: F011

- **Task 011: features/prepare-quiz TypeScript 전환** — 완료 ✅
  - 7개 JS 파일 → TS 전환 (constants, usePrepareQuiz, usePrepareQuizOptions, usePrepareQuizPages, usePrepareQuizUi, usePrepareQuizUpload, file-uploader)
  - `QuestionType`, `QuizLevel`, `LevelDescription`, `PageMode`, `HoveredPage`, `PrepareQuizReturn` 등 타입 정의 및 export
  - 관련 기능 ID: F012

- **Task 012: features/quiz-generation TypeScript 전환** — 완료 ✅
  - `src/features/quiz-generation/model/useQuizGenerationStore.js` -> `.ts` (Zustand store + SSE EventSource 타입, Quiz/FileInfo 인터페이스 포함)
  - `src/features/quiz-generation/index.ts`에서 타입 re-export 추가
  - `uuid` 의존성 제거 → `crypto.randomUUID()` 대체
  - 관련 기능 ID: F013

- **Task 013: features/solve-quiz TypeScript 전환** — 완료 ✅
  - 6개 JS 파일 → TS 전환 (isUnanswered, useSolveQuiz, useSolveQuizData, useSolveQuizQuestion, useSolveQuizSubmit, useSolveQuizTimer)
  - `Quiz`, `QuizSelection` 타입을 quiz-generation에서 import
  - 관련 기능 ID: F017

- **Task 014: features/quiz-result, quiz-explanation, quiz-history TypeScript 전환** — 완료 ✅
  - 3개 feature의 JS/JSX 파일 → TS 전환 (useQuizResult, useQuizExplanation, useQuizHistory)
  - 각 feature별 타입/인터페이스 정의 (QuizHistoryRecord, ExplanationResult 등)
  - 관련 기능 ID: F014, F015, F016

### Phase 5: widgets 레이어 마이그레이션

> **순서 근거**: widgets는 features를 조합한 재사용 UI 블록으로, features 마이그레이션이 완료되어야 import 타입이 정확해진다. 4개 위젯 모두 CSS 파일을 포함하고 있어 Tailwind 전환과 TypeScript 전환을 동시에 수행한다. Shadcn 컴포넌트(Button, Dialog 등)를 적극 활용하여 UI 일관성을 확보한다.

- **Task 015: widgets 모델 TS 전환 + index.tsx rename + header Tailwind 전환** — 완료 ✅
  - 3개 모델 TS 전환: useHeader.ts, useHelp.ts, useRecentChanges.ts
  - 4개 widget index.jsx → index.tsx 동시 전환 + package.json `#widgets/*` 패턴 업데이트
  - header/index.css(313줄) → Tailwind 유틸리티 클래스 전환 및 삭제
  - cn() 유틸리티 활용, 반응형 max-md:/max-sm: 적용
  - 관련 기능 ID: F018

- **Task 016: widgets/footer, help, recent-changes Tailwind 전환** — 완료 ✅
  - footer(37줄 CSS), help(400줄 CSS), recent-changes(46줄 CSS) → Tailwind 유틸리티 클래스 전환
  - 3개 index.css 파일 모두 삭제
  - Help: Schema.org microdata 유지, 반응형 그리드 적용
  - 관련 기능 ID: F018

### Phase 6: pages 레이어 마이그레이션

> **순서 근거**: pages는 widgets/features를 조합하는 최상위 UI 레이어로, 하위 레이어 마이그레이션이 모두 완료된 후 진행한다. 12개 페이지를 기능적 연관성에 따라 3개 Task로 그룹화하여 작업 단위를 관리 가능한 크기로 유지한다. 각 페이지는 .jsx -> .tsx 전환과 .css -> Tailwind 전환을 동시에 수행한다.

- **Task 017: 전체 index.tsx rename + 소규모 페이지 Tailwind 전환** — 완료 ✅
  - 12개 페이지 index.jsx → index.tsx 동시 rename + package.json `#pages/*` 패턴 업데이트
  - login-redirect, maintenance, login-select, privacy-policy Tailwind 전환
  - CSS 3개 파일 삭제 (maintenance, login-select, privacy-policy)
  - 관련 기능 ID: F019

- **Task 018: 퀴즈 부가 페이지 및 게시판 페이지 Tailwind + TypeScript 전환** — 완료 ✅
  - board×3 + quiz-history + quiz-result 5개 페이지 Tailwind 전환
  - 각 페이지별 인라인 TypeScript 타입 정의 (BoardPost, BoardListResponse, BoardDetailPost, BoardEditData 등)
  - CSS 5개 파일 삭제 (board, board-detail, board-write, quiz-history, quiz-result)
  - 관련 기능 ID: F019

- **Task 019: make-quiz 페이지 Tailwind + TypeScript 전환** — 완료 ✅
  - make-quiz 페이지 1499줄 CSS → Tailwind 유틸리티 클래스 전환
  - 커스텀 키프레임 애니메이션 globals.css에 추가
  - QuizTypeOption 인터페이스, react-pdf Document/Page 타이핑
  - index.css 삭제
  - 관련 기능 ID: F019

- **Task 020: solve-quiz + quiz-explanation 페이지 Tailwind + TypeScript 전환** — 완료 ✅
  - solve-quiz 페이지 665줄 CSS → Tailwind 전환 (제출 다이얼로그 오버레이, 문제번호 패널)
  - quiz-explanation 페이지 849줄 CSS → Tailwind 전환 (토글 스위치 pseudo-elements, react-pdf 타이핑)
  - CSS 2개 파일 삭제 (solve-quiz, quiz-explanation)
  - 관련 기능 ID: F019

### Phase 7: app 레이어 마이그레이션

> **순서 근거**: app은 FSD 최상위 레이어이자 애플리케이션 진입점이다. 모든 하위 레이어가 마이그레이션된 후 진행해야 import 경로가 안정적이다. main.jsx -> main.tsx 전환 시 index.html의 엔트리포인트도 변경해야 하므로 빌드 파이프라인에 직접 영향을 미친다.

- **Task 021: app 레이어 TypeScript 전환** — 완료 ✅
  - `src/app/main.jsx` -> `src/app/main.tsx` (ReactDOM 진입점)
  - `src/app/App.jsx` -> `src/app/App.tsx` (라우터 설정, 전역 레이아웃)
  - `src/app/ui/PageViewTracker.jsx` -> `.tsx`
  - `src/app/model/useInitGA.js` -> `.ts`
  - `src/app/model/usePageViewTracker.js` -> `.ts`
  - `src/app/model/pageTitles.js` -> `.ts`
  - `index.html`의 `<script src>`를 `main.tsx`로 변경
  - `src/app/App.css` + `src/app/index.css` -> `globals.css`로 통합 후 제거
  - 관련 기능 ID: F020
  - **검증 기준**:
    - `npm run build` 성공
    - `src/app/` 내 `.js`/`.jsx` 파일 0개 확인
    - `App.css`, `index.css` 삭제 확인
    - `index.html`의 엔트리포인트가 `main.tsx`를 가리키는지 확인
    - Playwright MCP로 `npm run dev` 후 메인 페이지 정상 로딩 확인

### Phase 8: 정리 및 검증

> **순서 근거**: 모든 레이어의 마이그레이션이 완료된 후, 남아있는 정리 작업과 전체 검증을 수행한다. import 별칭 시스템 전환, 잔여 CSS 파일 확인, 빌드 검증, 문서 갱신 등 마이그레이션의 완결성을 보장하는 마무리 단계이다.

- **Task 022: 잔여 파일 검증 및 별칭 시스템 문서화** — 완료 ✅
  - 범위 변경: 별칭 전환(# → @) 계획은 분석 후 취소 — # 별칭이 FSD 진입점 자동 해석(glob-to-index) 제공, tsconfig paths 미지원, 60개+ import 수정 리스크 대비 이점 없음
  - 현재 이중 별칭 체계 유지: `#` (package.json imports, FSD 레이어) + `@/` (tsconfig paths + vite alias, Shadcn UI)
  - 잔여 파일 검증: src/ 내 .js/.jsx 0개, .css는 globals.css만, CSS import은 외부 라이브러리(react-toastify, react-pdf)만
  - 모든 .js/.jsx 파일이 .ts/.tsx로 전환 완료 확인
  - 관련 기능 ID: F021, F022

- **Task 023: 전체 빌드 검증 및 동작 확인** - 완료 ✅
  - `npm run build` 프로덕션 빌드 성공 확인
  - `npm run lint` 린트 오류 없음 확인
  - `npx prettier --check .` 포맷 검증 통과 확인
  - `npm run dev` 로컬 개발 서버 정상 동작 확인
  - 12개 페이지 수동 동작 확인 (기존 기능 100% 보존 검증)
  - Prerender 정상 동작 확인 (`/`, `/ko`, `/en`)
  - TypeScript strict 모드에서 타입 오류 없음 확인
  - **검증 기준**:
    - 위 모든 항목 통과
    - Playwright MCP로 12개 페이지 네비게이션 및 렌더링 정상 확인
    - 콘솔 에러/경고 0건 확인

- **Task 024: CLAUDE.md 및 프로젝트 문서 갱신** - 완료 ✅
  - CLAUDE.md 기술 스택 섹션 갱신 (TypeScript, Tailwind CSS v4, Shadcn UI 추가)
  - CLAUDE.md 명령어 섹션 갱신 (필요 시)
  - CLAUDE.md import 별칭 섹션 갱신 (package.json imports -> tsconfig paths)
  - CLAUDE.md 디렉토리 구조 갱신 (shared/ui 하위 Shadcn 컴포넌트 구조 반영)
  - CLAUDE.md 개발 도구 섹션 갱신 (ESLint TS 플러그인 등)
  - 관련 기능 ID: F024
  - **검증 기준**:
    - CLAUDE.md의 기술 스택이 `package.json` 실제 의존성과 일치하는지 확인
    - CLAUDE.md의 디렉토리 구조가 실제 `src/` 구조와 일치하는지 확인
    - CLAUDE.md의 import 별칭이 `tsconfig.json` paths와 일치하는지 확인

### Phase 9: MagicUI 도입

> **순서 근거**: Phase 8까지 Shadcn UI 기반 TypeScript + Tailwind CSS 마이그레이션이 완료된 상태에서 MagicUI를 도입하면, 안정적인 컴포넌트 기반 위에 애니메이션/인터랙션을 추가할 수 있다. 목업 확정 전이므로 환경 설정(Task 024)만 선행하고, 실제 컴포넌트 적용(Task 025)은 디자인 결정 후 진행한다.

- **Task 025: MagicUI 환경 설정** - 우선순위
  - `framer-motion` 패키지 설치 (dependencies)
  - MagicUI 컴포넌트 설치 환경 구성 (`npx shadcn@latest add` 방식으로 MagicUI 컴포넌트 추가 가능하도록 설정)
  - MagicUI 컴포넌트 배치 경로 확정 (`src/shared/ui/` 하위)
  - 테스트용 MagicUI 컴포넌트 1개 설치하여 정상 동작 확인
  - `npm run build` 빌드 검증
  - 관련 기능 ID: F025
  - **검증 기준**:
    - `npm run build` 성공
    - 테스트용 MagicUI 컴포넌트가 정상 렌더링되는지 Playwright MCP로 확인
    - `framer-motion` import 정상 resolve 확인

- **Task 026: MagicUI 컴포넌트 적용**
  - 구체적 적용 범위는 목업 확정 후 결정
  - 대상 레이어: widgets(header, footer, help, recent-changes), pages(12개 페이지) 레이어의 UI 컴포넌트
  - 적용 방식: Shadcn UI 정적 컴포넌트를 MagicUI 애니메이션 컴포넌트로 교체 또는 래핑
  - 페이지 전환 애니메이션, 로딩 인터랙션, 스크롤 기반 애니메이션 등 적용
  - 전체 빌드 및 동작 검증
  - 관련 기능 ID: F026
  - **검증 기준**:
    - `npm run build` 성공
    - Playwright MCP로 애니메이션 적용 페이지 렌더링 및 인터랙션 정상 확인
    - 기존 기능 회귀 없음 확인
