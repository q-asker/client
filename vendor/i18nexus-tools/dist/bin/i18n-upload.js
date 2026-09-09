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
exports.uploadTranslations = uploadTranslations;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const google_sheets_1 = require("../scripts/google-sheets");
const config_loader_1 = require("../scripts/config-loader");
const DEFAULT_CONFIG = {
    credentialsPath: "./credentials.json",
    spreadsheetId: "",
    localesDir: "./locales",
    sheetName: "Translations",
    autoTranslate: false,
    force: false,
};
async function uploadTranslations(dir, config) {
    console.log("\n📤 Starting Google Sheets upload process...\n");
    // Validate configuration
    if (!config.spreadsheetId) {
        console.error("❌ Error: Spreadsheet ID is required");
        console.error("Please provide it via config file or --spreadsheet-id flag\n");
        process.exit(1);
    }
    // 모든 네임스페이스 자동 감지
    const namespaces = detectNamespaces(dir);
    if (namespaces.length === 0) {
        // 네임스페이스 미사용: default 시트로 업로드
        console.log("📝 No namespaces detected, uploading to 'default' sheet\n");
        const sheetsManager = new google_sheets_1.GoogleSheetsManager({
            credentialsPath: config.credentialsPath,
            spreadsheetId: config.spreadsheetId,
            sheetName: "default",
        });
        await sheetsManager.authenticate();
        await sheetsManager.uploadTranslations(dir, config.autoTranslate, config.force);
    }
    else {
        // 각 네임스페이스를 별도 시트로 업로드
        console.log(`📦 Detected ${namespaces.length} namespace(s): ${namespaces.join(", ")}\n`);
        for (const namespace of namespaces) {
            console.log(`📤 Uploading namespace '${namespace}' to sheet '${namespace}'...`);
            const sheetsManager = new google_sheets_1.GoogleSheetsManager({
                credentialsPath: config.credentialsPath,
                spreadsheetId: config.spreadsheetId,
                sheetName: namespace,
                namespace: namespace,
            });
            await sheetsManager.authenticate();
            await sheetsManager.ensureWorksheet();
            await sheetsManager.uploadTranslations(dir, config.autoTranslate, config.force);
            console.log(`✅ Completed upload for namespace '${namespace}'\n`);
        }
    }
}
/**
 * locales 디렉토리에서 모든 네임스페이스 감지
 * 네임스페이스 구조: locales/[namespace]/[lang].json
 * 레거시 구조: locales/[lang].json (빈 배열 반환)
 */
function detectNamespaces(localesDir) {
    if (!fs.existsSync(localesDir)) {
        return [];
    }
    const items = fs.readdirSync(localesDir);
    const namespaces = [];
    for (const item of items) {
        const itemPath = path.join(localesDir, item);
        const stat = fs.statSync(itemPath);
        // 디렉토리이고, 그 안에 JSON 파일이 있으면 네임스페이스로 간주
        if (stat.isDirectory() && item !== "types") {
            const files = fs.readdirSync(itemPath);
            const hasJsonFiles = files.some((file) => file.endsWith(".json"));
            if (hasJsonFiles) {
                namespaces.push(item);
            }
        }
    }
    return namespaces;
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
            case "--auto-translate":
            case "-a":
                config.autoTranslate = true;
                break;
            case "--force":
            case "-f":
                config.force = true;
                break;
            case "--help":
            case "-h":
                console.log(`
Usage: i18n-upload [options]

Upload translations from ALL namespace folders to Google Sheets automatically.
Each namespace folder becomes a sheet (e.g., locales/common/ → "common" sheet).

Options:
  -c, --credentials <path>     Path to Google Sheets credentials file (default: "./credentials.json")
  -s, --spreadsheet-id <id>    Google Spreadsheet ID (required)
  -l, --locales-dir <path>     Path to locales directory (default: "./locales")
  -a, --auto-translate         Enable auto-translation mode (English uses GOOGLETRANSLATE formula)
  -f, --force                  Force mode: Clear all existing data and re-upload everything
  -h, --help                   Show this help message

Examples:
  # Basic upload (text only, only new keys)
  i18n-upload -s "your-spreadsheet-id"
  
  # Auto-translate mode (Korean as text, English as GOOGLETRANSLATE formula)
  i18n-upload -s "your-spreadsheet-id" --auto-translate
  
  # Force mode: Clear and re-upload all translations
  i18n-upload -s "your-spreadsheet-id" --force
  
  # With custom paths
  i18n-upload -c "./my-creds.json" -s "your-spreadsheet-id" -l "./translations"

How it works:
  - Automatically detects all namespace folders in locales directory
  - Each namespace folder becomes a sheet (auto-creates if not exists)
  - locales/common/ → "common" sheet
  - locales/dashboard/ → "dashboard" sheet
  - No need to specify sheet names in config!
        `);
                process.exit(0);
                break;
        }
    }
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    uploadTranslations(finalConfig.localesDir, finalConfig).catch(console.error);
}
