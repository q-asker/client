#!/usr/bin/env node
"use strict";
/**
 * i18n-wrapper-swc-worker CLI
 *
 * SWC + Worker Threads를 사용한 고성능 번역 래퍼
 * - 병렬 처리로 10-12배 성능 향상
 * - 멀티코어 CPU 활용
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.wrapTranslations = void 0;
const wrapper_1 = require("./wrapper");
Object.defineProperty(exports, "wrapTranslations", { enumerable: true, get: function () { return wrapper_1.wrapTranslations; } });
const constants_1 = require("../common/utils/constants");
// CLI 실행 부분
if (require.main === module) {
    const args = process.argv.slice(2);
    const config = {};
    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case constants_1.CLI_OPTIONS.PATTERN:
            case constants_1.CLI_OPTIONS.PATTERN_SHORT:
                config.sourcePattern = args[++i];
                break;
            case constants_1.CLI_OPTIONS.HELP:
            case constants_1.CLI_OPTIONS.HELP_SHORT:
                console.log(`
i18n-wrapper-swc-worker - High-Performance Translation Wrapper

${constants_1.CLI_HELP.USAGE}

${constants_1.CLI_HELP.OPTIONS}

Performance:
  - Uses SWC parser for fast parsing
  - Uses Worker Threads for parallel processing
  - Expected 10-12x performance improvement over standard version

${constants_1.CLI_HELP.EXAMPLES}

Note: This version uses Worker Threads and may consume more memory.
      Use standard i18n-wrapper for memory-constrained environments.
        `);
                process.exit(0);
                break;
        }
    }
    console.log("🚀 Starting i18n-wrapper-swc-worker...\n");
    (0, wrapper_1.wrapTranslations)(config)
        .then((result) => {
        const timeInSeconds = (result.totalTime / 1000).toFixed(2);
        console.log("\n✅ Processing complete!");
        console.log("═══════════════════════════════════════");
        console.log(`⏱️  Total time: ${timeInSeconds}s`);
        console.log(`📊 Total files: ${result.stats.totalFiles}`);
        console.log(`✏️  Modified: ${result.stats.modifiedFiles}`);
        console.log(`⏭️  Skipped: ${result.stats.skippedFiles}`);
        console.log(`❌ Errors: ${result.stats.errorFiles}`);
        console.log(`⚡ Average per file: ${result.stats.averageTimePerFile.toFixed(2)}ms`);
        console.log("═══════════════════════════════════════");
        console.log(`\n🔧 Workers: ${result.stats.workerStats.totalWorkers} | Completed: ${result.stats.workerStats.completedTasks} | Failed: ${result.stats.workerStats.failedTasks}`);
    })
        .catch((error) => {
        console.error("❌ Fatal error:", error);
        process.exit(1);
    });
}
