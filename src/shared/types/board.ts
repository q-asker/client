/** 게시판 카테고리 */
export type BoardCategory = 'INQUIRY' | 'UPDATE_LOG';

/** 게시글 목록 항목 */
export interface BoardPost {
  boardId: string;
  title: string;
  userName: string | null;
  createdAt: string;
  viewCount: number;
  status: 'ANSWERED' | 'CREATED' | null;
  category: BoardCategory;
}

/** 게시글 목록 응답 */
export interface BoardListResponse {
  posts: BoardPost[];
  totalPages: number;
  totalElements: number;
}

/** 게시글 상세 */
export interface BoardDetailPost {
  boardId: string;
  title: string;
  content: string;
  username: string;
  createdAt: string;
  viewCount: number;
  status: string | null;
  replies: string[] | null;
  isWriter: boolean;
  category: BoardCategory;
}
