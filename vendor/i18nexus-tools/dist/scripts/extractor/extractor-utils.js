"use strict";
/**
 * Extractor 유틸리티 함수들
 * 순수 함수로 구성되어 테스트하기 쉬움
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
exports.isTFunction = isTFunction;
exports.getDefaultValue = getDefaultValue;
exports.escapeCsvValue = escapeCsvValue;
const t = __importStar(require("@babel/types"));
const constants_1 = require("./constants");
/**
 * t() 함수 호출인지 확인
 */
function isTFunction(callee) {
    // t() 직접 호출
    if (t.isIdentifier(callee, { name: constants_1.STRING_CONSTANTS.TRANSLATION_FUNCTION })) {
        return true;
    }
    // useTranslation().t 형태의 호출
    if (t.isMemberExpression(callee) &&
        t.isIdentifier(callee.property, {
            name: constants_1.STRING_CONSTANTS.TRANSLATION_FUNCTION,
        })) {
        return true;
    }
    return false;
}
/**
 * t() 함수 호출에서 defaultValue 추출
 */
function getDefaultValue(args) {
    // 두 번째 인수가 옵션 객체인 경우 defaultValue 추출
    if (args.length > 1 && t.isObjectExpression(args[1])) {
        const defaultValueProp = args[1].properties.find((prop) => t.isObjectProperty(prop) &&
            t.isIdentifier(prop.key, {
                name: constants_1.STRING_CONSTANTS.DEFAULT_VALUE,
            }) &&
            t.isStringLiteral(prop.value));
        if (defaultValueProp && t.isObjectProperty(defaultValueProp)) {
            return defaultValueProp.value.value;
        }
    }
    return undefined;
}
/**
 * CSV 값 이스케이프 처리
 */
function escapeCsvValue(value) {
    // CSV에서 특수 문자가 포함된 경우 따옴표로 감싸고, 따옴표는 두 번 반복
    const hasSpecialChars = constants_1.CSV_CONSTANTS.SPECIAL_CHARS.some((char) => value.includes(char));
    if (hasSpecialChars) {
        return `${constants_1.CSV_CONSTANTS.QUOTE}${value.replace(/"/g, constants_1.CSV_CONSTANTS.QUOTE_ESCAPED)}${constants_1.CSV_CONSTANTS.QUOTE}`;
    }
    return value;
}
