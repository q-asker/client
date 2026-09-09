import { I18nexusConfig } from "./config-loader";
export type DoctorIssueLevel = "error" | "warning" | "info";
export type DoctorStatus = "healthy" | "warning" | "failed";
export interface DoctorIssue {
    level: DoctorIssueLevel;
    code: string;
    message: string;
    fix?: string;
}
export interface DoctorReport {
    ok: boolean;
    status: DoctorStatus;
    config: I18nexusConfig;
    issues: DoctorIssue[];
    summary: {
        localesDir: string;
        namespaces: string[];
        languages: string[];
        generatedTypesPath: string;
        localeEntrypointPath: string;
        typescriptModuleResolution?: string;
    };
}
export declare function runDoctor(projectRoot?: string): DoctorReport;
export declare function printDoctorReport(report: DoctorReport): void;
