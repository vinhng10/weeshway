import { getLocales } from "expo-localization";
import { create } from "zustand";

interface LocaleState {
  formatter: Intl.NumberFormat;
  currency: string;
  country: string;
  formatMoney: (amount?: number) => string;
}

const locale = getLocales()[0];
const currency = locale.currencyCode ?? "USD";
const languageTag = locale.languageTag ?? "en-US";
const country = locale.regionCode ?? "FI";

export const useLocales = create<LocaleState>((set, get) => ({
  currency: currency,
  country: country,
  formatter: new Intl.NumberFormat(languageTag, {
    style: "currency",
    currency: currency,
  }),

  formatMoney: (amount?: number) => {
    if (!amount) return "";
    return get().formatter.format(amount / 100);
  },
}));
