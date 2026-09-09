#!/usr/bin/env node
export interface CleanLegacyCliConfig {
    sourcePattern?: string;
    localesDir?: string;
    languages?: string;
    dryRun?: boolean;
    noBackup?: boolean;
}
