import type { GradeResult, AcceptedAnswer } from '#features/quiz-generation';

// ── 선택형 ──

export interface Selection {
  id: number;
  content: string;
  correct: boolean;
}

export interface Problem {
  number: number;
  title: string;
  userAnswer: number;
  correct: boolean;
  inReview: boolean;
  selections: Selection[];
  /** REAL_BLANK 한정: 사용자가 직접 입력한 원본 텍스트(다중 빈칸은 U+001F 직렬화). */
  textAnswer?: string | null;
  /** REAL_BLANK 한정: 빈칸 index 순서의 허용답안. null=구문항/비REAL_BLANK. */
  acceptedAnswers?: AcceptedAnswer[] | null;
}

export interface HistoryDetailData {
  historyId: string;
  problemSetId: string;
  quizType: 'MULTIPLE' | 'BLANK' | 'OX' | 'REAL_BLANK';
  totalCount: number;
  score: number;
  totalTime: string;
  takenAt: string;
  problems: Problem[];
}

// ── 에세이 ──

export interface EssayProblem {
  number: number;
  title: string;
  textAnswer: string | null;
  inReview: boolean;
  selections: { id: number; content: string }[];
  gradeResult: GradeResult | null;
}

export interface EssayHistoryDetailData {
  problemSetId: string;
  quizType: 'ESSAY';
  totalCount: number;
  totalTime: string;
  takenAt: string;
  problems: EssayProblem[];
}
