import type { Quiz } from '#features/quiz-generation';

/**
 * 마크다운 렌더링 테스트용 풍부한 mock 퀴즈 데이터.
 * URL에 ?mock=true 추가 시 서버 호출 없이 이 데이터로 테스트 가능.
 */
export const MOCK_QUIZZES: Quiz[] = [
  {
    number: 1,
    title:
      '다음 **Python** 코드의 출력 결과로 올바른 것은?\n\n```python\ndef fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)\n\nprint(fibonacci(6))\n```\n\n> 힌트: 재귀 함수의 호출 순서를 따라가 보세요.',
    selections: [
      {
        id: 'a',
        content:
          '`fibonacci(6)`은 재귀적으로 `fibonacci(5) + fibonacci(4)`를 호출하며, 최종적으로 **5**를 반환한다. 이는 피보나치 수열의 6번째 항(0-indexed)에 해당하는 값이다.',
      },
      {
        id: 'b',
        content:
          '`fibonacci(6)`은 재귀 호출 트리에서 `fibonacci(5) = 5`, `fibonacci(4) = 3`을 거쳐 최종 합산 결과로 **8**을 출력한다. 재귀 깊이는 총 25회이다.',
      },
      {
        id: 'c',
        content:
          '`fibonacci(6)`의 재귀 호출 과정은 `f(6) → f(5) + f(4) → ... → f(1) + f(0)`으로 전개되며, 모든 리프 노드의 합이 **13**이 된다. 이는 피보나치 수열의 7번째 값과 같다.',
      },
      {
        id: 'd',
        content:
          '피보나치 수열에서 `f(6) = f(5) + f(4) = 13 + 8 = 21`이므로 출력값은 **21**이다. 단, 이 계산은 1-indexed 기준이며, 0-indexed에서는 다른 결과가 나올 수 있다.',
      },
    ],
  },
  {
    number: 2,
    title:
      '**TCP 3-Way Handshake** 과정을 올바르게 나열한 것은?\n\n| 단계 | 클라이언트 | 서버 |\n|------|-----------|------|\n| 1 | SYN 전송 | - |\n| 2 | - | SYN+ACK 전송 |\n| 3 | ? | - |\n\n3단계에서 클라이언트가 전송하는 것은?',
    selections: [
      { id: 'a', content: '**ACK** 패킷을 전송한다' },
      { id: 'b', content: '**SYN** 패킷을 재전송한다' },
      { id: 'c', content: '**FIN** 패킷을 전송한다' },
      { id: 'd', content: '**RST** 패킷을 전송한다' },
    ],
  },
  {
    number: 3,
    title:
      '다음 중 **시간 복잡도**가 `O(n log n)`인 정렬 알고리즘을 *모두* 고르시오.\n\n- 버블 정렬\n- 합병 정렬(Merge Sort)\n- 퀵 정렬(Quick Sort)\n- 삽입 정렬\n- 힙 정렬(Heap Sort)',
    selections: [
      { id: 'a', content: '합병 정렬, 퀵 정렬, 힙 정렬' },
      { id: 'b', content: '버블 정렬, 합병 정렬, 힙 정렬' },
      { id: 'c', content: '합병 정렬, 삽입 정렬, 힙 정렬' },
      { id: 'd', content: '퀵 정렬, 삽입 정렬, 버블 정렬' },
    ],
  },
  {
    number: 4,
    title:
      "아래 **SQL 쿼리**의 실행 결과로 올바른 것은?\n\n```sql\nSELECT department, COUNT(*) as cnt, AVG(salary) as avg_salary\nFROM employees\nWHERE hire_date >= '2023-01-01'\nGROUP BY department\nHAVING COUNT(*) >= 3\nORDER BY avg_salary DESC;\n```\n\n조건:\n1. `hire_date`가 **2023년 이후**인 직원만 필터링\n2. 부서별로 **3명 이상**인 부서만 표시\n3. 평균 급여 **내림차순** 정렬",
    selections: [
      {
        id: 'a',
        content:
          '2023년 이후 입사자가 3명 이상인 부서의 인원 수와 평균 급여를 *내림차순*으로 보여준다',
      },
      {
        id: 'b',
        content: '모든 부서의 전체 직원 수와 평균 급여를 보여준다',
      },
      {
        id: 'c',
        content: '2023년 이후 입사자 중 급여가 높은 상위 3명만 보여준다',
      },
      {
        id: 'd',
        content: '`HAVING` 절이 `WHERE` 이전에 실행되므로 **오류**가 발생한다',
      },
    ],
  },
  {
    number: 5,
    title:
      '**React**에서 `useEffect`의 클린업 함수가 호출되는 시점으로 올바른 것은?\n\n```jsx\nuseEffect(() => {\n  const timer = setInterval(() => {\n    console.log("tick");\n  }, 1000);\n\n  return () => clearInterval(timer); // 클린업\n}, [dependency]);\n```\n\n---\n\n위 코드에서 `clearInterval(timer)`이 실행되는 시점은?',
    selections: [
      {
        id: 'a',
        content:
          '`dependency`가 변경되어 **이펙트가 재실행되기 직전** 또는 컴포넌트가 **언마운트**될 때',
      },
      { id: 'b', content: '컴포넌트가 **최초 마운트**될 때' },
      { id: 'c', content: '`dependency` 값이 `null`이 될 때만' },
      {
        id: 'd',
        content: '`useEffect` 콜백이 실행된 **직후** 매번 호출된다',
      },
    ],
  },
  {
    number: 6,
    title:
      '**Git**에서 다음 명령어의 차이점을 설명한 것 중 *틀린* 것은?\n\n- `git merge feature`\n- `git rebase feature`\n\n> ⚠️ 두 명령 모두 `main` 브랜치에서 실행한다고 가정합니다.',
    selections: [
      {
        id: 'a',
        content:
          '`merge`는 **병합 커밋**을 생성하고, `rebase`는 커밋 히스토리를 **선형적으로** 재배치한다',
      },
      {
        id: 'b',
        content: '`rebase`는 기존 커밋의 **해시값을 변경**하지만, `merge`는 변경하지 않는다',
      },
      {
        id: 'c',
        content: '`merge`와 `rebase` 모두 **충돌(conflict)**이 발생할 수 있다',
      },
      {
        id: 'd',
        content: '`rebase`는 `merge`와 달리 **원격 브랜치에서 항상 안전**하게 사용할 수 있다',
      },
    ],
  },
  {
    number: 7,
    title:
      '다음 **TypeScript** 코드에서 타입 에러가 발생하는 줄은?\n\n```typescript\ninterface User {\n  name: string;\n  age: number;\n  email?: string;\n}\n\nconst user: User = {\n  name: "Kim",       // 1번 줄\n  age: "25",         // 2번 줄\n  email: undefined,  // 3번 줄\n  phone: "010-1234", // 4번 줄\n};\n```',
    selections: [
      { id: 'a', content: '**2번 줄**만 에러 (`string`을 `number`에 할당)' },
      { id: 'b', content: '**2번 줄**과 **4번 줄** 모두 에러' },
      {
        id: 'c',
        content: '**3번 줄**과 **4번 줄** 모두 에러 (`undefined`와 초과 프로퍼티)',
      },
      { id: 'd', content: '**4번 줄**만 에러 (초과 프로퍼티 검사)' },
    ],
  },
  {
    number: 8,
    title:
      '**OSI 7계층** 모델에서 각 계층과 프로토콜의 매핑이 올바른 것은?\n\n| 계층 | 프로토콜 |\n|------|----------|\n| 응용 계층 | HTTP, FTP, DNS |\n| 전송 계층 | TCP, UDP |\n| 네트워크 계층 | IP, ICMP |\n| 데이터링크 계층 | ? |\n\n데이터링크 계층에 해당하는 프로토콜은?',
    selections: [
      { id: 'a', content: '**Ethernet**, **PPP** (Point-to-Point Protocol)' },
      { id: 'b', content: '**TCP**, **SCTP**' },
      { id: 'c', content: '**HTTP/2**, **QUIC**' },
      { id: 'd', content: '**ARP**만 해당' },
    ],
  },
  {
    number: 9,
    title:
      '다음 **JavaScript** 코드의 실행 순서를 올바르게 나열한 것은?\n\n```javascript\nconsole.log("1");\n\nsetTimeout(() => console.log("2"), 0);\n\nPromise.resolve().then(() => console.log("3"));\n\nconsole.log("4");\n```\n\n> 이벤트 루프의 **매크로태스크**와 **마이크로태스크** 큐의 우선순위를 고려하세요.',
    selections: [
      { id: 'a', content: '`1` → `4` → `3` → `2`' },
      { id: 'b', content: '`1` → `4` → `2` → `3`' },
      { id: 'c', content: '`1` → `2` → `3` → `4`' },
      { id: 'd', content: '`1` → `3` → `4` → `2`' },
    ],
  },
  {
    number: 10,
    title:
      '다음 **디자인 패턴**에 대한 설명 중 올바른 것은?\n\n- **싱글턴(Singleton)**: 클래스의 인스턴스를 하나만 생성\n- **옵저버(Observer)**: 객체의 상태 변화를 다른 객체에 통지\n- **팩토리(Factory)**: 객체 생성 로직을 별도로 분리\n\n아래 코드는 어떤 패턴인가?\n\n```python\nclass EventEmitter:\n    def __init__(self):\n        self._listeners = {}\n\n    def on(self, event, callback):\n        self._listeners.setdefault(event, []).append(callback)\n\n    def emit(self, event, *args):\n        for cb in self._listeners.get(event, []):\n            cb(*args)\n```',
    selections: [
      { id: 'a', content: '**옵저버(Observer)** 패턴' },
      { id: 'b', content: '**싱글턴(Singleton)** 패턴' },
      { id: 'c', content: '**팩토리(Factory)** 패턴' },
      { id: 'd', content: '**전략(Strategy)** 패턴' },
    ],
  },
];

/**
 * BLANK(빈칸 채우기) 타입 mock 퀴즈 데이터.
 * URL에 ?mock=true&design=C|D|E|F 추가 시 BLANK 전용 UI를 테스트할 수 있다.
 */
/**
 * ESSAY(서술형) 타입 mock 퀴즈 데이터.
 * URL에 ?mock=true&essay=true 추가 시 ESSAY 전용 UI를 테스트할 수 있다.
 */
export const MOCK_ESSAY_QUIZZES: Quiz[] = [
  {
    number: 1,
    type: 'ESSAY',
    title:
      '**TCP 3-Way Handshake**의 각 단계(SYN, SYN+ACK, ACK)에서 클라이언트와 서버가 수행하는 동작을 설명하고, 이 과정이 필요한 이유를 서술하시오.',
    selections: [],
    modelAnswer:
      'TCP 3-Way Handshake는 클라이언트와 서버 간의 신뢰성 있는 연결을 수립하기 위한 과정이다. 1단계에서 클라이언트는 SYN 플래그가 설정된 세그먼트를 서버에 전송하여 연결을 요청한다. 2단계에서 서버는 SYN+ACK 세그먼트로 응답하여 연결 요청을 수락하고 자신도 연결을 요청한다. 3단계에서 클라이언트는 ACK 세그먼트를 전송하여 서버의 연결 요청을 확인한다. 이 과정은 양방향 통신 채널을 확립하고, 초기 순서 번호(ISN)를 교환하며, 양측 모두 데이터를 송수신할 준비가 되었음을 확인하기 위해 필요하다.',
  },
  {
    number: 2,
    type: 'ESSAY',
    title:
      '**React**에서 `useEffect`와 `useLayoutEffect`의 차이점을 설명하고, 각각 어떤 상황에서 사용하는 것이 적절한지 예시를 들어 서술하시오.',
    selections: [],
    modelAnswer:
      'useEffect는 브라우저가 화면을 그린(paint) 후에 비동기적으로 실행되는 반면, useLayoutEffect는 DOM 변경 후 브라우저가 화면을 그리기 전에 동기적으로 실행된다. useEffect는 데이터 페칭, 이벤트 리스너 등록, 타이머 설정 등 화면 렌더링을 차단할 필요가 없는 부수 효과에 적합하다. useLayoutEffect는 DOM 측정(요소 크기, 위치), 스크롤 위치 조정, 깜빡임 방지가 필요한 DOM 조작 등에 적합하다.',
  },
  {
    number: 3,
    type: 'ESSAY',
    title:
      '**SOLID 원칙** 중 **단일 책임 원칙(SRP)**과 **개방-폐쇄 원칙(OCP)**을 각각 설명하고, 이 원칙들이 왜 중요한지 실제 코드 설계 관점에서 서술하시오.',
    selections: [],
    modelAnswer:
      '단일 책임 원칙(SRP)은 클래스는 하나의 책임만 가져야 하며, 변경의 이유가 하나여야 한다는 원칙이다. 개방-폐쇄 원칙(OCP)은 소프트웨어 요소는 확장에는 열려 있고 수정에는 닫혀 있어야 한다는 원칙이다. SRP는 코드의 응집도를 높이고 변경의 영향 범위를 줄여 유지보수를 용이하게 한다. OCP는 기존 코드를 수정하지 않고 새로운 기능을 추가할 수 있게 하여, 안정성을 유지하면서 확장성을 확보한다.',
  },
];

/**
 * REAL_BLANK(주관식 빈칸) 타입 mock 퀴즈 데이터.
 * URL에 ?mock=true&real_blank=true 추가 시 REAL_BLANK 전용 UI를 테스트할 수 있다.
 *
 * 정답은 `selections[].correct === true` 항목의 `content`를 사용하며,
 * 다중 빈칸은 콤마(`,`)로 토큰을 구분한다 (기존 BLANK와 동일 포맷).
 */
export const MOCK_REAL_BLANK_QUIZZES: Quiz[] = [
  {
    number: 1,
    type: 'REAL_BLANK',
    title: '대한민국의 수도는 _______이다.',
    selections: [{ id: '1', content: '서울', correct: true }],
  },
  {
    number: 2,
    type: 'REAL_BLANK',
    title:
      'TCP 3-Way Handshake는 _______ → _______ → ACK 순서로 진행되며, 양쪽 모두의 연결 의사를 확인한다.',
    selections: [{ id: '1', content: 'SYN, SYN+ACK', correct: true }],
  },
  {
    number: 3,
    type: 'REAL_BLANK',
    title: 'JavaScript의 단일 스레드 이벤트 모델을 처리하는 메커니즘은 _______이다.',
    selections: [{ id: '1', content: 'Event Loop', correct: true }],
  },
  {
    number: 4,
    type: 'REAL_BLANK',
    title: '원주율 π의 소수점 둘째 자리까지의 근사값은 _______ 이다.',
    selections: [{ id: '1', content: '3.14', correct: true }],
  },
];

export const MOCK_BLANK_QUIZZES: Quiz[] = [
  {
    number: 1,
    type: 'BLANK',
    title:
      '카프카에서 `Producer`가 메시지를 전송할 때, 메시지의 `Key`값을 가지지 않는 경우 파티션 분배 전략으로 Kafka 2.4 버전부터 기본으로 채택된 방식은 _______이다.',
    selections: [
      { id: '1', content: 'Custom Partitioner', correct: false },
      { id: '2', content: 'Sticky Partitioning', correct: true },
      { id: '3', content: 'Round Robin', correct: false },
      { id: '4', content: 'Hash Partitioning', correct: false },
    ],
  },
  {
    number: 2,
    type: 'BLANK',
    title:
      '카프카 `Consumer`가 `Topic`에 처음 접속하여 메시지를 가져올 때, 가장 오래된 처음 `offset`부터 가져올지, 가장 최근의 마지막 `offset`부터 가져올지를 설정하는 파라미터는 _______이다.',
    selections: [
      { id: '1', content: 'enable.auto.commit', correct: false },
      { id: '2', content: 'bootstrap.servers', correct: false },
      { id: '3', content: 'auto.offset.reset', correct: true },
      { id: '4', content: 'group.id', correct: false },
    ],
  },
  {
    number: 3,
    type: 'BLANK',
    title:
      '카프카 `Producer`에서 `send()` 메소드 호출 시, `Record Accumulator`에 입력하지 못하고 `block`되는 최대 시간을 설정하는 파라미터는 _______이다.',
    selections: [
      { id: '1', content: 'retry.backoff.ms', correct: false },
      { id: '2', content: 'delivery.timeout.ms', correct: false },
      { id: '3', content: 'request.timeout.ms', correct: false },
      { id: '4', content: 'max.block.ms', correct: true },
    ],
  },
  {
    number: 4,
    type: 'BLANK',
    title:
      '카프카에서 `Consumer Group` 내의 `Consumer`들에게 고정된 ID를 부여하여, `Consumer`가 `shutdown`되어도 `session.timeout.ms` 내에 재기동되면 `rebalance`가 수행되지 않게 하는 기능은 _______이다.',
    selections: [
      { id: '1', content: 'Idempotence', correct: false },
      { id: '2', content: 'Cooperative Rebalancing', correct: false },
      { id: '3', content: 'Dynamic Group Membership', correct: false },
      { id: '4', content: 'Static Group Membership', correct: true },
    ],
  },
  {
    number: 5,
    type: 'BLANK',
    title:
      'Producer가 메시지 전송 시 재전송(retry)을 수행하더라도 메시지 중복을 방지하기 위해, Producer ID와 메시지 Sequence를 사용하여 중복을 제거하는 메커니즘을 _______라고 한다.',
    selections: [
      { id: '1', content: 'Idempotence', correct: true },
      { id: '2', content: 'Compaction', correct: false },
      { id: '3', content: 'Rebalancing', correct: false },
      { id: '4', content: 'Transaction', correct: false },
    ],
  },
  {
    number: 6,
    type: 'BLANK',
    title:
      'TCP 3-Way Handshake는 _______ → _______ → ACK 순서로 진행되며, 양쪽 모두의 연결 의사를 확인한다.',
    selections: [
      { id: '1', content: 'SYN, SYN+ACK', correct: true },
      { id: '2', content: 'SYN, FIN', correct: false },
      { id: '3', content: 'FIN, RST', correct: false },
      { id: '4', content: 'RST, ACK', correct: false },
    ],
  },
  {
    number: 7,
    type: 'BLANK',
    title:
      'HTTP에서 _______ 메서드는 리소스를 조회하고, _______ 메서드는 새로운 리소스를 생성하며, _______ 메서드는 리소스를 삭제한다.',
    selections: [
      { id: '1', content: 'GET, POST, DELETE', correct: true },
      { id: '2', content: 'POST, GET, PUT', correct: false },
      { id: '3', content: 'GET, PUT, PATCH', correct: false },
      { id: '4', content: 'HEAD, POST, DELETE', correct: false },
    ],
  },
];
