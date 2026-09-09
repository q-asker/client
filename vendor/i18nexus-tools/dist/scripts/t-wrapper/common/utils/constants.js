"use strict";
/**
 * t-wrapper 상수 정의
 * 모든 상수를 중앙화하고 Object.freeze로 불변성 보장
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.REGEX_PATTERNS = exports.STRING_CONSTANTS = exports.CLI_HELP = exports.CLI_OPTIONS = exports.CONSOLE_MESSAGES = void 0;
// Console 메시지 (에러만 출력)
exports.CONSOLE_MESSAGES = Object.freeze({
    ERROR_PROCESSING: (filePath) => `❌ Error processing ${filePath}:`,
    FATAL_ERROR: "❌ Fatal error:",
});
// CLI 옵션
exports.CLI_OPTIONS = Object.freeze({
    PATTERN: "--pattern",
    PATTERN_SHORT: "-p",
    HELP: "--help",
    HELP_SHORT: "-h",
});
// CLI Help 메시지
exports.CLI_HELP = Object.freeze({
    USAGE: `Usage: t-wrapper [options]`,
    OPTIONS: `Options:
  -p, --pattern <pattern>    Source file pattern (default: "src/**/*.{js,jsx,ts,tsx}")
  -h, --help                Show this help message`,
    EXAMPLES: `Examples:
  t-wrapper
  t-wrapper -p "app/**/*.tsx"`,
});
// 문자열 상수
exports.STRING_CONSTANTS = Object.freeze({
    I18N_IGNORE: "i18n-ignore",
    I18N_IGNORE_COMMENT: "// i18n-ignore",
    I18N_IGNORE_BLOCK: "/* i18n-ignore",
    I18N_IGNORE_JSX: "{/* i18n-ignore",
    TRANSLATION_FUNCTION: "t",
    USE_TRANSLATION: "useTranslation",
    GET_SERVER_TRANSLATION: "getTranslation",
    USE_CLIENT_DIRECTIVE: "use client",
    COMPLETION_TITLE: "Translation Wrapper Completed",
    DEFAULT_ENV: "production",
    VARIABLE_KIND: "const",
    EXPR_PREFIX: "expr",
    INTERPOLATION_START: "{{",
    INTERPOLATION_END: "}}",
    MEMBER_SEPARATOR: "_",
});
// 정규식 패턴
exports.REGEX_PATTERNS = Object.freeze({
    REACT_COMPONENT: /^[A-Z]/,
    REACT_HOOK: /^use[A-Z]/, // use로 시작하고 대문자로 이어지는 경우 (useState, useTranslation, useMyHook 등)
    // 참고: 커스텀 훅은 보통 JSX를 반환하지 않으므로 번역 대상이 아님
    // 하지만 use로 시작하는 모든 함수를 인식하려면 /^use/로 변경 가능
    KOREAN_TEXT: /[가-힣]/,
});
