/**
 * SWC + Worker Threads 기반 Translation Wrapper
 * - 병렬 처리로 성능 향상
 * - SWC 파서 사용
 */
import { ScriptConfig } from "../../common/default-config";
export declare function wrapTranslations(config?: Partial<ScriptConfig>): Promise<{
    processedFiles: string[];
    totalTime: number;
    stats: {
        totalFiles: number;
        modifiedFiles: number;
        skippedFiles: number;
        errorFiles: number;
        averageTimePerFile: number;
        workerStats: any;
    };
}>;
