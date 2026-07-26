import { describe, it, expect } from 'vitest';
import {
  normalizeBlankAnswer,
  gradeRealBlankQuiz,
  serializeRealBlankTokens,
  type RealBlankGradable,
} from './blank-scoring';

// 단일 빈칸: 정답 '이벤트 루프' + 동의어 + 오답선지 '콜 스택'
const eventLoop = (userAnswer: string | number | null): RealBlankGradable => ({
  userAnswer,
  selections: [
    { content: '이벤트 루프', correct: true },
    { content: '콜 스택', correct: false },
  ],
  acceptedAnswers: [
    { answer: '이벤트 루프', accepted: ['Event Loop', '이벤트루프', 'event-loop'] },
  ],
});

describe('normalizeBlankAnswer', () => {
  it('공백·대소문자를 흡수한다', () => {
    expect(normalizeBlankAnswer(' Event  Loop ')).toBe(normalizeBlankAnswer('eventloop'));
  });
  it('전각/반각(NFKC)을 통일한다', () => {
    // 전각 'ＳＥＯＵＬ' → 반각 소문자 'seoul'
    expect(normalizeBlankAnswer('ＳＥＯＵＬ')).toBe(normalizeBlankAnswer('seoul'));
  });
  it('문장부호를 제거한다', () => {
    expect(normalizeBlankAnswer('event-loop')).toBe(normalizeBlankAnswer('event loop'));
    expect(normalizeBlankAnswer('3.14')).toBe('314');
  });
});

describe('gradeRealBlankQuiz — FR-001 표기 차이', () => {
  it('공백·대소문자만 다르면 정답', () => {
    expect(gradeRealBlankQuiz(eventLoop('이벤트루프'))).toBe(true);
    expect(gradeRealBlankQuiz(eventLoop('Event Loop'))).toBe(true);
    expect(gradeRealBlankQuiz(eventLoop('event loop'))).toBe(true);
  });
  it('하이픈 등 문장부호 차이를 흡수', () => {
    expect(gradeRealBlankQuiz(eventLoop('event-loop'))).toBe(true);
  });
});

describe('gradeRealBlankQuiz — FR-003 동의어', () => {
  it('허용답안 목록 중 하나와 뜻이 같으면 정답', () => {
    expect(gradeRealBlankQuiz(eventLoop('이벤트 루프'))).toBe(true);
    expect(gradeRealBlankQuiz(eventLoop('EVENT LOOP'))).toBe(true);
  });
});

describe('gradeRealBlankQuiz — FR-002 오탈자(길이비례)', () => {
  it('정규화 길이 5, 편집거리 1 오탈자는 정답', () => {
    // '이벤트루프'(5) vs '이벤트르프'(루→르, 거리1) → threshold 1 → 정답
    expect(gradeRealBlankQuiz(eventLoop('이벤트르프'))).toBe(true);
  });
  it('짧은 답(len≤2)은 오탈자 불허 — 완전일치만', () => {
    const q: RealBlankGradable = {
      userAnswer: '강',
      selections: [
        { content: '산', correct: true },
        { content: '바다', correct: false },
      ],
      acceptedAnswers: [{ answer: '산', accepted: [] }],
    };
    expect(gradeRealBlankQuiz(q)).toBe(false); // '강'은 '산'의 오탈자로 인정 안 됨
    expect(gradeRealBlankQuiz({ ...q, userAnswer: '산' })).toBe(true);
  });
});

describe('gradeRealBlankQuiz — FR-005 오답 보호(D-guard)', () => {
  it('오답선지를 그대로 입력하면 오답', () => {
    expect(gradeRealBlankQuiz(eventLoop('콜 스택'))).toBe(false);
    expect(gradeRealBlankQuiz(eventLoop('콜스택'))).toBe(false); // 표기만 달라도 오답선지면 오답
  });
  it('오탈자 관용이 오답선지로 새지 않는다(D-guard가 tolerance보다 우선)', () => {
    // 정답 OCP, 오답선지 OOP. 'OOP'는 'OCP'와 거리1이라 관용이면 정답이 될 뻔하지만 오답선지라 오답.
    const q: RealBlankGradable = {
      userAnswer: 'OOP',
      selections: [
        { content: 'OCP', correct: true },
        { content: 'OOP', correct: false },
      ],
      acceptedAnswers: [{ answer: 'OCP', accepted: [] }],
    };
    expect(gradeRealBlankQuiz(q)).toBe(false);
    expect(gradeRealBlankQuiz({ ...q, userAnswer: 'OCP' })).toBe(true);
    expect(gradeRealBlankQuiz({ ...q, userAnswer: 'ocp' })).toBe(true);
  });
  it('무관한 답·빈 답·미응답 센티넬은 오답', () => {
    expect(gradeRealBlankQuiz(eventLoop('자바스크립트'))).toBe(false);
    expect(gradeRealBlankQuiz(eventLoop(''))).toBe(false);
    expect(gradeRealBlankQuiz(eventLoop('   '))).toBe(false);
    expect(gradeRealBlankQuiz(eventLoop('0'))).toBe(false); // 서버 미응답 센티넬
    expect(gradeRealBlankQuiz(eventLoop(null))).toBe(false);
  });
});

describe('gradeRealBlankQuiz — G 다중 빈칸', () => {
  const multi = (userAnswer: string): RealBlankGradable => ({
    userAnswer,
    selections: [{ content: 'SYN, SYN+ACK', correct: true }],
    acceptedAnswers: [
      { answer: 'SYN', accepted: [] },
      { answer: 'SYN+ACK', accepted: ['SYN-ACK'] },
    ],
  });
  it('모든 빈칸이 관용 범위면 정답', () => {
    expect(gradeRealBlankQuiz(multi(serializeRealBlankTokens(['syn', 'syn+ack'])))).toBe(true);
    // 두 번째 빈칸을 동의어 'SYN-ACK'로
    expect(gradeRealBlankQuiz(multi(serializeRealBlankTokens(['SYN', 'SYN-ACK'])))).toBe(true);
  });
  it('한 빈칸이라도 틀리면 오답', () => {
    expect(gradeRealBlankQuiz(multi(serializeRealBlankTokens(['syn', 'fin'])))).toBe(false);
  });
  it('토큰 수가 빈칸 수와 다르면 오답', () => {
    expect(gradeRealBlankQuiz(multi('syn'))).toBe(false); // 1토큰 vs 2빈칸
  });
});

describe('gradeRealBlankQuiz — F 소급(허용목록 없는 구문항)', () => {
  const legacy = (userAnswer: string): RealBlankGradable => ({
    userAnswer,
    selections: [{ content: '서울', correct: true }],
    acceptedAnswers: null,
  });
  it('표기·오탈자만 관용, 완전일치는 항상 정답', () => {
    expect(gradeRealBlankQuiz(legacy('서울'))).toBe(true);
    expect(gradeRealBlankQuiz(legacy(' 서울 '))).toBe(true);
  });
  it('동의어 데이터가 없으므로 다른 표기(영↔한)는 오답', () => {
    expect(gradeRealBlankQuiz(legacy('Seoul'))).toBe(false);
  });
});

describe('gradeRealBlankQuiz — FR-006 재현성', () => {
  it('같은 입력을 반복 채점해도 판정이 동일하다', () => {
    const inputs = ['이벤트루프', '콜 스택', '이벤트르프', ''];
    for (const inp of inputs) {
      const first = gradeRealBlankQuiz(eventLoop(inp));
      for (let k = 0; k < 5; k++) {
        expect(gradeRealBlankQuiz(eventLoop(inp))).toBe(first);
      }
    }
  });
});
