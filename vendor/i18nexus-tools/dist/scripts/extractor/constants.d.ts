/**
 * extractor 상수 정의
 * 모든 상수를 중앙화하고 Object.freeze로 불변성 보장
 */
export declare const CONSOLE_MESSAGES: Readonly<{
    readonly PARSE_FAILED: (filePath: string) => string;
    readonly KEY_EXTRACTION_FAILED: "❌ Key extraction failed:";
    readonly EXTRACTION_FAILED: "❌ Extraction failed:";
    readonly NO_FILES_FOUND: (pattern: string) => string;
    readonly PARSE_EXISTING_FAILED: (filePath: string) => string;
}>;
export declare const STRING_CONSTANTS: Readonly<{
    readonly TRANSLATION_FUNCTION: "t";
    readonly DEFAULT_VALUE: "defaultValue";
    readonly CSV_HEADER: "Key,English,Korean";
    readonly CSV_SEPARATOR: ",";
    readonly CSV_NEWLINE: "\n";
    readonly CSV_QUOTE: "\"";
    readonly CSV_QUOTE_ESCAPED: "\"\"";
    readonly JSON_EXTENSION: ".json";
    readonly CSV_EXTENSION: ".csv";
    readonly INDEX_FILE: "index.ts";
    readonly DEFAULT_OUTPUT_FILE: "extracted-translations.json";
    readonly DEFAULT_OUTPUT_DIR: "locales";
    readonly DEFAULT_NAMESPACE: "";
    readonly DEFAULT_LANG_KO: "ko";
    readonly DEFAULT_LANG_EN: "en";
    readonly EMPTY_STRING: "";
}>;
export declare const FILE_EXTENSIONS: Readonly<{
    readonly JSON: ".json";
    readonly CSV: ".csv";
    readonly TS: ".ts";
}>;
export declare const CSV_CONSTANTS: Readonly<{
    readonly HEADER: "Key,English,Korean";
    readonly SEPARATOR: ",";
    readonly NEWLINE: "\n";
    readonly QUOTE: "\"";
    readonly QUOTE_ESCAPED: "\"\"";
    readonly SPECIAL_CHARS: readonly [",", "\"", "\n", "\r"];
}>;
export declare const OUTPUT_FORMATS: Readonly<{
    readonly JSON: "json";
    readonly CSV: "csv";
}>;
