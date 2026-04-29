export const FRANKFURTER_WEB_URL = "https://frankfurter.dev";
export const FRANKFURTER_API_BASE_URL = "https://api.frankfurter.dev";

export const frankfurterCurrenciesUrl = `${FRANKFURTER_API_BASE_URL}/currencies`;

export const frankfurterLatestRatesUrl = (baseCurrency: string) =>
  `${FRANKFURTER_API_BASE_URL}/latest?from=${encodeURIComponent(baseCurrency)}`;
