/** Tanzanian shilling (TZS) formatting for the employee portal. */

export const CURRENCY_LOCALE = "en-TZ";
export const CURRENCY_CODE = "TZS";

const standardFormatter = new Intl.NumberFormat(CURRENCY_LOCALE, {
  style: "currency",
  currency: CURRENCY_CODE,
  maximumFractionDigits: 0,
});

export function formatMoney(amount: number): string {
  return standardFormatter.format(amount);
}

export function formatMoneyNumber(amount: number): string {
  return new Intl.NumberFormat(CURRENCY_LOCALE, { maximumFractionDigits: 0 }).format(amount);
}
