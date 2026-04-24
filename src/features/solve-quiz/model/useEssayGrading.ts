import { useTranslation } from 'i18nexus';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axiosInstance from '#shared/api';
import type { GradeResult } from '#features/quiz-generation';

/** mock 채점 결과 생성 */
const generateMockGrade = (textAnswer: string): GradeResult => {
  const length = textAnswer.trim().length;

  if (length > 100) {
    return {
      elementScores: [
        {
          element: 'SYN 단계 — 연결 요청과 시퀀스 번호 설정',
          maxPoints: 2,
          earnedPoints: 2,
          level: '충족',
          feedback: '클라이언트의 SYN 전송과 초기 시퀀스 번호 설정을 정확하게 서술했습니다.',
        },
        {
          element: 'SYN-ACK 단계 — 수락 응답과 양방향 통신 기반',
          maxPoints: 2,
          earnedPoints: 2,
          level: '충족',
          feedback: '서버의 SYN-ACK 응답과 시퀀스 번호 교환의 의미를 정확히 서술했습니다.',
        },
        {
          element: 'ACK 단계 — 연결 완성과 신뢰성 확보',
          maxPoints: 2,
          earnedPoints: 1,
          level: '부분 충족',
          feedback: 'ACK 단계를 언급했으나, 신뢰성 확보의 구체적 메커니즘 서술이 부족합니다.',
        },
      ],

      totalScore: 5,
      maxScore: 6,
      overallFeedback:
        'TCP 3-way handshake의 전반적인 흐름을 잘 이해하고 있습니다. ACK 단계에서 신뢰성 확보 메커니즘을 보완하면 완전한 답안이 됩니다.',
    };
  }

  if (length > 30) {
    return {
      elementScores: [
        {
          element: 'SYN 단계 — 연결 요청과 시퀀스 번호 설정',
          maxPoints: 2,
          earnedPoints: 2,
          level: '충족',
          feedback: '클라이언트의 SYN 전송을 정확하게 서술했습니다.',
        },
        {
          element: 'SYN-ACK 단계 — 수락 응답과 양방향 통신 기반',
          maxPoints: 2,
          earnedPoints: 1,
          level: '부분 충족',
          feedback: '서버 응답은 언급했으나, 시퀀스 번호 교환의 의미를 서술하지 않았습니다.',
        },
        {
          element: 'ACK 단계 — 연결 완성과 신뢰성 확보',
          maxPoints: 2,
          earnedPoints: 0,
          level: '미충족',
          feedback: 'ACK 단계를 언급하지 않았습니다.',
        },
      ],

      totalScore: 3,
      maxScore: 6,
      overallFeedback: '기본 개념은 이해하고 있으나, SYN-ACK과 ACK 단계에 대한 설명이 부족합니다.',
    };
  }

  return {
    elementScores: [
      {
        element: 'SYN 단계 — 연결 요청과 시퀀스 번호 설정',
        maxPoints: 2,
        earnedPoints: 0,
        level: '미충족',
        feedback: 'SYN 단계에 대한 설명이 누락되었습니다.',
      },
      {
        element: 'SYN-ACK 단계 — 수락 응답과 양방향 통신 기반',
        maxPoints: 2,
        earnedPoints: 0,
        level: '미충족',
        feedback: 'SYN-ACK 단계에 대한 설명이 누락되었습니다.',
      },
      {
        element: 'ACK 단계 — 연결 완성과 신뢰성 확보',
        maxPoints: 2,
        earnedPoints: 0,
        level: '미충족',
        feedback: 'ACK 단계에 대한 설명이 누락되었습니다.',
      },
    ],

    totalScore: 0,
    maxScore: 6,
    overallFeedback:
      '답변이 너무 짧거나 핵심 내용이 부족합니다. 각 단계별로 구체적으로 서술해 주세요.',
  };
};

/** 서술형(ESSAY) 문제 AI 채점 훅 — 문제별로 채점 상태를 추적한다 */
export function useEssayGrading() {
  const { t } = useTranslation('common');
  const [gradingSet, setGradingSet] = useState<Set<number>>(new Set());
  const [gradeErrors, setGradeErrors] = useState<Record<number, string | null>>({});
  const [searchParams] = useSearchParams();
  const isMock = searchParams.get('mock') === 'true';

  /** 서술형 답안을 AI에게 채점 요청한다 */
  const gradeEssayAnswer = async (
    problemSetId: string,
    problemNumber: number,
    textAnswer: string,
    attemptCount: number,
  ): Promise<GradeResult | null> => {
    setGradingSet((prev) => new Set(prev).add(problemNumber));
    setGradeErrors((prev) => ({ ...prev, [problemNumber]: null }));

    try {
      // mock 모드: API 호출 없이 로컬에서 채점 시뮬레이션
      if (isMock) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        return generateMockGrade(textAnswer);
      }

      const { data } = await axiosInstance.post<GradeResult>(
        `/essay/problem-sets/${problemSetId}/problems/${problemNumber}/grade`,
        { textAnswer, attemptCount },
      );
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : t('채점 중 오류가 발생했습니다.');
      setGradeErrors((prev) => ({ ...prev, [problemNumber]: message }));
      return null;
    } finally {
      setGradingSet((prev) => {
        const next = new Set(prev);
        next.delete(problemNumber);
        return next;
      });
    }
  };

  /** 특정 문제가 채점 중인지 확인 */
  const isQuestionGrading = (num: number) => gradingSet.has(num);

  /** 특정 문제의 채점 에러 조회 */
  const getGradeError = (num: number) => gradeErrors[num] ?? null;

  return { gradeEssayAnswer, isQuestionGrading, getGradeError };
}
