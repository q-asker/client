사용자가 설명한 새 기능/대규모 작업에 대해 다음 순서로 진행한다:

1. `docs/PRD.md`를 읽고 현재 제품 명세를 파악한다
2. `prd-generator` 에이전트를 호출하여 PRD에 새 기능 명세를 추가한다
3. `development-planner` 에이전트를 호출하여 ROADMAP에 Phase/Task를 추가한다
4. 결과 요약을 출력한 후 종료한다 (코드 구현은 하지 않는다)

## 금지 사항

이 커맨드 실행 중 다음 작업을 수행하지 않는다:

- 코드 파일 생성/수정
- 패키지 설치 (`npm install` 등)
- 빌드/서버 실행
- Task 자동 구현

## 입력

$ARGUMENTS
