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
exports.downloadTranslations = downloadTranslations;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const google_sheets_1 = require("../scripts/google-sheets");
const config_loader_1 = require("../scripts/config-loader");
function generateIndexFile(localesDir, languages) {
    const indexPath = path.join(localesDir, "index.ts");
    // Import 문 생성
    const imports = languages
        .map((lang) => `import ${lang} from "./${lang}.json";`)
        .join("\n");
    // Export 객체 생성
    const exportObj = languages.map((lang) => `  ${lang}: ${lang},`).join("\n");
    const content = `${imports}

export const translations = {
${exportObj}
};
`;
    fs.writeFileSync(indexPath, content, "utf-8");
    console.log(`📝 Generated index file: ${indexPath}`);
}
const DEFAULT_CONFIG = {
    credentialsPath: "./credentials.json",
    spreadsheetId: "",
    localesDir: "./locales",
    sheetName: "Translations",
    languages: ["en", "ko"],
};
async function downloadTranslations(config = {}, options = {}) {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    try {
        console.log("📥 Starting translation download from Google Sheets...");
        // 설정 유효성 검사
        if (!finalConfig.spreadsheetId) {
            console.error("❌ Spreadsheet ID is required");
            process.exit(1);
        }
        if (!fs.existsSync(finalConfig.credentialsPath)) {
            console.error(`❌ Credentials file not found: ${finalConfig.credentialsPath}`);
            process.exit(1);
        }
        // Google Sheets Manager 초기화
        const sheetsManager = new google_sheets_1.GoogleSheetsManager({
            credentialsPath: finalConfig.credentialsPath,
            spreadsheetId: finalConfig.spreadsheetId,
            sheetName: finalConfig.sheetName,
        });
        // 인증
        await sheetsManager.authenticate();
        // 모든 시트 자동 다운로드 (sheetName 무시)
        console.log("📥 Downloading all sheets automatically...");
        await sheetsManager.downloadAllSheets(finalConfig.localesDir, finalConfig.languages);
        // Note: 이전에는 단일 시트만 다운로드했지만, 이제는 모든 시트를 자동으로 다운로드합니다.
        // force 옵션은 개별 시트 다운로드 시 적용되며, 각 시트는 locales/[namespace]/ 폴더에 저장됩니다.
        // index.tsx 생성 (선택사항)
        // generateIndexFile(finalConfig.localesDir, finalConfig.languages);
        console.log("✅ Translation download completed successfully");
    }
    catch (error) {
        console.error("❌ Download failed:", error);
        process.exit(1);
    }
}
// CLI 실행 부분
if (require.main === module) {
    // i18nexus.config.json에서 설정 로드
    const userConfig = (0, config_loader_1.loadConfig)();
    const args = process.argv.slice(2);
    const config = {
        // config 파일에서 Google Sheets 설정 가져오기
        credentialsPath: userConfig.googleSheets?.credentialsPath,
        spreadsheetId: userConfig.googleSheets?.spreadsheetId,
        localesDir: userConfig.localesDir,
        sheetName: userConfig.googleSheets?.sheetName,
        languages: userConfig.languages,
    };
    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case "--credentials":
            case "-c":
                config.credentialsPath = args[++i];
                break;
            case "--spreadsheet-id":
            case "-s":
                config.spreadsheetId = args[++i];
                break;
            case "--locales-dir":
            case "-l":
                config.localesDir = args[++i];
                break;
            case "--sheet-name":
            case "-n":
                config.sheetName = args[++i];
                break;
            case "--languages":
                config.languages = args[++i].split(",");
                break;
            case "--help":
            case "-h":
                console.log(`
Usage: i18n-download [options]

Download translations from ALL sheets in Google Spreadsheet automatically.
Each sheet becomes a namespace folder (e.g., "common" sheet → locales/common/).

Options:
  -c, --credentials <path>     Path to Google Sheets credentials file (default: "./credentials.json")
  -s, --spreadsheet-id <id>    Google Spreadsheet ID (required)
  -l, --locales-dir <path>     Path to locales directory (default: "./locales")
  --languages <langs>          Comma-separated list of languages (default: "en,ko")
  -h, --help                   Show this help message

Examples:
  i18n-download -s "your-spreadsheet-id"
  i18n-download -c "./my-creds.json" -s "your-spreadsheet-id" -l "./translations"
  i18n-download -s "your-spreadsheet-id" --languages "en,ko,ja"

How it works:
  - Automatically detects all sheets in the spreadsheet
  - Each sheet name becomes a namespace (folder)
  - "common" sheet → locales/common/en.json, locales/common/ko.json
  - "dashboard" sheet → locales/dashboard/en.json, locales/dashboard/ko.json
  - No need to specify sheet names in config!
        `);
                process.exit(0);
                break;
        }
    }
    downloadTranslations(config).catch(console.error);
}
