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
exports.updateExistingUseTranslation = updateExistingUseTranslation;
/**
 * 기존 useTranslation() 호출을 찾아서 네임스페이스를 추가/수정
 */
const traverse_1 = __importDefault(require("@babel/traverse"));
const t = __importStar(require("@babel/types"));
function updateExistingUseTranslation(ast, correctNamespace, sourceCode) {
    let updated = false;
    (0, traverse_1.default)(ast, {
        CallExpression: (path) => {
            // useTranslation() 호출 찾기
            if (t.isIdentifier(path.node.callee, { name: "useTranslation" })) {
                const args = path.node.arguments;
                // 인자가 없는 경우: useTranslation() → useTranslation("namespace")
                if (args.length === 0) {
                    path.node.arguments = [t.stringLiteral(correctNamespace)];
                    updated = true;
                    console.log(`  ✓ Added namespace "${correctNamespace}" to useTranslation()`);
                }
                // 빈 문자열인 경우: useTranslation("") → useTranslation("namespace")
                else if (args.length === 1 &&
                    t.isStringLiteral(args[0]) &&
                    args[0].value === "") {
                    args[0].value = correctNamespace;
                    updated = true;
                    console.log(`  ✓ Updated namespace to "${correctNamespace}"`);
                }
                // 이미 네임스페이스가 있는 경우는 유지 (사용자의 명시적 의도)
                else if (args.length === 1 && t.isStringLiteral(args[0])) {
                    console.log(`  ℹ️  Keeping existing namespace "${args[0].value}"`);
                }
            }
        },
    });
    return updated;
}
