import { describe, it, expect } from "vitest";
import { sortLanguageOptionsByEnglishName } from "./sortLanguages";

describe("sortLanguageOptionsByEnglishName", () => {
  it("orders by English display name", () => {
    const sorted = sortLanguageOptionsByEnglishName([
      { value: "ta", label: "Tamil (தமிழ்)" },
      { value: "en", label: "English" },
      { value: "zh", label: "Chinese (Mandarin)" },
    ]);
    expect(sorted.map((item) => item.value)).toEqual(["zh", "en", "ta"]);
  });
});
