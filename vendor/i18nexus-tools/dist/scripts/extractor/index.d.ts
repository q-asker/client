#!/usr/bin/env node
import { ExtractedKey, StaticKeyExtractionMode } from "./key-extractor";
import { NamespacingConfig } from "./namespace-inference";
export interface ExtractorConfig {
    sourcePattern?: string;
    outputFile?: string;
    outputDir?: string;
    namespace?: string;
    translationImportSource?: string;
    includeLineNumbers?: boolean;
    includeFilePaths?: boolean;
    sortKeys?: boolean;
    dryRun?: boolean;
    fallbackNamespace?: string;
    outputFormat?: "json" | "csv";
    languages?: string[];
    defaultLanguage?: string;
    sourceLanguage?: string;
    force?: boolean;
    useNamespaceStructure?: boolean;
    namespacing?: NamespacingConfig;
    skipValidation?: boolean;
    namespaceStrategy?: "full" | "page-based" | "single";
    generateTypes?: boolean;
    typesOutputPath?: string;
    strictTypeGeneration?: boolean;
    staticKeyExtraction?: StaticKeyExtractionMode;
    staticKeyContainerPatterns?: string[];
}
export type { ExtractedKey } from "./key-extractor";
export declare class TranslationExtractor {
    private config;
    private extractedKeys;
    private namespaceKeys;
    constructor(config?: Partial<ExtractorConfig>);
    private parseFile;
    private addExtractedKey;
    /**
     * 추출된 키 목록 반환 (clean-legacy에서 사용)
     */
    getExtractedKeys(): ExtractedKey[];
    /**
     * 키만 분석하고 파일은 쓰지 않음 (clean-legacy용)
     */
    extractKeysOnly(): Promise<ExtractedKey[]>;
    extract(): Promise<void>;
    private generateTypesIfEnabled;
    private getTypesOutputPath;
}
export declare function runTranslationExtractor(config?: Partial<ExtractorConfig>): Promise<void>;
