/**
 * Performance Monitoring System
 *
 * 각 함수의 성능을 측정하고 콘솔에 출력
 */
export interface PerformanceMetric {
    name: string;
    duration: number;
    timestamp: number;
    metadata?: Record<string, any>;
    memoryUsage?: {
        heapUsed: number;
        heapTotal: number;
        external: number;
        rss: number;
    };
}
export interface PerformanceReport {
    totalDuration: number;
    metrics: PerformanceMetric[];
    summary: {
        averageDuration: number;
        slowestOperation: string;
        fastestOperation: string;
        totalOperations: number;
    };
}
export declare class PerformanceMonitor {
    private metrics;
    private startTimes;
    private enabled;
    constructor(options?: {
        enabled?: boolean;
        environment?: string;
        release?: string;
    });
    /**
     * 함수 실행 시간 측정 시작
     */
    start(name: string, metadata?: Record<string, any>): void;
    /**
     * 함수 실행 시간 측정 종료
     */
    end(name: string, metadata?: Record<string, any>): PerformanceMetric | null;
    /**
     * 함수를 래핑하여 자동으로 성능 측정
     */
    wrap<T extends (...args: any[]) => any>(name: string, fn: T, metadata?: Record<string, any>): T;
    /**
     * 데코레이터: 메서드 성능 자동 측정
     */
    static measure(metadata?: Record<string, any>): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
    /**
     * 성능 리포트 생성
     */
    getReport(): PerformanceReport;
    /**
     * 성능 리포트 출력
     */
    printReport(verbose?: boolean): void;
    /**
     * 메트릭 초기화
     */
    reset(): void;
    /**
     * 커스텀 메트릭 로깅
     */
    captureCustomMetric(name: string, value: number, unit?: string, metadata?: Record<string, any>): void;
    /**
     * 에러 캡처
     */
    captureError(error: Error, context?: Record<string, any>): void;
}
/**
 * 전역 Performance Monitor 인스턴스
 */
export declare const globalPerformanceMonitor: PerformanceMonitor;
/**
 * 유틸리티: 함수 실행 시간 측정
 */
export declare function measureAsync<T>(name: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T>;
/**
 * 유틸리티: 동기 함수 실행 시간 측정
 */
export declare function measureSync<T>(name: string, fn: () => T, metadata?: Record<string, any>): T;
