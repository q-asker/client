/**
 * Auto-generated i18nexus locale entrypoint.
 *
 * This file is designed for i18nexus core v4:
 * - lazy namespace loading via I18nProvider.loadNamespace
 * - typed createI18n helper for advanced namespace/key inference
 * - fallback namespace metadata shared by tools and runtime
 *
 * Regenerate with:
 *   npx i18n-extractor
 */
import { createI18n, type CreateI18nUseTranslationReturn, type NamespaceLoader } from 'i18nexus';
import type {
  I18nexusGeneratedClientTranslationFunction,
  I18nexusGeneratedTranslationFunction,
  I18nexusGeneratedTranslationKeys,
  I18nexusGeneratedTranslations,
} from './types/i18nexus';

export const languages = ['en', 'ko'] as const;
export const namespaces = [
  'board',
  'board-detail',
  'board-write',
  'common',
  'login-redirect',
  'login-select',
  'maintenance',
  'make-quiz',
  'privacy-policy',
  'quiz-explanation',
  'quiz-history',
  'quiz-history-detail',
  'quiz-result',
  'solve-quiz',
  'terms-of-service',
] as const;
export const fallbackNamespace = 'common' as const;

export type AppLanguage = 'en' | 'ko';
export type AppNamespace =
  | 'board'
  | 'board-detail'
  | 'board-write'
  | 'common'
  | 'login-redirect'
  | 'login-select'
  | 'maintenance'
  | 'make-quiz'
  | 'privacy-policy'
  | 'quiz-explanation'
  | 'quiz-history'
  | 'quiz-history-detail'
  | 'quiz-result'
  | 'solve-quiz'
  | 'terms-of-service';

export type AppTranslationKeys<NS extends AppNamespace = AppNamespace> =
  I18nexusGeneratedTranslationKeys<NS>;
export type AppTranslationFunction<NS extends AppNamespace = AppNamespace> =
  I18nexusGeneratedTranslationFunction<NS>;
export type AppServerTranslationFunction<NS extends AppNamespace = AppNamespace> =
  I18nexusGeneratedTranslationFunction<NS>;
export type AppClientTranslationFunction<NS extends AppNamespace = AppNamespace> =
  I18nexusGeneratedClientTranslationFunction<NS>;
export type AppUseTranslationReturn<NS extends AppNamespace = AppNamespace> =
  CreateI18nUseTranslationReturn<AppTranslationKeys<NS>>;

export const loadNamespace: NamespaceLoader = async (namespace, language) => {
  const module = await import(`./${namespace}/${language}.json`);
  return module.default;
};

export const i18n = createI18n({} as I18nexusGeneratedTranslations, {
  fallbackNamespace,
});

export const I18nProvider = i18n.I18nProvider;
export const useTranslation = i18n.useTranslation;

/**
 * Beginner API:
 *   import { I18nProvider } from "i18nexus";
 *   import { loadNamespace, fallbackNamespace } from "./locales";
 *
 * Advanced typed API:
 *   import { I18nProvider, useTranslation } from "./locales";
 *
 * Next.js App Router:
 *   Keep I18nProvider in a "use client" wrapper.
 *   Call router.refresh() after changeLanguage() when server components
 *   also use getTranslation().
 */
