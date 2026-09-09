#!/usr/bin/env node
export interface DownloadConfig {
    credentialsPath?: string;
    spreadsheetId?: string;
    localesDir?: string;
    sheetName?: string;
    languages?: string[];
}
export declare function downloadTranslations(config?: Partial<DownloadConfig>, options?: {
    force?: boolean;
}): Promise<void>;
