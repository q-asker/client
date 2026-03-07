# CLAUDE.md

<!-- TODO: docs/PRD.md 생성 후 활성화 -->
<!-- TODO: docs/roadmaps/ 생성 후 활성화 -->

## 프로젝트 개요

Q-Asker는 PDF, PPT, Word 파일을 업로드하면 AI가 퀴즈(빈칸, OX, 객관식)를 자동 생성해주는 웹 서비스의 클라이언트 애플리케이션이다.

## 기술 스택

| 분류            | 기술                                                          |
| --------------- | ------------------------------------------------------------- |
| 언어            | JavaScript (JSX)                                              |
| 프레임워크      | React 19.1                                                    |
| 빌드 도구       | Vite 6.3                                                      |
| 상태 관리       | Zustand 5                                                     |
| 라우팅          | React Router DOM 7.6                                          |
| HTTP 클라이언트 | Axios 1.9                                                     |
| SSE             | @microsoft/fetch-event-source                                 |
| PDF 뷰어        | react-pdf (pdfjs-dist)                                        |
| 국제화 (i18n)   | i18nexus                                                      |
| 토스트          | react-toastify                                                |
| 분석            | react-ga4 (Google Analytics)                                  |
| 린터            | ESLint 9 (eslint-config-prettier, react-hooks, react-refresh) |
| 포맷터          | Prettier 3.8                                                  |
| Git Hooks       | Husky 9                                                       |
| SEO             | vite-plugin-prerender (프리렌더링)                            |

## 명령어 (Scripts)

```bash
npm run dev       # 개발 서버 실행 (로컬 백엔드 연결, --mode dev)
npm run remote    # 개발 서버 실행 (원격 백엔드 프록시, --mode remote)
npm run build     # 프로덕션 빌드 (--mode prod)
npm run lint      # ESLint 실행
npm run preview   # 빌드 결과 미리보기 (포트 5173)
npm run prepare   # Husky 설치
npx prettier --write <파일>  # Prettier 포맷 적용
npx prettier --check .       # Prettier 포맷 검증
```

## 아키텍처

FSD(Feature-Sliced Design) 아키텍처를 기반으로 구성되어 있다.

```
src/
├── app/                    # 앱 진입점, 라우팅, 전역 설정
│   ├── App.jsx             # 메인 앱 (라우팅, SEO, i18n)
│   ├── main.jsx            # 엔트리 포인트
│   ├── model/              # 앱 레벨 훅 (useInitGA)
│   └── ui/                 # 앱 레벨 UI (PageViewTracker)
├── assets/                 # 정적 리소스
├── entities/               # 도메인 엔티티
│   └── auth/               # 인증 엔티티
├── features/               # 기능 단위 모듈
│   ├── auth/               # 인증 기능
│   ├── prepare-quiz/       # 퀴즈 준비 (파일 업로드, 옵션 설정)
│   ├── quiz-explanation/   # 퀴즈 해설
│   ├── quiz-generation/    # 퀴즈 생성 (AI)
│   ├── quiz-history/       # 퀴즈 기록
│   ├── quiz-result/        # 퀴즈 결과
│   └── solve-quiz/         # 퀴즈 풀기
├── pages/                  # 페이지 컴포넌트
│   ├── login-redirect/
│   ├── login-select/
│   ├── maintenance/        # 서비스 점검 페이지
│   ├── make-quiz/
│   ├── privacy-policy/
│   ├── quiz-explanation/
│   ├── quiz-history/
│   ├── quiz-result/
│   └── solve-quiz/
├── shared/                 # 공유 유틸리티
│   ├── api/                # API 클라이언트 (Axios)
│   ├── i18n/               # 번역 리소스
│   ├── lib/                # 유틸리티 함수
│   ├── toast/              # 토스트 헬퍼
│   └── ui/                 # 공용 UI 컴포넌트
└── widgets/                # 위젯 (조합형 UI)
    ├── footer/
    ├── header/
    ├── help/
    └── recent-changes/
```

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

### 라우팅 구조

| 경로                         | 페이지          | 설명             |
| ---------------------------- | --------------- | ---------------- |
| `/`                          | MakeQuiz        | 메인 (퀴즈 생성) |
| `/ko`                        | MakeQuiz        | 한국어 랜딩      |
| `/en`                        | MakeQuiz        | 영어 랜딩        |
| `/login`                     | LoginSelect     | 로그인 방법 선택 |
| `/login/redirect`            | LoginRedirect   | OAuth 리다이렉트 |
| `/privacy-policy`            | PrivacyPolicy   | 개인정보처리방침 |
| `/quiz/:problemSetId`        | SolveQuiz       | 퀴즈 풀기        |
| `/result/:problemSetId`      | QuizResult      | 퀴즈 결과        |
| `/explanation/:problemSetId` | QuizExplanation | 퀴즈 해설        |
| `/history`                   | QuizHistory     | 퀴즈 기록        |

> 현재 점검 모드 활성화: 모든 라우트가 Maintenance 페이지로 리다이렉트

## 환경 변수

`.env.*` 파일로 모드별 관리 (`.gitignore`에 포함됨):

| 변수                     | 설명                     |
| ------------------------ | ------------------------ |
| `VITE_BASE_URL`          | API 서버 주소            |
| `VITE_GA_MEASUREMENT_ID` | Google Analytics 측정 ID |

| 모드   | 파일          | VITE_BASE_URL             |
| ------ | ------------- | ------------------------- |
| dev    | `.env.dev`    | `http://localhost:8080`   |
| remote | `.env.remote` | `/api` (Vite 프록시)      |
| prod   | `.env.prod`   | `https://api.q-asker.com` |

## 개발 도구 및 설정

- **패키지 매니저:** npm
- **Node.js:** ES Module (`"type": "module"`)
- **포맷터:** Prettier (`.prettierrc` — singleQuote, trailingComma: all, printWidth: 100)
- **린터:** ESLint 9 flat config (`eslint.config.js` — eslint-config-prettier 연동)
- **Git Hooks:** Husky 9 (`npm run prepare`)
- **프리렌더링:** vite-plugin-prerender (`/`, `/ko`, `/en`)
- **프록시:** Vite dev server → `/api` 프록시 (`.env.prod`의 `VITE_BASE_URL` 사용)

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
