# 디자인 변형 공통 규칙 (Design Variants Rules)

## 1. 에이전트/스킬 사용 규칙

- **모든 컴포넌트 변형 작성 시 `/design-variants` 스킬 필수 참조**
- 스킬은 design-variants-rules.md(본 문서) + 페이지별 특화 규칙 참고
- 실제 구현: TypeScript + React, 색상: OKLch, 애니메이션: Framer Motion

## 2. 기술 제약 (준수 필수)

### 파일 구조

- 위치: `src/pages/{페이지}/{ComponentName}.tsx`
- 네이밍: PascalCase (예: `SolveQuizMagicA.tsx`)
- index.tsx에서 export

### 색상

- **OKLch 색공간만 사용** (`oklch()` 함수)
- HEX, RGB, 색상명 금지
- 형식: `oklch(lightness% chroma hue)`
  - lightness: 0~100
  - chroma: 0~0.4
  - hue: 0~360

예:

```tsx
// ✅ 좋음
className="bg-blue-600 dark:bg-blue-900"  // Tailwind에서 oklch로 정의됨
style={{ color: 'oklch(70% 0.2 220)' }}  // 직접 정의

// ❌ 금지
className="bg-[#2563eb]"
style={{ color: '#2563eb' }}
```

### 스타일링

- **Tailwind CSS 유틸리티 클래스 우선**
- 커스텀 CSS는 `src/app/globals.css`에만 작성
- 컴포넌트별 `.css` 파일 금지
- `dark:` 클래스로 다크모드 지원

### 애니메이션

- **Framer Motion만 사용** (`motion.div`, `motion.button` 등)
- CSS animation/transition도 Tailwind `transition` 클래스 사용 가능
- 다른 애니메이션 라이브러리 금지

### TypeScript

- `strict: true` 모드
- 컴포넌트 인터페이스 정의 필수
- `React.FC` 사용
- Props 타입 명시

### 임포트

**shrimp-rules.md의 Import 규칙을 따릅니다**:

- FSD 슬라이스: `#features/`, `#widgets/` 등
- Shadcn/MagicUI: `@/shared/ui/components/`
- 절대경로 사용 (상대경로 금지)

## 3. 모든 변형이 필수로 제공할 기능

### UI 요소 (필수)

- [ ] 진행률 표시 (퍼센트 또는 시각화)
- [ ] 현재 문제 번호 표시 (Q n / total)
- [ ] 문제별 상태 표시 (정답/미답변/검토)
- [ ] 선택 옵션 UI
- [ ] 이전/다음/확인/제출 버튼
- [ ] 제출 다이얼로그 (통계: 전체/답변/미답변/검토)
- [ ] 검토 마크 체크박스
- [ ] 마크다운 콘텐츠 렌더링

### 기능 (필수)

- [ ] mock=true 모드 지원 (테스트용)
- [ ] 문제 점프 네비게이션
- [ ] 답변 선택 & 저장
- [ ] 제출 전 확인
- [ ] 다크모드 지원
- [ ] 반응형 디자인

## 4. 코드 품질 기준

### 파일 크기

- 컴포넌트 파일: < 250줄 권장
- 길면 로직을 함수/hook으로 분리

### 조건문

- 3줄 이상의 조건은 함수로 추출

```tsx
// ❌ 피하기
{
  quiz.showSubmitDialog && quiz.submitReady && !quiz.isLoading && <div>...</div>;
}

// ✅ 좋음
{
  shouldShowSubmitDialog() && <div>...</div>;
}
```

### 타입 정의

```tsx
interface QuizState {
  currentQuestion: number;
  totalQuestions: number;
  // ...
}

interface ComponentProps {
  quiz: QuizState;
}
```

### 주석

- 복잡한 로직에만 한국어 주석 추가
- 간단한 코드는 주석 불필요 (코드 자체가 설명)
- 함수/인터페이스 위에는 JSDoc 불필요 (타입이 명확하면)

## 5. 반응형 설계

### Breakpoints (Tailwind 기본값)

- sm: 640px
- md: 768px
- lg: 1024px ← **주요 레이아웃 전환점**
- xl: 1280px

### 패턴

```tsx
// 모바일 1열 → 데스크톱 2열
<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">

// 모바일: 숨김 → 데스크톱: 표시
<aside className="hidden lg:block">

// 모바일: 하단 고정 → 데스크톱: 우측 사이드바
<nav className="fixed bottom-0 lg:relative lg:flex-col">
```

## 6. 다크모드

### 필수 구현

- 모든 텍스트 색상: `text-gray-900 dark:text-white`
- 모든 배경: `bg-white dark:bg-slate-900`
- 모든 테두리: `border-gray-200 dark:border-gray-700`

### 대비 확인

- 다크모드에서도 가독성 유지 필수
- 밝은 색상 사용 시 명도(lightness) 조정

## 7. 검증 기준

### TypeScript

```bash
npx tsc --noEmit  # 컴파일 에러 없음
```

### 빌드

```bash
npm run build  # 성공
```

### 포맷팅

```bash
npx prettier --check .  # 통과
```

### 런타임

- `/quiz/test?sq=N&mock=true` 로드 가능
- solve-quiz-compare.html에서 즉시 변경
- 콘솔 에러 없음

### 다크모드

- `<html class="dark">` 상태에서 가독성 유지
- 모든 색상 대비 확인 (WCAG AA 권장)

## 8. 참고: 완성된 변형 분석

### Magic 변형들 (애니메이션 중심)

- #1 MagicA, #13 MagicE, #14 MagicF, #15 MagicG, #16 MagicH
- 패턴: BlurFade, TextAnimate, perspective, staggerChildren, infinite rotate
- 색상 선택: 선명함 (chroma > 0.15)

### Design 변형들 (구조 중심)

- #4 DesignB, #7 DesignC, #8 DesignD, #11 DesignG, #12 DesignH
- 패턴: sidebar, grid, timeline, header, chat
- 색상 선택: 차분함 (chroma < 0.15)

## 9. 자주하는 실수

❌ **금지**

- `import './Component.css'`
- `style={{ color: '#2563eb' }}`
- `<div style={dynamicStyle}>` (Tailwind 클래스 사용)
- MagicUI 외 다른 애니메이션 라이브러리
- 기존 변형 코드 복사 후 색상만 변경
- `useEffect` 과다 사용 (hook 계층 유의)

✅ **권장**

- Tailwind 클래스 우선
- OKLch 색상 사용
- Framer Motion으로 고급 애니메이션
- 타입 정의 완성
- 컴포넌트 분리 (크기 < 250줄)
