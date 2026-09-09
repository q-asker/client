"use strict";
/**
 * 키 추출 로직
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
exports.extractTranslationKey = extractTranslationKey;
exports.createExtractedKey = createExtractedKey;
const t = __importStar(require("@babel/types"));
const pathLib = __importStar(require("path"));
const extractor_utils_1 = require("./extractor-utils");
const ITERABLE_CALLBACK_METHODS = new Set(["map", "forEach", "flatMap"]);
const DEFAULT_STATIC_KEY_CONTAINER_PATTERNS = [
    "^I18N_KEYS$",
    "_I18N_KEYS$",
    "^TRANSLATION_KEYS$",
    "_TRANSLATION_KEYS$",
    "^translationKeys$",
    "TranslationKeys$",
];
/**
 * t() 호출에서 번역 키 추출
 */
function extractTranslationKey(path, filePath, config) {
    const { node } = path;
    // t() 함수 호출 감지
    if (!(0, extractor_utils_1.isTFunction)(node.callee)) {
        return null;
    }
    const firstArg = node.arguments[0];
    if (!firstArg ||
        t.isArgumentPlaceholder(firstArg) ||
        t.isSpreadElement(firstArg)) {
        return null;
    }
    const keys = resolveStaticTranslationKeys(firstArg, path, createStaticKeyResolverOptions(config));
    if (!keys || keys.length === 0) {
        return null;
    }
    const extractedKeys = [...new Set(keys)].map((key) => createExtractedKey(key, node, filePath, config));
    return extractedKeys.length === 1 ? extractedKeys[0] : extractedKeys;
}
function resolveStaticTranslationKeys(expression, callPath, options, visitedBindings = new Set()) {
    const unwrapped = unwrapExpression(expression);
    // Case 1: t("문자열") - 직접 문자열
    if (t.isStringLiteral(unwrapped)) {
        return [unwrapped.value];
    }
    if (options.mode === "off") {
        return null;
    }
    // Case 2: const TITLE = "title"; t(TITLE)
    if (t.isIdentifier(unwrapped)) {
        return resolveIdentifierKeys(unwrapped, callPath, options, visitedBindings);
    }
    // Case 3: const KEYS = { title: "title" } as const; t(KEYS.title)
    if (t.isMemberExpression(unwrapped)) {
        return resolveMemberExpressionKeys(unwrapped, callPath, options, visitedBindings);
    }
    return null;
}
function resolveIdentifierKeys(identifier, callPath, options, visitedBindings) {
    const binding = callPath.scope.getBinding(identifier.name);
    if (!binding) {
        return null;
    }
    const callbackKeys = resolveIterableCallbackParamKeys(identifier, callPath, options, visitedBindings);
    if (callbackKeys) {
        return callbackKeys;
    }
    if (visitedBindings.has(identifier.name)) {
        return null;
    }
    const init = getConstBindingInit(identifier.name, callPath);
    if (!init) {
        return null;
    }
    visitedBindings.add(identifier.name);
    return resolveStaticTranslationKeys(init, callPath, options, visitedBindings);
}
function resolveIterableCallbackParamKeys(identifier, callPath, options, visitedBindings) {
    const binding = callPath.scope.getBinding(identifier.name);
    if (!binding || binding.kind !== "param") {
        return null;
    }
    const functionPath = binding.path.findParent((parentPath) => parentPath.isFunction());
    if (!functionPath?.isFunction()) {
        return null;
    }
    const paramIndex = functionPath.node.params.findIndex((param) => t.isIdentifier(param) && param.name === identifier.name);
    if (paramIndex !== 0) {
        return null;
    }
    const parentPath = functionPath.parentPath;
    if (!parentPath?.isCallExpression()) {
        return null;
    }
    const callbackIndex = parentPath.node.arguments.findIndex((argument) => argument === functionPath.node);
    if (callbackIndex !== 0) {
        return null;
    }
    const callee = parentPath.node.callee;
    if (!t.isMemberExpression(callee) ||
        !t.isIdentifier(callee.property) ||
        !ITERABLE_CALLBACK_METHODS.has(callee.property.name)) {
        return null;
    }
    const iterable = callee.object;
    if (!t.isExpression(iterable)) {
        return null;
    }
    if (!canResolveStructuredStaticKeys(iterable, callPath, options)) {
        return null;
    }
    return resolveStaticStringArray(iterable, callPath, options, visitedBindings);
}
function resolveMemberExpressionKeys(memberExpression, callPath, options, visitedBindings) {
    const propertyName = getStaticPropertyName(memberExpression.property, memberExpression.computed);
    if (!propertyName || !t.isExpression(memberExpression.object)) {
        return null;
    }
    if (!canResolveStructuredStaticKeys(memberExpression.object, callPath, options)) {
        return null;
    }
    const objectExpression = resolveStaticObjectExpression(memberExpression.object, callPath, options, visitedBindings);
    if (objectExpression) {
        const propertyValue = getObjectPropertyValue(objectExpression, propertyName);
        return propertyValue
            ? resolveStaticTranslationKeys(propertyValue, callPath, options, visitedBindings)
            : null;
    }
    const arrayValues = resolveStaticStringArray(memberExpression.object, callPath, options, visitedBindings);
    if (arrayValues && /^\d+$/.test(propertyName)) {
        const value = arrayValues[Number(propertyName)];
        return value ? [value] : null;
    }
    return null;
}
function resolveStaticStringArray(expression, callPath, options, visitedBindings) {
    const unwrapped = unwrapExpression(expression);
    if (t.isArrayExpression(unwrapped)) {
        const values = [];
        for (const element of unwrapped.elements) {
            if (!element || t.isSpreadElement(element)) {
                return null;
            }
            const resolved = resolveStaticTranslationKeys(element, callPath, options, visitedBindings);
            if (!resolved || resolved.length !== 1) {
                return null;
            }
            values.push(resolved[0]);
        }
        return values;
    }
    if (t.isIdentifier(unwrapped)) {
        if (visitedBindings.has(unwrapped.name)) {
            return null;
        }
        const init = getConstBindingInit(unwrapped.name, callPath);
        if (!init) {
            return null;
        }
        visitedBindings.add(unwrapped.name);
        return resolveStaticStringArray(init, callPath, options, visitedBindings);
    }
    return null;
}
function resolveStaticObjectExpression(expression, callPath, options, visitedBindings) {
    const unwrapped = unwrapExpression(expression);
    if (t.isObjectExpression(unwrapped)) {
        return unwrapped;
    }
    if (!t.isIdentifier(unwrapped) || visitedBindings.has(unwrapped.name)) {
        return null;
    }
    const init = getConstBindingInit(unwrapped.name, callPath);
    if (!init) {
        return null;
    }
    visitedBindings.add(unwrapped.name);
    return resolveStaticObjectExpression(init, callPath, options, visitedBindings);
}
function getConstBindingInit(bindingName, callPath) {
    const binding = callPath.scope.getBinding(bindingName);
    if (!binding || binding.kind !== "const" || !binding.constant) {
        return null;
    }
    const declaratorPath = binding.path.isVariableDeclarator()
        ? binding.path
        : binding.path.isIdentifier()
            ? binding.path.parentPath
            : null;
    if (!declaratorPath?.isVariableDeclarator()) {
        return null;
    }
    const init = declaratorPath.node.init;
    return init && t.isExpression(init) ? init : null;
}
function createStaticKeyResolverOptions(config) {
    const requestedMode = config?.staticKeyExtraction ?? "safe";
    const mode = isStaticKeyExtractionMode(requestedMode)
        ? requestedMode
        : "safe";
    return {
        mode,
        containerPatterns: compileStaticKeyContainerPatterns(config?.staticKeyContainerPatterns),
    };
}
function isStaticKeyExtractionMode(mode) {
    return mode === "off" || mode === "safe" || mode === "aggressive";
}
function compileStaticKeyContainerPatterns(patterns) {
    const patternSources = patterns && patterns.length > 0
        ? patterns
        : DEFAULT_STATIC_KEY_CONTAINER_PATTERNS;
    return patternSources.flatMap((pattern) => {
        try {
            return [new RegExp(pattern)];
        }
        catch {
            return [];
        }
    });
}
function canResolveStructuredStaticKeys(expression, callPath, options) {
    if (options.mode === "aggressive") {
        return true;
    }
    if (options.mode !== "safe") {
        return false;
    }
    const rootIdentifier = getRootIdentifier(expression);
    if (!rootIdentifier) {
        return false;
    }
    const binding = callPath.scope.getBinding(rootIdentifier.name);
    if (!binding || binding.kind !== "const" || !binding.constant) {
        return false;
    }
    return options.containerPatterns.some((pattern) => pattern.test(rootIdentifier.name));
}
function getRootIdentifier(expression) {
    const unwrapped = unwrapExpression(expression);
    if (t.isIdentifier(unwrapped)) {
        return unwrapped;
    }
    if (t.isMemberExpression(unwrapped) && t.isExpression(unwrapped.object)) {
        return getRootIdentifier(unwrapped.object);
    }
    return null;
}
function getObjectPropertyValue(objectExpression, propertyName) {
    const property = objectExpression.properties.find((prop) => {
        if (!t.isObjectProperty(prop)) {
            return false;
        }
        const keyName = getStaticPropertyName(prop.key, prop.computed);
        return keyName === propertyName;
    });
    if (!property ||
        !t.isObjectProperty(property) ||
        !t.isExpression(property.value)) {
        return null;
    }
    return property.value;
}
function getStaticPropertyName(property, computed) {
    if (t.isPrivateName(property)) {
        return null;
    }
    if (!computed && t.isIdentifier(property)) {
        return property.name;
    }
    if (t.isStringLiteral(property) || t.isNumericLiteral(property)) {
        return String(property.value);
    }
    return null;
}
function unwrapExpression(expression) {
    let current = expression;
    while (t.isTSAsExpression(current) ||
        t.isTSSatisfiesExpression(current) ||
        t.isTSTypeAssertion(current) ||
        t.isTSNonNullExpression(current) ||
        t.isParenthesizedExpression(current)) {
        current = current.expression;
    }
    return current;
}
/**
 * ExtractedKey 객체 생성
 */
function createExtractedKey(key, node, filePath, config) {
    const loc = node.loc;
    const extractedKey = {
        key,
        defaultValue: (0, extractor_utils_1.getDefaultValue)(node.arguments.filter((arg) => !t.isArgumentPlaceholder(arg) && !t.isSpreadElement(arg))),
    };
    if (config?.includeFilePaths) {
        extractedKey.filePath = pathLib.relative(process.cwd(), filePath);
    }
    if (config?.includeLineNumbers && loc) {
        extractedKey.lineNumber = loc.start.line;
        extractedKey.columnNumber = loc.start.column;
    }
    return extractedKey;
}
