import { getLocales } from "expo-localization";
import { create } from "zustand";

interface LocaleState {
  currency: string;
  country: string;
  ratesCache: Record<string, Record<string, number>>;
  formatMoney: (amount?: number, fromCurrency?: string) => string;
  exchangeMoney: (
    amount?: number,
    fromCurrency?: string,
    toCurrency?: string
  ) => Promise<number>;
}

const locale = getLocales()[0];

async function fetchRates(base: string): Promise<Record<string, number>> {
  const response = await fetch(
    `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${base.toLowerCase()}.json`
  );
  const data = await response.json();
  return data[base.toLowerCase()];
}

export const useLocales = create<LocaleState>((set, get) => ({
  currency: locale.currencyCode ?? "USD",
  country: locale.regionCode ?? "US",
  ratesCache: {},

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

  exchangeMoney: async (
    amount?: number,
    fromCurrency?: string,
    toCurrency?: string
  ) => {
    if (!amount) return 0;
    const { currency, ratesCache } = get();
    if (!fromCurrency) fromCurrency = currency;
    if (!toCurrency) toCurrency = currency;
    if (fromCurrency === toCurrency) return amount;

    const key = fromCurrency.toLowerCase();
    let rates = ratesCache[key];

    if (!rates) {
      rates = await fetchRates(fromCurrency);
      set({ ratesCache: { ...get().ratesCache, [key]: rates } });
    }

    const rate = rates[toCurrency.toLowerCase()];
    if (!rate) return amount;

    return amount * rate;
  },
}));
