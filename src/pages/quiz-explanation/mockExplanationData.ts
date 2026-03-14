/**
 * quiz-explanation 디자인 변형 테스트용 mock 데이터.
 * URL에 ?mock=true 추가 시 location.state 없이도 이 데이터로 렌더링 가능.
 */
import type { Quiz } from '#features/quiz-generation';

export const MOCK_QUIZZES: Quiz[] = [
  {
    number: 1,
    title: 'TCP 3-Way Handshake의 세 번째 단계에서 클라이언트가 전송하는 패킷은?',
    selections: [
      { id: '1', content: 'ACK 패킷을 전송한다' },
      { id: '2', content: 'SYN 패킷을 재전송한다' },
      { id: '3', content: 'FIN 패킷을 전송한다' },
      { id: '4', content: 'RST 패킷을 전송한다' },
    ],
    userAnswer: '1',
    check: true,
  },
  {
    number: 2,
    title: 'React에서 useEffect 클린업 함수가 호출되는 시점은?',
    selections: [
      { id: '1', content: 'dependency 변경 시 이펙트 재실행 직전 또는 언마운트 시' },
      { id: '2', content: '컴포넌트가 최초 마운트될 때' },
      { id: '3', content: 'dependency 값이 null이 될 때만' },
      { id: '4', content: 'useEffect 콜백 실행 직후 매번' },
    ],
    userAnswer: '2',
    check: false,
  },
  {
    number: 3,
    title: '시간 복잡도가 O(n log n)인 정렬 알고리즘을 모두 고르시오.',
    selections: [
      { id: '1', content: '합병 정렬, 퀵 정렬, 힙 정렬' },
      { id: '2', content: '버블 정렬, 합병 정렬, 힙 정렬' },
      { id: '3', content: '합병 정렬, 삽입 정렬, 힙 정렬' },
      { id: '4', content: '퀵 정렬, 삽입 정렬, 버블 정렬' },
    ],
    userAnswer: '1',
    check: true,
  },
  {
    number: 4,
    title: 'Git에서 merge와 rebase의 차이에 대한 설명 중 틀린 것은?',
    selections: [
      { id: '1', content: 'merge는 병합 커밋을 생성하고, rebase는 선형적으로 재배치한다' },
      { id: '2', content: 'rebase는 기존 커밋의 해시값을 변경하지만, merge는 변경하지 않는다' },
      { id: '3', content: 'merge와 rebase 모두 충돌이 발생할 수 있다' },
      {
        id: '4',
        content: 'rebase는 merge와 달리 원격 브랜치에서 항상 안전하게 사용할 수 있다',
      },
    ],
    userAnswer: '3',
    check: false,
  },
];

export const MOCK_EXPLANATION = {
  results: [
    {
      number: 1,
      explanation:
        '## TCP 3-Way Handshake\n\nTCP 연결 수립은 **3단계**로 진행됩니다:\n\n1. **SYN** — 클라이언트 → 서버: 연결 요청\n2. **SYN-ACK** — 서버 → 클라이언트: 요청 수락 + 역방향 연결 요청\n3. **ACK** — 클라이언트 → 서버: 최종 확인\n\n세 번째 단계에서 클라이언트는 `ACK` 패킷을 전송하며, 이 과정이 완료되면 **ESTABLISHED** 상태가 됩니다.\n\n> 💡 **핵심 포인트**: FIN은 연결 *종료* 시, RST는 *비정상 종료* 시 사용되므로 혼동하지 않도록 주의하세요.\n\n```\nClient          Server\n  |--- SYN ------->|\n  |<-- SYN-ACK ----|  \n  |--- ACK ------->|  ← 3번째 단계\n  |   ESTABLISHED  |\n```',
      referencedPages: [3, 5, 7],
    },
    {
      number: 2,
      explanation:
        '## useEffect 클린업 함수\n\n`useEffect`의 클린업 함수는 **두 가지 시점**에 호출됩니다:\n\n| 시점 | 설명 |\n|------|------|\n| **리렌더링 직전** | dependency 변경 → 이전 이펙트의 클린업 실행 → 새 이펙트 실행 |\n| **언마운트** | 컴포넌트 제거 시 마지막 클린업 실행 |\n\n### 올바른 예시\n\n```jsx\nuseEffect(() => {\n  const timer = setInterval(() => console.log("tick"), 1000);\n  \n  // 클린업: 리렌더 직전 또는 언마운트 시 호출\n  return () => clearInterval(timer);\n}, [dependency]);\n```\n\n> ⚠️ **주의**: 최초 마운트 시에는 클린업이 호출되지 **않습니다**. `componentDidMount`에 해당하는 시점에서는 정리할 이전 이펙트가 없기 때문입니다.',
      referencedPages: [12, 14],
    },
    {
      number: 3,
      explanation:
        '## 정렬 알고리즘 시간 복잡도 비교\n\n### O(n log n) 알고리즘\n\n- **합병 정렬 (Merge Sort)** — 항상 `O(n log n)`, 안정 정렬\n- **퀵 정렬 (Quick Sort)** — 평균 `O(n log n)`, 최악 `O(n²)`\n- **힙 정렬 (Heap Sort)** — 항상 `O(n log n)`, 불안정 정렬\n\n### O(n²) 알고리즘\n\n- **버블 정렬** — 인접 원소 비교/교환 반복\n- **삽입 정렬** — 거의 정렬된 데이터에서는 `O(n)`까지 가능\n\n| 알고리즘 | 최선 | 평균 | 최악 | 안정성 |\n|----------|------|------|------|--------|\n| Merge Sort | `O(n log n)` | `O(n log n)` | `O(n log n)` | ✅ |\n| Quick Sort | `O(n log n)` | `O(n log n)` | `O(n²)` | ❌ |\n| Heap Sort | `O(n log n)` | `O(n log n)` | `O(n log n)` | ❌ |\n\n> 💡 실무에서는 **퀵 정렬**이 캐시 효율이 좋아 가장 널리 사용됩니다.',
      referencedPages: [20],
    },
    {
      number: 4,
      explanation:
        '## Git merge vs rebase\n\n### 핵심 차이\n\n| | `merge` | `rebase` |\n|---|---------|----------|\n| **커밋 히스토리** | 병합 커밋 생성 (비선형) | 커밋을 선형으로 재배치 |\n| **해시값 변경** | ❌ 기존 커밋 유지 | ✅ 새 해시값 부여 |\n| **충돌 가능성** | ✅ 있음 | ✅ 있음 |\n\n### 왜 4번이 틀린가?\n\n`rebase`는 커밋 히스토리를 **재작성(rewrite)** 합니다. 이미 `push`된 원격 브랜치에서 rebase를 수행하면:\n\n1. 기존 커밋의 해시가 변경됨\n2. 다른 협업자의 로컬과 **히스토리 불일치** 발생\n3. `force push`가 필요해지며, 다른 사람의 작업이 유실될 위험\n\n```bash\n# ⚠️ 위험한 패턴\ngit checkout feature\ngit rebase main\ngit push --force  # 다른 협업자의 커밋이 사라질 수 있음\n```\n\n> **Golden Rule**: 이미 공유된 브랜치에서는 `rebase` 대신 `merge`를 사용하세요.',
      referencedPages: [25, 26],
    },
  ],
};

export const MOCK_UPLOADED_URL = '';
