import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import { ScriptConfig } from "../../../common/default-config";
/**
 * AST에 번역 바인딩 및 import 추가
 * 파일 쓰기는 포함하지 않음 (테스트 용이성을 위해)
 *
 * @param ast - Babel AST
 * @param modifiedComponentPaths - 수정된 컴포넌트 경로들
 * @param config - 스크립트 설정
 * @param filePath - 파일 경로 (네임스페이스 추론용)
 * @param sourceCode - 소스 코드 (네임스페이스 추론용)
 */
export declare function applyTranslationsToAST(ast: t.File, modifiedComponentPaths: NodePath<t.Function>[], config: Required<ScriptConfig>, filePath?: string, sourceCode?: string): void;
/**
 * AST를 코드로 변환하여 파일에 쓰기
 */
export declare function writeASTToFile(ast: t.File, filePath: string, config: Required<ScriptConfig>): void;
