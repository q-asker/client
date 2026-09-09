"use strict";
/**
 * extractor 상수 정의
 * 모든 상수를 중앙화하고 Object.freeze로 불변성 보장
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OUTPUT_FORMATS = exports.CSV_CONSTANTS = exports.FILE_EXTENSIONS = exports.STRING_CONSTANTS = exports.CONSOLE_MESSAGES = void 0;
// Console 메시지 (에러만 출력)
exports.CONSOLE_MESSAGES = Object.freeze({
    PARSE_FAILED: (filePath) => `⚠️  Failed to parse ${filePath}:`,
    KEY_EXTRACTION_FAILED: "❌ Key extraction failed:",
    EXTRACTION_FAILED: "❌ Extraction failed:",
    NO_FILES_FOUND: (pattern) => `⚠️  No files found matching pattern: ${pattern}`,
    PARSE_EXISTING_FAILED: (filePath) => `⚠️  Failed to parse existing ${filePath}, will overwrite`,
});
// 문자열 상수
exports.STRING_CONSTANTS = Object.freeze({
    TRANSLATION_FUNCTION: "t",
    DEFAULT_VALUE: "defaultValue",
    CSV_HEADER: "Key,English,Korean",
    CSV_SEPARATOR: ",",
    CSV_NEWLINE: "\n",
    CSV_QUOTE: '"',
    CSV_QUOTE_ESCAPED: '""',
    JSON_EXTENSION: ".json",
    CSV_EXTENSION: ".csv",
    INDEX_FILE: "index.ts",
    DEFAULT_OUTPUT_FILE: "extracted-translations.json",
    DEFAULT_OUTPUT_DIR: "locales",
    DEFAULT_NAMESPACE: "",
    DEFAULT_LANG_KO: "ko",
    DEFAULT_LANG_EN: "en",
    EMPTY_STRING: "",
});
// 파일 확장자
exports.FILE_EXTENSIONS = Object.freeze({
    JSON: ".json",
    CSV: ".csv",
    TS: ".ts",
});
// CSV 관련 상수
exports.CSV_CONSTANTS = Object.freeze({
    HEADER: "Key,English,Korean",
    SEPARATOR: ",",
    NEWLINE: "\n",
    QUOTE: '"',
    QUOTE_ESCAPED: '""',
    SPECIAL_CHARS: [",", '"', "\n", "\r"],
});
// 출력 형식
exports.OUTPUT_FORMATS = Object.freeze({
    JSON: "json",
    CSV: "csv",
});
