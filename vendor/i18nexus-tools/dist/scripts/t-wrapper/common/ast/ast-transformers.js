"use strict";
/**
 * AST 변환 로직
 * 문자열 리터럴, 템플릿 리터럴, JSX 텍스트를 t() 함수로 변환
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
exports.transformFunctionBody = transformFunctionBody;
const t = __importStar(require("@babel/types"));
const ast_helpers_1 = require("./ast-helpers");
const constants_1 = require("../utils/constants");
const TRANSLATABLE_JSX_ATTRIBUTES = new Set([
    "alt",
    "aria-description",
    "aria-label",
    "aria-roledescription",
    "label",
    "placeholder",
    "title",
]);
function getSourceLanguage(options) {
    return options?.sourceLanguage || "ko";
}
function hasEnglishText(value) {
    return /[A-Za-z]/.test(value);
}
function hasKoreanText(value) {
    return constants_1.REGEX_PATTERNS.KOREAN_TEXT.test(value);
}
function isEnglishSourceLanguage(sourceLanguage) {
    return sourceLanguage === "en" || sourceLanguage === "auto";
}
function isKoreanSourceLanguage(sourceLanguage) {
    return sourceLanguage === "ko" || sourceLanguage === "auto";
}
function getJsxAttributeName(attribute) {
    if (t.isJSXIdentifier(attribute.name)) {
        return attribute.name.name;
    }
    if (t.isJSXNamespacedName(attribute.name)) {
        return `${attribute.name.namespace.name}:${attribute.name.name.name}`;
    }
    return null;
}
function isTranslatableJsxAttribute(path) {
    if (!t.isJSXAttribute(path.parent)) {
        return false;
    }
    const attributeName = getJsxAttributeName(path.parent);
    return attributeName ? TRANSLATABLE_JSX_ATTRIBUTES.has(attributeName) : false;
}
function isUiStringLiteralPath(path) {
    return (isTranslatableJsxAttribute(path) || t.isJSXExpressionContainer(path.parent));
}
function shouldWrapText(value, options) {
    const sourceLanguage = getSourceLanguage(options);
    return ((isKoreanSourceLanguage(sourceLanguage) && hasKoreanText(value)) ||
        (isEnglishSourceLanguage(sourceLanguage) && hasEnglishText(value)));
}
function shouldWrapStringLiteral(path, options) {
    const value = path.node.value;
    const sourceLanguage = getSourceLanguage(options);
    if (isKoreanSourceLanguage(sourceLanguage) && hasKoreanText(value)) {
        return true;
    }
    return (isEnglishSourceLanguage(sourceLanguage) &&
        hasEnglishText(value) &&
        isUiStringLiteralPath(path));
}
function shouldWrapTemplateLiteral(path, options) {
    const sourceLanguage = getSourceLanguage(options);
    const rawText = path.node.quasis.map((quasi) => quasi.value.raw).join("");
    if (isKoreanSourceLanguage(sourceLanguage) && hasKoreanText(rawText)) {
        return true;
    }
    return (isEnglishSourceLanguage(sourceLanguage) &&
        hasEnglishText(rawText) &&
        t.isJSXExpressionContainer(path.parent));
}
/**
 * 함수 body 내의 AST 노드들을 변환
 */
function transformFunctionBody(path, sourceCode, options = {}) {
    let wasModified = false;
    path.traverse({
        StringLiteral: (subPath) => {
            if ((0, ast_helpers_1.shouldSkipPath)(subPath, ast_helpers_1.hasIgnoreComment) ||
                (0, ast_helpers_1.hasIgnoreComment)(subPath, sourceCode)) {
                return;
            }
            // 빈 문자열이나 공백만 있는 문자열은 스킵
            const trimmedValue = subPath.node.value.trim();
            if (!trimmedValue) {
                return;
            }
            if (shouldWrapStringLiteral(subPath, options)) {
                wasModified = true;
                const replacement = t.callExpression(t.identifier(constants_1.STRING_CONSTANTS.TRANSLATION_FUNCTION), [t.stringLiteral(subPath.node.value)]);
                if (t.isJSXAttribute(subPath.parent)) {
                    subPath.replaceWith(t.jsxExpressionContainer(replacement));
                }
                else {
                    subPath.replaceWith(replacement);
                }
            }
        },
        TemplateLiteral: (subPath) => {
            // i18n-ignore 주석이 있는 경우 스킵
            if ((0, ast_helpers_1.shouldSkipPath)(subPath, ast_helpers_1.hasIgnoreComment) ||
                (0, ast_helpers_1.hasIgnoreComment)(subPath, sourceCode)) {
                return;
            }
            // 이미 t()로 래핑된 경우 스킵
            if (t.isCallExpression(subPath.parent) &&
                t.isIdentifier(subPath.parent.callee, {
                    name: constants_1.STRING_CONSTANTS.TRANSLATION_FUNCTION,
                })) {
                return;
            }
            if (!shouldWrapTemplateLiteral(subPath, options)) {
                return;
            }
            // 템플릿 리터럴을 i18next interpolation 형식으로 변환
            // 예: `안녕 ${name}` → t(`안녕 {{name}}`, { name })
            wasModified = true;
            const templateNode = subPath.node;
            const expressions = templateNode.expressions;
            const quasis = templateNode.quasis;
            // 표현식이 없으면 단순 문자열로 처리
            if (expressions.length === 0) {
                const replacement = t.callExpression(t.identifier(constants_1.STRING_CONSTANTS.TRANSLATION_FUNCTION), [t.stringLiteral(quasis[0].value.raw)]);
                subPath.replaceWith(replacement);
                return;
            }
            // i18next 형식으로 변환: `안녕 ${name}` → `안녕 {{name}}`
            let i18nextString = "";
            const interpolationVars = [];
            quasis.forEach((quasi, index) => {
                i18nextString += quasi.value.raw;
                if (index < expressions.length) {
                    const expr = expressions[index];
                    // 변수명 추출
                    let varName;
                    if (t.isIdentifier(expr)) {
                        varName = expr.name;
                    }
                    else if (t.isMemberExpression(expr)) {
                        // user.name → user_name
                        // 간단한 멤버 표현식은 직접 변환
                        const parts = [];
                        let current = expr;
                        while (t.isMemberExpression(current)) {
                            if (t.isIdentifier(current.property)) {
                                parts.unshift(current.property.name);
                            }
                            current = current.object;
                        }
                        if (t.isIdentifier(current)) {
                            parts.unshift(current.name);
                        }
                        varName = parts.join(constants_1.STRING_CONSTANTS.MEMBER_SEPARATOR);
                    }
                    else {
                        // 복잡한 표현식은 expr0, expr1 등으로 처리
                        varName = `${constants_1.STRING_CONSTANTS.EXPR_PREFIX}${index}`;
                    }
                    // i18next 형식: {{varName}}
                    i18nextString += `${constants_1.STRING_CONSTANTS.INTERPOLATION_START}${varName}${constants_1.STRING_CONSTANTS.INTERPOLATION_END}`;
                    // interpolation 객체에 추가
                    interpolationVars.push(t.objectProperty(t.identifier(varName), expr));
                }
            });
            // t("안녕 {{name}}", { name: name })
            const args = [
                t.stringLiteral(i18nextString),
            ];
            // interpolation 객체가 있으면 두 번째 인자로 추가
            if (interpolationVars.length > 0) {
                args.push(t.objectExpression(interpolationVars));
            }
            const replacement = t.callExpression(t.identifier(constants_1.STRING_CONSTANTS.TRANSLATION_FUNCTION), args);
            subPath.replaceWith(replacement);
        },
        JSXText: (subPath) => {
            // i18n-ignore 주석이 있는 경우 스킵
            if ((0, ast_helpers_1.hasIgnoreComment)(subPath, sourceCode)) {
                return;
            }
            const text = subPath.node.value.trim();
            // 빈 텍스트나 공백만 있는 경우 스킵
            if (!text) {
                return;
            }
            if (shouldWrapText(text, options)) {
                wasModified = true;
                // t() 함수 호출로 감싸기
                const replacement = t.jsxExpressionContainer(t.callExpression(t.identifier(constants_1.STRING_CONSTANTS.TRANSLATION_FUNCTION), [t.stringLiteral(text)]));
                subPath.replaceWith(replacement);
            }
        },
    });
    return { wasModified };
}
