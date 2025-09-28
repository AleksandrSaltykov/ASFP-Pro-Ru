import { localeResources } from "./resources";
import { createScopedTranslator } from "./createScopedTranslator";

export type OrderStepperTranslationKey = keyof typeof localeResources.en.orderStepper;

type AppLocale = keyof typeof localeResources;

const orderStepperTranslations = {
  en: localeResources.en.orderStepper,
  ru: localeResources.ru.orderStepper
} as const satisfies Record<AppLocale, Record<OrderStepperTranslationKey, string>>;

export const useOrderStepperTranslations = createScopedTranslator<AppLocale, OrderStepperTranslationKey>(
  orderStepperTranslations,
  "en"
);
