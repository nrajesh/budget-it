import { describe, it, expect } from "vitest";
import { sortLanguageOptionsByEnglishName } from "./sortLanguages";

describe("sortLanguageOptionsByEnglishName", () => {
  it("orders by English display name", () => {
    const sorted = sortLanguageOptionsByEnglishName([
      { value: "ta", label: "தமிழ் (Tamil)", sortLabel: "Tamil" },
      { value: "en", label: "English (English)", sortLabel: "English" },
      { value: "zh", label: "中文 (Chinese (Mandarin))", sortLabel: "Chinese" },
    ]);
    expect(sorted.map((item) => item.value)).toEqual(["zh", "en", "ta"]);
  });
});
