import { supabase } from "@/supabase";
import { getLocales } from "expo-localization";
import { create } from "zustand";

interface LocaleState {
  currency: string;
  country: string;
  spotFee: number;
  usdRates: Record<string, number>;
  initFees: () => Promise<void>;
  formatMoney: (amount?: number, fromCurrency?: string) => string;
  exchange: (amount: number, fromCurrency: string, toCurrency: string) => number;
}

const locale = getLocales()[0];

export const useLocales = create<LocaleState>((set, get) => ({
  currency: locale.currencyCode ?? "USD",
  country: locale.regionCode ?? "US",
  spotFee: 50,
  usdRates: {},

  initFees: async () => {
    try {
      const [{ data }, ratesRes] = await Promise.all([
        supabase.from("fees").select("value").eq("key", "spot_fee").single(),
        fetch(
          "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json"
        ),
      ]);
      const rates = await ratesRes.json();
      set({
        spotFee: data?.value ?? 50,
        usdRates: rates.usd ?? {},
      });
    } catch {
      // keep defaults
    }
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

  // Triangulate any pair through USD: rate(A→B) = rate(USD→B) / rate(USD→A)
  exchange: (amount: number, fromCurrency: string, toCurrency: string) => {
    if (fromCurrency.toLowerCase() === toCurrency.toLowerCase()) return amount;
    const { usdRates } = get();
    const from = fromCurrency.toLowerCase();
    const to = toCurrency.toLowerCase();
    const rateFrom = from === "usd" ? 1 : usdRates[from];
    const rateTo = to === "usd" ? 1 : usdRates[to];
    if (!rateFrom || !rateTo) return amount;
    return Math.round(amount * (rateTo / rateFrom));
  },
}));
