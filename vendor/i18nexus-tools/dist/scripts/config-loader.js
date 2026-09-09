#!/usr/bin/env node
"use strict";
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
exports.loadConfig = loadConfig;
exports.loadConfigSilently = loadConfigSilently;
const fs = __importStar(require("fs"));
const pathLib = __importStar(require("path"));
const default_config_1 = require("./common/default-config");
const DEFAULT_CONFIG = {
    languages: [...default_config_1.COMMON_DEFAULTS.languages],
    defaultLanguage: default_config_1.COMMON_DEFAULTS.defaultLanguage,
    sourceLanguage: default_config_1.COMMON_DEFAULTS.defaultLanguage,
    localesDir: default_config_1.COMMON_DEFAULTS.localesDir,
    sourcePattern: default_config_1.COMMON_DEFAULTS.sourcePattern,
    translationImportSource: default_config_1.COMMON_DEFAULTS.translationImportSource,
    mode: undefined,
    serverTranslationFunction: "getTranslation",
    googleSheets: {
        spreadsheetId: default_config_1.GOOGLE_SHEETS_DEFAULTS.spreadsheetId,
        credentialsPath: default_config_1.GOOGLE_SHEETS_DEFAULTS.credentialsPath,
        sheetName: default_config_1.GOOGLE_SHEETS_DEFAULTS.sheetName,
    },
    useNamespaceStructure: true,
    strictTypeGeneration: false,
    generateTypes: true,
    staticKeyExtraction: "safe",
};
function isHelpOrVersionCommand() {
    return process.argv.some((arg) => ["--help", "-h", "--version", "-v", "-V"].includes(arg));
}
/**
 * i18nexus.config.json 파일을 로드합니다.
 * 파일이 없으면 기본 설정을 반환합니다.
 */
function loadConfig(configPath = "i18nexus.config.json", options) {
    const absolutePath = pathLib.resolve(process.cwd(), configPath);
    const shouldLog = !options?.silent && !isHelpOrVersionCommand();
    if (!fs.existsSync(absolutePath)) {
        if (shouldLog) {
            console.log("⚠️  i18nexus.config.json not found, using default configuration");
            console.log("💡 Run 'i18n-sheets init' to create a config file");
        }
        return DEFAULT_CONFIG;
    }
    try {
        // JSON 파일 로드
        const fileContent = fs.readFileSync(absolutePath, "utf-8");
        const config = JSON.parse(fileContent);
        // namespaceLocation이 설정되어 있으면 namespacing.basePath로 변환
        let finalConfig = { ...config };
        if (config.namespaceLocation) {
            finalConfig.namespacing = {
                enabled: true,
                basePath: config.namespaceLocation,
                defaultNamespace: config.namespacing?.defaultNamespace || "common",
                framework: config.namespacing?.framework || "nextjs-app",
                ignorePatterns: config.namespacing?.ignorePatterns || [],
                ...config.namespacing,
            };
        }
        const mergedConfig = {
            ...DEFAULT_CONFIG,
            ...finalConfig,
            sourceLanguage: finalConfig.sourceLanguage ||
                finalConfig.defaultLanguage ||
                DEFAULT_CONFIG.sourceLanguage,
            googleSheets: {
                ...DEFAULT_CONFIG.googleSheets,
                ...(finalConfig.googleSheets || {}),
            },
        };
        // 기본값과 병합
        return mergedConfig;
    }
    catch (error) {
        if (shouldLog) {
            console.warn(`⚠️  Failed to load ${configPath}, using default configuration:`, error);
        }
        return DEFAULT_CONFIG;
    }
}
/**
 * i18nexus.config.json 파일을 조용히 로드합니다 (로그 출력 없음).
 * 서버 환경에서 사용하기 적합합니다.
 */
function loadConfigSilently(configPath = "i18nexus.config.json") {
    return loadConfig(configPath, { silent: true });
}
