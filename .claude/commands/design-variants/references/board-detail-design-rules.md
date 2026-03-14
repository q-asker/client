---
name: Board-Detail 디자인 변형 규칙
description: Board-Detail 페이지의 Design A-D, Magic A-D 8개 변형 규칙
type: reference
globs: 'src/pages/board-detail/**'
---

# Board-Detail 디자인 변형 규칙

> design-variants-rules.md를 상속합니다. 공통 원칙은 해당 문서를 참조하세요.

## 개요

Board-Detail 페이지는 **8개의 변형**(Design A-D, Magic A-D)을 지원한다:

- 게시물 상세 페이지

## 페이지 특성

**주요 요소**:

- 제목, 작성자, 작성일
- 본문 콘텐츠
- 댓글 리스트
- 댓글 작성 폼

**변형 포인트**:

- 콘텐츠 너비
- 본문 타이포그래피
- 댓글 표시 방식
- 상호작용 요소

## 색상 팔레트

```css
--color-bd-primary: oklch(0.5 0.1 270);
--color-bd-secondary: oklch(0.6 0.08 240);
```

## 구현 체크리스트

- [ ] 컴포넌트 파일 생성
- [ ] `src/pages/board-detail/index.tsx`에 lazy import 추가
- [ ] query parameter 등록
- [ ] `npm run build` 성공 확인
- [ ] `npx prettier --check .` 성공 확인
