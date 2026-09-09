import React from "react";
export const interpolate = (text, variables) => {
    if (!variables) {
        return text;
    }
    return text.replace(/\{\{(\w+)\}\}/g, (match, variableName) => {
        const value = variables[variableName];
        return value !== undefined ? String(value) : match;
    });
};
export const interpolateWithStyles = (text, variables, styles) => {
    const parts = [];
    let lastIndex = 0;
    const regex = /\{\{(\w+)\}\}/g;
    let match;
    let key = 0;
    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
        }
        const variableName = match[1];
        const value = variables[variableName];
        const style = styles[variableName];
        if (value !== undefined) {
            if (style) {
                parts.push(React.createElement("span", { key: `var-${key++}`, style }, String(value)));
            }
            else {
                parts.push(String(value));
            }
        }
        else {
            parts.push(match[0]);
        }
        lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }
    return React.createElement(React.Fragment, null, ...parts);
};
export const translateFromSnapshot = (translations, key, variables, styles) => {
    const translatedText = translations[key] || key;
    if (styles && variables) {
        return interpolateWithStyles(translatedText, variables, styles);
    }
    return interpolate(translatedText, variables);
};
export const hasOwnNamespace = (translations, namespace) => {
    if (!namespace) {
        return true;
    }
    return Object.prototype.hasOwnProperty.call(translations || {}, namespace);
};
export const resolveNamespaceForLanguage = (translations, namespace, language, fallbackLanguage) => {
    const namespaceData = translations[namespace];
    if (!namespaceData || typeof namespaceData !== "object") {
        return {};
    }
    const current = namespaceData[language];
    if (current && typeof current === "object") {
        return current;
    }
    const fallback = namespaceData[fallbackLanguage];
    if (fallback && typeof fallback === "object") {
        return fallback;
    }
    const first = Object.values(namespaceData)[0];
    if (first && typeof first === "object") {
        return first;
    }
    return {};
};
export const flattenTranslationsForLanguage = (translations, language, fallbackLanguage) => {
    const merged = {};
    for (const namespace of Object.keys(translations || {})) {
        Object.assign(merged, resolveNamespaceForLanguage(translations, namespace, language, fallbackLanguage));
    }
    return merged;
};
const resolveLoadedTranslations = ({ namespace, currentLanguage, fallbackLanguage, fallbackNamespace, loadedNamespaces, }) => {
    let result = {};
    if (fallbackNamespace) {
        result = resolveLoadedNamespaceForLanguage(loadedNamespaces, String(fallbackNamespace), currentLanguage, fallbackLanguage);
    }
    if (namespace) {
        result = {
            ...result,
            ...resolveLoadedNamespaceForLanguage(loadedNamespaces, namespace, currentLanguage, fallbackLanguage),
        };
    }
    return result;
};
const resolveLoadedNamespaceForLanguage = (loadedNamespaces, namespace, language, fallbackLanguage) => {
    const namespaceData = loadedNamespaces.get(namespace);
    if (!namespaceData || typeof namespaceData !== "object") {
        return {};
    }
    const current = namespaceData[language];
    if (current && typeof current === "object") {
        return current;
    }
    const fallback = namespaceData[fallbackLanguage];
    if (fallback && typeof fallback === "object") {
        return fallback;
    }
    const first = Object.values(namespaceData)[0];
    if (first && typeof first === "object") {
        return first;
    }
    return {};
};
const resolveNamespaceStaticTranslations = ({ namespace, staticTranslations, currentLanguage, fallbackLanguage, fallbackNamespace, }) => {
    if (!namespace) {
        return flattenTranslationsForLanguage(staticTranslations, currentLanguage, fallbackLanguage);
    }
    let result = {};
    if (fallbackNamespace) {
        result = {
            ...result,
            ...resolveNamespaceForLanguage(staticTranslations, String(fallbackNamespace), currentLanguage, fallbackLanguage),
        };
    }
    const requested = resolveNamespaceForLanguage(staticTranslations, namespace, currentLanguage, fallbackLanguage);
    if (Object.keys(requested).length > 0) {
        return { ...result, ...requested };
    }
    return {
        ...result,
        ...flattenTranslationsForLanguage(staticTranslations, currentLanguage, fallbackLanguage),
    };
};
const resolveStaticTranslations = (options) => {
    if (options.staticResolutionMode === "flattened") {
        return flattenTranslationsForLanguage(options.staticTranslations, options.currentLanguage, options.fallbackLanguage);
    }
    return resolveNamespaceStaticTranslations(options);
};
export const resolveTranslationSnapshot = (options) => {
    if (options.staticResolutionMode === "namespace" &&
        options.staticMergeMode === "when-empty") {
        return resolveNamespaceTranslationSnapshot(options);
    }
    const loadedTranslations = resolveLoadedTranslations(options);
    const hasLoadedTranslations = Object.keys(loadedTranslations).length > 0;
    if (options.staticMergeMode === "when-empty") {
        return hasLoadedTranslations
            ? loadedTranslations
            : resolveStaticTranslations(options);
    }
    return {
        ...resolveStaticTranslations(options),
        ...loadedTranslations,
    };
};
const resolveNamespaceTranslationSnapshot = (options) => {
    const staticFallback = options.fallbackNamespace
        ? resolveNamespaceForLanguage(options.staticTranslations, String(options.fallbackNamespace), options.currentLanguage, options.fallbackLanguage)
        : {};
    const loadedFallback = options.fallbackNamespace
        ? resolveLoadedNamespaceForLanguage(options.loadedNamespaces, String(options.fallbackNamespace), options.currentLanguage, options.fallbackLanguage)
        : {};
    if (!options.namespace) {
        return {
            ...flattenTranslationsForLanguage(options.staticTranslations, options.currentLanguage, options.fallbackLanguage),
            ...loadedFallback,
        };
    }
    const staticRequested = resolveNamespaceForLanguage(options.staticTranslations, options.namespace, options.currentLanguage, options.fallbackLanguage);
    const loadedRequested = resolveLoadedNamespaceForLanguage(options.loadedNamespaces, options.namespace, options.currentLanguage, options.fallbackLanguage);
    const staticRequestedLayer = Object.keys(staticRequested).length > 0
        ? staticRequested
        : flattenTranslationsForLanguage(options.staticTranslations, options.currentLanguage, options.fallbackLanguage);
    return {
        ...staticFallback,
        ...loadedFallback,
        ...staticRequestedLayer,
        ...loadedRequested,
    };
};
export const getNamespaceReadiness = ({ namespace, staticTranslations, loadedNamespaces, loadingNamespaces, }) => {
    const hasStaticNamespace = hasOwnNamespace(staticTranslations, namespace);
    const isNamespaceLoaded = namespace ? loadedNamespaces.has(namespace) : true;
    const isNamespaceLoading = namespace
        ? loadingNamespaces.has(namespace)
        : false;
    return {
        hasStaticNamespace,
        isNamespaceLoaded,
        isNamespaceLoading,
        isNamespaceReady: namespace
            ? isNamespaceLoaded || hasStaticNamespace
            : true,
    };
};
export const shouldLoadNamespace = ({ namespace, lazy, hasStaticNamespace, isNamespaceLoaded, }) => {
    return !!namespace && !!lazy && !hasStaticNamespace && !isNamespaceLoaded;
};
export const resolveTranslationReady = ({ isLoading, isNamespaceLoading, isNamespaceReady, }) => {
    return !isLoading && !isNamespaceLoading && isNamespaceReady;
};
//# sourceMappingURL=translation-runtime.js.map