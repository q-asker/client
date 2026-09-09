/**
 * Callsite inference utilities for automatic namespace detection
 * Uses Error.stack to determine which file called getTranslation()
 */
export interface I18nexusConfig {
    fallbackNamespace?: string;
    namespaceLocation?: string;
    namespacing?: {
        enabled: boolean;
        basePath: string;
        defaultNamespace: string;
        framework?: "nextjs-app" | "nextjs-pages" | "tanstack-file" | "tanstack-folder" | "react-router" | "remix" | "other";
        ignorePatterns?: string[];
        strategy?: "first-folder" | "full-path" | "last-folder";
    };
}
/**
 * Infer namespace from the call site using config
 */
export declare function inferNamespaceFromCallSite(config: I18nexusConfig | null): string | null;
/**
 * Helper function to extract namespace inference configuration
 */
export declare function getNamespaceInferenceConfig(config: I18nexusConfig | null): {
    enabled: boolean;
    basePath: string;
    defaultNamespace: string;
    framework?: "nextjs-app" | "nextjs-pages" | "tanstack-file" | "tanstack-folder" | "react-router" | "remix" | "other";
    ignorePatterns?: string[];
    strategy?: "first-folder" | "full-path" | "last-folder";
} | null;
//# sourceMappingURL=callsite-inference.d.ts.map