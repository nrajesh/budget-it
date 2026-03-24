import { describe, it, expect } from "vitest";
import i18n from "@/i18n/config";

describe("translation coverage", () => {
  it("has common dialog translations in tamil", async () => {
    await i18n.changeLanguage("ta");

    const keys = [
      "dialogs.common.cancel",
      "dialogs.common.continue",
      "dialogs.password.label",
      "dialogs.password.placeholder",
      "dialogs.recurrence.currentOnly",
      "dialogs.recurrence.currentAndFuture",
      "dialogs.missingCurrency.title",
      "dialogs.globalProgress.complete",
      "transactions.header.title",
      "transactions.toasts.scheduleNotFound.title",
      "settings.cards.currency.title",
    ];

    keys.forEach((key) => {
      expect(i18n.t(key)).not.toBe(key);
    });
  });
});
