# Q-Asker Client

## 프로젝트 개요

PDF, PPT, Word 파일을 업로드하면 AI가 퀴즈를 자동 생성하는 웹 서비스의 프론트엔드 클라이언트.

## 기술 스택

- **언어**: JavaScript (ES2020+)
- **프레임워크**: React 19
- **빌드 도구**: Vite 6
- **상태 관리**: Zustand 5
- **라우팅**: React Router DOM 7
- **HTTP 클라이언트**: Axios
- **다국어**: i18nexus
- **PDF 처리**: pdfjs-dist, react-pdf
- **알림**: react-toastify
- **분석**: react-ga4
- **SSE**: @microsoft/fetch-event-source

## 명령어 (Scripts)

| 명령어            | 설명                           |
| ----------------- | ------------------------------ |
| `npm run dev`     | 개발 서버 실행 (dev 모드)      |
| `npm run remote`  | 개발 서버 실행 (remote 모드)   |
| `npm run build`   | 프로덕션 빌드 (prod 모드)      |
| `npm run lint`    | ESLint 검사                    |
| `npm run preview` | 빌드 결과 미리보기 (5173 포트) |

## 아키텍처

**Feature-Sliced Design (FSD)** 아키텍처 적용.

```
src/
├── app/              # 앱 진입점, 라우팅, 전역 설정
│   ├── ui/           # App 레벨 UI (PageViewTracker 등)
│   └── model/        # App 레벨 로직 (GA 초기화 등)
├── pages/            # 페이지 컴포넌트
│   ├── make-quiz/        # 퀴즈 생성 페이지
│   ├── solve-quiz/       # 퀴즈 풀기 페이지
│   ├── quiz-result/      # 퀴즈 결과 페이지
│   ├── quiz-explanation/ # 퀴즈 해설 페이지
│   ├── quiz-history/     # 퀴즈 기록 페이지
│   ├── login-select/     # 로그인 선택 페이지
│   ├── login-redirect/   # 로그인 리디렉트
│   ├── maintenance/      # 서비스 점검 페이지
│   └── privacy-policy/   # 개인정보 처리방침
├── widgets/          # 독립적 UI 블록
│   ├── header/
│   ├── footer/
│   ├── help/
│   └── recent-changes/
├── features/         # 비즈니스 기능
│   ├── prepare-quiz/     # 퀴즈 준비
│   ├── quiz-generation/  # 퀴즈 생성
│   ├── solve-quiz/       # 퀴즈 풀기
│   ├── quiz-result/      # 퀴즈 결과
│   ├── quiz-explanation/ # 퀴즈 해설
│   ├── quiz-history/     # 퀴즈 기록
│   └── auth/             # 인증
├── entities/         # 도메인 엔티티
│   └── auth/
├── shared/           # 공유 모듈
│   ├── api/          # Axios 인스턴스
│   ├── ui/           # 공통 UI 컴포넌트
│   ├── lib/          # 유틸리티 함수
│   ├── toast/        # 토스트 알림
│   └── i18n/         # 다국어 설정
└── assets/           # 정적 리소스
```

### 라우팅 구조

> 현재 서비스 점검 모드 (`<Route path="*" element={<Maintenance />} />`)

| 경로                         | 페이지            |
| ---------------------------- | ----------------- |
| `/`                          | MakeQuiz          |
| `/ko`, `/en`                 | MakeQuiz (다국어) |
| `/login`                     | LoginSelect       |
| `/login/redirect`            | LoginRedirect     |
| `/privacy-policy`            | PrivacyPolicy     |
| `/quiz/:problemSetId`        | SolveQuiz         |
| `/result/:problemSetId`      | QuizResult        |
| `/explanation/:problemSetId` | QuizExplanation   |
| `/history`                   | QuizHistory       |

## 환경 변수

| 키                       | 설명                     |
| ------------------------ | ------------------------ |
| `VITE_BASE_URL`          | API 서버 베이스 URL      |
| `VITE_GA_MEASUREMENT_ID` | Google Analytics 측정 ID |

환경 파일: `.env.dev`, `.env.remote`, `.env.prod`

## 개발 도구 및 설정

- **패키지 매니저**: npm
- **린터**: ESLint 9 + eslint-config-prettier
- **포맷터**: Prettier 3 (`npx prettier --write .`)
- **Git Hooks**: Husky 9 + `.githooks/` (core.hooksPath)
  - `prepare-commit-msg`: JIRA 티켓 접두사 자동 추가
  - `pre-commit`: Prettier 포맷 검증
- **Import Alias**: `#` prefix (package.json `imports` 필드)
  - `#app/*`, `#pages/*`, `#features/*`, `#entities/*`, `#widgets/*`, `#shared/*`
