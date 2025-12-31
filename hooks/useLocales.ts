import { getLocales } from "expo-localization";
import { create } from "zustand";

interface LocaleState {
  currency: string;
  country: string;
  exchangeRates: Record<string, number>;
  fetchExchangeRates: () => Promise<void>;
  formatMoney: (amount?: number, fromCurrency?: string) => string;
}

const locale = getLocales()[0];

export const useLocales = create<LocaleState>((set, get) => ({
  currency: locale.currencyCode ?? "USD",
  country: locale.regionCode ?? "US",
  exchangeRates: {},

  fetchExchangeRates: async () => {
    const currency = get().currency;
    const response = await fetch(
      `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${currency.toLowerCase()}.json`
    );
    const data = await response.json();
    set({ exchangeRates: data[currency.toLowerCase()] });
  },

  formatMoney: (amount?: number, currency?: string) => {
    if (!amount) return "";
    if (!currency) currency = get().currency;
    const languageTag = locale.languageTag ?? "en-US";
    const formatter = new Intl.NumberFormat(languageTag, {
      style: "currency",
      currency: currency,
    });
    return formatter.format(amount * 0.01);
  },
}));
