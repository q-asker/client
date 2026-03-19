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
  userAnswer: string | number;
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
export const MOCK_UPLOADED_URL = '';
