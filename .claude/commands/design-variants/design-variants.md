---
name: design-variants
description: 모든 페이지의 Design/Magic 변형을 일관성 있게 생성하는 스킬
type: skill
trigger: 컴포넌트 변형 구현, 새로운 디자인 변형 추가 시
keywords:
  - design-variant
  - magic
  - framer-motion
  - tailwind
  - oklch
  - responsive
---

# 디자인 변형 스킬 (Design Variants Skill)

컴포넌트 디자인 변형을 일관성 있게 생성하기 위한 스킬입니다. 모든 페이지의 Design/Magic 변형 구현 시 반드시 참조합니다.

---

## 개요

이 스킬은 아래 2개의 레퍼런스 문서를 기반으로 디자인 변형 컴포넌트를 구현하도록 가이드합니다:

1. **[design-variants-rules.md](./references/design-variants-rules.md)** (필수)
   - 모든 페이지에 공통으로 적용되는 기술 규칙
   - OKLch 색상 사용법, Tailwind CSS, Framer Motion, TypeScript 규칙
   - 반응형 설계, 다크 모드, 파일 크기, 검증 기준

2. **페이지별 특화 규칙** (선택)
   - `[solve-quiz-design-rules.md](./references/solve-quiz-design-rules.md)` — solve-quiz 변형 가이드
   - 향후 추가 가능: quiz-result, quiz-explanation 등

---

## 사용 방법

### 1단계: 구현할 변형 파악

```
📌 변형 명시
- 페이지: solve-quiz
- 변형 번호 & 이름: #2 MagicB
- 유형: Magic (애니메이션 중심)
- 설명: Stagger Reveal (순차 드러나는 애니메이션)
```

### 2단계: 공통 규칙 적용

**[design-variants-rules.md](./references/design-variants-rules.md)** 섹션별 체크:

1. **에이전트/스킬 사용 규칙** ✓ (본 스킬 사용 중)
2. **기술 제약**
   - 파일 위치: `src/pages/{page}/{ComponentName}.tsx`
   - OKLch 색상 (`oklch()` 함수만 사용)
   - Tailwind CSS 우선 (`.css` 파일 금지)
   - Framer Motion만 애니메이션 사용
   - TypeScript `strict: true` 모드

3. **필수 UI 요소** (페이지마다 다름)
   - solve-quiz: 진행률, 문제 네비, 선택지, 제출 다이얼로그, 검토 마크, 버튼
   - quiz-result: 점수, 통계, 문항별 결과 카드
   - quiz-explanation: 질문, 정답 설명, 다음/이전 버튼

4. **반응형 설계** (lg: 1024px 기준)
5. **다크 모드** (모든 색상에 `dark:` 클래스)
6. **검증 기준** (빌드, 포맷팅, 런타임)

### 3단계: 페이지별 특화 규칙 적용

**[solve-quiz-design-rules.md](./references/solve-quiz-design-rules.md)** 참고:

- **변형별 상세 구현**: 레이아웃, 색상 팔레트, 애니메이션 패턴
- **Magic 변형**: 선명도(chroma) > 0.15, 강한 애니메이션
- **Design 변형**: 선명도(chroma) < 0.15, 구조 중심
- **검증 체크리스트**: 각 변형의 구현 완료 기준

### 4단계: 구현

```tsx
// ✅ 좋은 예
import { motion } from 'framer-motion';
import { useTranslation } from 'i18nexus';
import MarkdownText from '@/shared/ui/components/markdown-text';
import { cn } from '@/shared/ui/lib/utils';

const SolveQuizMagicB: React.FC = () => {
  // 진행률 계산
  const progressPercent = Math.round((quiz.answeredCount / quiz.totalQuestions) * 100);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* 진행률 + 순차 애니메이션 */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        {/* 진행률 바 */}
      </motion.div>

      {/* Stagger 애니메이션 */}
      <motion.div transition={{ staggerChildren: 0.05, delayChildren: 0.2 }}>
        {quiz.quizzes.map((q) => (
          <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
            Q{q.number}
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
};
```

### 5단계: 검증

```bash
# TypeScript 컴파일
npx tsc --noEmit

# 포맷팅
npx prettier --check .

# 빌드
npm run build

# 런타임 확인
# 1. 브라우저에서 `/quiz/test?sq={번호}&mock=true` 로드
# 2. public/{page}-compare.html에서 변형 확인
# 3. 콘솔 에러 없음
# 4. 다크 모드 전환 시 가독성 유지
```

---

## 자주하는 실수

❌ **금지**

- `style={{ color: '#2563eb' }}` — HEX 색상
- `import './Component.css'` — 컴포넌트별 CSS 파일
- MagicUI 외 다른 애니메이션 라이브러리
- useEffect 과다 사용
- 기존 변형 코드 복사만 하고 색상만 변경

✅ **권장**

- `className="text-blue-600"` 또는 `style={{ color: 'oklch(70% 0.2 220)' }}`
- Tailwind 클래스 우선
- Framer Motion으로 고급 애니메이션
- 타입 정의 완성
- 컴포넌트 크기 < 250줄

---

## 📚 문서 계층 구조 (반드시 순서대로 읽음)

| 순서 | 문서                                                                    | 내용                                               | 대상              |
| ---- | ----------------------------------------------------------------------- | -------------------------------------------------- | ----------------- |
| 1️⃣   | [`shrimp-rules.md`](../../rules/shrimp-rules.md)                        | 프로젝트 **일반** 규칙 (FSD, import, 포맷팅, 색상) | 모든 개발자       |
| 2️⃣   | **본 문서**                                                             | 변형 구현 **방법** (5단계 가이드)                  | 변형 개발자       |
| 3️⃣   | [`design-variants-rules.md`](./references/design-variants-rules.md)     | 변형 **공통 규칙** (반드시 읽음)                   | 변형 개발자       |
| 4️⃣   | [`solve-quiz-design-rules.md`](./references/solve-quiz-design-rules.md) | **solve-quiz** 특화 규칙 (상세 예시)               | solve-quiz 변형만 |

### ⚠️ 중요

- **design-variants-rules.md**는 shrimp-rules.md의 **일반 규칙을 상속**하며, 변형 구현 시 **추가 제약**을 명시합니다.
- shrimp-rules.md의 내용을 반복하지 않으므로, **shrimp-rules.md를 먼저 읽어야 합니다.**

---

## 변형 체계

### Solve-Quiz 변형들

| #   | 이름    | 유형   | 상태       |
| --- | ------- | ------ | ---------- |
| 1   | MagicA  | Magic  | ✅ 완성    |
| 2   | MagicB  | Magic  | 🔄 구현 중 |
| 3   | DesignA | Design | 🔄 구현 중 |
| 4   | DesignB | Design | ✅ 완성    |
| 5   | MagicC  | Magic  | 🔄 구현 중 |
| 6   | MagicD  | Magic  | 🔄 구현 중 |
| 7   | DesignC | Design | ✅ 완성    |
| 8   | DesignD | Design | ✅ 완성    |
| 9   | DesignE | Design | 🔄 구현 중 |
| 10  | DesignF | Design | 🔄 구현 중 |
| 11  | DesignG | Design | ✅ 완성    |
| 12  | DesignH | Design | ✅ 완성    |
| 13  | MagicE  | Magic  | ✅ 완성    |
| 14  | MagicF  | Magic  | ✅ 완성    |
| 15  | MagicG  | Magic  | ✅ 완성    |
| 16  | MagicH  | Magic  | ✅ 완성    |

---

## 호출 방법

```
/design-variants

# 프롬프트 예시:
변형 구현을 시작하겠습니다.
- 페이지: solve-quiz
- 변형: #2 MagicB (Stagger Reveal)
- 참조: solve-quiz-design-rules.md의 "MagicB" 섹션
```
