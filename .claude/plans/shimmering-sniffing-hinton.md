# Plan: 궁극의 /init 커맨드 재설계

## Context

`.claude/` 디렉토리를 다른 프로젝트에서 통째로 복사-붙여넣기한 뒤 `/init`만 치면, Claude Code + Shrimp Task Manager 환경이 바로 세팅되어야 한다. 현재 init.md는 CLAUDE.md만 생성하고 나머지(rules, settings, Shrimp 연동 등)는 안내조차 부실하다.

## 현재 문제점

1. **CLAUDE.md만 생성** — settings.json 미처리, Shrimp 연동 확인 없음
2. **init-rules와 검증 로직 중복** — init이 rules 일치성 검증, init-rules도 같은 일
3. **3단계 흐름이 암묵적** — init → init-rules → plan-feature 필수인데 안내 부족
4. **"프로젝트 초기화 체크" 섹션이 CLAUDE.md에 삽입됨** — init 커맨드의 진단 로직이지 프로젝트 문서가 아님

## 수정 대상

**파일 1개만 전면 재작성:**
- `.claude/commands/init.md` (현재 107줄)

**수정하지 않는 파일:**
- `init-rules.md` — 별도 커맨드로 유지
- `settings.local.json`, `hooks/` — 개인 환경
- `agents/evaluators/`, `validate.md` — 프로젝트 특화 (개발자 영역)

## 새 init.md 설계

### STEP 1 — 컨텍스트 수집 (7가지 스캔)

| # | 스캔 대상 | 추론 결과 |
|---|-----------|-----------|
| 1-1 | 빌드/패키지 설정 (package.json, tsconfig, pyproject.toml 등) | 언어, 프레임워크, 패키지 매니저, 주요 의존성 |
| 1-2 | 디렉토리 구조 (depth 조절, node_modules 등 제외) | 디렉토리 트리 |
| 1-3 | 기존 CLAUDE.md | 존재 여부, 누락 섹션 |
| 1-4 | .claude/rules/ | 3가지 상태: missing / mismatch / ok |
| 1-5 | docs/PRD.md, docs/roadmaps/ | 존재 여부 |
| 1-6 | .claude/settings.json | 존재 여부, 필수 필드 확인 |
| 1-7 | Shrimp Task Manager (shrimp-rules.md, shrimp_data/, settings.local.json 읽기전용) | connected / not-found |

### STEP 2 — CLAUDE.md 작성

현재와 동일하되 변경점:
- **"프로젝트 초기화 체크" 섹션 제거** — STEP 4 완료 리포트로 이동
- "CLAUDE.md 유지 규칙" 섹션은 유지
- 필수 6개 섹션: 문서 참조 블록, 프로젝트 개요, 기술 스택, 명령어, 아키텍처, 개발 도구
- 선택 섹션: 환경 변수, 라우팅 구조, 데이터 플로우

### STEP 3 — settings.json 확인/생성 (신규)

- 있으면: `plansDirectory` 필드 확인, 없으면 추가. 나머지 보존
- 없으면: 기본 템플릿 `{ "plansDirectory": ".claude/plans" }` 생성

### STEP 4 — 완료 리포트 + 후속 커맨드 안내 (강화)

```
## /init 완료

### 작업 내역
- [생성|보완] CLAUDE.md
- [생성|확인|보완] .claude/settings.json

### 채워진 섹션
- (체크리스트)

### TODO (사용자 확인 필요)
- (파악 불가 항목)

---

### 다음 단계 (순서대로 실행)

1. /init-rules — Rules 파일 초기화
   (rulesStatus에 따라 필수/선택 안내)

2. /plan-feature — PRD + ROADMAP 생성
   (prdExists, roadmapExists에 따라 필수/선택 안내)

3. Shrimp Task Manager 연동
   (shrimpStatus에 따라 안내)
```

## 핵심 설계 결정

- **Rules 검증은 init에서만 수행, 생성은 init-rules에서만** — 중복 제거
- **settings.local.json, hooks/는 절대 건드리지 않음** — 개인 환경
- **프로젝트 특화 파일 정리는 하지 않음** — 분기 최소화
- **Shrimp 연동은 읽기 전용 확인만** — settings.local.json을 읽되 수정 안 함

## 검증 방법

1. 현재 프로젝트에서 CLAUDE.md를 임시 삭제 후 `/init` 실행 → 정상 생성 확인
2. 완료 리포트에서 rules=ok, PRD=존재, Shrimp=connected가 정확히 표시되는지 확인
3. 빈 프로젝트(package.json만 있는)에서 `.claude/` 복사 후 `/init` 실행 → rules=mismatch 감지 확인
