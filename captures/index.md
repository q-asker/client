# UI 캡처 인덱스

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
