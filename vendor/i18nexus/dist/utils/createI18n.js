import React from "react";
import { I18nProvider as BaseI18nProvider, useI18nContext, } from "../components/I18nProvider.js";
import { getNamespaceReadiness, resolveTranslationReady, resolveTranslationSnapshot, shouldLoadNamespace, translateFromSnapshot, } from "./translation-runtime.js";
export function createI18n(translations, options = {}) {
    const normalizedOptions = {
        fallbackNamespace: options.fallbackNamespace,
        enableFallback: options.enableFallback ?? true,
    };
    const I18nProvider = (providerProps) => {
        const { translations: overrideTranslations, ...props } = providerProps;
        const runtimeTranslations = overrideTranslations || translations;
        return React.createElement(BaseI18nProvider, {
            ...props,
            translations: runtimeTranslations,
            fallbackNamespace: normalizedOptions.enableFallback
                ? normalizedOptions.fallbackNamespace
                : undefined,
        });
    };
    const useTranslationImpl = (namespace) => {
        const context = useI18nContext();
        const fallbackLanguage = context.languageManager.getDefaultLanguage();
        const source = (context.namespaceTranslations &&
            Object.keys(context.namespaceTranslations).length > 0
            ? context.namespaceTranslations
            : translations);
        const { hasStaticNamespace, isNamespaceLoaded, isNamespaceLoading, isNamespaceReady, } = React.useMemo(() => getNamespaceReadiness({
            namespace,
            staticTranslations: source,
            loadedNamespaces: context.loadedNamespaces,
            loadingNamespaces: context.loadingNamespaces,
        }), [namespace, source, context.loadedNamespaces, context.loadingNamespaces]);
        React.useEffect(() => {
            if (!namespace ||
                !shouldLoadNamespace({
                    namespace,
                    lazy: context.lazy,
                    hasStaticNamespace,
                    isNamespaceLoaded,
                })) {
                return;
            }
            void context.ensureNamespaceLoaded(namespace);
        }, [
            context.ensureNamespaceLoaded,
            context.lazy,
            hasStaticNamespace,
            isNamespaceLoaded,
            namespace,
        ]);
        const currentTranslations = React.useMemo(() => resolveTranslationSnapshot({
            namespace,
            staticTranslations: source,
            currentLanguage: context.currentLanguage,
            fallbackLanguage,
            fallbackNamespace: context.fallbackNamespace
                ? String(context.fallbackNamespace)
                : undefined,
            loadedNamespaces: context.loadedNamespaces,
            staticResolutionMode: "flattened",
            staticMergeMode: "before-loaded",
        }), [
            namespace,
            source,
            context.currentLanguage,
            fallbackLanguage,
            context.fallbackNamespace,
            context.loadedNamespaces,
        ]);
        const t = React.useCallback(((key, variables, styles) => {
            return translateFromSnapshot(currentTranslations, key, variables, styles);
        }), [currentTranslations]);
        return {
            t,
            currentLanguage: context.currentLanguage,
            isReady: resolveTranslationReady({
                isLoading: context.isLoading,
                isNamespaceLoading,
                isNamespaceReady,
            }),
        };
    };
    const useTranslation = ((namespace) => {
        return useTranslationImpl(namespace);
    });
    return {
        I18nProvider,
        useTranslation,
        translations,
        options: normalizedOptions,
    };
}
//# sourceMappingURL=createI18n.js.map