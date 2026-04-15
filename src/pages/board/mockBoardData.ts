/**
 * board 게시판 목록 mock 데이터.
 * URL에 ?mock=true 추가 시 실제 API 없이 이 데이터로 렌더링 가능.
 */

import type { BoardPost, BoardListResponse } from '../../shared/types/board';

/** @deprecated BoardPost 사용 권장 */
export type MockBoardPost = BoardPost;
/** @deprecated BoardListResponse 사용 권장 */
export type MockBoardListResponse = BoardListResponse;

export const MOCK_BOARD_POSTS: BoardPost[] = [
  {
    boardId: 'mock-bd-001',
    title: '퀴즈 생성 시 PDF 파일이 업로드되지 않습니다',
    userName: '김철수',
    createdAt: '2026-03-12T14:30:00.000Z',
    viewCount: 42,
    status: 'ANSWERED',
    category: 'INQUIRY',
  },
  {
    boardId: 'mock-bd-002',
    title: '영어 퀴즈 생성 시 한국어로 출제되는 문제',
    userName: '이영희',
    createdAt: '2026-03-12T10:15:00.000Z',
    viewCount: 28,
    status: 'CREATED',
    category: 'INQUIRY',
  },
  {
    boardId: 'mock-bd-003',
    title: '퀴즈 결과 페이지에서 점수가 표시되지 않아요',
    userName: '박지민',
    createdAt: '2026-03-11T16:45:00.000Z',
    viewCount: 15,
    status: 'ANSWERED',
    category: 'INQUIRY',
  },
  {
    boardId: 'mock-bd-004',
    title: '히스토리 삭제가 안 됩니다',
    userName: '최민수',
    createdAt: '2026-03-11T09:00:00.000Z',
    viewCount: 7,
    status: 'CREATED',
    category: 'INQUIRY',
  },
  {
    boardId: 'mock-bd-005',
    title: '모바일에서 퀴즈 풀기 화면이 깨져요',
    userName: '정수연',
    createdAt: '2026-03-10T20:30:00.000Z',
    viewCount: 53,
    status: 'ANSWERED',
    category: 'INQUIRY',
  },
  {
    boardId: 'mock-bd-006',
    title: 'PPT 파일 지원 문의드립니다',
    userName: '한지원',
    createdAt: '2026-03-10T11:00:00.000Z',
    viewCount: 19,
    status: 'CREATED',
    category: 'INQUIRY',
  },
];

export const MOCK_UPDATE_LOG_POSTS: BoardPost[] = [
  {
    boardId: 'mock-ul-001',
    title: '퀴즈 해설 페이지 UI 개선 및 레이아웃 최적화',
    userName: '운영팀',
    createdAt: '2026-03-13T09:00:00.000Z',
    viewCount: 128,
    status: null,
    category: 'UPDATE_LOG',
  },
  {
    boardId: 'mock-ul-002',
    title: '문의 게시판 답변 알림 기능 추가 및 이메일 발송',
    userName: '운영팀',
    createdAt: '2026-03-12T14:30:00.000Z',
    viewCount: 95,
    status: null,
    category: 'UPDATE_LOG',
  },
  {
    boardId: 'mock-ul-003',
    title: 'PDF 업로드 속도 최적화 및 파일 용량 압축',
    userName: '운영팀',
    createdAt: '2026-03-11T11:00:00.000Z',
    viewCount: 203,
    status: null,
    category: 'UPDATE_LOG',
  },
  {
    boardId: 'mock-ul-004',
    title: '퀴즈 기록 통계 차트 추가 및 분석 기능 개선',
    userName: '운영팀',
    createdAt: '2026-03-10T16:00:00.000Z',
    viewCount: 67,
    status: null,
    category: 'UPDATE_LOG',
  },
  {
    boardId: 'mock-ul-005',
    title: '다크 모드 지원 시작 (베타) 및 전체 테마 통일',
    userName: '운영팀',
    createdAt: '2026-03-09T10:00:00.000Z',
    viewCount: 312,
    status: null,
    category: 'UPDATE_LOG',
  },
  {
    boardId: 'mock-ul-006',
    title: 'Safari 대용량 PDF Range 분할 다운로드 최적화',
    userName: '운영팀',
    createdAt: '2026-03-08T15:00:00.000Z',
    viewCount: 41,
    status: null,
    category: 'UPDATE_LOG',
  },
];

/** mock 응답 데이터 */
export const MOCK_BOARD_RESPONSE: BoardListResponse = {
  posts: MOCK_BOARD_POSTS,
  totalPages: 2,
  totalElements: 16,
};

export const MOCK_UPDATE_LOG_RESPONSE: BoardListResponse = {
  posts: MOCK_UPDATE_LOG_POSTS,
  totalPages: 2,
  totalElements: 16,
};
