/**
 * quiz-history 디자인 변형 테스트용 mock 데이터.
 * URL에 ?mock=true 추가 시 실제 localStorage 없이도 이 데이터로 렌더링 가능.
 */

/** 퀴즈 기록 항목 (mock용 확장 타입) */
export interface MockQuizHistoryRecord {
  problemSetId: string;
  fileName: string;
  status: 'completed' | 'in-progress';
  quizLevel: string;
  score: number;
  questionCount: number;
  uploadedUrl: string;
  quizData: unknown[];
  createdAt: string;
  completedAt?: string;
  totalTime?: string;
  correctCount?: number;
  totalQuestions?: number;
}

/** 퀴즈 통계 (mock용) */
export interface MockQuizStats {
  totalQuizzes: number;
  completedQuizzes: number;
  averageScore: number;
  completionRate: number;
}

export const MOCK_QUIZ_HISTORY: MockQuizHistoryRecord[] = [
  {
    problemSetId: 'mock-001',
    fileName: 'CS 네트워크 기초.pdf',
    status: 'completed',
    quizLevel: '중급',
    score: 80,
    questionCount: 5,
    uploadedUrl: '',
    quizData: [],
    createdAt: '2026-03-12T09:30:00.000Z',
    completedAt: '2026-03-12T09:45:00.000Z',
    totalTime: '00:14:32',
    correctCount: 4,
    totalQuestions: 5,
  },
  {
    problemSetId: 'mock-002',
    fileName: '운영체제 프로세스 관리.pptx',
    status: 'completed',
    quizLevel: '고급',
    score: 60,
    questionCount: 10,
    uploadedUrl: '',
    quizData: [],
    createdAt: '2026-03-11T14:00:00.000Z',
    completedAt: '2026-03-11T14:30:00.000Z',
    totalTime: '00:28:15',
    correctCount: 6,
    totalQuestions: 10,
  },
  {
    problemSetId: 'mock-003',
    fileName: 'React Hooks 심화 가이드.docx',
    status: 'in-progress',
    quizLevel: '고급',
    score: 0,
    questionCount: 8,
    uploadedUrl: '',
    quizData: [],
    createdAt: '2026-03-11T10:00:00.000Z',
  },
  {
    problemSetId: 'mock-004',
    fileName: '자료구조와 알고리즘.pdf',
    status: 'completed',
    quizLevel: '초급',
    score: 100,
    questionCount: 5,
    uploadedUrl: '',
    quizData: [],
    createdAt: '2026-03-10T16:00:00.000Z',
    completedAt: '2026-03-10T16:10:00.000Z',
    totalTime: '00:08:45',
    correctCount: 5,
    totalQuestions: 5,
  },
  {
    problemSetId: 'mock-005',
    fileName: '데이터베이스 정규화 이론.pdf',
    status: 'in-progress',
    quizLevel: '중급',
    score: 0,
    questionCount: 7,
    uploadedUrl: '',
    quizData: [],
    createdAt: '2026-03-10T11:00:00.000Z',
  },
  {
    problemSetId: 'mock-006',
    fileName: 'TypeScript 제네릭 패턴.docx',
    status: 'completed',
    quizLevel: '중급',
    score: 90,
    questionCount: 10,
    uploadedUrl: '',
    quizData: [],
    createdAt: '2026-03-09T08:00:00.000Z',
    completedAt: '2026-03-09T08:25:00.000Z',
    totalTime: '00:22:10',
    correctCount: 9,
    totalQuestions: 10,
  },
];

/** mock 통계 데이터 */
export const MOCK_QUIZ_STATS: MockQuizStats = {
  totalQuizzes: 6,
  completedQuizzes: 4,
  averageScore: 82,
  completionRate: 67,
};
