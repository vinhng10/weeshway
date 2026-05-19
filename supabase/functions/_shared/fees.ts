import { createServiceRoleClient } from "./auth.ts";

export type Fees = {
  bookingFee: number;
  transactionFee: number;
  usdRates: Record<string, number>;
};

export async function getFees(): Promise<Fees> {
  const defaults: Fees = {
    bookingFee: 50,
    transactionFee: 5,
    usdRates: {},
  };
  try {
    const supabase = createServiceRoleClient();
    const [{ data }, ratesRes] = await Promise.all([
      supabase.from("fees").select("key, value"),
      fetch(
        "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json",
      ),
    ]);
    const rates = await ratesRes.json();
    const map = Object.fromEntries(
      (data ?? []).map((r: { key: string; value: number }) => [r.key, r.value]),
    );
    return {
      bookingFee: map.booking_fee ?? defaults.bookingFee,
      transactionFee: map.transaction_fee ?? defaults.transactionFee,
      usdRates: rates.usd ?? {},
    };
  } catch {
    return defaults;
  }
}

/**
 * Converts an amount between any two currencies via USD triangulation.
 * rate(A→B) = rate(USD→B) / rate(USD→A)
 */
export function exchange(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  usdRates: Record<string, number>,
): number {
  if (fromCurrency.toLowerCase() === toCurrency.toLowerCase()) return amount;
  const from = fromCurrency.toLowerCase();
  const to = toCurrency.toLowerCase();
  const rateFrom = from === "usd" ? 1 : usdRates[from];
  const rateTo = to === "usd" ? 1 : usdRates[to];
  if (!rateFrom || !rateTo) return amount;
  return Math.round(amount * (rateTo / rateFrom));
}
