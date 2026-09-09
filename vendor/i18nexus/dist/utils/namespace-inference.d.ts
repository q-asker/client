/**
 * Namespace inference from file path (simplified for core package)
 * This version doesn't require AST parsing dependencies
 */
export interface NamespacingConfig {
    enabled: boolean;
    basePath: string;
    defaultNamespace: string;
    framework?: "nextjs-app" | "nextjs-pages" | "tanstack-file" | "tanstack-folder" | "react-router" | "remix" | "other";
    ignorePatterns?: string[];
    strategy?: "first-folder" | "full-path" | "last-folder";
}
/**
 * Infer namespace from file path
 */
export declare function inferNamespaceFromPath(filePath: string, config: NamespacingConfig): string;
/**
 * Infer namespace from file (simplified version without AST parsing)
 * Uses path-based inference only
 */
export declare function inferNamespaceFromFile(filePath: string, code: string, config: NamespacingConfig): string;
//# sourceMappingURL=namespace-inference.d.ts.map