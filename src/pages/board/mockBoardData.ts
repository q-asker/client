/**
 * board 게시판 목록 디자인 변형 테스트용 mock 데이터.
 * URL에 ?mock=true 추가 시 실제 API 없이 이 데이터로 렌더링 가능.
 */

/** 게시글 항목 타입 */
export interface MockBoardPost {
  boardId: string;
  title: string;
  userName: string;
  createdAt: string;
  viewCount: number;
  status: 'ANSWERED' | 'CREATED' | string;
}

/** 게시글 목록 응답 타입 */
export interface MockBoardListResponse {
  posts: MockBoardPost[];
  totalPages: number;
  totalElements: number;
}

export const MOCK_BOARD_POSTS: MockBoardPost[] = [
  {
    boardId: 'mock-bd-001',
    title: '퀴즈 생성 시 PDF 파일이 업로드되지 않습니다',
    userName: '김철수',
    createdAt: '2026-03-12T14:30:00.000Z',
    viewCount: 42,
    status: 'ANSWERED',
  },
  {
    boardId: 'mock-bd-002',
    title: '영어 퀴즈 생성 시 한국어로 출제되는 문제',
    userName: '이영희',
    createdAt: '2026-03-12T10:15:00.000Z',
    viewCount: 28,
    status: 'CREATED',
  },
  {
    boardId: 'mock-bd-003',
    title: '퀴즈 결과 페이지에서 점수가 표시되지 않아요',
    userName: '박지민',
    createdAt: '2026-03-11T16:45:00.000Z',
    viewCount: 15,
    status: 'ANSWERED',
  },
  {
    boardId: 'mock-bd-004',
    title: '히스토리 삭제가 안 됩니다',
    userName: '최민수',
    createdAt: '2026-03-11T09:00:00.000Z',
    viewCount: 7,
    status: 'CREATED',
  },
  {
    boardId: 'mock-bd-005',
    title: '모바일에서 퀴즈 풀기 화면이 깨져요',
    userName: '정수연',
    createdAt: '2026-03-10T20:30:00.000Z',
    viewCount: 53,
    status: 'ANSWERED',
  },
  {
    boardId: 'mock-bd-006',
    title: 'PPT 파일 지원 문의드립니다',
    userName: '한지원',
    createdAt: '2026-03-10T11:00:00.000Z',
    viewCount: 19,
    status: 'CREATED',
  },
];

/** mock 응답 데이터 */
export const MOCK_BOARD_RESPONSE: MockBoardListResponse = {
  posts: MOCK_BOARD_POSTS,
  totalPages: 2,
  totalElements: 16,
};
