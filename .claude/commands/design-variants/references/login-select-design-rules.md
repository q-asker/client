---
name: Login-Select 디자인 변형 규칙
description: Login-Select 페이지의 Design A-D, Magic A-D 8개 변형 규칙
type: reference
globs: 'src/pages/login-select/**'
---

# Login-Select 디자인 변형 규칙

> design-variants-rules.md를 상속합니다. 공통 원칙은 해당 문서를 참조하세요.

## 개요

Login-Select 페이지는 **8개의 변형**(Design A-D, Magic A-D)을 지원한다:

- 로그인 방식 선택 페이지

## 페이지 특성

**주요 요소**:

- 로그인 옵션 버튼 (OAuth 제공자별)
- 헤더/소개
- 약관 링크

**변형 포인트**:

- 버튼 레이아웃 (그리드 vs 스택)
- 버튼 스타일
- 색상 스킴
- 상호작용 피드백

## 색상 팔레트

```css
--color-ls-primary: oklch(0.5 0.1 270);
--color-ls-secondary: oklch(0.6 0.08 240);
```

## 구현 체크리스트

- [ ] 컴포넌트 파일 생성
- [ ] `src/pages/login-select/index.tsx`에 lazy import 추가
- [ ] query parameter 등록
- [ ] `npm run build` 성공 확인
- [ ] `npx prettier --check .` 성공 확인
