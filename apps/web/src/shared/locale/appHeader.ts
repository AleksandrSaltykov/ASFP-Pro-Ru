import { localeResources } from "./resources";
import { createScopedTranslator } from "./createScopedTranslator";

type AppHeaderTranslationKey = keyof typeof localeResources.en.appHeader;

type AppLocale = keyof typeof localeResources;

const appHeaderTranslations = {
  en: localeResources.en.appHeader,
  ru: localeResources.ru.appHeader
} as const satisfies Record<AppLocale, Record<AppHeaderTranslationKey, string>>;

export const useAppHeaderTranslations = createScopedTranslator<AppLocale, AppHeaderTranslationKey>(
  appHeaderTranslations,
  "en"
);
