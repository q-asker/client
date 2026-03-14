---
name: Board 디자인 변형 규칙
description: Board 페이지의 Design A-D, Magic A-D 8개 변형 규칙
type: reference
globs: 'src/pages/board/**'
---

# Board 디자인 변형 규칙

> design-variants-rules.md를 상속합니다. 공통 원칙은 해당 문서를 참조하세요.

## 개요

Board 페이지는 **8개의 변형**(Design A-D, Magic A-D)을 지원한다:

- 게시판 게시물 목록

## 페이지 특성

**주요 요소**:

- 게시물 리스트
- 각 항목: 제목, 작성자, 작성일, 조회수
- 페이지네이션
- 정렬 옵션

**변형 포인트**:

- 카드 vs 리스트 레이아웃
- 정보 표시 방식
- 강조 요소
- 인터랙션 피드백

## 색상 팔레트

```css
--color-board-primary: oklch(0.5 0.1 270);
--color-board-secondary: oklch(0.6 0.08 240);
```

## 구현 체크리스트

- [ ] 컴포넌트 파일 생성
- [ ] `src/pages/board/index.tsx`에 lazy import 추가
- [ ] query parameter 등록
- [ ] `npm run build` 성공 확인
- [ ] `npx prettier --check .` 성공 확인
