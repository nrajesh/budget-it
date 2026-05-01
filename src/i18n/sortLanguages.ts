/** Sort language pickers by English display name (A–Z). */
export function sortLanguageOptionsByEnglishName<
  T extends { label: string; sortLabel?: string },
>(options: T[]): T[] {
  const getSortLabel = (option: T) => option.sortLabel ?? option.label;

  return [...options].sort((a, b) =>
    getSortLabel(a).localeCompare(getSortLabel(b), "en", {
      sensitivity: "base",
    }),
  );
}
