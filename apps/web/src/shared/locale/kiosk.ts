import { localeResources } from "./resources";
import { createScopedTranslator } from "./createScopedTranslator";

type KioskTranslationKey = keyof typeof localeResources.en.kiosk;

type KioskLocale = keyof typeof localeResources;

const kioskTranslations = {
  en: localeResources.en.kiosk,
  ru: localeResources.ru.kiosk
} as const satisfies Record<KioskLocale, Record<KioskTranslationKey, string>>;

export const useKioskTranslations = createScopedTranslator<KioskLocale, KioskTranslationKey>(
  kioskTranslations,
  "ru"
);
