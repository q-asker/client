/**
 * board-detail 게시물 상세 디자인 변형 테스트용 mock 데이터.
 * URL에 ?mock=true 추가 시 실제 API 없이 이 데이터로 렌더링 가능.
 */

/** 게시글 상세 타입 (mock용) */
export interface MockBoardDetailPost {
  boardId: string;
  title: string;
  content: string;
  username: string;
  createdAt: string;
  viewCount: number;
  status: string;
  replies: string[];
  isWriter: boolean;
}

export const MOCK_BOARD_DETAIL: MockBoardDetailPost = {
  boardId: 'mock-bd-001',
  title: '퀴즈 생성 시 PDF 파일이 업로드되지 않습니다',
  content:
    '안녕하세요.\n\n퀴즈 생성 페이지에서 PDF 파일을 업로드하려고 하면 "지원하지 않는 파일 형식입니다"라는 오류가 발생합니다.\n\n파일 크기는 약 2MB이고 일반적인 PDF 파일입니다.\n\n브라우저는 Chrome 최신 버전을 사용하고 있습니다.\n\n확인 부탁드립니다. 감사합니다.',
  username: '김철수',
  createdAt: '2026-03-12T14:30:00.000Z',
  viewCount: 42,
  status: 'ANSWERED',
  replies: [
    '안녕하세요, Q-Asker 운영팀입니다.\n\n해당 문제는 PDF 파일의 인코딩 방식에 따라 발생할 수 있습니다. 파일을 다시 저장한 후 업로드해 주시겠어요?\n\n문제가 지속되면 support@q-asker.com으로 파일을 보내주시면 확인해 드리겠습니다.',
    '추가로, 다음 업데이트에서 더 많은 PDF 형식을 지원할 예정입니다. 불편을 드려 죄송합니다.',
  ],
  isWriter: true,
};
