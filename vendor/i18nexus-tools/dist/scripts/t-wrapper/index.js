#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const wrapper_1 = require("./wrapper");
const constants_1 = require("./common/utils/constants");
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
${constants_1.CLI_HELP.USAGE}
${constants_1.CLI_HELP.OPTIONS}

${constants_1.CLI_HELP.EXAMPLES}
        `);
                process.exit(0);
                break;
        }
    }
    (0, wrapper_1.wrapTranslations)(config)
        .then((result) => {
        const timeInSeconds = (result.totalTime / 1000).toFixed(2);
        console.log(`✅ Processed ${result.processedFiles.length} file(s) in ${timeInSeconds}s`);
    })
        .catch(console.error);
}
