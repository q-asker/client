#!/usr/bin/env node
export interface CleanLegacyConfig {
    sourcePattern?: string;
    localesDir?: string;
    languages?: string[];
    dryRun?: boolean;
    backup?: boolean;
}
interface CleanStats {
    totalUsedInCode: number;
    totalKeysPerLanguage: Map<string, number>;
    keptKeys: number;
    removedUnused: number;
    removedInvalidValue: number;
    missingKeys: number;
}
interface CleanIssues {
    unusedKeys: string[];
    invalidValueKeys: string[];
    missingKeys: string[];
}
export declare class LegacyCleaner {
    private config;
    constructor(config?: Partial<CleanLegacyConfig>);
    /**
     * 백업 파일 생성
     */
    private createBackup;
    /**
     * JSON 파일 읽기
     */
    private readJsonFile;
    /**
     * JSON 파일 쓰기
     */
    private writeJsonFile;
    /**
     * 값이 유효한지 검사
     */
    private isValidValue;
    /**
     * 레거시 키 정리 실행
     */
    clean(): Promise<{
        stats: CleanStats;
        issues: CleanIssues;
    }>;
    /**
     * 결과 리포트 출력
     */
    printReport(stats: CleanStats, issues: CleanIssues): void;
}
export declare function runCleanLegacy(config?: Partial<CleanLegacyConfig>): Promise<void>;
export {};
