/**
 * t-wrapper 상수 정의
 * 모든 상수를 중앙화하고 Object.freeze로 불변성 보장
 */
export declare const CONSOLE_MESSAGES: Readonly<{
    readonly ERROR_PROCESSING: (filePath: string) => string;
    readonly FATAL_ERROR: "❌ Fatal error:";
}>;
export declare const CLI_OPTIONS: Readonly<{
    readonly PATTERN: "--pattern";
    readonly PATTERN_SHORT: "-p";
    readonly HELP: "--help";
    readonly HELP_SHORT: "-h";
}>;
export declare const CLI_HELP: Readonly<{
    readonly USAGE: "Usage: t-wrapper [options]";
    readonly OPTIONS: "Options:\n  -p, --pattern <pattern>    Source file pattern (default: \"src/**/*.{js,jsx,ts,tsx}\")\n  -h, --help                Show this help message";
    readonly EXAMPLES: "Examples:\n  t-wrapper\n  t-wrapper -p \"app/**/*.tsx\"";
}>;
export declare const STRING_CONSTANTS: Readonly<{
    readonly I18N_IGNORE: "i18n-ignore";
    readonly I18N_IGNORE_COMMENT: "// i18n-ignore";
    readonly I18N_IGNORE_BLOCK: "/* i18n-ignore";
    readonly I18N_IGNORE_JSX: "{/* i18n-ignore";
    readonly TRANSLATION_FUNCTION: "t";
    readonly USE_TRANSLATION: "useTranslation";
    readonly GET_SERVER_TRANSLATION: "getTranslation";
    readonly USE_CLIENT_DIRECTIVE: "use client";
    readonly COMPLETION_TITLE: "Translation Wrapper Completed";
    readonly DEFAULT_ENV: "production";
    readonly VARIABLE_KIND: "const";
    readonly EXPR_PREFIX: "expr";
    readonly INTERPOLATION_START: "{{";
    readonly INTERPOLATION_END: "}}";
    readonly MEMBER_SEPARATOR: "_";
}>;
export declare const REGEX_PATTERNS: Readonly<{
    readonly REACT_COMPONENT: RegExp;
    readonly REACT_HOOK: RegExp;
    readonly KOREAN_TEXT: RegExp;
}>;
