import { localeResources } from "./resources";
import { createScopedTranslator } from "./createScopedTranslator";

type ProcessMapTranslationKey = keyof typeof localeResources.en.processMap;

type AppLocale = keyof typeof localeResources;

const processMapTranslations = {
  en: localeResources.en.processMap,
  ru: localeResources.ru.processMap
} as const satisfies Record<AppLocale, Record<ProcessMapTranslationKey, string>>;

export const useProcessMapTranslations = createScopedTranslator<AppLocale, ProcessMapTranslationKey>(
  processMapTranslations,
  "en"
);
