import { ScriptConfig } from "../../common/default-config";
export declare function wrapTranslations(config?: Partial<ScriptConfig>): Promise<{
    processedFiles: string[];
    totalTime: number;
}>;
