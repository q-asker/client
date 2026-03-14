---
name: Quiz-History 디자인 변형 규칙
description: Quiz-History 페이지의 Design A-D, Magic A-D 8개 변형 규칙
type: reference
globs: 'src/pages/quiz-history/**'
---

# Quiz-History 디자인 변형 규칙

> design-variants-rules.md를 상속합니다. 공통 원칙은 해당 문서를 참조하세요.

## 개요

Quiz-History 페이지는 **8개의 변형**(Design A-D, Magic A-D)을 지원한다:

- 사용자의 퀴즈 풀이 히스토리 목록

## 페이지 특성

**주요 요소**:

- 히스토리 리스트/테이블
- 각 항목: 파일명, 풀이 날짜, 정답율, 소요 시간
- 필터/정렬 옵션
- 검색 기능

**변형 포인트**:

- 리스트 레이아웃 (테이블 vs 카드)
- 행 높이와 정보 밀도
- 정렬/필터 UI
- 색상과 강조

## 색상 팔레트

```css
--color-qh-primary: oklch(0.5 0.1 270);
--color-qh-secondary: oklch(0.6 0.08 240);
```

## 구현 체크리스트

- [ ] 컴포넌트 파일 생성
- [ ] `src/pages/quiz-history/index.tsx`에 lazy import 추가
- [ ] query parameter 등록
- [ ] `npm run build` 성공 확인
- [ ] `npx prettier --check .` 성공 확인
