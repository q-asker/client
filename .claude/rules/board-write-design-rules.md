---
name: Board-Write 디자인 변형 규칙
description: Board-Write 페이지의 Design A-D, Magic A-D 8개 변형 규칙
type: reference
globs: 'src/pages/board-write/**'
---

# Board-Write 디자인 변형 규칙

> design-variants-rules.md를 상속합니다. 공통 원칙은 해당 문서를 참조하세요.

## 개요

Board-Write 페이지는 **8개의 변형**(Design A-D, Magic A-D)을 지원한다:

- 게시물 작성 폼

## 페이지 특성

**주요 요소**:

- 제목 입력란
- 본문 편집기 (마크다운 또는 WYSIWYG)
- 첨부 파일 영역
- 제출 버튼

**변형 포인트**:

- 폼 레이아웃
- 입력 필드 스타일
- 편집기 UI
- 버튼 스타일

## 색상 팔레트

```css
--color-bw-primary: oklch(0.5 0.1 270);
--color-bw-secondary: oklch(0.6 0.08 240);
```

## 구현 체크리스트

- [ ] 컴포넌트 파일 생성
- [ ] `src/pages/board-write/index.tsx`에 lazy import 추가
- [ ] query parameter 등록
- [ ] `npm run build` 성공 확인
- [ ] `npx prettier --check .` 성공 확인
