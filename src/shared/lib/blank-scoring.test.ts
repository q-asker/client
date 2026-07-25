import { describe, it, expect } from 'vitest';
import {
  normalizeBlankAnswer,
  serializeRealBlankTokens,
  isRealBlankQuizCorrect,
  type RealBlankGradable,
} from './blank-scoring';

/** 단일 빈칸 문항 헬퍼 */
const single = (
  correct: string,
  userAnswer: string | null,
  acceptedAnswers?: string[][],
): RealBlankGradable => ({
  selections: [{ id: '1', content: correct, correct: true }],
  userAnswer,
  acceptedAnswers,
});

/** 다중 빈칸 문항 헬퍼 (userAnswer는 토큰 직렬화) */
const multi = (
  correct: string,
  userTokens: string[],
  acceptedAnswers?: string[][],
): RealBlankGradable => ({
  selections: [{ id: '1', content: correct, correct: true }],
  userAnswer: serializeRealBlankTokens(userTokens),
  acceptedAnswers,
});

describe('normalizeBlankAnswer (contract §7.3)', () => {
  it('공백 전부 제거 + 소문자', () => {
    expect(normalizeBlankAnswer('Event Loop')).toBe('eventloop');
    expect(normalizeBlankAnswer('  이벤트  루프 ')).toBe('이벤트루프');
    expect(normalizeBlankAnswer('SEOUL')).toBe('seoul');
  });

  it('NFKC: 전각→반각, 전각 공백 제거', () => {
    expect(normalizeBlankAnswer('ＳＹＮ')).toBe('syn'); // 전각 영문
    expect(normalizeBlankAnswer('서울　특별시')).toBe('서울특별시'); // U+3000 전각 공백
  });

  it('문장부호(\\p{P}) 제거', () => {
    expect(normalizeBlankAnswer('U.S.A.')).toBe('usa');
    expect(normalizeBlankAnswer('e.g.')).toBe('eg');
    expect(normalizeBlankAnswer('SYN-ACK')).toBe('synack'); // 하이픈은 \p{P}
  });

  it('보존 심볼(+ # = < >)은 남겨 C++↔C·C#↔C 구분 유지 (SC-002 안전)', () => {
    expect(normalizeBlankAnswer('C++')).toBe('c++');
    expect(normalizeBlankAnswer('C#')).toBe('c#'); // #은 \p{P}이지만 명시 예외로 보존
    expect(normalizeBlankAnswer('F#')).toBe('f#');
    expect(normalizeBlankAnswer('a < b')).toBe('a<b');
    expect(normalizeBlankAnswer('a=b')).toBe('a=b');
    expect(normalizeBlankAnswer('C++')).not.toBe(normalizeBlankAnswer('C'));
    expect(normalizeBlankAnswer('C#')).not.toBe(normalizeBlankAnswer('C'));
  });

  it('# 외 \\p{P}(@ % & - .)는 제거된다', () => {
    expect(normalizeBlankAnswer('a@b')).toBe('ab');
    expect(normalizeBlankAnswer('U.S.A.')).toBe('usa');
    expect(normalizeBlankAnswer('SYN-ACK')).toBe('synack');
  });

  it('재현성(SC-003): 같은 입력은 항상 같은 결과', () => {
    const s = 'Ｅvent  Loop!!';
    expect(normalizeBlankAnswer(s)).toBe(normalizeBlankAnswer(s));
  });
});

describe('isRealBlankQuizCorrect — 단일 빈칸', () => {
  it('완전 일치', () => {
    expect(isRealBlankQuizCorrect(single('서울', '서울'))).toBe(true);
  });

  it('표기 차이(공백·대소문자)만 달라도 정답 (FR-002①)', () => {
    expect(isRealBlankQuizCorrect(single('Event Loop', 'event  loop'))).toBe(true);
    expect(isRealBlankQuizCorrect(single('Event Loop', 'EVENTLOOP'))).toBe(true);
  });

  it('인정 답 목록의 동의어·한↔영 정답 인정 (FR-002②)', () => {
    const q = single('서울', 'Seoul', [['Seoul', '서울특별시']]);
    expect(isRealBlankQuizCorrect(q)).toBe(true);
    expect(isRealBlankQuizCorrect(single('서울', '서울특별시', [['Seoul', '서울특별시']]))).toBe(
      true,
    );
    // 인정 답도 표기 정규화 관용을 받는다
    expect(isRealBlankQuizCorrect(single('Event Loop', '이벤트루프', [['이벤트 루프']]))).toBe(
      true,
    );
  });

  it('함정/무관 오답은 오답 (FR-003, SC-002)', () => {
    expect(isRealBlankQuizCorrect(single('서울', '부산', [['Seoul']]))).toBe(false);
    expect(isRealBlankQuizCorrect(single('서울', '평양'))).toBe(false);
    // 심볼 구분: 정답 C++ 문항에서 함정 C 입력은 오답이어야 한다
    expect(isRealBlankQuizCorrect(single('C++', 'C'))).toBe(false);
    expect(isRealBlankQuizCorrect(single('C++', 'C++'))).toBe(true);
  });

  it('빈/공백-only/미응답(0) 입력은 관용과 무관하게 오답', () => {
    expect(isRealBlankQuizCorrect(single('서울', ''))).toBe(false);
    expect(isRealBlankQuizCorrect(single('서울', '   '))).toBe(false);
    expect(isRealBlankQuizCorrect(single('서울', '0'))).toBe(false); // 서버 미응답 신호
    expect(isRealBlankQuizCorrect(single('서울', null))).toBe(false);
  });

  it('기존 세트(FR-006): acceptedAnswers 없으면 표기 정규화만 적용', () => {
    // 동의어는 목록이 없어 인정 안 됨
    expect(isRealBlankQuizCorrect(single('Event Loop', '이벤트 루프'))).toBe(false);
    // 표기 정규화는 여전히 동작 (회귀 없음, 현행 완전일치 대비 상위호환)
    expect(isRealBlankQuizCorrect(single('Event Loop', 'event loop'))).toBe(true);
    expect(isRealBlankQuizCorrect(single('3.14', '3.14'))).toBe(true);
  });
});

describe('isRealBlankQuizCorrect — 다중 빈칸', () => {
  const correct = 'SYN, SYN+ACK';
  const accepted = [[], ['SYN ACK', 'SYNACK']];

  it('빈칸별 정답 (표기 정규화 + 인정 답)', () => {
    expect(isRealBlankQuizCorrect(multi(correct, ['SYN', 'SYN+ACK'], accepted))).toBe(true);
    expect(isRealBlankQuizCorrect(multi(correct, ['syn', 'SYNACK'], accepted))).toBe(true); // 2번째 빈칸 인정 답
  });

  it('토큰 수 불일치 시 전체 오답', () => {
    expect(isRealBlankQuizCorrect(multi(correct, ['SYN'], accepted))).toBe(false);
    expect(isRealBlankQuizCorrect(multi(correct, ['SYN', 'SYN+ACK', 'ACK'], accepted))).toBe(false);
  });

  it('한 빈칸이라도 틀리면 전체 오답', () => {
    expect(isRealBlankQuizCorrect(multi(correct, ['SYN', 'ACK'], accepted))).toBe(false); // ACK는 인정 답 아님
    expect(isRealBlankQuizCorrect(multi(correct, ['FIN', 'SYN+ACK'], accepted))).toBe(false); // 1번째 틀림
  });

  it('한 빈칸이 비면 전체 오답', () => {
    expect(isRealBlankQuizCorrect(multi(correct, ['SYN', ''], accepted))).toBe(false);
  });
});

describe('성공 기준 배치 검증 (SC-001 / SC-002)', () => {
  // 정답 "Event Loop", 인정 답 = 동의어/표기 변형
  const q = (userAnswer: string): RealBlankGradable =>
    single('Event Loop', userAnswer, [['이벤트 루프', 'event-loop', '이벤트루프']]);

  it('SC-001: 의미상 정답인 변형 목록의 90% 이상 인정', () => {
    const validVariants = [
      'Event Loop',
      'event loop',
      'EVENTLOOP',
      'event-loop',
      'event  loop', // 공백 차이
      '이벤트 루프',
      '이벤트루프',
      'ＥＶＥＮＴ ＬＯＯＰ', // 전각
    ];
    const accepted = validVariants.filter((v) => isRealBlankQuizCorrect(q(v)));
    expect(accepted.length / validVariants.length).toBeGreaterThanOrEqual(0.9);
  });

  it('SC-002: 함정/무관 오답 목록에서 정답 인정 0건', () => {
    // disjoint 가정: 인정 답이 함정과 정규화 후 겹치지 않는다(백엔드 sanitize가 보장) → FE는 이 가정을 검증
    const traps = ['Call Stack', 'Task Queue', 'Microtask', 'Web API', 'setTimeout', '스택', ''];
    const accepted = traps.filter((v) => isRealBlankQuizCorrect(q(v)));
    expect(accepted.length).toBe(0);
  });
});
