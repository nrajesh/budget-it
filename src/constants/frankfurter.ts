export const FRANKFURTER_WEB_URL = "https://frankfurter.dev";
export const FRANKFURTER_API_BASE_URL = "https://api.frankfurter.dev";

export interface FrankfurterCurrency {
  iso_code: string;
  name: string;
  symbol?: string;
}

export interface FrankfurterRate {
  base: string;
  quote: string;
  rate: number;
}

export const frankfurterCurrenciesUrl = `${FRANKFURTER_API_BASE_URL}/v2/currencies`;

export const frankfurterLatestRatesUrl = (baseCurrency: string) =>
  `${FRANKFURTER_API_BASE_URL}/v2/rates?base=${encodeURIComponent(baseCurrency)}`;
