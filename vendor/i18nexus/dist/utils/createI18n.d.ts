import React from "react";
import { type I18nProviderProps } from "../components/I18nProvider.js";
import { TranslationStyles, TranslationVariables } from "./translation-runtime.js";
export type LegacyNamespaceTranslations = {
    readonly [namespace: string]: {
        readonly [language: string]: {
            readonly [key: string]: string;
        };
    };
};
export type I18nTranslations = LegacyNamespaceTranslations;
type KeysOfNamespace<TTranslations extends LegacyNamespaceTranslations, NS extends keyof TTranslations> = {
    [L in keyof TTranslations[NS]]: keyof TTranslations[NS][L] & string;
}[keyof TTranslations[NS]] & string;
type AllTranslationKeys<TTranslations extends LegacyNamespaceTranslations> = {
    [NS in keyof TTranslations]: KeysOfNamespace<TTranslations, NS>;
}[keyof TTranslations] & string;
type FallbackKeys<TTranslations extends LegacyNamespaceTranslations, FallbackNamespace extends keyof TTranslations | never> = [FallbackNamespace] extends [never] ? never : FallbackNamespace extends keyof TTranslations ? KeysOfNamespace<TTranslations, FallbackNamespace> : never;
export interface CreateI18nOptions<TTranslations extends I18nTranslations = I18nTranslations, FallbackNamespace extends keyof TTranslations & string = never> {
    fallbackNamespace?: FallbackNamespace;
    enableFallback?: boolean;
}
export interface LegacyUseTranslationReturn<K extends string = string> {
    t: {
        (key: K, variables: TranslationVariables, styles: TranslationStyles): React.ReactElement;
        (key: K, variables?: TranslationVariables): string;
    };
    currentLanguage: string;
    isReady: boolean;
}
export type CreateI18nUseTranslationReturn<K extends string = string> = LegacyUseTranslationReturn<K>;
export interface CreateI18nInstance<TTranslations extends I18nTranslations = I18nTranslations, FallbackNamespace extends keyof TTranslations & string = never> {
    I18nProvider: React.ComponentType<Omit<I18nProviderProps<TTranslations>, "translations" | "fallbackNamespace"> & {
        translations?: TTranslations;
    }>;
    useTranslation: {
        (): CreateI18nUseTranslationReturn<AllTranslationKeys<TTranslations>>;
        <NS extends keyof TTranslations & string>(namespace: NS): CreateI18nUseTranslationReturn<KeysOfNamespace<TTranslations, NS> | FallbackKeys<TTranslations, FallbackNamespace>>;
    };
    translations: TTranslations;
    options: {
        fallbackNamespace?: FallbackNamespace;
        enableFallback: boolean;
    };
}
export declare function createI18n<TTranslations extends LegacyNamespaceTranslations, FallbackNamespace extends keyof TTranslations & string = never>(translations: TTranslations, options?: CreateI18nOptions<TTranslations, FallbackNamespace>): CreateI18nInstance<TTranslations, FallbackNamespace>;
export {};
//# sourceMappingURL=createI18n.d.ts.map