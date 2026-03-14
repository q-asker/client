---
name: Privacy-Policy 디자인 변형 규칙
description: Privacy-Policy 페이지의 Design A-D, Magic A-D 8개 변형 규칙
type: reference
globs: 'src/pages/privacy-policy/**'
---

# Privacy-Policy 디자인 변형 규칙

> design-variants-rules.md를 상속합니다. 공통 원칙은 해당 문서를 참조하세요.

## 개요

Privacy-Policy 페이지는 **8개의 변형**(Design A-D, Magic A-D)을 지원한다:

- 개인정보처리방침 문서 페이지

## 페이지 특성

**주요 요소**:

- 마크다운 기반 정책 문서
- 목차/네비게이션
- 섹션 제목 및 본문
- 마지막 수정일

**변형 포인트**:

- 문서 너비와 가독성
- 마크다운 렌더링 스타일
- 색상 강조
- 네비게이션 UI

## 색상 팔레트

```css
--color-pp-primary: oklch(0.5 0.1 270);
--color-pp-secondary: oklch(0.6 0.08 240);
```

## 구현 체크리스트

- [ ] 컴포넌트 파일 생성
- [ ] `src/pages/privacy-policy/index.tsx`에 lazy import 추가
- [ ] query parameter 등록
- [ ] 마크다운 렌더링 스타일 정의
- [ ] `npm run build` 성공 확인
- [ ] `npx prettier --check .` 성공 확인
