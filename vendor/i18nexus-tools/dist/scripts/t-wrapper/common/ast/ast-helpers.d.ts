/**
 * AST 헬퍼 함수들
 * 순수 함수로 구성되어 테스트하기 쉬움
 */
import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
/**
 * i18n-ignore 주석이 노드 바로 위에 있는지 확인
 * 파일의 원본 소스코드를 직접 검사하여 주석 감지
 */
export declare function hasIgnoreComment(path: NodePath, sourceCode?: string): boolean;
/**
 * 문자열 리터럴 경로를 스킵해야 하는지 확인
 */
export declare function shouldSkipPath(path: NodePath<t.StringLiteral>, hasIgnoreCommentFn: (path: NodePath, sourceCode?: string) => boolean): boolean;
/**
 * React 컴포넌트 이름인지 확인
 * 대문자로 시작하는 함수명 (예: Component, MyButton)
 */
export declare function isReactComponent(name: string): boolean;
/**
 * React 커스텀 훅 이름인지 확인
 * use로 시작하고 대문자로 이어지는 함수명 (예: useMyHook, useToast)
 */
export declare function isReactCustomHook(name: string): boolean;
/** 함수 본문(body)에 이미 번역 함수 호출이 있는지 확인 */
export declare function hasTranslationFunctionCall(body: NodePath<t.BlockStatement | t.Expression>, functionName: string): boolean;
/**
 * 번역 함수 바인딩 생성 (공통 함수)
 * client 모드: const { t } = useTranslation("namespace")
 * server 모드: const { t } = await getTranslation("namespace")
 *
 * @param mode - "client" 또는 "server"
 * @param serverFnName - 서버 번역 함수명 (server 모드일 때만)
 * @param namespace - 네임스페이스 (옵션)
 */
export declare function createTranslationBinding(mode: "client" | "server", serverFnName?: string, namespace?: string): t.VariableDeclaration;
/**
 * 기존 useTranslation 호출에서 네임스페이스 추출
 * @returns 네임스페이스 문자열 또는 undefined
 */
export declare function extractNamespaceFromUseTranslation(body: NodePath<t.BlockStatement | t.Expression>): string | undefined;
