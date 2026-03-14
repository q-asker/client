---
name: Solve-Quiz 디자인 변형 규칙
description: Solve-Quiz 페이지의 Design A-D, Magic A-D 8개 변형 규칙
type: reference
globs: 'src/pages/solve-quiz/**'
---

# Solve-Quiz 디자인 변형 규칙

> design-variants-rules.md를 상속합니다. 공통 원칙은 해당 문서를 참조하세요.

## 개요

Solve-Quiz 페이지는 **8개의 변형**(Design A-D, Magic A-D)을 지원한다:

- 퀴즈 풀이 인터페이스의 다양한 표현

## 페이지 특성

**주요 요소**:

- 문제 제시 영역
- 선택지 (단일 선택 / 복수 선택)
- 남은 문제 네비게이션
- 제출/다음 버튼

**변형 포인트**:

- 문제 카드 스타일
- 선택지 표현 (버튼 vs 라디오 vs 체크박스)
- 진행 상황 표시
- 네비게이션 스타일

## 색상 팔레트

각 변형별로 고유한 oklch 색상 변수를 정의한다:

```css
--color-sq-primary: oklch(0.5 0.1 270);
--color-sq-secondary: oklch(0.6 0.08 240);
```

## 구현 체크리스트

- [ ] 컴포넌트 파일 생성
- [ ] `src/pages/solve-quiz/index.tsx`에 lazy import 추가
- [ ] query parameter 등록
- [ ] `npm run build` 성공 확인
- [ ] `npx prettier --check .` 성공 확인
