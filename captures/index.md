# UI 캡처 인덱스

## 007 빈칸 허용 정답 노출(US3) + 이어풀기(US1) (기능 E2E 산출)

- 2026-07-31 — US3 결과 화면: 빈칸별 허용 정답 목록(모범답 강조 + 함께 인정된 표현). Q2 다중빈칸 "빈칸 1/빈칸 2" 구분(FR-008) — blank-accepted-result.png — /result/58Ow4V3x — (로그인·mockai)
- 2026-07-31 — US3 해설 화면: REAL_BLANK 답안 박스에 인정된 답 목록 동일 노출 — blank-accepted-explanation.png — /explanation/58Ow4V3x — (로그인·mockai)
- 2026-07-31 — US3 FR-007: 채점 전 풀이 화면에는 허용 정답 목록 비노출 — blank-solve-no-accepted.png — /quiz/58Ow4V3x — (로그인·mockai)
- 2026-07-31 — US1 이어풀기 after: "이 조건으로 더 풀기" → 같은 조건 새 REAL_BLANK 세트(5문항) 즉시생성 → 풀이 진입(1회차) — blank-repeat-1-solve.png — /quiz/{newId} — (로그인·mockai)
- 2026-07-31 — US1 이어풀기 after: 새 세트 결과에서 다시 이어풀기 → 또 다른 독립 새 세트 풀이 진입(2회차, 드릴 루프 무결 FR-003) — blank-repeat-2-solve.png — /quiz/{newId2} — (로그인·mockai)

### US1 이어풀기 결함 수리 before/after (실 Gemini 경제학 40p·REAL_BLANK·10·[1..40]·KO, 시드 mBV9rakl)

> **재현 방식(정직 라벨)**: 결함 사슬의 재연결 트리거는 운영에선 Cloudflare가 TTFQ 무음 SSE를 절단해 발생한다.
> 로컬엔 그 프록시가 없어 Playwright로 **SSE 스트림을 닫아 EventSource 재연결을 인위 유도**했다(트리거만 동등
> 치환, 결함 사슬은 실제로 재현). before=pre-fix 두 레포(develop, 멱등화·POST-once 이전), after=fixed 두 레포.
> POST 누적 횟수가 증거: before=2회(202,400), after=1회(202).

- 2026-07-31 — **before(pre-fix)**: 이어풀기 → 재연결 → pre-fix onopen 재-POST(2회차) → BE 중복 400(AI_DUPLICATED) → onError → "생성에 실패했어요…" 토스트 + 옵션화면 폴백(막다른 실패). POST 202,400 — blank-repeat-before-prefix-fail.png — (pre-fix BE·실 Gemini)
- 2026-07-31 — **after(fixed)**: 같은 재연결 유도에도 POST-once 가드로 재-POST 0 + Last-Event-ID 리플레이 → 정상 완료 → 경제학 새 세트(10문항) 풀이 진입. POST 202(1회) — blank-repeat-after-realgemini-solve.png — /quiz/{newId} — (fixed BE·실 Gemini)

## 006 이어풀기 — 같은 조건으로 문제 이어서 더 풀기

- 2026-07-30 — 결과 화면 CTA "이 조건으로 더 풀기"(해설 보기 아래·홈으로 위, outline) — repeat-cta-result.png — /result/:id — (백엔드 목킹)
- 2026-07-30 — 즉시생성 진행 오버레이("같은 조건으로 새 문제를 만들고 있어요…" + 완료 시 풀이 자동 진입 안내) — repeat-generating-overlay.png — CTA 클릭 후 — (백엔드 목킹)
- (기능 E2E 산출 예정: repeat-cta-result.png / repeat-cta-explanation.png / repeat-solve-new-set.png — 로컬 백엔드 실행 시 repeat-generation.spec.ts가 생성)

## 005 문제 본문 마크다운 렌더링 (기능 E2E 산출)

- 2026-07-29T09:23:05Z — 검토(결과) 화면: 표·인용·코드·인라인/블록 수식 렌더, 원시 문법 미노출 — markdown-review.png — /result/d2M1pa8v — (로그인)
- 2026-07-29T09:23:05Z — 해설 화면: 본문·해설 마크다운 렌더 + 좌측 네비게이터 평문 라벨(원시 문법 제거) — markdown-explanation.png — /explanation/d2M1pa8v — (로그인)
- 2026-07-29T09:23:05Z — 풀이 화면: 문제 본문 마크다운 렌더, 원시 파이프 미노출 — markdown-solve.png — /quiz/d2M1pa8v — (로그인)

## 005 해설 네비게이터 수정 before/after (표-우선 스템)

- 2026-07-29T09:49:20Z — before: 네비게이터가 원시 마크다운(표 파이프·:---) 노출 — nav-before.png
- 2026-07-29T09:49:20Z — after: toPlainText로 평문 라벨 표시 — nav-after.png
