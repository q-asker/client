"use strict";
/**
 * Worker Thread 실행 코드
 * - 파일 파싱 (SWC)
 * - AST 변환 (Babel traverse/generator)
 * - 파일 쓰기
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
const core_1 = require("@swc/core");
const traverse_1 = __importDefault(require("@babel/traverse"));
const t = __importStar(require("@babel/types"));
const component_transformer_1 = require("../common/ast/component-transformer");
const translation_applier_1 = require("../common/applier/translation-applier");
if (!worker_threads_1.parentPort) {
    throw new Error("This file must be run as a Worker Thread");
}
/**
 * SWC로 파싱 후 Babel AST로 변환
 *
 * 참고: SWC의 parseSync는 SWC AST를 반환하지만,
 * 여기서는 transform을 통해 코드를 먼저 정규화한 후
 * Babel로 다시 파싱하는 방식을 사용합니다.
 */
function parseWithSwc(code) {
    try {
        // SWC로 빠르게 파싱 (문법 검증 및 트랜스파일)
        const result = (0, core_1.parseSync)(code, {
            syntax: "typescript",
            tsx: true,
            decorators: true,
            dynamicImport: true,
        });
        // SWC AST를 Babel AST로 변환하는 것은 복잡하므로,
        // 대신 Babel parser를 직접 사용 (하이브리드 접근)
        // SWC의 주된 이점은 병렬 처리에서 나옴
        const babelParser = require("@babel/parser");
        return babelParser.parse(code, {
            sourceType: "module",
            plugins: [
                "typescript",
                "jsx",
                "decorators-legacy",
                "classProperties",
                "objectRestSpread",
            ],
        });
    }
    catch (error) {
        throw new Error(`Parse error: ${error}`);
    }
}
/**
 * 파일 처리 메인 함수
 */
function processFile(task) {
    const startTime = Date.now();
    const { filePath, code, config } = task;
    try {
        // 1. 파싱 (SWC/Babel 하이브리드)
        const ast = parseWithSwc(code);
        // 2. AST 순회 및 변환
        let isFileModified = false;
        const modifiedComponentPaths = [];
        (0, traverse_1.default)(ast, {
            FunctionDeclaration: (path) => {
                if ((0, component_transformer_1.tryTransformComponent)(path, code, modifiedComponentPaths, config)) {
                    isFileModified = true;
                }
            },
            ArrowFunctionExpression: (path) => {
                if (t.isVariableDeclarator(path.parent) &&
                    t.isIdentifier(path.parent.id)) {
                    if ((0, component_transformer_1.tryTransformComponent)(path, code, modifiedComponentPaths, config)) {
                        isFileModified = true;
                    }
                }
            },
        });
        // 3. 변경사항 적용
        if (isFileModified) {
            (0, translation_applier_1.applyTranslationsToAST)(ast, modifiedComponentPaths, config);
            (0, translation_applier_1.writeASTToFile)(ast, filePath, config);
            const processingTime = Date.now() - startTime;
            return {
                type: "success",
                filePath,
                modified: true,
                processingTime,
            };
        }
        else {
            const processingTime = Date.now() - startTime;
            return {
                type: "no-change",
                filePath,
                modified: false,
                processingTime,
            };
        }
    }
    catch (error) {
        return {
            type: "error",
            filePath,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
/**
 * Worker 메시지 리스너
 */
worker_threads_1.parentPort.on("message", (task) => {
    if (task.type === "process-file") {
        const result = processFile(task);
        worker_threads_1.parentPort.postMessage(result);
    }
});
