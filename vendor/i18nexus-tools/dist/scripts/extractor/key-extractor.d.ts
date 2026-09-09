/**
 * 키 추출 로직
 */
import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
export interface ExtractedKey {
    key: string;
    defaultValue?: string;
    filePath?: string;
    lineNumber?: number;
    columnNumber?: number;
}
export type StaticKeyExtractionMode = "off" | "safe" | "aggressive";
export interface ExtractorConfig {
    includeFilePaths?: boolean;
    includeLineNumbers?: boolean;
    staticKeyExtraction?: StaticKeyExtractionMode;
    staticKeyContainerPatterns?: string[];
}
type ExtractedKeyResult = ExtractedKey | ExtractedKey[] | null;
/**
 * t() 호출에서 번역 키 추출
 */
export declare function extractTranslationKey(path: NodePath<t.CallExpression>, filePath: string, config?: ExtractorConfig): ExtractedKeyResult;
/**
 * ExtractedKey 객체 생성
 */
export declare function createExtractedKey(key: string, node: t.CallExpression, filePath: string, config?: ExtractorConfig): ExtractedKey;
export {};
