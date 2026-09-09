#!/usr/bin/env node
export interface UploadConfig {
    credentialsPath?: string;
    spreadsheetId?: string;
    localesDir?: string;
    sheetName?: string;
    autoTranslate?: boolean;
    force?: boolean;
}
export declare function uploadTranslations(dir: string, config: Required<UploadConfig>): Promise<void>;
