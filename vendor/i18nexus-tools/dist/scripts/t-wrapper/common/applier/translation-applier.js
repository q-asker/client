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
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyTranslationsToAST = applyTranslationsToAST;
exports.writeASTToFile = writeASTToFile;
const t = __importStar(require("@babel/types"));
const parser_utils_1 = require("../../../common/ast/parser-utils");
const ast_helpers_1 = require("../ast/ast-helpers");
const import_manager_1 = require("../manager/import-manager");
const constants_1 = require("../utils/constants");
const fs_utils_1 = require("../utils/fs-utils");
const namespace_inference_1 = require("../../../extractor/namespace-inference");
const config_loader_1 = require("../../../config-loader");
const namespace_updater_1 = require("../ast/namespace-updater");
/**
 * 함수의 props에 t 함수가 있는지 확인
 */
function checkIfTIsInProps(fnNode) {
    const params = fnNode.params;
    if (params.length === 0) {
        return false;
    }
    const firstParam = params[0];
    // ObjectPattern: function MyComponent({ t, other }) {}
    if (t.isObjectPattern(firstParam)) {
        return firstParam.properties.some((prop) => {
            if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
                return prop.key.name === constants_1.STRING_CONSTANTS.TRANSLATION_FUNCTION;
            }
            if (t.isRestElement(prop) && t.isIdentifier(prop.argument)) {
                return false; // rest는 제외
            }
            return false;
        });
    }
    // Identifier with TypeScript annotation: function MyComponent(props: Props) {}
    if (t.isIdentifier(firstParam)) {
        // 함수 body에서 const { t } = props 패턴 확인
        if (t.isBlockStatement(fnNode.body)) {
            const body = fnNode.body;
            for (const stmt of body.body) {
                if (t.isVariableDeclaration(stmt)) {
                    // const { t } = props 패턴
                    for (const decl of stmt.declarations) {
                        if (t.isVariableDeclarator(decl) &&
                            t.isObjectPattern(decl.id) &&
                            t.isIdentifier(decl.init) &&
                            decl.init.name === firstParam.name) {
                            const hasTInDestructure = decl.id.properties.some((prop) => {
                                if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
                                    return (prop.key.name === constants_1.STRING_CONSTANTS.TRANSLATION_FUNCTION);
                                }
                                return false;
                            });
                            if (hasTInDestructure) {
                                return true;
                            }
                        }
                    }
                }
            }
        }
    }
    return false;
}
/**
 * AST에 번역 바인딩 및 import 추가
 * 파일 쓰기는 포함하지 않음 (테스트 용이성을 위해)
 *
 * @param ast - Babel AST
 * @param modifiedComponentPaths - 수정된 컴포넌트 경로들
 * @param config - 스크립트 설정
 * @param filePath - 파일 경로 (네임스페이스 추론용)
 * @param sourceCode - 소스 코드 (네임스페이스 추론용)
 */
function applyTranslationsToAST(ast, modifiedComponentPaths, config, filePath, sourceCode) {
    const isServerMode = config.mode === "server";
    const isClientMode = config.mode === "client";
    const isNextjsFramework = config.framework === "nextjs";
    if (isNextjsFramework && isClientMode) {
        (0, import_manager_1.ensureUseClientDirective)(ast);
    }
    const usedTranslationFunctions = new Set();
    // i18nexus.config.json 로드 (네임스페이스 설정 확인)
    const i18nexusConfig = (0, config_loader_1.loadConfig)("i18nexus.config.json", { silent: true });
    // namespaceLocation이 있으면 자동으로 enabled로 간주
    const namespacingEnabled = i18nexusConfig.namespacing?.enabled ?? !!i18nexusConfig.namespaceLocation;
    // 네임스페이스 추론 (파일 전체에 대해)
    let correctNamespace;
    if (namespacingEnabled && filePath && sourceCode) {
        // namespacing 설정이 없으면 namespaceLocation으로부터 생성
        const namespacingConfig = i18nexusConfig.namespacing ||
            (i18nexusConfig.namespaceLocation
                ? {
                    enabled: true,
                    basePath: i18nexusConfig.namespaceLocation,
                    defaultNamespace: i18nexusConfig.fallbackNamespace || "common",
                    framework: i18nexusConfig.namespacing?.framework || "nextjs-app",
                    strategy: i18nexusConfig.namespacing?.strategy || "first-folder",
                }
                : undefined);
        if (namespacingConfig) {
            correctNamespace = (0, namespace_inference_1.inferNamespaceFromFile)(filePath, sourceCode, namespacingConfig);
        }
    }
    // 1단계: 기존 useTranslation() 호출이 있으면 네임스페이스 추가/수정
    if (correctNamespace && sourceCode) {
        const updated = (0, namespace_updater_1.updateExistingUseTranslation)(ast, correctNamespace, sourceCode);
        if (updated) {
            // useTranslation이 이미 있고 업데이트되었으면 import만 확인
            (0, import_manager_1.ensureNamedImport)(ast, config.translationImportSource, constants_1.STRING_CONSTANTS.USE_TRANSLATION);
            return; // 이미 useTranslation이 있으므로 새로 추가하지 않음
        }
    }
    // 2단계: useTranslation()이 없는 경우에만 새로 추가
    const translationFunctionName = isServerMode
        ? config.serverTranslationFunction
        : constants_1.STRING_CONSTANTS.USE_TRANSLATION;
    // 수정된것 중 t가 있는 것을 찾아서 수정
    modifiedComponentPaths.forEach((componentPath) => {
        if (componentPath.scope.hasBinding(constants_1.STRING_CONSTANTS.TRANSLATION_FUNCTION)) {
            return;
        }
        const body = componentPath.get("body");
        if ((0, ast_helpers_1.hasTranslationFunctionCall)(body, translationFunctionName)) {
            return;
        }
        if (isServerMode) {
            componentPath.node.async = true;
        }
        // 네임스페이스 추론
        let namespace;
        // t가 props로 내려오는지 확인
        const hasTAsProps = checkIfTIsInProps(componentPath.node);
        if (hasTAsProps) {
            // t가 props로 있으면 common 네임스페이스 사용
            namespace = i18nexusConfig.fallbackNamespace || "common";
        }
        else if (namespacingEnabled && filePath && sourceCode) {
            // 1순위: 기존 useTranslation() 호출에서 네임스페이스 추출
            const existingNamespace = (0, ast_helpers_1.extractNamespaceFromUseTranslation)(body);
            if (existingNamespace) {
                namespace = existingNamespace;
            }
            else {
                namespace = correctNamespace;
            }
        }
        const decl = (0, ast_helpers_1.createTranslationBinding)(isServerMode ? "server" : "client", isServerMode ? config.serverTranslationFunction : undefined, namespace);
        // body 최상단에 추가
        if (body.isBlockStatement()) {
            body.unshiftContainer("body", decl);
        }
        // body 최상단이 아닌 경우 리턴 앞에 추가
        // 예시: const Home = () => <div />;
        else {
            const original = body.node;
            componentPath.node.body = t.blockStatement([
                decl,
                t.returnStatement(original),
            ]);
        }
        // 사용된 번역 함수 추가
        usedTranslationFunctions.add(translationFunctionName);
    });
    // 사용된 번역 함수 가져와서 임포트 구문 추가
    usedTranslationFunctions.forEach((functionName) => {
        // 서버 모드일 때는 import source에 /server 추가
        const effectiveImportSource = isServerMode
            ? `${config.translationImportSource}/server`
            : config.translationImportSource;
        (0, import_manager_1.ensureNamedImport)(ast, effectiveImportSource, functionName);
    });
}
/**
 * AST를 코드로 변환하여 파일에 쓰기
 */
function writeASTToFile(ast, filePath, config) {
    const output = (0, parser_utils_1.generateCode)(ast, {
        retainLines: true,
        comments: true,
    });
    // 제네릭 타입은 TypeScript가 인자로부터 자동 추론하므로 추가하지 않음
    // useTranslation("namespace") - 이 형태로 충분
    (0, fs_utils_1.writeFile)(filePath, output.code);
}
