import { localeResources } from "./resources";
import { createScopedTranslator } from "./createScopedTranslator";

type OrderDetailsTranslationKey = keyof typeof localeResources.en.orderDetails;

type AppLocale = keyof typeof localeResources;

const orderDetailsTranslations = {
  en: localeResources.en.orderDetails,
  ru: localeResources.ru.orderDetails
} as const satisfies Record<AppLocale, Record<OrderDetailsTranslationKey, string>>;

export const useOrderDetailsTranslations = createScopedTranslator<AppLocale, OrderDetailsTranslationKey>(
  orderDetailsTranslations,
  "en"
);
