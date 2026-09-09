/**
 * TypeScript type definition generator for i18nexus
 *
 * This module generates TypeScript declaration files that provide
 * type safety for translation keys in useTranslation hook.
 */
/**
 * Extracted translations structure
 * namespace -> language -> key -> value
 */
export interface ExtractedTranslations {
    [namespace: string]: {
        [language: string]: {
            [key: string]: string;
        };
    };
}
/**
 * Configuration for type generation
 */
export interface TypeGeneratorConfig {
    /** Output file path for type definitions */
    outputPath: string;
    /** Whether to include JSDoc comments */
    includeJsDocs?: boolean;
    /** Fallback namespace for keys without explicit namespace */
    fallbackNamespace?: string;
    /** Translation import source (e.g., "i18nexus", "react-i18next") */
    translationImportSource?: string;
    /**
     * Strict validation mode for translation completeness.
     * When enabled, type generation fails if any language is missing keys
     * or if any translation value is empty.
     */
    strictValidation?: boolean;
}
export interface TranslationValidationIssue {
    namespace: string;
    language: string;
    key: string;
    type: "missing-key" | "empty-value" | "invalid-value";
    message: string;
}
/**
 * Validate translation completeness for strict type generation.
 * - Every language in a namespace must include the same keys.
 * - Every value must be a non-empty string.
 */
export declare function validateTranslationsForTypeGeneration(extractedData: ExtractedTranslations): TranslationValidationIssue[];
/**
 * Generate TypeScript type definitions from extracted translations
 *
 * Creates a .d.ts file with Module Augmentation for type-safe translations
 *
 * @example
 * ```typescript
 * // Generated types/i18nexus.d.ts
 * declare module "i18nexus" {
 *   interface TranslationKeys {
 *     "home": "title" | "description";
 *     "about": "company" | "team";
 *   }
 * }
 * ```
 */
export declare function generateTypeDefinitions(extractedData: ExtractedTranslations, config: TypeGeneratorConfig): void;
/**
 * Read extracted translations from locale files
 *
 * This is used when type generation is triggered separately
 */
export declare function readExtractedTranslations(localesDir: string, options?: {
    fallbackNamespace?: string;
}): ExtractedTranslations;
