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
}

export interface HistoryDetailData {
  historyId: string;
  problemSetId: string;
  quizType: 'MULTIPLE' | 'BLANK' | 'OX';
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
