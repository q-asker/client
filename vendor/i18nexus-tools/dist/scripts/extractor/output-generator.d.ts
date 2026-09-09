/**
 * 출력 생성 로직
 */
import { ExtractedKey } from "./key-extractor";
export interface OutputConfig {
    sortKeys?: boolean;
    outputFormat?: "json" | "csv";
    languages?: string[];
    outputDir?: string;
    outputFile?: string;
    sourceLanguage?: string;
    force?: boolean;
    dryRun?: boolean;
}
/**
 * 출력 데이터 생성
 */
export declare function generateOutputData(keys: ExtractedKey[], config: OutputConfig): any;
/**
 * Google Sheets CSV 생성
 */
export declare function generateGoogleSheetsCSV(keys: ExtractedKey[], config?: OutputConfig): string;
/**
 * index.ts 파일 생성 (레거시 모드)
 */
export declare function generateIndexFile(languages: string[], outputDir: string, dryRun: boolean): void;
/**
 * 네임스페이스 모드용 index.ts 파일 생성
 * 모든 네임스페이스를 import하고 createI18n으로 i18n 객체 생성
 */
export declare function generateNamespaceIndexFile(namespaces: string[], languages: string[], outputDir: string, fallbackNamespace: string, dryRun: boolean, useI18nexusLibrary?: boolean, useGeneratedTypes?: boolean, typesOutputPath?: string): void;
/**
 * 네임스페이스별 출력 파일 작성 (도메인 우선 구조)
 */
export declare function writeOutputFileWithNamespace(data: any, config: OutputConfig & {
    namespace: string;
}): void;
/**
 * 출력 파일 작성 (레거시 모드)
 */
export declare function writeOutputFile(data: any, config: OutputConfig): void;
