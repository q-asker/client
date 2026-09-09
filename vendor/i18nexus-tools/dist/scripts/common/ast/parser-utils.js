"use strict";
/**
 * AST 파서 유틸리티
 * extractor와 wrapper에서 공통으로 사용
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BABEL_EXTENDED_PLUGINS = exports.BABEL_BASE_PLUGINS = void 0;
exports.parseWithBabel = parseWithBabel;
exports.parseFile = parseFile;
exports.generateWithBabel = generateWithBabel;
exports.generateCode = generateCode;
const parser_1 = require("@babel/parser");
const generator_1 = __importDefault(require("@babel/generator"));
/**
 * Babel 파서 기본 플러그인 목록
 */
exports.BABEL_BASE_PLUGINS = [
    "typescript",
    "jsx",
    "decorators-legacy",
    "classProperties",
    "objectRestSpread",
];
/**
 * Babel 파서 확장 플러그인 목록 (extractor용)
 */
exports.BABEL_EXTENDED_PLUGINS = [
    ...exports.BABEL_BASE_PLUGINS,
    "asyncGenerators",
    "functionBind",
    "exportDefaultFrom",
    "exportNamespaceFrom",
    "dynamicImport",
];
/**
 * Babel 파서로 코드 파싱
 */
function parseWithBabel(code, options = {}) {
    const plugins = options.extendedPlugins
        ? [...exports.BABEL_EXTENDED_PLUGINS]
        : [...exports.BABEL_BASE_PLUGINS];
    return (0, parser_1.parse)(code, {
        sourceType: options.sourceType || "module",
        plugins: plugins,
    });
}
/**
 * 코드 파싱 (Babel 사용)
 */
function parseFile(code, options = {}) {
    return parseWithBabel(code, options);
}
/**
 * Babel로 AST를 코드로 생성
 */
function generateWithBabel(ast, options = {}) {
    return (0, generator_1.default)(ast, {
        retainLines: options.retainLines !== false,
        comments: options.comments !== false,
        // Enable TypeScript support for type parameters
        decoratorsBeforeExport: true,
        // Prevent Unicode escape sequences for non-ASCII characters (e.g., Korean)
        jsescOption: {
            minimal: true,
        },
    });
}
/**
 * AST를 코드로 생성 (Babel 사용)
 */
function generateCode(ast, options = {}) {
    return generateWithBabel(ast, options);
}
