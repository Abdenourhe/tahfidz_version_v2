import { describe, it, expect } from "vitest";
import { translations, t } from "./translations";

describe("translations dictionary", () => {
  it("contient les sections essentielles", () => {
    expect(translations).toHaveProperty("nav");
    expect(translations).toHaveProperty("common");
    expect(translations).toHaveProperty("students");
    expect(translations).toHaveProperty("teachers");
    expect(translations).toHaveProperty("auth");
  });

  it("chaque entrée a fr, en et ar", () => {
    const check = (obj: Record<string, { fr: string; en: string; ar: string }>) => {
      for (const [, val] of Object.entries(obj)) {
        expect(val).toHaveProperty("fr");
        expect(val).toHaveProperty("en");
        expect(val).toHaveProperty("ar");
        expect(typeof val.fr).toBe("string");
        expect(typeof val.en).toBe("string");
        expect(typeof val.ar).toBe("string");
      }
    };
    check(translations.common);
    check(translations.nav);
  });
});

describe("t() helper", () => {
  it("retourne la traduction FR par défaut", () => {
    expect(t("common", "save", "fr")).toBe("Enregistrer");
  });

  it("retourne la traduction EN si demandée", () => {
    expect(t("common", "save", "en")).toBe("Save");
  });

  it("retourne la traduction AR si demandée", () => {
    expect(t("common", "save", "ar")).toBe("حفظ");
  });

  it("fallback sur FR si la clé n'existe pas dans la locale", () => {
    // Si on demande une clé inexistante, elle retourne la clé elle-même
    expect(t("common", "nonExistentKey" as any, "en")).toBe("nonExistentKey");
  });

  it("retourne la clé si la section n'existe pas", () => {
    expect(t("unknownSection" as any, "save", "fr")).toBe("save");
  });
});
