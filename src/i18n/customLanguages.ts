const CUSTOM_LANGUAGES_STORAGE_KEY = "app-custom-languages";

export interface CustomLanguageConfig {
  code: string;
  name: string;
  translations: Record<string, unknown>;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const normalizeCode = (code: string) => code.trim().toLowerCase();

export const getCustomLanguages = (): CustomLanguageConfig[] => {
  const raw = localStorage.getItem(CUSTOM_LANGUAGES_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(
        (item) =>
          isObject(item) &&
          typeof item.code === "string" &&
          typeof item.name === "string" &&
          isObject(item.translations),
      )
      .map((item) => ({
        code: normalizeCode(item.code),
        name: item.name.trim(),
        translations: item.translations,
      }))
      .filter((item) => item.code && item.name);
  } catch {
    return [];
  }
};

const saveCustomLanguages = (languages: CustomLanguageConfig[]) => {
  localStorage.setItem(CUSTOM_LANGUAGES_STORAGE_KEY, JSON.stringify(languages));
  window.dispatchEvent(new CustomEvent("app:languages-updated"));
};

export const upsertCustomLanguage = (language: CustomLanguageConfig) => {
  const code = normalizeCode(language.code);
  const name = language.name.trim();
  if (!code || !name) {
    throw new Error("Language code and name are required.");
  }

  const all = getCustomLanguages();
  const existing = all.find((item) => item.code === code);
  if (existing) {
    existing.name = name;
    existing.translations = language.translations;
  } else {
    all.push({ code, name, translations: language.translations });
  }

  saveCustomLanguages(all);
  return all;
};

/** Removes a custom language from storage. Built-in codes are ignored. */
export const removeCustomLanguage = (code: string): boolean => {
  const normalized = normalizeCode(code);
  if (!normalized) {
    return false;
  }

  const all = getCustomLanguages();
  const next = all.filter((item) => item.code !== normalized);
  if (next.length === all.length) {
    return false;
  }

  saveCustomLanguages(next);
  return true;
};
