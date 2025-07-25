export type Language = 'es' | 'en';

export interface Translations {
  [key: string]: string;
}

export interface LanguageTranslations {
  es: Translations;
  en: Translations;
}