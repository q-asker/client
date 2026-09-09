"use strict";
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
exports.wrapTranslations = wrapTranslations;
const glob_1 = require("glob");
const fs_utils_1 = require("../common/utils/fs-utils");
const traverse_1 = __importDefault(require("@babel/traverse"));
const t = __importStar(require("@babel/types"));
const default_config_1 = require("../../common/default-config");
const parser_utils_1 = require("../../common/ast/parser-utils");
const component_transformer_1 = require("../common/ast/component-transformer");
const translation_applier_1 = require("../common/applier/translation-applier");
const namespace_updater_1 = require("../common/ast/namespace-updater");
const namespace_inference_1 = require("../../extractor/namespace-inference");
const config_loader_1 = require("../../config-loader");
async function wrapTranslations(config = {}) {
    const fullConfig = {
        ...default_config_1.SCRIPT_CONFIG_DEFAULTS,
        ...config,
    };
    const startTime = Date.now();
    const filePaths = await (0, glob_1.glob)(fullConfig.sourcePattern);
    const processedFiles = [];
    for (const filePath of filePaths) {
        let isFileModified = false;
        const code = (0, fs_utils_1.readFile)(filePath);
        try {
            const ast = (0, parser_utils_1.parseFile)(code, {
                sourceType: "module",
                tsx: true,
                decorators: true,
            });
            // i18nexus.config.json 로드 (네임스페이스 설정 확인)
            const i18nexusConfig = (0, config_loader_1.loadConfig)("i18nexus.config.json", {
                silent: true,
            });
            const namespacingEnabled = i18nexusConfig.namespacing?.enabled ?? false;
            // 네임스페이스 업데이트 시도
            let namespaceUpdated = false;
            if (namespacingEnabled && i18nexusConfig.namespacing) {
                const correctNamespace = (0, namespace_inference_1.inferNamespaceFromFile)(filePath, code, i18nexusConfig.namespacing);
                if (correctNamespace) {
                    namespaceUpdated = (0, namespace_updater_1.updateExistingUseTranslation)(ast, correctNamespace, code);
                }
            }
            const modifiedComponentPaths = [];
            (0, traverse_1.default)(ast, {
                FunctionDeclaration: (path) => {
                    if ((0, component_transformer_1.tryTransformComponent)(path, code, modifiedComponentPaths, fullConfig)) {
                        isFileModified = true;
                    }
                },
                ArrowFunctionExpression: (path) => {
                    if (t.isVariableDeclarator(path.parent) &&
                        t.isIdentifier(path.parent.id)) {
                        if ((0, component_transformer_1.tryTransformComponent)(path, code, modifiedComponentPaths, fullConfig)) {
                            isFileModified = true;
                        }
                    }
                },
            });
            // 파일이 수정되었거나 네임스페이스가 업데이트된 경우
            if (isFileModified || namespaceUpdated) {
                if (isFileModified) {
                    (0, translation_applier_1.applyTranslationsToAST)(ast, modifiedComponentPaths, fullConfig, filePath, code);
                }
                (0, translation_applier_1.writeASTToFile)(ast, filePath, fullConfig);
                processedFiles.push(filePath);
            }
        }
        catch (error) {
            // 에러 발생 시 조용히 스킵
        }
    }
    const totalTime = Date.now() - startTime;
    return {
        processedFiles,
        totalTime,
    };
}
