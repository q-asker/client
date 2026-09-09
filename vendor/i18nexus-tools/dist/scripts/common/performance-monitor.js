"use strict";
/**
 * Performance Monitoring System
 *
 * 각 함수의 성능을 측정하고 콘솔에 출력
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalPerformanceMonitor = exports.PerformanceMonitor = void 0;
exports.measureAsync = measureAsync;
exports.measureSync = measureSync;
const performance_reporter_1 = require("./performance-reporter");
// 디버그 모드 확인
const isDebugMode = process.env.I18N_PERF_DEBUG === "true";
class PerformanceMonitor {
    constructor(options) {
        this.metrics = [];
        this.startTimes = new Map();
        this.enabled =
            options?.enabled ?? process.env.I18N_PERF_MONITOR !== "false";
        if (isDebugMode && this.enabled) {
            console.log("[Performance Monitor] ✅ Initialized");
            console.log("[Performance Monitor] Environment:", options?.environment || process.env.NODE_ENV || "production");
        }
    }
    /**
     * 함수 실행 시간 측정 시작
     */
    start(name, metadata) {
        if (!this.enabled)
            return;
        const startTime = performance.now();
        this.startTimes.set(name, startTime);
        if (isDebugMode) {
            console.log(`[Performance Monitor] 🎯 Started: ${name}`, metadata || {});
        }
    }
    /**
     * 함수 실행 시간 측정 종료
     */
    end(name, metadata) {
        if (!this.enabled)
            return null;
        const startTime = this.startTimes.get(name);
        if (!startTime) {
            console.warn(`⚠️  Performance measurement not started for: ${name}`);
            return null;
        }
        const endTime = performance.now();
        const duration = endTime - startTime;
        const memoryUsage = process.memoryUsage();
        const metric = {
            name,
            duration,
            timestamp: Date.now(),
            metadata,
            memoryUsage: {
                heapUsed: memoryUsage.heapUsed,
                heapTotal: memoryUsage.heapTotal,
                external: memoryUsage.external,
                rss: memoryUsage.rss,
            },
        };
        this.metrics.push(metric);
        this.startTimes.delete(name);
        // 느린 작업 경고 (1초 이상)
        if (duration > 1000) {
            console.warn(`[Performance Monitor] 🐌 Slow operation detected: ${name} (${duration.toFixed(2)}ms)`, metadata || {});
        }
        else if (isDebugMode) {
            console.log(`[Performance Monitor] ✅ Finished: ${name} (${duration.toFixed(2)}ms)`, metadata || {});
        }
        return metric;
    }
    /**
     * 함수를 래핑하여 자동으로 성능 측정
     */
    wrap(name, fn, metadata) {
        if (!this.enabled)
            return fn;
        const monitor = this;
        return function (...args) {
            monitor.start(name, metadata);
            try {
                const result = fn.apply(this, args);
                // Promise 처리
                if (result && typeof result.then === "function") {
                    return result.then((value) => {
                        monitor.end(name, metadata);
                        return value;
                    }, (error) => {
                        monitor.end(name, { ...metadata, error: true });
                        throw error;
                    });
                }
                monitor.end(name, metadata);
                return result;
            }
            catch (error) {
                monitor.end(name, { ...metadata, error: true });
                throw error;
            }
        };
    }
    /**
     * 데코레이터: 메서드 성능 자동 측정
     */
    static measure(metadata) {
        return function (target, propertyKey, descriptor) {
            const originalMethod = descriptor.value;
            const className = target.constructor.name;
            const methodName = `${className}.${propertyKey}`;
            descriptor.value = function (...args) {
                // @ts-ignore
                const monitor = this.performanceMonitor;
                if (!monitor || !monitor.enabled) {
                    return originalMethod.apply(this, args);
                }
                monitor.start(methodName, metadata);
                try {
                    const result = originalMethod.apply(this, args);
                    // Promise 처리
                    if (result && typeof result.then === "function") {
                        return result.then((value) => {
                            monitor.end(methodName, metadata);
                            return value;
                        }, (error) => {
                            monitor.end(methodName, { ...metadata, error: true });
                            throw error;
                        });
                    }
                    monitor.end(methodName, metadata);
                    return result;
                }
                catch (error) {
                    monitor.end(methodName, { ...metadata, error: true });
                    throw error;
                }
            };
            return descriptor;
        };
    }
    /**
     * 성능 리포트 생성
     */
    getReport() {
        if (this.metrics.length === 0) {
            return {
                totalDuration: 0,
                metrics: [],
                summary: {
                    averageDuration: 0,
                    slowestOperation: "N/A",
                    fastestOperation: "N/A",
                    totalOperations: 0,
                },
            };
        }
        const totalDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0);
        const averageDuration = totalDuration / this.metrics.length;
        const sorted = [...this.metrics].sort((a, b) => b.duration - a.duration);
        const slowest = sorted[0];
        const fastest = sorted[sorted.length - 1];
        return {
            totalDuration,
            metrics: this.metrics,
            summary: {
                averageDuration,
                slowestOperation: `${slowest.name} (${slowest.duration.toFixed(2)}ms)`,
                fastestOperation: `${fastest.name} (${fastest.duration.toFixed(2)}ms)`,
                totalOperations: this.metrics.length,
            },
        };
    }
    /**
     * 성능 리포트 출력
     */
    printReport(verbose = false) {
        if (!this.enabled || this.metrics.length === 0) {
            console.log("📊 Performance monitoring disabled or no metrics collected");
            return;
        }
        const report = this.getReport();
        performance_reporter_1.PerformanceReporter.printReport(report, verbose);
    }
    /**
     * 메트릭 초기화
     */
    reset() {
        this.metrics = [];
        this.startTimes.clear();
    }
    /**
     * 커스텀 메트릭 로깅
     */
    captureCustomMetric(name, value, unit = "millisecond", metadata) {
        if (!this.enabled)
            return;
        console.log(`[Performance Monitor] 📊 Custom Metric: ${name}`, {
            value,
            unit,
            ...metadata,
        });
    }
    /**
     * 에러 캡처
     */
    captureError(error, context) {
        performance_reporter_1.PerformanceReporter.printError(error, context);
    }
}
exports.PerformanceMonitor = PerformanceMonitor;
/**
 * 전역 Performance Monitor 인스턴스
 */
exports.globalPerformanceMonitor = new PerformanceMonitor();
/**
 * 유틸리티: 함수 실행 시간 측정
 */
async function measureAsync(name, fn, metadata) {
    exports.globalPerformanceMonitor.start(name, metadata);
    try {
        const result = await fn();
        exports.globalPerformanceMonitor.end(name, metadata);
        return result;
    }
    catch (error) {
        exports.globalPerformanceMonitor.end(name, { ...metadata, error: true });
        throw error;
    }
}
/**
 * 유틸리티: 동기 함수 실행 시간 측정
 */
function measureSync(name, fn, metadata) {
    exports.globalPerformanceMonitor.start(name, metadata);
    try {
        const result = fn();
        exports.globalPerformanceMonitor.end(name, metadata);
        return result;
    }
    catch (error) {
        exports.globalPerformanceMonitor.end(name, { ...metadata, error: true });
        throw error;
    }
}
