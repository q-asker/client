# Solve-Quiz 디자인 변형 가이드

solve-quiz 페이지의 6개 신규 변형을 구현하기 위한 상세 규칙입니다.

---

## 1. 변형 목록 및 분류

| #   | 이름    | 유형   | 설명               | 우선 참조                                          |
| --- | ------- | ------ | ------------------ | -------------------------------------------------- |
| #2  | MagicB  | Magic  | Stagger Reveal     | 진행률 표시 → 문제 리스트 → 선택지 순차 애니메이션 |
| #3  | DesignA | Design | Minimalist Sidebar | 좌측 고정 사이드바(진행률/네비) + 우측 문제        |
| #5  | MagicC  | Magic  | Rotating Ring      | 진행률을 회전 링으로 표현 + 애니메이션 강화        |
| #6  | MagicD  | Magic  | Glassmorphism      | 유리 효과 + 블러 배경 + 애니메이션                 |
| #9  | DesignE | Design | Grid Cards         | 문제를 그리드 카드로 표현 (3열 이상)               |
| #10 | DesignF | Design | Carousel Slider    | 카로셀/슬라이더로 문제 순회                        |

---

## 2. Solve-Quiz 필수 구성 요소

모든 변형이 갖춰야 하는 UI/기능:

### 진행 표시

- **Required**: 진행률 수치 표시 (%) + 시각화 (프로그레스 바, 링, 게이지 등)
- **위치**: 상단 또는 좌측 고정 영역
- **Framer Motion**: `animate={{ width: progressPercent }}`로 부드러운 애니메이션

### 문제 네비게이션

- **Required**: "Q n / total" 표시
- **Jump**: 모든 문제 번호를 버튼으로 표시 → 클릭 시 해당 문제로 이동
- **상태 표시**:
  - 현재 문제: 강조 색상 (bg-{color}-600)
  - 답변 완료: 녹색 (emerald-\*)
  - 검토 표시: 황색 (amber-\*)
  - 미답변: 회색 (gray-\*)

### 선택지 렌더링

- **Required**: 모든 선택지를 버튼으로 표시
- **선택 상태**: 클릭 시 border + bg 색상 변경 (selected option 강조)
- **마크다운**: `<MarkdownText>` 컴포넌트로 렌더링

### 제출 다이얼로그

- **Required**: "제출 확인" 다이얼로그 (모든 변형 동일)
- **통계**: 전체/답변/미답변/검토 개수 표시
- **Dialog**: Framer Motion으로 fade-in, scale-up 애니메이션

### 버튼 그룹

- **이전/다음**: 문제 이동 (현재 선택지 저장 후 이동)
- **확인**: 제출 다이얼로그 열기
- **제출**: 최종 제출 (completedAt 저장)

### 검토 마크

- **checkbox**: `quiz.currentQuiz.check` 토글
- **라벨**: t('검토') 표시

---

## 3. 색상 팔레트 (OKLch)

### Magic 변형 (선명도 > 0.15)

- **Primary**: oklch(70% 0.2 220) — 파란색
- **Accent**: oklch(75% 0.25 280) — 보라색
- **Success**: oklch(72% 0.18 160) — 초록색
- **Warning**: oklch(76% 0.2 80) — 황색
- **Muted**: oklch(65% 0.08 220) — 회색-파란색

### Design 변형 (선명도 < 0.15)

- **Primary**: oklch(68% 0.12 220) — 차분한 파란색
- **Accent**: oklch(70% 0.1 280) — 차분한 보라색
- **Success**: oklch(70% 0.12 160) — 차분한 초록색
- **Warning**: oklch(74% 0.14 80) — 차분한 황색
- **Muted**: oklch(62% 0.06 220) — 차분한 회색

**다크 모드**: 각 색상 명도(lightness) +10~15% 증가, chroma는 유지

---

## 4. 변형별 상세 구현 가이드

### #2 MagicB (Stagger Reveal)

**개념**: 각 UI 섹션이 순차적으로 나타나는 애니메이션

**레이아웃**:

```tsx
// 상단 진행률
<motion.div initial={{opacity: 0, y: -10}} animate={{opacity: 1, y: 0}} transition={{delay: 0}}>
  {/* 진행률 바 */}
</motion.div>

// 문제 목록 (그리드)
<motion.div transition={{staggerChildren: 0.1, delayChildren: 0.2}}>
  {quiz.quizzes.map((q, idx) => (
    <motion.button key={q.number} initial={{opacity: 0, scale: 0.8}} animate={{opacity: 1, scale: 1}}>
      Q{q.number}
    </motion.button>
  ))}
</motion.div>

// 선택지 (각각 지연)
<motion.div transition={{staggerChildren: 0.05, delayChildren: 0.4}}>
  {quiz.currentQuiz.selections.map((opt) => (
    <motion.button initial={{opacity: 0, x: -20}} animate={{opacity: 1, x: 0}}>
      {opt.content}
    </motion.button>
  ))}
</motion.div>
```

**색상**: Magic 팔레트 (파란색 중심, Primary: oklch(70% 0.2 220))
**다크 모드**: 배경 어두운 톤 (dark:bg-slate-950), 텍스트 밝음 (dark:text-white)

---

### #3 DesignA (Minimalist Sidebar)

**개념**: 좌측 고정 사이드바 + 우측 콘텐츠 (참조: SolveQuizDesignC.tsx의 타임라인 패턴)

**레이아웃**:

```tsx
<div className="flex min-h-screen">
  {/* 좌측 사이드바 - sticky */}
  <aside className="hidden lg:flex lg:w-56 flex-col bg-slate-50 dark:bg-slate-900 border-r sticky top-0 h-screen">
    <div className="p-6">
      <h3 className="text-xs font-bold uppercase mb-4">문제진행</h3>
      {/* 진행률 바 */}
      {/* 문제 네비 (5-10개 미리보기) */}
    </div>
  </aside>

  {/* 우측 콘텐츠 */}
  <main className="flex-1 px-8 py-8">
    {/* 진행률 표시 */}
    {/* 현재 문제 */}
    {/* 선택지 */}
    {/* 버튼 */}
  </main>
</div>
```

**사이드바 네비**:

- 아이콘 (CheckCircle2/Circle) + Q번호 + 호버 효과
- 현재 문제: bg-blue-100 dark:bg-blue-950 + border-l-4

**색상**: Design 팔레트 (차분, slate 기반) — oklch(68% 0.12 220)
**반응형**: md 이하에서 사이드바 숨김

---

### #5 MagicC (Rotating Ring)

**개념**: 진행률을 회전 링으로 표현 (SVG 또는 Framer Motion)

**진행률 링**:

```tsx
// 방법 1: SVG + Framer Motion
<motion.svg>
  <motion.circle
    animate={{ pathLength: progressPercent / 100 }}
    transition={{ duration: 0.8 }}
  />
</motion.svg>

// 방법 2: Framer Motion + border-b + rotate
<motion.div
  className="w-20 h-20 rounded-full border-4 border-transparent border-b-blue-500"
  animate={{ rotate: 360 }}
  transition={{ duration: 2, repeat: Infinity }}
/>
```

**레이아웃**: 사각형 카드 중앙에 링 + 진행률 숫자

**색상**: Magic 팔레트 (보라/파란색) — oklch(75% 0.25 280)

---

### #6 MagicD (Glassmorphism)

**개념**: 유리/블러 효과 + 배경 흐림 + 떠있는 카드 느낌

**구현**:

```tsx
<div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
  {/* 배경 블러 (optional: backdrop-blur 또는 CSS filter) */}

  {/* 콘텐츠 카드 */}
  <motion.div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-white/20">
    {/* 투명 배경 + 유리 효과 */}
  </motion.div>
</div>
```

**카드 스타일**:

- `bg-white/80 backdrop-blur-md` (라이트 모드)
- `dark:bg-slate-900/80 dark:backdrop-blur-md` (다크 모드)
- `border border-white/20 dark:border-white/10`

**섀도우**: `shadow-2xl` + 보라/파란 그래디언트 테두리

**색상**: Magic 팔레트 + 그래디언트 배경 (보라 → 파란색)

---

### #9 DesignE (Grid Cards)

**개념**: 문제를 3열 그리드 카드로 표현 (참조: 읽은 SolveQuizDesignE.tsx)

**레이아웃**:

```tsx
<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
  {quiz.quizzes.map((q, idx) => (
    <motion.button
      key={q.number}
      onClick={() => quizActions.handleJumpTo(q.number)}
      className={cn(
        'p-4 rounded-lg text-center',
        q.number === quiz.currentQuestion && 'bg-orange-600 text-white',
        !unanswered && 'bg-emerald-100',
        q.check && 'bg-amber-100',
        !q.check && unanswered && 'bg-gray-100',
      )}
    >
      <div className="font-bold">Q{q.number}</div>
      <div className="text-xs mt-1">{상태}</div>
    </motion.button>
  ))}
</div>
```

**색상**: Design 팔레트 (주황/차분) — oklch(70% 0.15 40)

---

### #10 DesignF (Carousel Slider)

**개념**: 문제를 카로셀로 순회 (버튼 또는 드래그)

**구현** (Framer Motion):

```tsx
<motion.div
  className="overflow-hidden"
  initial={{ x: 0 }}
  animate={{ x: -(currentQuestion - 1) * 100 + '%' }}
  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
>
  <div className="flex">
    {quiz.quizzes.map((q) => (
      <div key={q.number} className="w-full flex-shrink-0">
        {/* 카드 콘텐츠 */}
      </div>
    ))}
  </div>
</motion.div>
```

**네비**: 좌/우 화살표 버튼 + 현재 슬라이드 표시

**색상**: Design 팔레트 (차분) — oklch(68% 0.12 220)

---

## 5. 공통 애니메이션 패턴

### Magic 변형

- **Entrance**: `initial={{ opacity: 0, ... }}` + `animate={{ opacity: 1, ... }}`
- **Interaction**: `whileHover={{ scale: 1.05 }}`, `whileTap={{ scale: 0.95 }}`
- **Stagger**: `transition={{ staggerChildren: 0.05, delayChildren: 0.1 }}`
- **Loop**: `animate={{ rotate: 360 }}` + `transition={{ repeat: Infinity, duration: 2 }}`

### Design 변형

- **Entrance**: 더 느린 페이드인 (duration: 0.8~1s)
- **Interaction**: 간단한 hover 효과 (색상 변경, 약간의 스케일)
- **Transition**: 부드러운 CSS transition (`transition-all`)

---

## 6. TypeScript 타입 정의

```tsx
interface SolveQuizProps {
  quiz: QuizState;
  quizActions: QuizActions;
  progressPercent: number;
}

interface QuizState {
  currentQuestion: number;
  totalQuestions: number;
  answeredCount: number;
  unansweredCount: number;
  reviewCount: number;
  isLoading: boolean;
  showSubmitDialog: boolean;
  selectedOption: string | null;
  currentQuiz: Quiz;
  quizzes: Quiz[];
}

interface Quiz {
  number: number;
  title: string;
  selections: Selection[];
  userAnswer: string | null;
  check: boolean;
}
```

---

## 7. 검증 체크리스트

### 모든 변형 공통

- [ ] `/quiz/test?sq={1-10}&mock=true` 로드 가능
- [ ] 모든 6가지 필수 UI 요소 포함 (진행률, 네비, 선택지, 제출 다이얼로그, 검토 마크, 버튼)
- [ ] 다크 모드: `dark:` 클래스 적용 확인
- [ ] 반응형: md/lg 브레이크포인트에서 레이아웃 변경 확인
- [ ] TypeScript: `npx tsc --noEmit` 에러 없음
- [ ] 포맷팅: `npx prettier --check .` 통과
- [ ] 빌드: `npm run build` 성공
- [ ] 파일 크기: < 250줄 (초과 시 로직 함수로 분리)

### Design-Specific

- [ ] 사이드바/그리드/카로셀 레이아웃 정상 작동
- [ ] 문제 점프 네비게이션 동작
- [ ] 색상 명도 대비 확인 (WCAG AA 권장)

### Magic-Specific

- [ ] Framer Motion 애니메이션 부드럽게 실행
- [ ] 성능: 60fps 유지 (동시 다중 애니메이션 시에도)
- [ ] 반복 애니메이션: `repeat: Infinity` 사용 시 성능 저하 없음

---

## 8. 참고 자료

### 완성된 Solve-Quiz 변형

- **#1 MagicA**: 블러페이드 애니메이션 중심 (비교할 Magic 스타일)
- **#4 DesignB**: 분할 패널 레이아웃 (Design 스타일 참조)
- **#7 DesignC**: 타임라인 좌측 사이드바 (DesignA와 유사)
- **#8 DesignD**: 상단 헤더 + 그리드 우측 (좌/우 분리)
- **#11-16**: 추가 Magic/Design 변형들

### 외부 참조

- `design-variants-rules.md`: 모든 페이지 공통 규칙
- `src/features/solve-quiz/model/useSolveQuiz.ts`: 상태 관리 로직
- `src/shared/ui/lib/utils.ts`: `cn()` 병합 유틸
- Framer Motion 문서: https://www.framer.com/motion/

---

## 9. 자주하는 실수 (solve-quiz 특화)

❌ **금지**

- `<div onClick={handleJump}>Q{n}</div>` 형태 (버튼으로 만들어야 접근성 좋음)
- 진행률 막대를 `width: calc(...)` 인라인 스타일로 구현 (Framer Motion 사용)
- 문제 리스트를 모두 렌더링 후 display:none으로 숨김 (성능 저하)
- 선택지 렌더링 시 `key={idx}` (key={opt.id} 사용)
- useEffect 과다 사용으로 상태 동기화 꼬임

✅ **권장**

- `<motion.button>` 사용 (Framer Motion 애니메이션)
- 진행률: `animate={{ width: \`${progressPercent}%\` }}`
- 문제 선택 시 `e.preventDefault()` 불필요 (motion.button 사용)
- Dark mode: 모든 배경/텍스트에 `dark:` 클래스
- useSolveQuiz 훅에서 모든 상태/액션 얻기
