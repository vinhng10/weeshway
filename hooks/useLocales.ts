import { getLocales } from "expo-localization";
import { create } from "zustand";

interface LocaleState {
  currency: string;
  country: string;
  exchangeRates: Record<string, number>;
  fetchExchangeRates: () => Promise<void>;
  formatMoney: (amount?: number, fromCurrency?: string) => string;
  exchangeMoney: (amount?: number, fromCurrency?: string) => number;
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
    if (!amount) amount = 0;
    if (!currency) currency = get().currency;
    const languageTag = locale.languageTag ?? "en-US";
    const formatter = new Intl.NumberFormat(languageTag, {
      style: "currency",
      currency: currency,
    });
    return formatter.format(amount * 0.01);
  },

  exchangeMoney: (amount?: number, fromCurrency?: string) => {
    if (!amount) return 0;
    const { currency, exchangeRates } = get();
    if (!fromCurrency) fromCurrency = currency;

    const rate = exchangeRates[fromCurrency.toLowerCase()];
    if (!rate) return amount;

    // Convert from foreign currency to user's currency
    // exchangeRates[fromCurrency] is the rate FROM userCurrency TO fromCurrency
    // So to convert FROM fromCurrency TO userCurrency, we need 1 / rate
    return (amount * 100) / (rate * 100);
  },
}));
