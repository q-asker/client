import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import type { ScriptConfig } from "../../../common/default-config";
/**
 * 컴포넌트나 커스텀 훅을 변환 시도
 * @returns 변환 성공 여부
 */
export declare function tryTransformComponent(path: NodePath<t.Function>, code: string, modifiedComponentPaths: NodePath<t.Function>[], config?: Pick<ScriptConfig, "sourceLanguage">): boolean;
