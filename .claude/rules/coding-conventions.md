---
description: 코드 작성 시 적용되는 네이밍, 컴포넌트, 스타일링, 폼 규칙
globs: ["**/*.ts", "**/*.tsx", "**/*.css"]
---

# 코딩 컨벤션

## 일반 규칙

- 변수명/함수명: 영어 (camelCase)
- 컴포넌트명: PascalCase
- 파일명: kebab-case (컴포넌트 파일 포함)
- 코드 주석: 한국어
- 경로 alias: `@/*` (프로젝트 루트 기준)

## 컴포넌트 규칙

- 서버 컴포넌트 기본, 필요 시에만 `"use client"` 사용
- shadcn/ui 컴포넌트는 `components/ui/`에 위치, 직접 수정 금지
- 커스텀 컴포넌트는 `components/` 직하 또는 기능별 하위 디렉토리
- 레이아웃 컴포넌트(Header, Footer)는 `components/layout/`

## 스타일링 규칙

- Tailwind CSS v4 유틸리티 클래스 사용
- `cn()` 함수로 조건부 클래스 병합 (`lib/utils.ts`)
- CSS 변수 기반 테마 (`globals.css`), oklch 색상 체계

## 폼 규칙

- React Hook Form + Zod 스키마 조합
- `@hookform/resolvers`로 연결

## 구현 방식 선택

- UI 컴포넌트: shadcn/ui에 해당 컴포넌트가 있으면 반드시 사용한다
- 새 페이지: 서버 컴포넌트로 시작하고, 인터랙티브 부분만 클라이언트 컴포넌트로 분리한다

> 금지 사항(외부 DB, 인증 등)은 `constraints.md` 참조.
