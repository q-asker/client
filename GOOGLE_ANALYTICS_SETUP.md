# Google Analytics 설정 가이드

## 1. Google Analytics 4 계정 설정

1. [Google Analytics](https://analytics.google.com/)에 접속하여 계정을 생성하거나 로그인합니다.
2. **관리** → **속성 만들기**를 클릭합니다.
3. 속성 이름을 입력하고 **다음**을 클릭합니다.
4. 비즈니스 정보를 입력하고 **만들기**를 클릭합니다.
5. **데이터 스트림** → **웹**을 선택합니다.
6. 웹사이트 URL과 스트림 이름을 입력하고 **스트림 만들기**를 클릭합니다.
7. **측정 ID** (G-XXXXXXXXXX 형태)를 복사합니다.

## 2. 환경 변수 설정

프로젝트 루트 디렉토리에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

> **중요**: G-XXXXXXXXXX를 실제 Google Analytics 측정 ID로 교체하세요.

## 3. 추적되는 이벤트들

현재 다음과 같은 이벤트들이 자동으로 추적됩니다:

### 페이지뷰

- **퀴즈 생성 페이지** (`/`): 사용자가 퀴즈를 생성하는 페이지
- **퀴즈 풀기 페이지** (`/quiz/:id`): 사용자가 퀴즈를 푸는 페이지
- **퀴즈 결과 페이지** (`/result/:id`): 퀴즈 결과를 보는 페이지
- **퀴즈 해설 페이지** (`/explanation/:id`): 퀴즈 해설을 보는 페이지

### 사용자 정의 이벤트

#### MakeQuiz 페이지 이벤트

- `file_upload_start`: 파일 업로드 시작 (드래그앤드롭/클릭 구분, 파일 정보 포함)
- `file_upload_complete`: 파일 업로드 완료 (업로드 시간 포함)
- `file_delete`: 파일 삭제
- `quiz_option_change`: 퀴즈 옵션 변경 (문제 유형, 수량, 페이지 범위, 난이도)
- `quiz_generation_start`: 문제 생성 시작 (모든 설정 정보 포함)
- `quiz_generation_complete`: 문제 생성 완료 (생성 시간 포함)
- `navigate_to_quiz`: 문제로 이동 버튼 클릭

#### SolveQuiz 페이지 이벤트

- `quiz_start`: 퀴즈 시작
- `answer_selected`: 답안 선택 (정답 여부 포함)
- `navigate_question`: 문제 간 이동 (이전/다음/직접 클릭)
- `toggle_review`: 검토 체크박스 토글
- `confirm_answer`: 문제 확인 버튼 클릭
- `submit_quiz`: 퀴즈 제출 (완료율, 검토 문제 수 포함)

#### QuizResult 페이지 이벤트

- `view_result`: 결과 페이지 진입 (점수, 성공률, 소요시간 포함)
- `quiz_complete`: 퀴즈 완료 (최종 성과 데이터)
- `click_explanation`: 해설 보기 버튼 클릭

#### QuizExplanation 페이지 이벤트

- `view_explanation`: 해설 페이지 방문
- `navigate_question`: 해설 내 문제 간 이동
- `toggle_pdf_slide`: PDF 슬라이드 토글

## 4. Google Analytics에서 확인하는 방법

### 실시간 데이터 확인

1. Google Analytics → **보고서** → **실시간**
2. 현재 사이트를 사용하는 사용자 수와 페이지뷰를 실시간으로 확인할 수 있습니다.

### 페이지별 빈도수 분석

1. **보고서** → **참여도** → **페이지 및 화면**
2. 각 페이지별 방문 횟수, 사용자 수, 평균 체류 시간 등을 확인할 수 있습니다.

### 사용자 정의 이벤트 확인

1. **보고서** → **참여도** → **이벤트**
2. 설정한 사용자 정의 이벤트들의 발생 횟수를 확인할 수 있습니다.

### 상세 분석 보고서

1. **탐색** → **자유형식** 또는 **유입경로 탐색**
2. 더 상세한 사용자 행동 패턴을 분석할 수 있습니다.

## 5. 개발 환경에서 테스트

개발 환경에서는 디버그 모드가 활성화되어 있어 브라우저 개발자 도구의 콘솔에서 Google Analytics 이벤트 전송을 확인할 수 있습니다.

## 6. 프로덕션 배포 시 주의사항

- `.env` 파일은 `.gitignore`에 포함되어 있는지 확인하세요.
- 배포 환경에서도 `VITE_GA_MEASUREMENT_ID` 환경 변수를 설정해야 합니다.
- Vercel, Netlify 등의 배포 플랫폼에서는 환경 변수를 별도로 설정할 수 있습니다.

## 7. 개인정보 보호

Google Analytics는 사용자의 개인정보를 수집할 수 있으므로, 필요에 따라 개인정보 처리방침을 업데이트하고 쿠키 동의 배너를 추가하는 것을 고려하세요.
