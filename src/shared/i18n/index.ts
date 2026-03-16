import en from './en.json';
import ko from './ko.json';

interface TranslationSet {
  [key: string]: string;
}

interface Translations {
  en: TranslationSet;
  ko: TranslationSet;
}

export const translations: Translations = {
  en: en,
  ko: ko,
};
