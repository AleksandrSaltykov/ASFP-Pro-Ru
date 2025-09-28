import { useCallback, useState } from "react";

type TranslationParams = Record<string, string | number>;

type TranslationMap<TLocale extends string, TKey extends string> = Record<TLocale, Record<TKey, string>>;

const formatTemplate = (template: string, params?: TranslationParams) => {
  if (!params) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (match, token) => {
    const value = params[token];
    return value !== undefined ? String(value) : "";
  });
};

const detectLocale = <TLocale extends string>(locales: readonly TLocale[], fallback: TLocale): TLocale => {
  if (typeof navigator === "undefined" || typeof navigator.language !== "string") {
    return fallback;
  }

  const normalized = navigator.language.toLowerCase();
  const match = locales.find((locale) => normalized.startsWith(locale.toLowerCase()));
  return match ?? fallback;
};

export const createScopedTranslator = <TLocale extends string, TKey extends string>(
  translations: TranslationMap<TLocale, TKey>,
  fallbackLocale: TLocale
) => {
  const locales = Object.keys(translations) as TLocale[];

  return () => {
    const [locale] = useState<TLocale>(() => detectLocale(locales, fallbackLocale));

    return useCallback(
      (key: TKey, params?: TranslationParams) => {
        const dictionary = translations[locale] ?? translations[fallbackLocale];
        const template = dictionary?.[key] ?? translations[fallbackLocale][key];
        return formatTemplate(template, params);
      },
      [locale]
    );
  };
};
