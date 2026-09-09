/**
 * Worker Pool 관리 클래스
 * - Worker Thread 생성 및 관리
 * - 작업 큐 관리
 * - 결과 수집
 */
import { WorkerTask, WorkerResult, WorkerPoolStats } from "./types";
export declare class WorkerPool {
    private workerCount;
    private workers;
    private taskQueue;
    private availableWorkers;
    private workerTasks;
    private stats;
    constructor(workerCount?: number);
    /**
     * Worker Pool 초기화
     */
    initialize(): Promise<void>;
    /**
     * 작업 실행
     */
    runTask(task: WorkerTask): Promise<WorkerResult>;
    /**
     * 큐 처리
     */
    private processQueue;
    /**
     * Worker 메시지 처리
     */
    private handleWorkerMessage;
    /**
     * Worker 에러 처리
     */
    private handleWorkerError;
    /**
     * 통계 조회
     */
    getStats(): WorkerPoolStats;
    /**
     * Worker Pool 종료
     */
    terminate(): Promise<void>;
}
