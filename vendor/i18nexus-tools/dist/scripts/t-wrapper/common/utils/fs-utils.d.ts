/**
 * 파일 시스템 유틸리티 함수
 */
/**
 * 파일에 내용을 작성
 */
export declare function writeFile(filePath: string, content: string): void;
/**
 * 파일 내용을 읽기
 */
export declare function readFile(filePath: string): string;
/**
 * 임시 디렉토리 생성 (테스트용)
 */
export declare function createTempDir(prefix: string): string;
/**
 * 디렉토리 삭제 (테스트용)
 */
export declare function removeDir(dirPath: string): void;
