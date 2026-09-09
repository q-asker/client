/**
 * Extractor 유틸리티 함수들
 * 순수 함수로 구성되어 테스트하기 쉬움
 */
import * as t from "@babel/types";
/**
 * t() 함수 호출인지 확인
 */
export declare function isTFunction(callee: t.Expression | t.V8IntrinsicIdentifier): boolean;
/**
 * t() 함수 호출에서 defaultValue 추출
 */
export declare function getDefaultValue(args: t.Expression[]): string | undefined;
/**
 * CSV 값 이스케이프 처리
 */
export declare function escapeCsvValue(value: string): string;
