/**
 * Adaptive Translation Wrapper
 *
 * 파일 개수에 따라 자동으로 최적 버전 선택:
 * - < 3000 파일: Babel (단일 스레드)
 * - >= 3000 파일: SWC + Workers (병렬 처리)
 */
import { ScriptConfig } from "../common/default-config";
export declare function wrapTranslations(config?: Partial<ScriptConfig>): Promise<{
    processedFiles: string[];
    totalTime: number;
    stats?: any;
    strategy?: "babel" | "swc-worker";
}>;
