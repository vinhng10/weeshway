import { supabase } from "@/supabase";
import { ProfileType } from "@/types";
import { getLocales } from "expo-localization";
import { create } from "zustand";

interface LocaleState {
  currency: string;
  country: string;
  bookingFee: number;
  transactionFee: number;
  usdRates: Record<string, number>;
  initFees: () => Promise<void>;
  syncLocales: (profile: ProfileType | null) => Promise<void>;
  formatMoney: (amount?: number, fromCurrency?: string) => string;
  exchange: (
    amount: number,
    fromCurrency: string,
    toCurrency: string,
  ) => number;
}

const locale = getLocales()[0];

export const useLocales = create<LocaleState>((set, get) => ({
  currency: locale.currencyCode ?? "USD",
  country: locale.regionCode ?? "US",
  bookingFee: 50,
  transactionFee: 5,
  usdRates: {},

  initFees: async () => {
    try {
      const [{ data }, ratesRes] = await Promise.all([
        supabase.from("fees").select("key, value"),
        fetch(
          "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json",
        ),
      ]);
      const rates = await ratesRes.json();
      const map = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
      set({
        bookingFee: map.booking_fee ?? 50,
        transactionFee: map.transaction_fee ?? 5,
        usdRates: rates.usd ?? {},
      });
    } catch {
      // keep defaults
    }
  },

  syncLocales: async (profile: ProfileType | null) => {
    if (!profile?.id) return;

    try {
      const { country, currency } = get();
      const updates: Record<string, unknown> = {};

      if (profile.country !== country) {
        updates.country = country;
      }

      if (profile.currency !== currency) {
        updates.currency = currency;
      }

      if (Object.keys(updates).length === 0) return;

      await supabase
        .from("profiles")
        .update(updates)
        .eq("id", profile.id)
        .throwOnError();
    } catch {}
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
