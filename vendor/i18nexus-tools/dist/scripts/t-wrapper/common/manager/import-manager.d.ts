/**
 * Import 및 디렉티브 관리 유틸리티
 */
import * as t from "@babel/types";
/** AST에 named import가 필요한지 확인하고 추가 */
export declare function ensureNamedImport(ast: t.File, source: string, importedName: string): boolean;
/**
 * AST에 여러 named import를 한 번에 추가
 *
 * @param ast - Babel AST
 * @param source - import source (e.g., "i18nexus")
 * @param importedNames - import할 이름들 (e.g., ["useTranslation", "useLanguageSwitcher"])
 */
export declare function ensureMultipleNamedImports(ast: t.File, source: string, importedNames: string[]): boolean;
/** AST에 "use client" 디렉티브가 필요한지 확인하고 추가 */
export declare function ensureUseClientDirective(ast: t.File): boolean;
