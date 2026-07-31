import type { GradeResult } from '#features/quiz-generation';

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
  /** REAL_BLANK: 사용자가 입력한 원본 텍스트(U+001F 직렬화/raw). 선택형은 없음 */
  textAnswer?: string;
  /** REAL_BLANK: 대표정답(표시용, 다중은 ", " 결합). 선택형은 없음 */
  answer?: string;
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
