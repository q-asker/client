"use strict";
/**
 * Import 및 디렉티브 관리 유틸리티
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
exports.ensureNamedImport = ensureNamedImport;
exports.ensureMultipleNamedImports = ensureMultipleNamedImports;
exports.ensureUseClientDirective = ensureUseClientDirective;
const t = __importStar(require("@babel/types"));
const constants_1 = require("../utils/constants");
/** AST에 named import가 필요한지 확인하고 추가 */
function ensureNamedImport(ast, source, importedName) {
    let hasSource = false;
    let hasSpecifier = false;
    for (const node of ast.program.body) {
        if (t.isImportDeclaration(node) && node.source.value === source) {
            hasSource = true;
            for (const spec of node.specifiers) {
                if (t.isImportSpecifier(spec) &&
                    t.isIdentifier(spec.imported) &&
                    spec.imported.name === importedName) {
                    hasSpecifier = true;
                    break;
                }
            }
            if (!hasSpecifier) {
                node.specifiers.push(t.importSpecifier(t.identifier(importedName), t.identifier(importedName)));
                hasSpecifier = true;
            }
            break;
        }
    }
    if (!hasSource) {
        const decl = t.importDeclaration([
            t.importSpecifier(t.identifier(importedName), t.identifier(importedName)),
        ], t.stringLiteral(source));
        ast.program.body.unshift(decl);
        hasSpecifier = true;
    }
    return hasSpecifier;
}
/**
 * AST에 여러 named import를 한 번에 추가
 *
 * @param ast - Babel AST
 * @param source - import source (e.g., "i18nexus")
 * @param importedNames - import할 이름들 (e.g., ["useTranslation", "useLanguageSwitcher"])
 */
function ensureMultipleNamedImports(ast, source, importedNames) {
    let modified = false;
    for (const name of importedNames) {
        if (ensureNamedImport(ast, source, name)) {
            modified = true;
        }
    }
    return modified;
}
/** AST에 "use client" 디렉티브가 필요한지 확인하고 추가 */
function ensureUseClientDirective(ast) {
    // 이미 존재하면 패스
    const hasDirective = (ast.program.directives || []).some((d) => d.value.value === constants_1.STRING_CONSTANTS.USE_CLIENT_DIRECTIVE);
    if (!hasDirective) {
        const dir = t.directive(t.directiveLiteral(constants_1.STRING_CONSTANTS.USE_CLIENT_DIRECTIVE));
        ast.program.directives = ast.program.directives || [];
        ast.program.directives.unshift(dir);
        return true;
    }
    return false;
}
