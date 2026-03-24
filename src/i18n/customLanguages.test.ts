import { describe, it, expect, beforeEach } from "vitest";
import {
  getCustomLanguages,
  removeCustomLanguage,
  upsertCustomLanguage,
} from "@/i18n/customLanguages";

describe("customLanguages", () => {
  beforeEach(() => {
    localStorage.removeItem("app-custom-languages");
  });

  it("upserts a custom language with translations", () => {
    upsertCustomLanguage({
      code: "de",
      name: "German",
      translations: {
        layout: {
          nav: {
            dashboard: "Instrumententafel",
          },
        },
      },
    });

    const all = getCustomLanguages();
    expect(all).toHaveLength(1);
    expect(all[0]?.code).toBe("de");
    expect(all[0]?.name).toBe("German");
  });

  it("removes a custom language by code", () => {
    upsertCustomLanguage({
      code: "de",
      name: "German",
      translations: { a: 1 },
    });
    expect(removeCustomLanguage("de")).toBe(true);
    expect(getCustomLanguages()).toHaveLength(0);
    expect(removeCustomLanguage("de")).toBe(false);
  });
});
