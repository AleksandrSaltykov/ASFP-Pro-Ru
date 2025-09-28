import { localeResources } from "./resources";
import { createScopedTranslator } from "./createScopedTranslator";

type AppSidebarTranslationKey = keyof typeof localeResources.en.appSidebar;

type AppLocale = keyof typeof localeResources;

const appSidebarTranslations = {
  en: localeResources.en.appSidebar,
  ru: localeResources.ru.appSidebar
} as const satisfies Record<AppLocale, Record<AppSidebarTranslationKey, string>>;

export const useAppSidebarTranslations = createScopedTranslator<AppLocale, AppSidebarTranslationKey>(
  appSidebarTranslations,
  "ru"
);
