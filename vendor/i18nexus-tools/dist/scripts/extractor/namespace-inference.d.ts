/**
 * 네임스페이스 추론 및 검증 로직
 * ver2.md 기반 구현
 */
export interface NamespacingConfig {
    enabled: boolean;
    basePath: string;
    defaultNamespace: string;
    framework?: "nextjs-app" | "nextjs-pages" | "tanstack-file" | "tanstack-folder" | "react-router" | "remix" | "other";
    ignorePatterns?: string[];
    /**
     * 네임스페이스 추론 전략
     * - "first-folder": 첫 번째 폴더명만 사용 (기본값)
     *   예: gallery/folder/page.tsx → "gallery"
     * - "full-path": 전체 경로를 kebab-case로 변환
     *   예: gallery/folder/page.tsx → "gallery-folder"
     * - "last-folder": 마지막 폴더명 사용
     *   예: gallery/folder/page.tsx → "folder"
     */
    strategy?: "first-folder" | "full-path" | "last-folder";
}
/**
 * 파일 경로에서 네임스페이스 추론 (경로 기반만)
 */
export declare function inferNamespaceFromPath(filePath: string, config: NamespacingConfig): string;
/**
 * 파일에서 네임스페이스 추론 (우선순위 기반)
 * 1순위: useTranslation()에 명시된 네임스페이스
 * 2순위: 파일 경로 기반 추론
 */
export declare function inferNamespaceFromFile(filePath: string, code: string, config: NamespacingConfig): string;
/**
 * 기존 inferNamespace 함수 (하위 호환성)
 * @deprecated Use inferNamespaceFromFile or inferNamespaceFromPath instead
 */
export declare function inferNamespace(filePath: string, config: NamespacingConfig): string;
/**
 * 파일에서 useTranslation 훅 호출 찾기
 */
export declare function findUseTranslationCalls(filePath: string, code: string): Array<{
    namespace?: string;
    line: number;
}>;
/**
 * 네임스페이스 검증
 */
export declare function validateNamespace(filePath: string, code: string, expectedNamespace: string, config: NamespacingConfig): {
    valid: boolean;
    error?: string;
};
