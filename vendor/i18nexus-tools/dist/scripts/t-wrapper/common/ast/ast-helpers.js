"use strict";
/**
 * AST 헬퍼 함수들
 * 순수 함수로 구성되어 테스트하기 쉬움
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasIgnoreComment = hasIgnoreComment;
exports.shouldSkipPath = shouldSkipPath;
exports.isReactComponent = isReactComponent;
exports.isReactCustomHook = isReactCustomHook;
exports.hasTranslationFunctionCall = hasTranslationFunctionCall;
exports.createTranslationBinding = createTranslationBinding;
exports.extractNamespaceFromUseTranslation = extractNamespaceFromUseTranslation;
const t = __importStar(require("@babel/types"));
const constants_1 = require("../utils/constants");
/**
 * i18n-ignore 주석이 노드 바로 위에 있는지 확인
 * 파일의 원본 소스코드를 직접 검사하여 주석 감지
 */
function hasIgnoreComment(path, sourceCode) {
    const node = path.node;
    // 1. AST의 leadingComments 확인
    if (node.leadingComments) {
        const hasIgnore = node.leadingComments.some((comment) => comment.value.trim() === constants_1.STRING_CONSTANTS.I18N_IGNORE ||
            comment.value.trim().startsWith(constants_1.STRING_CONSTANTS.I18N_IGNORE));
        if (hasIgnore)
            return true;
    }
    // 2. 부모 노드의 leadingComments 확인
    if (path.parentPath?.node?.leadingComments) {
        const hasIgnore = path.parentPath.node.leadingComments.some((comment) => comment.value.trim() === constants_1.STRING_CONSTANTS.I18N_IGNORE ||
            comment.value.trim().startsWith(constants_1.STRING_CONSTANTS.I18N_IGNORE));
        if (hasIgnore)
            return true;
    }
    // 3. 소스코드 직접 검사 (node.loc가 있는 경우)
    if (sourceCode && node.loc) {
        const startLine = node.loc.start.line;
        const lines = sourceCode.split("\n");
        // 현재 라인과 바로 위 라인 검사
        for (let i = Math.max(0, startLine - 3); i < startLine; i++) {
            const line = lines[i];
            if (line &&
                (line.includes(constants_1.STRING_CONSTANTS.I18N_IGNORE) ||
                    line.includes(constants_1.STRING_CONSTANTS.I18N_IGNORE_COMMENT) ||
                    line.includes(constants_1.STRING_CONSTANTS.I18N_IGNORE_BLOCK) ||
                    line.includes(constants_1.STRING_CONSTANTS.I18N_IGNORE_JSX))) {
                return true;
            }
        }
    }
    return false;
}
/**
 * 문자열 리터럴 경로를 스킵해야 하는지 확인
 */
function shouldSkipPath(path, hasIgnoreCommentFn) {
    // i18n-ignore 주석이 있는 경우 스킵
    if (hasIgnoreCommentFn(path)) {
        return true;
    }
    // 부모 노드에 i18n-ignore 주석이 있는 경우도 스킵
    if (path.parent && hasIgnoreCommentFn(path.parentPath)) {
        return true;
    }
    // t() 함수로 이미 래핑된 경우 스킵
    if (t.isCallExpression(path.parent) &&
        t.isIdentifier(path.parent.callee, {
            name: constants_1.STRING_CONSTANTS.TRANSLATION_FUNCTION,
        })) {
        return true;
    }
    // import 구문은 스킵
    const importParent = path.findParent((p) => t.isImportDeclaration(p.node));
    if (importParent?.node && t.isImportDeclaration(importParent.node)) {
        return true;
    }
    // 객체 프로퍼티 KEY면 무조건 스킵
    if (t.isObjectProperty(path.parent) && path.parent.key === path.node) {
        return true;
    }
    return false;
}
/**
 * React 컴포넌트 이름인지 확인
 * 대문자로 시작하는 함수명 (예: Component, MyButton)
 */
function isReactComponent(name) {
    return constants_1.REGEX_PATTERNS.REACT_COMPONENT.test(name);
}
/**
 * React 커스텀 훅 이름인지 확인
 * use로 시작하고 대문자로 이어지는 함수명 (예: useMyHook, useToast)
 */
function isReactCustomHook(name) {
    return constants_1.REGEX_PATTERNS.REACT_HOOK.test(name);
}
/** 함수 본문(body)에 이미 번역 함수 호출이 있는지 확인 */
function hasTranslationFunctionCall(body, functionName) {
    if (!body.isBlockStatement()) {
        return false;
    }
    let hasCall = false;
    body.traverse({
        CallExpression: (p) => {
            if (t.isIdentifier(p.node.callee, {
                name: functionName,
            })) {
                hasCall = true;
            }
        },
    });
    return hasCall;
}
/**
 * 번역 함수 바인딩 생성 (공통 함수)
 * client 모드: const { t } = useTranslation("namespace")
 * server 모드: const { t } = await getTranslation("namespace")
 *
 * @param mode - "client" 또는 "server"
 * @param serverFnName - 서버 번역 함수명 (server 모드일 때만)
 * @param namespace - 네임스페이스 (옵션)
 */
function createTranslationBinding(mode, serverFnName, namespace) {
    const pattern = t.objectPattern([
        t.objectProperty(t.identifier(constants_1.STRING_CONSTANTS.TRANSLATION_FUNCTION), t.identifier(constants_1.STRING_CONSTANTS.TRANSLATION_FUNCTION), false, true),
    ]);
    let callExpression;
    const args = namespace ? [t.stringLiteral(namespace)] : [];
    if (mode === "server") {
        // 서버 모드: await getTranslation("namespace")
        const fnName = serverFnName || constants_1.STRING_CONSTANTS.GET_SERVER_TRANSLATION;
        callExpression = t.awaitExpression(t.callExpression(t.identifier(fnName), args));
    }
    else {
        // 클라이언트 모드: useTranslation("namespace")
        // 제네릭은 생략 - TypeScript가 인자로부터 자동 추론
        const callee = t.identifier(constants_1.STRING_CONSTANTS.USE_TRANSLATION);
        callExpression = t.callExpression(callee, args);
    }
    return t.variableDeclaration(constants_1.STRING_CONSTANTS.VARIABLE_KIND, [
        t.variableDeclarator(pattern, callExpression),
    ]);
}
/**
 * 기존 useTranslation 호출에서 네임스페이스 추출
 * @returns 네임스페이스 문자열 또는 undefined
 */
function extractNamespaceFromUseTranslation(body) {
    if (!body.isBlockStatement()) {
        return undefined;
    }
    let namespace;
    body.traverse({
        CallExpression: (p) => {
            if (t.isIdentifier(p.node.callee, {
                name: constants_1.STRING_CONSTANTS.USE_TRANSLATION,
            })) {
                // useTranslation("namespace") 형태에서 namespace 추출
                const firstArg = p.node.arguments[0];
                if (t.isStringLiteral(firstArg)) {
                    namespace = firstArg.value;
                    p.stop(); // 첫 번째 발견 시 종료
                }
            }
        },
    });
    return namespace;
}
