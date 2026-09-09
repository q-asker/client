import React from "react";
export type TranslationVariables = Record<string, string | number>;
export type VariableStyle = React.CSSProperties;
export type TranslationStyles = Record<string, VariableStyle>;
export type RuntimeNamespaceTranslations = {
    readonly [namespace: string]: {
        readonly [language: string]: {
            readonly [key: string]: string;
        };
    };
};
export type LoadedNamespaces = Map<string, Record<string, Record<string, string>>>;
export type StaticResolutionMode = "namespace" | "flattened";
export type StaticMergeMode = "when-empty" | "before-loaded";
export interface NamespaceReadiness {
    hasStaticNamespace: boolean;
    isNamespaceLoaded: boolean;
    isNamespaceLoading: boolean;
    isNamespaceReady: boolean;
}
export interface TranslationSnapshotOptions {
    namespace?: string;
    staticTranslations: RuntimeNamespaceTranslations;
    currentLanguage: string;
    fallbackLanguage: string;
    fallbackNamespace?: string;
    loadedNamespaces: LoadedNamespaces;
    staticResolutionMode: StaticResolutionMode;
    staticMergeMode: StaticMergeMode;
}
export declare const interpolate: (text: string, variables?: TranslationVariables) => string;
export declare const interpolateWithStyles: (text: string, variables: TranslationVariables, styles: TranslationStyles) => React.ReactElement;
export declare const translateFromSnapshot: (translations: Record<string, string>, key: string, variables?: TranslationVariables, styles?: TranslationStyles) => string | React.ReactElement;
export declare const hasOwnNamespace: (translations: RuntimeNamespaceTranslations, namespace?: string) => boolean;
export declare const resolveNamespaceForLanguage: (translations: RuntimeNamespaceTranslations, namespace: string, language: string, fallbackLanguage: string) => Record<string, string>;
export declare const flattenTranslationsForLanguage: (translations: RuntimeNamespaceTranslations, language: string, fallbackLanguage: string) => Record<string, string>;
export declare const resolveTranslationSnapshot: (options: TranslationSnapshotOptions) => Record<string, string>;
export declare const getNamespaceReadiness: ({ namespace, staticTranslations, loadedNamespaces, loadingNamespaces, }: {
    namespace?: string;
    staticTranslations: RuntimeNamespaceTranslations;
    loadedNamespaces: LoadedNamespaces;
    loadingNamespaces: Set<string>;
}) => NamespaceReadiness;
export declare const shouldLoadNamespace: ({ namespace, lazy, hasStaticNamespace, isNamespaceLoaded, }: {
    namespace?: string;
    lazy?: boolean;
    hasStaticNamespace: boolean;
    isNamespaceLoaded: boolean;
}) => boolean;
export declare const resolveTranslationReady: ({ isLoading, isNamespaceLoading, isNamespaceReady, }: {
    isLoading: boolean;
    isNamespaceLoading: boolean;
    isNamespaceReady: boolean;
}) => boolean;
//# sourceMappingURL=translation-runtime.d.ts.map