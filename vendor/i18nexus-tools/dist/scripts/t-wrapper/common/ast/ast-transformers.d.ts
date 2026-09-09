/**
 * AST 변환 로직
 * 문자열 리터럴, 템플릿 리터럴, JSX 텍스트를 t() 함수로 변환
 */
import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
export interface TransformResult {
    wasModified: boolean;
}
export interface TransformOptions {
    sourceLanguage?: string;
}
/**
 * 함수 body 내의 AST 노드들을 변환
 */
export declare function transformFunctionBody(path: NodePath<t.Function>, sourceCode: string, options?: TransformOptions): TransformResult;
