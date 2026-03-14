---
name: Maintenance 디자인 변형 규칙
description: Maintenance 페이지의 Design A-D, Magic A-D 8개 변형 규칙
type: reference
globs: 'src/pages/maintenance/**'
---

# Maintenance 디자인 변형 규칙

> design-variants-rules.md를 상속합니다. 공통 원칙은 해당 문서를 참조하세요.

## 개요

Maintenance 페이지는 **8개의 변형**(Design A-D, Magic A-D)을 지원한다:

- 유지보수 중 알림 페이지

## 페이지 특성

**주요 요소**:

- 제목/헤드라인
- 메인테넌스 안내 메시지
- 예상 복구 시간
- 연락처 정보

**변형 포인트**:

- 레이아웃
- 강조 색상
- 아이콘 표현
- 타이포그래피

## 색상 팔레트

```css
--color-maint-primary: oklch(0.5 0.1 270);
--color-maint-secondary: oklch(0.6 0.08 240);
```

## 구현 체크리스트

- [ ] 컴포넌트 파일 생성
- [ ] `src/pages/maintenance/index.tsx`에 lazy import 추가
- [ ] query parameter 등록
- [ ] `npm run build` 성공 확인
- [ ] `npx prettier --check .` 성공 확인
