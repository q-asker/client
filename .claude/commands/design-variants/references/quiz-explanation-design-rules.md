---
name: Quiz-Explanation 디자인 변형 규칙
description: Quiz-Explanation 페이지의 Design A-D, Magic A-D 8개 변형 규칙
type: reference
globs: 'src/pages/quiz-explanation/**'
---

# Quiz-Explanation 디자인 변형 규칙

> design-variants-rules.md를 상속합니다. 공통 원칙은 해당 문서를 참조하세요.

## 개요

Quiz-Explanation 페이지는 **8개의 변형**(Design A-D, Magic A-D)을 지원한다:

- 퀴즈 해설 콘텐츠 표시

## 페이지 특성

**주요 요소**:

- 문제 전문
- 정오답 표시
- 마크다운 기반 해설 텍스트
- 이미지/미디어
- 관련 정보

**변형 포인트**:

- 콘텐츠 레이아웃
- 마크다운 렌더링 스타일
- 강조 표현
- 네비게이션

## 색상 팔레트

```css
--color-qe-primary: oklch(0.5 0.1 270);
--color-qe-secondary: oklch(0.6 0.08 240);
```

## 구현 체크리스트

- [ ] 컴포넌트 파일 생성
- [ ] `src/pages/quiz-explanation/index.tsx`에 lazy import 추가
- [ ] query parameter 등록
- [ ] 마크다운 렌더링 스타일 정의
- [ ] `npm run build` 성공 확인
- [ ] `npx prettier --check .` 성공 확인
