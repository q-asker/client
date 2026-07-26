/**
 * quiz-result 디자인 변형 테스트용 mock 데이터.
 * URL에 ?mock=true 추가 시 location.state 없이도 이 데이터로 렌더링 가능.
 */

/** 선택지 타입 */
interface QuizSelection {
  id: string;
  content: string;
  correct?: boolean;
}

/** 퀴즈 문항 타입 */
interface QuizItem {
  number: number;
  title: string;
  selections: QuizSelection[];
  userAnswer?: string | null;
  type?: 'MULTIPLE' | 'BLANK' | 'OX' | 'ESSAY' | 'REAL_BLANK';
  acceptedAnswers?: { answer: string; accepted: string[] }[] | null;
}

export const MOCK_RESULT_QUIZZES: QuizItem[] = [
  {
    number: 1,
    title: 'TCP 3-Way Handshake의 세 번째 단계에서 클라이언트가 전송하는 패킷은?',
    selections: [
      { id: 'a', content: 'ACK 패킷을 전송한다', correct: true },
      { id: 'b', content: 'SYN 패킷을 재전송한다' },
      { id: 'c', content: 'FIN 패킷을 전송한다' },
      { id: 'd', content: 'RST 패킷을 전송한다' },
    ],
    userAnswer: 'a',
  },
  {
    number: 2,
    title: 'React에서 useEffect 클린업 함수가 호출되는 시점은?',
    selections: [
      {
        id: 'a',
        content: 'dependency 변경 시 이펙트 재실행 직전 또는 언마운트 시',
        correct: true,
      },
      { id: 'b', content: '컴포넌트가 최초 마운트될 때' },
      { id: 'c', content: 'dependency 값이 null이 될 때만' },
      { id: 'd', content: 'useEffect 콜백 실행 직후 매번' },
    ],
    userAnswer: 'b',
  },
  {
    number: 3,
    title: '시간 복잡도가 O(n log n)인 정렬 알고리즘을 모두 고르시오.',
    selections: [
      { id: 'a', content: '합병 정렬, 퀵 정렬, 힙 정렬', correct: true },
      { id: 'b', content: '버블 정렬, 합병 정렬, 힙 정렬' },
      { id: 'c', content: '합병 정렬, 삽입 정렬, 힙 정렬' },
      { id: 'd', content: '퀵 정렬, 삽입 정렬, 버블 정렬' },
    ],
    userAnswer: 'a',
  },
  {
    number: 4,
    title: 'Git에서 merge와 rebase의 차이에 대한 설명 중 틀린 것은?',
    selections: [
      { id: 'a', content: 'merge는 병합 커밋을 생성하고, rebase는 선형적으로 재배치한다' },
      { id: 'b', content: 'rebase는 기존 커밋의 해시값을 변경하지만, merge는 변경하지 않는다' },
      { id: 'c', content: 'merge와 rebase 모두 충돌이 발생할 수 있다' },
      {
        id: 'd',
        content: 'rebase는 merge와 달리 원격 브랜치에서 항상 안전하게 사용할 수 있다',
        correct: true,
      },
    ],
    userAnswer: 'c',
  },
  {
    number: 5,
    title: 'JavaScript에서 console.log의 실행 순서를 올바르게 나열한 것은?',
    selections: [
      { id: 'a', content: '1 → 4 → 3 → 2', correct: true },
      { id: 'b', content: '1 → 4 → 2 → 3' },
      { id: 'c', content: '1 → 2 → 3 → 4' },
      { id: 'd', content: '1 → 3 → 4 → 2' },
    ],
    userAnswer: 'a',
  },
];

export const MOCK_TOTAL_TIME = '00:03:42';

/**
 * REAL_BLANK 관용 채점 결과 화면 mock (URL: ?mock=true&real_blank=true).
 * 관용 인정(동의어·오탈자·표기)과 오답 유지(오답선지 입력)를 한 화면에서 대비한다.
 * 오답선지(correct:false)는 UI에 노출되지 않지만 채점 데이터로 내려온다(실제 응답과 동일).
 */
export const MOCK_REAL_BLANK_RESULT_QUIZZES: QuizItem[] = [
  {
    number: 1,
    type: 'REAL_BLANK',
    title: 'JavaScript의 단일 스레드 비동기 처리를 담당하는 메커니즘은 _______이다.',
    selections: [
      { id: '1', content: 'Event Loop', correct: true },
      { id: '2', content: '콜 스택', correct: false },
    ],
    acceptedAnswers: [
      { answer: 'Event Loop', accepted: ['이벤트 루프', '이벤트루프', 'event-loop'] },
    ],
    // 동의어(한글 이표기) 입력 → 정답 인정
    userAnswer: '이벤트루프',
  },
  {
    number: 2,
    type: 'REAL_BLANK',
    title: '객체가 여러 형태를 가질 수 있는 객체지향 특성은 _______이다.',
    selections: [
      { id: '1', content: 'polymorphism', correct: true },
      { id: '2', content: 'inheritance', correct: false },
    ],
    acceptedAnswers: [{ answer: 'polymorphism', accepted: ['다형성'] }],
    // 오탈자(polymorphysm, 편집거리 1) → 정답 인정
    userAnswer: 'polymorphysm',
  },
  {
    number: 3,
    type: 'REAL_BLANK',
    title: '하이퍼텍스트 전송 프로토콜의 약어는 _______이다.',
    selections: [{ id: '1', content: 'HTTP', correct: true }],
    acceptedAnswers: [{ answer: 'HTTP', accepted: [] }],
    // 대소문자만 다름 → 정답 인정
    userAnswer: 'http',
  },
  {
    number: 4,
    type: 'REAL_BLANK',
    title: '기존 코드 수정 없이 확장에 열려 있어야 한다는 설계 원칙은 _______이다.',
    selections: [
      { id: '1', content: 'OCP', correct: true },
      { id: '2', content: 'OOP', correct: false },
    ],
    acceptedAnswers: [{ answer: 'OCP', accepted: ['개방-폐쇄 원칙'] }],
    // 오답선지(OOP)를 입력 — 오탈자 관용이 새지 않고 오답 유지(D-guard, FR-005)
    userAnswer: 'OOP',
  },
];

/**
 * 004(REAL_BLANK 전용 파이프라인 분리) 결과 화면 mock — 오답선지가 "전혀" 없는 세트만으로 구성
 * (URL: ?mock=true&real_blank=true&no_distractor=true).
 * 003 mock(MOCK_REAL_BLANK_RESULT_QUIZZES)은 오답선지 有/無가 섞여 있는데, 004는 신규 REAL_BLANK
 * 문항이 애초에 오답선지를 만들지 않는 경우(selections에 correct:false 항목 자체가 없음)를
 * 명시적으로 검증한다 — D-guard가 없어도 관용 판정이 정상 동작하고, 화면에 빈 오답 영역이
 * 생기지 않아야 한다(spec Edge Case).
 */
export const MOCK_REAL_BLANK_NO_DISTRACTOR_QUIZZES: QuizItem[] = [
  {
    number: 1,
    type: 'REAL_BLANK',
    title: '브라우저와 서버 간 상태 없는 요청-응답 프로토콜은 _______이다.',
    // correct:false 항목 없음 — 신규 REAL_BLANK 생성 결과와 동일한 shape
    selections: [{ id: '1', content: 'HTTP', correct: true }],
    acceptedAnswers: [{ answer: 'HTTP', accepted: [] }],
    // 표기 차이(대소문자) → 정답 인정
    userAnswer: 'http',
  },
  {
    number: 2,
    type: 'REAL_BLANK',
    title: '객체지향에서 데이터와 메서드를 하나로 묶고 외부 접근을 제한하는 원칙은 _______이다.',
    selections: [{ id: '1', content: '캡슐화', correct: true }],
    acceptedAnswers: [{ answer: '캡슐화', accepted: ['encapsulation'] }],
    // 동의어(영문 표기) → 정답 인정
    userAnswer: 'encapsulation',
  },
  {
    number: 3,
    type: 'REAL_BLANK',
    title:
      'TCP 연결 종료 4-way handshake에서 클라이언트→서버, 서버→클라이언트 순서로 오가는 첫 패킷은 각각 _______, _______이다.',
    // 다중 빈칸도 오답선지 없이 정상 동작해야 한다
    selections: [{ id: '1', content: 'FIN, ACK', correct: true }],
    acceptedAnswers: [
      { answer: 'FIN', accepted: [] },
      { answer: 'ACK', accepted: [] },
    ],
    // 첫 빈칸(FIN)은 정답, 두 번째 빈칸(RST)은 정답과 무관 → 문항 전체 오답.
    // 오답선지가 없어도 D-guard 없이 tolerance만으로 오답 처리됨을 확인.
    userAnswer: 'FINRST',
  },
];
