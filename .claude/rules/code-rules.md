---
description: "React/Vite/FSD 코딩 컨벤션, 레이어 의존성 규칙, 네이밍, 상태 관리, 제약 사항"
globs: "**/*.{ts,tsx,css}"
---

# 코드 규칙

## 네이밍

- 컴포넌트: PascalCase (`QuizForm`, `HeaderWidget`)
- 함수/변수: camelCase (`handleSubmit`, `quizTitle`)
- 상수: SCREAMING_SNAKE_CASE (`MAX_RETRY_COUNT`)
- 파일: 컴포넌트는 PascalCase.tsx, 유틸/모델은 camelCase.ts
- 디렉토리: kebab-case (`quiz-generation`, `solve-quiz`)
- 코드 주석: 한국어

## FSD 아키텍처 규칙

### 레이어 의존성

```
app → pages → widgets → features → entities → shared
```

- **역방향 의존 금지**: shared가 features를 참조하지 않는다
- **같은 레이어 횡단 참조 금지**: `quiz-generation` feature가 `solve-quiz` feature를 직접 참조하지 않는다
- **공유 로직은 shared로**: 여러 feature에서 사용하는 로직은 `shared/` 레이어에 배치

### 레이어별 책임

- **app**: 전역 설정, 라우팅, 프로바이더 설정
- **pages**: 라우트별 페이지 컴포넌트, feature/widget 조합
- **widgets**: 독립적인 UI 블록 (header, footer 등)
- **features**: 비즈니스 기능 단위 (model + UI)
- **entities**: 도메인 엔티티, 비즈니스 타입
- **shared**: API, UI 컴포넌트, 유틸리티, 라이브러리 래퍼

### Import 경로

- FSD 별칭(`#`): `#features/*`, `#shared/*`, `#entities/*` 등 (package.json imports)
- Shadcn UI 별칭(`@/`): `@/shared/ui/components/*` 등 (tsconfig paths + vite alias)
- 레이어 내부 상대 경로: `./model/useQuizGeneration`

## 컴포넌트 구조

- **함수형 컴포넌트만** 사용 (클래스 컴포넌트 금지)
- 컴포넌트 파일: `.tsx` 확장자
- 유틸/모델 파일: `.ts` 확장자
- 각 feature/page/widget의 진입점: `index.ts` 또는 `index.tsx`에서 public API만 export

## 상태 관리

- **전역 상태**: Zustand store 사용
- **서버 상태**: Axios + 커스텀 훅
- **로컬 상태**: React useState/useReducer
- Store 파일은 해당 feature의 `model/` 디렉토리에 배치

## 포맷팅

- **Prettier** 적용 (`singleQuote: true`, `printWidth: 100`, `trailingComma: all`)
- **ESLint** 9 flat config (`eslint.config.js`)
- 사용하지 않는 import 금지

## 제약 사항

- **CLAUDE.md 수정 없이 기술 스택 변경** 금지
- **환경 변수를 코드에 하드코딩** 금지 — `import.meta.env.VITE_*` 사용
- **API 호출**: `shared/api/`의 Axios 인스턴스를 통해서만 수행
- **i18n**: 사용자 노출 텍스트는 `shared/i18n/`의 번역 키 사용 권장
