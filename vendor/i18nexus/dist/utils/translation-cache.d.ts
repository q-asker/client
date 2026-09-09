/**
 * Translation caching system for performance optimization
 * Caches loaded translations to reduce file I/O operations
 */
/**
 * Get cached translations if they exist and are still valid
 */
export declare function getCachedTranslations(namespace: string, language: string): Record<string, Record<string, string>> | null;
/**
 * Store translations in cache
 */
export declare function cacheTranslations(namespace: string, language: string, translations: Record<string, Record<string, string>>): void;
/**
 * Invalidate cache for specific namespace/language or clear all
 */
export declare function invalidateCache(namespace?: string, language?: string): void;
/**
 * Get cache statistics for debugging
 */
export declare function getCacheStats(): {
    totalEntries: number;
    validEntries: number;
    expiredEntries: number;
    cacheSize: number;
    entries: {
        namespace: string;
        language: string;
        age: number;
        isExpired: boolean;
    }[];
};
/**
 * Clean up expired cache entries
 */
export declare function cleanupExpiredCache(): void;
//# sourceMappingURL=translation-cache.d.ts.map