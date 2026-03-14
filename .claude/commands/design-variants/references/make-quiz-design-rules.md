---
name: Make-Quiz 디자인 변형 규칙
description: Make-Quiz 페이지의 Design A-H 8개 변형 규칙
type: reference
globs: 'src/pages/make-quiz/**'
---

# Make-Quiz 디자인 변형 규칙

> design-variants-rules.md를 상속합니다. 공통 원칙은 해당 문서를 참조하세요.

## 개요

Make-Quiz 페이지는 **8개의 Design 변형**을 지원한다 (query parameter: mq=1~8):

- Design A-H: 다양한 UI/UX 스타일의 퀴즈 생성 인터페이스

## 페이지 특성

**주요 요소**:

- 파일 업로드 영역
- 옵션 설정 (문제 타입, 난이도, 개수 등)
- PDF 뷰어
- 생성 진행률 표시

**변형 포인트**:

- 레이아웃 (사이드바 vs 풀 너비)
- 색상 스킴
- 인터랙션 피드백
- 타이포그래피

## 색상 팔레트

각 변형별로 고유한 oklch 색상 변수를 정의한다. globals.css @theme에 추가:

```css
--color-mq-primary: oklch(0.5 0.1 270);
--color-mq-secondary: oklch(0.6 0.08 240);
/* 변형별 추가 색상 */
```

## 구현 체크리스트

새 변형 추가 시:

- [ ] 컴포넌트 파일 생성 (`MakeQuizDesignA.tsx` 등)
- [ ] `src/pages/make-quiz/index.tsx`에 lazy import 추가
- [ ] 변형 선택 로직에 query parameter 등록
- [ ] compare HTML에 버튼 추가 (선택)
- [ ] `npm run build` 성공 확인
- [ ] `npx prettier --check .` 성공 확인
