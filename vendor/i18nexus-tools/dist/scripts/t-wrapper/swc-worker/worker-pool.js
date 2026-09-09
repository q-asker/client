"use strict";
/**
 * Worker Pool 관리 클래스
 * - Worker Thread 생성 및 관리
 * - 작업 큐 관리
 * - 결과 수집
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerPool = void 0;
const worker_threads_1 = require("worker_threads");
const path = __importStar(require("path"));
const os = __importStar(require("os"));
class WorkerPool {
    constructor(workerCount = os.cpus().length) {
        this.workerCount = workerCount;
        this.workers = [];
        this.taskQueue = [];
        this.availableWorkers = [];
        this.workerTasks = new Map();
        this.stats = {
            totalWorkers: workerCount,
            activeWorkers: 0,
            queuedTasks: 0,
            completedTasks: 0,
            failedTasks: 0,
            totalProcessingTime: 0,
        };
    }
    /**
     * Worker Pool 초기화
     */
    async initialize() {
        // 테스트 환경에서는 .ts를, 프로덕션에서는 .js를 사용
        const workerScript = path.join(__dirname, __filename.endsWith(".ts") ? "worker.ts" : "worker.js");
        for (let i = 0; i < this.workerCount; i++) {
            const worker = new worker_threads_1.Worker(workerScript);
            this.workers.push(worker);
            this.availableWorkers.push(worker);
            // Worker 메시지 리스너 설정
            worker.on("message", (result) => {
                this.handleWorkerMessage(worker, result);
            });
            // Worker 에러 리스너 설정
            worker.on("error", (error) => {
                this.handleWorkerError(worker, error);
            });
            // Worker 종료 리스너 설정
            worker.on("exit", (code) => {
                if (code !== 0) {
                    console.error(`Worker stopped with exit code ${code}`);
                }
            });
        }
    }
    /**
     * 작업 실행
     */
    async runTask(task) {
        return new Promise((resolve, reject) => {
            const queuedTask = { task, resolve, reject };
            this.taskQueue.push(queuedTask);
            this.stats.queuedTasks = this.taskQueue.length;
            this.processQueue();
        });
    }
    /**
     * 큐 처리
     */
    processQueue() {
        while (this.taskQueue.length > 0 && this.availableWorkers.length > 0) {
            const queuedTask = this.taskQueue.shift();
            const worker = this.availableWorkers.shift();
            this.workerTasks.set(worker, queuedTask);
            this.stats.activeWorkers++;
            this.stats.queuedTasks = this.taskQueue.length;
            worker.postMessage(queuedTask.task);
        }
    }
    /**
     * Worker 메시지 처리
     */
    handleWorkerMessage(worker, result) {
        const queuedTask = this.workerTasks.get(worker);
        if (!queuedTask)
            return;
        this.workerTasks.delete(worker);
        this.availableWorkers.push(worker);
        this.stats.activeWorkers--;
        if (result.type === "success") {
            this.stats.completedTasks++;
            if (result.processingTime) {
                this.stats.totalProcessingTime += result.processingTime;
            }
            queuedTask.resolve(result);
        }
        else if (result.type === "error") {
            this.stats.failedTasks++;
            queuedTask.reject(new Error(result.error || "Unknown worker error"));
        }
        else {
            // no-change
            this.stats.completedTasks++;
            queuedTask.resolve(result);
        }
        this.processQueue();
    }
    /**
     * Worker 에러 처리
     */
    handleWorkerError(worker, error) {
        const queuedTask = this.workerTasks.get(worker);
        if (queuedTask) {
            this.workerTasks.delete(worker);
            this.stats.failedTasks++;
            queuedTask.reject(error);
        }
        // Worker를 사용 가능 목록에서 제거
        const index = this.availableWorkers.indexOf(worker);
        if (index > -1) {
            this.availableWorkers.splice(index, 1);
        }
    }
    /**
     * 통계 조회
     */
    getStats() {
        return { ...this.stats };
    }
    /**
     * Worker Pool 종료
     */
    async terminate() {
        await Promise.all(this.workers.map((worker) => worker.terminate()));
        this.workers = [];
        this.availableWorkers = [];
        this.workerTasks.clear();
    }
}
exports.WorkerPool = WorkerPool;
