---
name: Quiz Result 디자인 변형 규칙
description: Quiz Result 페이지의 12개 디자인 변형(기본, DesignA-H, MagicA-D) 상세 규칙
type: reference
globs: 'src/pages/quiz-result/**'
---

# Quiz Result 디자인 변형 규칙

> design-variants-rules.md를 상속합니다. 공통 원칙은 해당 문서를 참조하세요.

## 개요

Quiz Result 페이지는 12개의 디자인 변형을 지원한다:

- **기본**: 원본 구현 (쿼리 파라미터 없음)
- **MagicA-B, DesignA-D**: 기존 6개 변형 (qr=1-6)
- **DesignE-H**: 새로운 CSS 기반 변형 (qr=7-10)
- **MagicC-D**: 새로운 애니메이션 변형 (qr=11-12)

## 공통 레이아웃 (2열 구조)

모든 변형은 2열 레이아웃을 유지한다:

```
<div className="grid gap-6 lg:grid-cols-[{LEFT_WIDTH}px_1fr]">
  {/* 좌측 sticky 패널 */}
  <aside className="lg:sticky lg:top-8 lg:self-start flex flex-col gap-4">
    {/* 점수, 메타정보, CTA 버튼 */}
  </aside>

  {/* 우측 스크롤 영역 */}
  <div className="flex flex-col gap-4">
    {/* 문항 결과 카드 리스트 */}
  </div>
</div>
```

## 좌측 패널 규격

| 변형           | 너비  | 특징                      |
| -------------- | ----- | ------------------------- |
| DesignA/E/F    | 300px | 기본 카드                 |
| DesignB        | 320px | 메타 칩                   |
| DesignC        | 280px | 아코디언 + ProgressRing   |
| DesignD/MagicC | 320px | 메타 칩 + 아이콘          |
| DesignG        | 400px | ProgressRing + 상세 메타  |
| DesignH/MagicD | 300px | 다크 테마 + glassmorphism |

## DesignE-H 상세 스펙

### DesignE — Info Card 3-Column Grid (qr=7)

**목표**: 정보 밀도 증대로 한 화면에 더 많은 문항 표시

**구현 기준**:

- 좌측 너비: 300px (DesignA와 동일)
- 우측 그리드: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- 각 카드: DesignA와 동일한 구조 (크기만 조정)
- 카드 텍스트 크기: `text-sm` (기본 `text-lg` 대비 축소)

**검증**:

- lg(1024px): 3열, md: 2열, mobile: 1열
- 좌측 sticky 패널 정상 작동

---

### DesignF — Compact List Mini Cards (qr=8)

**목표**: 극도로 축약된 미니 리스트로 30개 문항 한 화면 표시

**구현 기준**:

- 좌측: 300px (DesignA와 동일)
- 우측 카드 높이: ~40px (기본 대비 약 1/3)
- 카드 레이아웃: `flex items-center gap-3`
- 구성 요소 (좌에서 우):
  1. 정오답 도트 (2.5px 원형) — Tailwind: `size-2.5 rounded-full`
  2. 문항 번호 (Q01 형식)
  3. 제목 (한줄 truncate)
  4. 선택한 답 (한줄, truncate, 우측 정렬)
- 정답 답안 섹션 제거

**검증**:

- 카드 높이 ~40px 확인
- 한 화면에 15+ 문항 표시 가능
- 정오답 구분 명확 (색상/도트)

---

### DesignG — Stats Enhanced Panel (qr=9)

**목표**: 통계 정보 강화로 결과 분석 깊이 증대

**구현 기준**:

- 좌측 너비: 400px (가장 큼)
- 좌측 구성:
  1. ProgressRing (size=160, scorePercent 시각화)
  2. 메타 카드 3개 (각 아이콘 + 수치):
     - Hash 아이콘 + 문제 수
     - Trophy 아이콘 + 정답율 (correctCount / total)
     - Clock 아이콘 + 걸린 시간
  3. 해설 보기 버튼
- 우측: DesignA와 동일한 기본 카드 리스트

**컴포넌트 import**:

```tsx
import { Hash, Trophy, Clock } from 'lucide-react';
import { ProgressRing } from './ProgressRing'; // DesignC에서 복사
```

**검증**:

- ProgressRing 렌더링 정상
- 좌측 너비 400px 유지
- 아이콘 4개 표시 정상

---

### DesignH — Dark Theme Gradient Cards (qr=10)

**목표**: 모던한 다크 테마 스타일로 야간 사용성 향상

**구현 기준**:

#### 배경색 (CSS 변수 사용 — tweakcn 스펙)

```tsx
style={{ backgroundColor: 'var(--color-surface-dark)' }}
```

#### 좌측 패널 스타일

- 배경: CSS 변수 `--color-surface-dark-card`
- 텍스트 색상: `text-white/60`, `text-white`
- 카드 배경: `--color-surface-dark-card`
- 경계선: `border-0`

#### 우측 카드 그래디언트

- 정답 (isCorrect): `bg-gradient-to-r from-emerald-500/10 to-emerald-600/10`
  - 좌측 보더: `border-l-emerald-400`
- 오답 (!isCorrect): `bg-gradient-to-r from-red-500/10 to-red-600/10`
  - 좌측 보더: `border-l-red-400`
- 텍스트: `text-white` (명도 확보)

#### 정답 설명 박스 (오답 시)

- 배경: `bg-emerald-500/20`
- 텍스트: `text-emerald-300`
- 경계선: `border border-emerald-400/30`

**CSS 변수 정의** (globals.css @theme):

```css
--color-surface-dark: oklch(0.15 0.05 264.66);
--color-surface-dark-card: oklch(0.11 0.03 264.66);
```

**검증**:

- 다크 배경 시각 확인
- 그래디언트 카드 렌더링 정상
- 텍스트 명도 확보 (흰색 기본)

---

## MagicC-D 상세 스펙

### MagicC — Reveal Animation (qr=11)

**목표**: Framer Motion 스태거 reveal 애니메이션으로 동적 진입

**구현 기준**:

#### 기반 구조

- DesignD를 기반으로 (타임라인 제거 후 일반 카드)
- 좌측 패널: BlurFade 애니메이션 유지

#### 우측 카드 애니메이션

- `<AnimatePresence>` 래핑
- 각 카드를 `<motion.div>`로 래핑:
  ```tsx
  <motion.div
    variants={cardVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    transition={{ delay: 0.5 + index * 0.1, duration: 0.3 }}
  >
  ```
- Variants 정의:
  ```tsx
  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };
  ```

#### 애니메이션 타이밍

- 시작 지연: 0.5초
- 카드별 스태거: index \* 0.1초
- 각 카드 지속시간: 0.3초
- 퇴출 애니메이션: `y: -20`

**Import**:

```tsx
import { motion, AnimatePresence } from 'framer-motion';
```

**검증**:

- 애니메이션 부드럽게 재생 (0.5초부터 시작)
- 각 카드 스태거 0.1초 간격 확인
- 퇴출 애니메이션 정상 작동

---

### MagicD — Glassmorphism Style (qr=12)

**목표**: 모던 glassmorphism으로 프리미엄한 UX 제공

**구현 기준**:

#### 배경

- 그래디언트 배경: `from-blue-50 via-purple-50 to-pink-50 dark:from-slate-950`
- 목적: 반투명 배경이 시각적 깊이를 강조

#### 좌측 패널 (glassmorphism)

```tsx
<motion.aside
  className="backdrop-blur-md bg-white/30 dark:bg-slate-900/30 rounded-2xl border border-white/20 dark:border-slate-700/20 p-4"
>
```

- 애니메이션: `motion.aside` with `initial={{ opacity: 0 }}`
- 각 내부 카드: `bg-white/40 dark:bg-slate-800/40 shadow-lg`

#### 우측 카드 (glassmorphism + hover 애니메이션)

```tsx
<motion.div
  whileHover={{ scale: 1.02 }}
  transition={{ duration: 0.2 }}
>
  <Card className="backdrop-blur-sm bg-white/40 dark:bg-slate-900/40 border border-white/20 dark:border-slate-700/20 shadow-2xl">
```

#### 카드 스타일

- 배경: `bg-white/40 dark:bg-slate-900/40` (반투명)
- 경계선: `border border-white/20 dark:border-slate-700/20`
- 쉐도우: `shadow-2xl` (깊이 강조)
- 정답 답안 박스: `bg-emerald-500/20 dark:bg-emerald-500/10 border border-emerald-400/30`

#### 진입 애니메이션

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.3 + index * 0.05, duration: 0.3 }}
  whileHover={{ scale: 1.02 }}
>
```

**Import**:

```tsx
import { motion } from 'framer-motion';
```

**검증**:

- 배경 blur 효과 시각 확인
- whileHover 스케일 애니메이션 정상
- 어두운 배경에서도 명도 콘트라스트 확보
- 반투명 카드 시각적 계층 구분 명확

---

## 비교 페이지 관리

### quiz-result-compare.html

모든 변형을 한곳에서 비교할 수 있도록 지원:

```html
<!-- Nav 버튼 -->
<button onclick="showOne('7')" id="btn-7">7</button>
<!-- DesignE -->
<button onclick="showOne('8')" id="btn-8">8</button>
<!-- DesignF -->
<button onclick="showOne('9')" id="btn-9">9</button>
<!-- DesignG -->
<button onclick="showOne('10')" id="btn-10">10</button>
<!-- DesignH -->
<button onclick="showOne('11')" id="btn-11">11</button>
<!-- MagicC -->
<button onclick="showOne('12')" id="btn-12">12</button>
<!-- MagicD -->

<!-- ALL_VARIANTS 배열 -->
const ALL_VARIANTS = [ // ... 기존 6개 ... { key: '7', label: '7 — DesignE (Info Card 3-Grid)' }, {
key: '8', label: '8 — DesignF (Compact List)' }, { key: '9', label: '9 — DesignG (Stats Enhanced)'
}, { key: '10', label: '10 — DesignH (Dark Theme)' }, { key: '11', label: '11 — MagicC (Reveal
Animation)' }, { key: '12', label: '12 — MagicD (Glassmorphism)' }, ];
```

**URL 패턴**: `/result/mock-test?mock=true&qr={1-12}`

---

## 구현 체크리스트

각 새 변형 추가 시:

- [ ] 컴포넌트 파일 생성 (`QuizResultDesignE.tsx` 등)
- [ ] `src/pages/quiz-result/index.tsx`에 lazy import 추가
- [ ] `QR_VARIANTS` 맵에 qr 파라미터 등록
- [ ] `public/quiz-result-compare.html`에 버튼 추가
- [ ] `ALL_VARIANTS` 배열에 항목 추가
- [ ] `npm run build` 성공 확인
- [ ] `npx prettier --check .` 성공 확인
- [ ] 비교 페이지에서 변형 시각 확인 (`?qr={N}&mock=true`)

---

## 참고 자료

- design-variants-rules.md: 전사 표준 규칙
- tweakcn 스펙: code-rules.md
- Framer Motion 문서: https://www.framer.com/motion/
- Shadcn UI 컴포넌트: @/shared/ui/components/
