/**
 * Performance Reporter
 *
 * 성능 리포트를 콘솔에 출력하는 기능
 */
import { PerformanceReport, PerformanceMetric } from "./performance-monitor";
export declare class PerformanceReporter {
    /**
     * 성능 리포트를 콘솔에 출력
     */
    static printReport(report: PerformanceReport, verbose?: boolean): void;
    /**
     * 단일 메트릭을 콘솔에 출력
     */
    static printMetric(metric: PerformanceMetric): void;
    /**
     * 에러를 콘솔에 출력
     */
    static printError(error: Error, context?: Record<string, any>): void;
    /**
     * 작업 완료 후 성능 리포트 출력
     */
    static printCompletionReport(report: PerformanceReport, processedFiles: string[], totalTime: number, title?: string): void;
}
