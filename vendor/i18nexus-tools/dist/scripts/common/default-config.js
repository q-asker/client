"use strict";
/**
 * 중앙화된 기본 설정 값들
 * 모든 설정 파일에서 공통으로 사용되는 기본값을 정의합니다.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SCRIPT_CONFIG_DEFAULTS = exports.WRAPPER_DEFAULTS = exports.PARSER_DEFAULTS = exports.PERFORMANCE_MONITORING_DEFAULTS = exports.GOOGLE_SHEETS_DEFAULTS = exports.COMMON_DEFAULTS = void 0;
/**
 * 공통 기본 설정 값
 */
exports.COMMON_DEFAULTS = {
    sourcePattern: "src/**/*.{js,jsx,ts,tsx}",
    translationImportSource: "i18nexus",
    languages: ["en", "ko"],
    defaultLanguage: "ko",
    localesDir: "./locales",
    fallbackNamespace: "common",
};
/**
 * Google Sheets 기본 설정
 */
exports.GOOGLE_SHEETS_DEFAULTS = {
    spreadsheetId: "",
    credentialsPath: "./credentials.json",
    sheetName: "Translations",
};
/**
 * 성능 모니터링 기본 설정
 */
exports.PERFORMANCE_MONITORING_DEFAULTS = {
    enablePerformanceMonitoring: process.env.I18N_PERF_MONITOR !== "false",
};
/**
 * 파서 기본 설정
 */
exports.PARSER_DEFAULTS = {
    parserType: "babel",
};
/**
 * Wrapper 기본 설정
 */
exports.WRAPPER_DEFAULTS = {
    enablePerformanceMonitoring: exports.PERFORMANCE_MONITORING_DEFAULTS.enablePerformanceMonitoring,
    parserType: exports.PARSER_DEFAULTS.parserType,
};
/**
 * ScriptConfig의 완전한 기본 설정 (중앙화)
 */
exports.SCRIPT_CONFIG_DEFAULTS = {
    sourcePattern: exports.COMMON_DEFAULTS.sourcePattern,
    translationImportSource: exports.COMMON_DEFAULTS.translationImportSource,
    sourceLanguage: exports.COMMON_DEFAULTS.defaultLanguage,
    serverTranslationFunction: "getTranslation",
    mode: undefined,
    framework: undefined,
    enablePerformanceMonitoring: exports.WRAPPER_DEFAULTS.enablePerformanceMonitoring,
    parserType: exports.WRAPPER_DEFAULTS.parserType,
};
