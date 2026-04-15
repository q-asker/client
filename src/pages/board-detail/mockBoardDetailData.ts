/**
 * board-detail 게시물 상세 mock 데이터.
 * URL에 ?mock=true 추가 시 실제 API 없이 이 데이터로 렌더링 가능.
 */

import type { BoardDetailPost } from '../../shared/types/board';

/** @deprecated BoardDetailPost 사용 권장 */
export type MockBoardDetailPost = BoardDetailPost;

export const MOCK_BOARD_DETAIL: BoardDetailPost = {
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
  category: 'INQUIRY',
};

export const MOCK_UPDATE_LOG_DETAIL: BoardDetailPost = {
  boardId: 'mock-ul-001',
  title: '퀴즈 해설 페이지 UI 개선 및 레이아웃 최적화',
  content:
    '안녕하세요, Q-Asker 팀입니다.\n\n이번 업데이트에서는 퀴즈 해설 페이지의 사용자 경험을 개선했습니다.\n\n## 주요 변경사항\n\n- 해설 텍스트의 가독성을 높이기 위해 줄 간격과 글꼴 크기를 조정했습니다.\n- 정답/오답 표시가 더 명확하게 구분되도록 색상과 아이콘을 개선했습니다.\n- 모바일 환경에서의 레이아웃이 최적화되어 작은 화면에서도 편하게 확인할 수 있습니다.\n\n## 개선 전후 비교\n\n- **이전**: 해설 텍스트가 좁은 영역에 밀집되어 가독성이 낮았음\n- **이후**: 충분한 여백과 시각적 구분으로 핵심 내용을 빠르게 파악 가능\n\n더 나은 서비스를 위해 노력하겠습니다.\n감사합니다.',
  username: '운영팀',
  createdAt: '2026-03-13T09:00:00.000Z',
  viewCount: 128,
  status: null,
  replies: null,
  isWriter: false,
  category: 'UPDATE_LOG',
};
