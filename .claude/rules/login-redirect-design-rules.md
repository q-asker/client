---
name: Login-Redirect 디자인 변형 규칙
description: Login-Redirect 페이지의 Design A-D, Magic A-D 8개 변형 규칙
type: reference
globs: 'src/pages/login-redirect/**'
---

# Login-Redirect 디자인 변형 규칙

> design-variants-rules.md를 상속합니다. 공통 원칙은 해당 문서를 참조하세요.

## 개요

Login-Redirect 페이지는 **8개의 변형**(Design A-D, Magic A-D)을 지원한다:

- OAuth 리다이렉트 처리 페이지

## 페이지 특성

**주요 요소**:

- 로딩 인디케이터
- 상태 메시지
- 리다이렉트 안내

**변형 포인트**:

- 로딩 애니메이션 스타일
- 메시지 표시 방식
- 색상 테마
- 진행 상황 표시

## 색상 팔레트

```css
--color-lr-primary: oklch(0.5 0.1 270);
--color-lr-secondary: oklch(0.6 0.08 240);
```

## 구현 체크리스트

- [ ] 컴포넌트 파일 생성
- [ ] `src/pages/login-redirect/index.tsx`에 lazy import 추가
- [ ] query parameter 등록
- [ ] `npm run build` 성공 확인
- [ ] `npx prettier --check .` 성공 확인
