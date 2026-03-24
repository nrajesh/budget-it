import { describe, it, expect, beforeEach } from "vitest";
import {
  getEnabledLanguages,
  saveEnabledLanguages,
} from "@/i18n/languagePreferences";

describe("languagePreferences", () => {
  beforeEach(() => {
    localStorage.removeItem("app-enabled-languages");
  });

  it("keeps exactly one enabled language", () => {
    const saved = saveEnabledLanguages(["en", "es", "zh"]);

    expect(saved).toEqual(["en"]);
    expect(getEnabledLanguages()).toEqual(["en"]);
  });

  it("supports tamil as an enabled language", () => {
    const saved = saveEnabledLanguages(["ta"]);

    expect(saved).toEqual(["ta"]);
    expect(getEnabledLanguages()).toEqual(["ta"]);
  });
});
