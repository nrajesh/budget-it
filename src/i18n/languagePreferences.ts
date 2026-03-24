import { supportedLanguages, type SupportedLanguage } from "./resources";
import { getCustomLanguages } from "./customLanguages";

const ENABLED_LANGUAGES_STORAGE_KEY = "app-enabled-languages";
export const MAX_ENABLED_LANGUAGES = 1;

const getAvailableLanguageCodes = () => [
  ...supportedLanguages,
  ...getCustomLanguages().map((item) => item.code),
];

const isSupportedLanguage = (value: string): value is SupportedLanguage =>
  getAvailableLanguageCodes().includes(value as SupportedLanguage);

const getPreferredLanguage = (): SupportedLanguage => {
  const browserLanguages = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];

  for (const language of browserLanguages) {
    const baseLanguage = language.toLowerCase().split("-")[0];
    if (isSupportedLanguage(baseLanguage)) {
      return baseLanguage;
    }
  }

  return "en";
};

const normalizeLanguageList = (values: string[]): SupportedLanguage[] => {
  const filtered = values.filter(isSupportedLanguage);
  const deduped = Array.from(new Set(filtered));
  const capped = deduped.slice(0, MAX_ENABLED_LANGUAGES);
  return capped.length > 0 ? capped : [getPreferredLanguage()];
};

export const getEnabledLanguages = (): SupportedLanguage[] => {
  const raw = localStorage.getItem(ENABLED_LANGUAGES_STORAGE_KEY);
  if (!raw) {
    return [getPreferredLanguage()];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [getPreferredLanguage()];
    }
    return normalizeLanguageList(parsed);
  } catch {
    return [getPreferredLanguage()];
  }
};

export const saveEnabledLanguages = (languages: SupportedLanguage[]) => {
  const normalized = normalizeLanguageList(languages);
  localStorage.setItem(
    ENABLED_LANGUAGES_STORAGE_KEY,
    JSON.stringify(normalized),
  );
  window.dispatchEvent(new CustomEvent("app:enabled-languages-changed"));
  return normalized;
};

export const isLanguageEnabled = (language: string) =>
  getEnabledLanguages().includes(language as SupportedLanguage);
