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
const path = __importStar(require("path"));
const type_generator_1 = require("../scripts/extractor/type-generator");
const config_loader_1 = require("../scripts/config-loader");
/**
 * i18n-type: 타입 정의 파일 생성 전용 명령어
 *
 * locales 폴더의 JSON 파일들을 읽어서 TypeScript 타입 정의를 생성합니다.
 * Extractor와 독립적으로 실행 가능합니다.
 */
// CLI 실행 부분
if (require.main === module) {
    const args = process.argv.slice(2);
    // 도움말 처리
    if (args.includes("--help") || args.includes("-h")) {
        console.log(`
Usage: i18n-type [options]

Generate TypeScript type definitions from translation files.
This command reads JSON files from locales directory and generates type-safe definitions.

Options:
  -h, --help                   Show this help message

Examples:
  # Generate types from locales directory
  npx i18n-type

How it works:
  1. Reads all translation JSON files from locales directory
  2. Generates TypeScript type definitions in locales/types/i18nexus.d.ts
  3. Includes fallback namespace support (if configured)
  4. Provides type-safe translation keys for useTranslation() and getTranslation()

Config (i18nexus.config.json):
  {
    "localesDir": "./locales",
    "fallbackNamespace": "common",  // Keys from fallback namespace are included in all namespaces
    "translationImportSource": "i18nexus",
    "strictTypeGeneration": false,   // When true, fail if any key/value is missing
    "typesOutputPath": "./locales/types/i18nexus.d.ts"
  }

Output:
  - locales/types/i18nexus.d.ts  (TypeScript declaration file)

Note: Run this command after extracting translations or modifying JSON files.
    `);
        process.exit(0);
    }
    // 설정 로드
    const config = (0, config_loader_1.loadConfig)();
    console.log("📝 Generating TypeScript type definitions...\n");
    try {
        // 1. locales 디렉토리에서 번역 데이터 읽기
        const translations = (0, type_generator_1.readExtractedTranslations)(config.localesDir, {
            fallbackNamespace: config.fallbackNamespace || "common",
        });
        if (Object.keys(translations).length === 0) {
            console.warn("⚠️  No translation files found in locales directory");
            console.log(`   Locales directory: ${config.localesDir}`);
            process.exit(1);
        }
        // 2. 타입 정의 생성
        const outputPath = config.typesOutputPath ||
            path.join(config.localesDir, "types", "i18nexus.d.ts");
        (0, type_generator_1.generateTypeDefinitions)(translations, {
            outputPath,
            fallbackNamespace: config.fallbackNamespace,
            translationImportSource: config.translationImportSource || "i18nexus",
            includeJsDocs: true,
            strictValidation: config.strictTypeGeneration,
        });
        console.log("\n✅ Type definitions generated successfully!");
        console.log(`   Output: ${outputPath}`);
        if (config.fallbackNamespace) {
            console.log(`   Fallback namespace: "${config.fallbackNamespace}" (keys included in all namespaces)`);
        }
        if (config.strictTypeGeneration) {
            console.log(`   Strict validation: enabled (missing key/value will fail generation)`);
        }
    }
    catch (error) {
        console.error("❌ Failed to generate type definitions:", error);
        process.exit(1);
    }
}
