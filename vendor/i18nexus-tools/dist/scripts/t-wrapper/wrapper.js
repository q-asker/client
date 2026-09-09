"use strict";
/**
 * Adaptive Translation Wrapper
 *
 * 파일 개수에 따라 자동으로 최적 버전 선택:
 * - < 3000 파일: Babel (단일 스레드)
 * - >= 3000 파일: SWC + Workers (병렬 처리)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.wrapTranslations = wrapTranslations;
const glob_1 = require("glob");
const default_config_1 = require("../common/default-config");
const wrapper_1 = require("./babel/wrapper");
const wrapper_2 = require("./swc-worker/wrapper");
const FILE_COUNT_THRESHOLD = 3000;
async function wrapTranslations(config = {}) {
    const fullConfig = {
        ...default_config_1.SCRIPT_CONFIG_DEFAULTS,
        ...config,
    };
    // 1. 파일 개수 확인
    const filePaths = await (0, glob_1.glob)(fullConfig.sourcePattern);
    const fileCount = filePaths.length;
    // 2. 전략 선택
    const useWorkers = fileCount >= FILE_COUNT_THRESHOLD;
    const strategy = useWorkers ? "swc-worker" : "babel";
    console.log(`📁 Found ${fileCount} files`);
    console.log(`🎯 Strategy: ${strategy} ${useWorkers ? "(parallel processing)" : "(single-threaded)"}`);
    // 3. 선택된 전략으로 실행
    if (useWorkers) {
        const result = await (0, wrapper_2.wrapTranslations)(config);
        return {
            ...result,
            strategy: "swc-worker",
        };
    }
    else {
        const result = await (0, wrapper_1.wrapTranslations)(config);
        return {
            ...result,
            strategy: "babel",
        };
    }
}
