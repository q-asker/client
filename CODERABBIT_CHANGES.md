# CodeRabbit 리뷰 반영 내역

CodeRabbit AI의 코드 리뷰를 기반으로 아래와 같은 변경사항을 적용했습니다.

## 1. 보안 및 안정성 강화

### `src/widgets/footer/index.jsx`

- **변경 사항:** 외부 링크(`target="_blank"`)에 `rel="noopener noreferrer"` 속성 추가
- **이유:** 보안 취약점(Tabnabbing) 방지 및 퍼포먼스 이슈 예방

### `src/features/solve-quiz/model/useSolveQuizQuestion.js`

- **변경 사항:** `handleCheckToggle` 함수 내 `currentQuiz` 존재 여부 확인 로직 추가
- **이유:** 비정상적인 인덱스 접근 시 발생할 수 있는 런타임 에러 방지

### `src/features/solve-quiz/model/useSolveQuizSubmit.js`

- **변경 사항:** `quizzes` 배열에 대한 안전한 접근 처리 (`safeQuizzes` 변수 도입 및 null check)
- **이유:** `quizzes` prop이 비정상적으로 전달될 경우 발생할 수 있는 크래시 방지

## 2. 버그 수정 및 로직 개선

### `src/features/quiz-generation/model/useQuizGenerationStore.js`

- **변경 사항:**
  - `startGeneration` 호출 시 `await` 키워드 추가
  - 비동기 로직의 실행 순서 보장
- **이유:** 비동기 함수 호출 시 에러 핸들링이 정상적으로 동작하지 않는 문제 해결

### `src/features/solve-quiz/model/useSolveQuiz.js`

- **변경 사항:** 미답변 문제(`unansweredCount`) 계산 로직 수정 (`q.userAnswer === 0` → `!q.userAnswer`)
- **이유:** `userAnswer`가 `null` 또는 `undefined`일 때 미답변으로 정확히 카운트되지 않는 오류 수정

### `src/features/solve-quiz/model/useSolveQuizData.js`

- **변경 사항:** `status` 비교 연산자를 `==`에서 `===`로 변경
- **이유:** 타입 안정성 확보 및 린트 규칙 준수

### `src/features/quiz-history/model/useQuizHistory.js`

- **변경 사항:**
  - `localStorage`를 이용한 `loadQuizHistory`, `saveQuizHistory`, `readQuizHistory` 구현
  - 기록 삭제 시 로컬 스토리지 동기화 로직 추가
- **이유:** 기존 코드에서 `loadQuizHistory`가 빈 배열만 반환하던 더미(Stub) 구현을 실제 데이터 로딩 로직으로 변경

## 3. 코드 품질 개선

### `src/features/prepare-quiz/model/usePrepareQuizUpload.js`

- **변경 사항:** `handleDragOver` `useCallback` 의존성 배열에서 불필요한 항목 제거
- **이유:** 불필요한 리렌더링 방지 및 클린 코드 유지
