import { localeResources } from "./resources";
import { createScopedTranslator } from "./createScopedTranslator";

type HomeExecTranslationKey = keyof typeof localeResources.en.homeExec;

type AppLocale = keyof typeof localeResources;

const homeExecTranslations = {
  en: localeResources.en.homeExec,
  ru: localeResources.ru.homeExec
} as const satisfies Record<AppLocale, Record<HomeExecTranslationKey, string>>;

export const useHomeExecTranslations = createScopedTranslator<AppLocale, HomeExecTranslationKey>(
  homeExecTranslations,
  "en"
);
