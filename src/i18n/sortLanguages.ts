/** Sort language pickers by English display name (A–Z). */
export function sortLanguageOptionsByEnglishName<T extends { label: string }>(
  options: T[],
): T[] {
  return [...options].sort((a, b) =>
    a.label.localeCompare(b.label, "en", { sensitivity: "base" }),
  );
}
