/**
 * AST 파서 유틸리티
 * extractor와 wrapper에서 공통으로 사용
 */
import * as t from "@babel/types";
export interface ParseOptions {
    sourceType?: "module" | "script";
    jsx?: boolean;
    tsx?: boolean;
    decorators?: boolean;
}
export interface GenerateOptions {
    retainLines?: boolean;
    comments?: boolean;
}
/**
 * Babel 파서 기본 플러그인 목록
 */
export declare const BABEL_BASE_PLUGINS: readonly ["typescript", "jsx", "decorators-legacy", "classProperties", "objectRestSpread"];
/**
 * Babel 파서 확장 플러그인 목록 (extractor용)
 */
export declare const BABEL_EXTENDED_PLUGINS: readonly ["typescript", "jsx", "decorators-legacy", "classProperties", "objectRestSpread", "asyncGenerators", "functionBind", "exportDefaultFrom", "exportNamespaceFrom", "dynamicImport"];
/**
 * Babel 파서로 코드 파싱
 */
export declare function parseWithBabel(code: string, options?: ParseOptions & {
    extendedPlugins?: boolean;
}): t.File;
/**
 * 코드 파싱 (Babel 사용)
 */
export declare function parseFile(code: string, options?: ParseOptions): t.File;
/**
 * Babel로 AST를 코드로 생성
 */
export declare function generateWithBabel(ast: t.File, options?: GenerateOptions): {
    code: string;
    map?: any;
};
/**
 * AST를 코드로 생성 (Babel 사용)
 */
export declare function generateCode(ast: t.File, options?: GenerateOptions): {
    code: string;
    map?: any;
};
