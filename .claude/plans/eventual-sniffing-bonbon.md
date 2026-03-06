# 평가 시스템 범용화: MCQ 특화 → 퀴즈 유형 무관

## Context

MCQ(4지선다) 전용 평가 시스템을 OX, 빈칸 등 다양한 퀴즈 유형에 대응하도록 범용화한다.
f6e5487c의 improvedPrompt를 모범사례로 저장하고, design-context를 공통/타입별로 분리하며,
평가 기준에서 MCQ 하드코딩을 제거하여 "구조적 품질 + 내부 일관성" 평가로 전환한다.

**결정사항**:
1. 루브릭 6개 항목 유지, MCQ 특화 기준 제거 (범용화)
2. design-context를 공통 + 타입별로 분리
3. 모범사례 프롬프트 별도 파일 저장
4. 퀴즈 타입은 에이전트가 프롬프트를 읽고 자동 감지 (데이터 모델 변경 없음)

---

## 변경 대상 파일

| # | 파일 | 변경 유형 |
|---|------|-----------|
| 1 | `.claude/agents/evaluators/reference-prompt.md` | **신규** |
| 2 | `.claude/agents/evaluators/design-context-common.md` | **신규** (기존 design-context.md에서 범용 부분 추출) |
| 3 | `.claude/agents/evaluators/design-context-mcq.md` | **신규** (기존 design-context.md에서 MCQ 부분 추출) |
| 4 | `.claude/agents/evaluators/design-context.md` | **삭제** (→ common + mcq로 분리) |
| 5 | `.claude/agents/evaluators/quiz-prompt-evaluator.md` | 수정 (B섹션, E-4, F-1 범용화) |
| 6 | `.claude/agents/evaluators/prompt-engineer-evaluator.md` | 수정 (answer_quality 범용화) |
| 7 | `.claude/agents/evaluators/education-evaluator.md` | 수정 (IWF/MCQ Quality Standards 범용화) |
| 8 | `.claude/agents/evaluators/consensus-moderator.md` | 소폭 수정 |
| 9 | `.claude/commands/validate.md` | 수정 (타입 감지 + 파일 참조 변경) |
| 10 | `CLAUDE.md` | 디렉토리 구조 갱신 |

**변경 없음**: `lib/rubrics.ts`, `lib/types.ts`, `lib/schemas.ts` (이미 범용)

---

## Step 1: `reference-prompt.md` 신규 생성

**소스**: `data/results/f6e5487c-*.json`의 `improvedPrompt`

```
# 모범사례 프롬프트 (구조 참조용)

## 목적
A등급 MCQ 프롬프트의 모범사례. 퀴즈 유형 무관하게 **구조적 품질의 참조점**으로 사용.

## 참조 방법
- 참조할 것: 섹션 순서, Primacy/Recency 배치, CoT Step 구조, 예시 형식, 예외 처리 패턴
- 참조하지 말 것: 오답 3유형, 선택지 4개 등 MCQ 특화 설계 결정

## 구조적 패턴 요약
(핵심 구조 패턴을 짧게 정리)

## 모범사례 프롬프트 전문
(f6e5487c의 improvedPrompt)
```

## Step 2: design-context 분리

### 2a. `design-context-common.md` (기존에서 범용 부분 추출)

**포함 내용** (기존 design-context.md에서):
- §1 프롬프트 아키텍처 (A1~A5)
- §2 Placeholder 정책 → 범용화: "프롬프트의 placeholder 정책을 확인"
- §6 가독성 규칙 (E1~E5)

**새로 추가**:
- "프롬프트 내부 일관성 평가 원칙" 섹션
- 범용 체크리스트 B (평가 목적/학습자 고정값 → 일반화)
- 범용 체크리스트 C (퀴즈 유형별 설계 일관성):
  - C1: 퀴즈 유형에 맞는 구성 요소가 완전히 정의되었는가?
  - C2: 해설 구조가 정의되었고 유형에 적합한가?
  - C3: 난이도 배분이 명시되고 일관되는가?
  - C4: 출력 구조가 유형에 맞게 정의되었는가?
  - C5: 고정값 요소들이 서로 상충하지 않는가?
- 범용 체크리스트 D:
  - D1: 출력 필드가 구성 요소를 빠짐없이 포함하는가?
  - D2: 출력 구조 설명과 예시가 일치하는가?
  - D3: JSON 스키마 별도 관리 (유지)

### 2b. `design-context-mcq.md` (기존에서 MCQ 부분 추출)

**포함 내용** (기존 design-context.md에서):
- §3 통합 평가 모드 (B1~B3)
- §4 고정값: 오답 3유형, 4단계 해설 2계층, 중/상 균등, 선택지 4개, 정답 위치
- §5 출력 구조: content/selections/explanation
- MCQ 특화 체크리스트 (C1~C5, D1~D2 원본)

**파일 상단에 명시**: "이 파일은 MCQ(4지선다) 프롬프트 평가 시에만 참조합니다."

### 2c. 기존 `design-context.md` 삭제

common + mcq로 완전 분리 후 삭제.

## Step 3: `quiz-prompt-evaluator.md` 범용화

- **B섹션 IWF**: "선택지 기반 퀴즈의 경우" 조건부로 변경
- **B섹션 MCQ 품질**: "퀴즈 유형별 문항 품질 기준"으로 리네임, 선지 관련은 조건부
- **E-4 (answer_quality)**: "오답 선지 가이드라인" → "정답 외 요소 생성 가이드라인"
- **F-1**: 고정값 예시 "(오답 3유형, 4단계 해설)" → "(퀴즈 유형별 구성 규칙, 해설 구조 등)"

## Step 4: `prompt-engineer-evaluator.md` 범용화

- answer_quality: "IWF 방지 체크리스트" → "퀴즈 유형별 문항 품질 체크리스트"
- "선지 균형/독립성" → "응답 요소 균형/독립성 (선택지 기반의 경우)"

## Step 5: `education-evaluator.md` 범용화

- Section 2 (IWF): "선택지 기반 퀴즈의 경우" 조건부 전제 추가
- Section 3: "MCQ Quality Standards" → "퀴즈 유형별 문항 품질 기준"
- answer_quality: "오답 선지가 오개념 반영" → "오답/오류 요소가 오개념 반영"

## Step 6: `consensus-moderator.md` 소폭 수정

- Step 4: "IWF 방지" → "퀴즈 유형별 문항 품질 기준"
- Placeholder 보존: "오답 유형, 해설 구조" → "퀴즈 유형별 구성 규칙, 해설 구조"

## Step 7: `validate.md` — 타입 감지 + 참조 변경

### 7a. 새로운 Step 추가: "1.5 퀴즈 타입 감지"

기존 "1. 대기 중인 프롬프트 탐색" 이후, Phase 1 이전에:
```
### 1.5 퀴즈 타입 감지

프롬프트 텍스트를 읽고 퀴즈 유형을 판별합니다:
- MCQ(4지선다): 선택지, 오답, selections 등의 키워드
- OX(참/거짓): OX, 참/거짓, true/false 등의 키워드
- 빈칸(fill-in-the-blank): 빈칸, ___, 들어갈 말 등의 키워드

판별된 타입에 따라:
- MCQ → design-context-mcq.md 참조
- OX → design-context-ox.md 참조 (존재하는 경우)
- 빈칸 → design-context-blank.md 참조 (존재하는 경우)
- 해당 타입 파일이 없으면 design-context-common.md만 참조
```

### 7b. Agent A/B/교차검토/합의 프롬프트 파일 참조 변경

기존:
```
1. quiz-prompt-evaluator.md
2. prompt-engineer-evaluator.md (또는 education-evaluator.md)
3. design-context.md
```

변경:
```
1. quiz-prompt-evaluator.md
2. prompt-engineer-evaluator.md (또는 education-evaluator.md)
3. design-context-common.md
4. design-context-{감지된 타입}.md (존재하는 경우)
5. reference-prompt.md (구조 참조용)
```

### 7c. improvedPrompt 제약 범용화

"오답 유형, 해설 구조, 난이도 배분" → "퀴즈 유형별 구성 규칙, 해설 구조, 난이도 배분"

## Step 8: `CLAUDE.md` 갱신

```
.claude/
  agents/evaluators/
    quiz-prompt-evaluator.md        # 공통 평가 기준 (범용)
    prompt-engineer-evaluator.md    # Agent A 가이드
    education-evaluator.md          # Agent B 가이드
    consensus-moderator.md          # 합의 조정자
    design-context-common.md        # 공통 설계 컨텍스트
    design-context-mcq.md           # MCQ 설계 컨텍스트
    reference-prompt.md             # 모범사례 프롬프트 (구조 참조용)
```

핵심 데이터 플로우의 Phase 1 이전에 "퀴즈 타입 자동 감지" 단계 추가 반영.

---

## 실행 순서

```
Step 1 + Step 2 (병렬)  — reference-prompt.md + design-context 분리
  ↓
Step 3 + Step 4 + Step 5 (병렬)  — 평가 가이드 범용화
  ↓
Step 6  — consensus-moderator 수정
  ↓
Step 7  — validate.md 타입 감지 + 참조 변경
  ↓
Step 8  — CLAUDE.md 갱신
```

## 향후 확장

OX/빈칸 프롬프트가 제출되면:
1. 해당 타입의 design-context 파일 생성 (예: `design-context-ox.md`)
2. 평가 실행 시 자동 감지 → 해당 파일 참조
3. 공통 기준 + 타입별 기준으로 평가

## 검증 방법

1. MCQ 하드코딩 잔재 검색: `grep -r "4지선다\|오답 3유형\|선택지 4개\|MCQ Quality" .claude/agents/evaluators/` (design-context-mcq.md 제외)
2. design-context.md 참조 잔재 검색: `grep -r "design-context\.md" .claude/` (common/mcq만 있어야 함)
3. validate.md에서 파일 참조 정합성 확인
4. `npm run build` 성공 확인
