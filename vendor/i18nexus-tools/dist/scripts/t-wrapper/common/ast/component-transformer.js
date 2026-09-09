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
exports.tryTransformComponent = tryTransformComponent;
const t = __importStar(require("@babel/types"));
const ast_helpers_1 = require("./ast-helpers");
const ast_transformers_1 = require("./ast-transformers");
/**
 * 컴포넌트나 커스텀 훅을 변환 시도
 * @returns 변환 성공 여부
 */
function tryTransformComponent(path, code, modifiedComponentPaths, config = {}) {
    let functionName;
    // function 형태
    if (path.isFunctionDeclaration() && path.node.id) {
        functionName = path.node.id.name;
    }
    // arrow function 형태
    else if (path.isArrowFunctionExpression() &&
        t.isVariableDeclarator(path.parent) &&
        t.isIdentifier(path.parent.id)) {
        functionName = path.parent.id.name;
    }
    if (functionName &&
        ((0, ast_helpers_1.isReactComponent)(functionName) || (0, ast_helpers_1.isReactCustomHook)(functionName))) {
        const transformResult = (0, ast_transformers_1.transformFunctionBody)(path, code, {
            sourceLanguage: config.sourceLanguage,
        });
        if (transformResult.wasModified) {
            modifiedComponentPaths.push(path);
            return true;
        }
    }
    return false;
}
