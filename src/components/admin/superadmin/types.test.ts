import { describe, it, expect } from "vitest";
import {
  generateSlug,
  formatPhone,
  formatDate,
  getActionColor,
  getActionLabel,
  getTargetIcon,
  getFeedbackTypeColor,
  getFeedbackTypeLabel,
  getStatusColor,
  getStatusLabel,
  getPriorityColor,
  getPriorityLabel,
  PLAN_PRICES,
  COUNTRIES,
  EMPTY_FORM,
} from "./types";

describe("generateSlug", () => {
  it("retourne une chaîne au format XX-NNNNN", () => {
    const slug = generateSlug();
    expect(slug).toMatch(/^[A-Z]{2}-\d{5}$/);
  });

  it("génère des slugs différents à chaque appel", () => {
    const s1 = generateSlug();
    const s2 = generateSlug();
    expect(s1).not.toBe(s2);
  });
});

describe("formatPhone", () => {
  it('retourne "—" pour null', () => {
    expect(formatPhone(null)).toBe("—");
  });

  it("formate un numéro algérien +213", () => {
    expect(formatPhone("+213552123456")).toBe("(+213) 552 123 456");
  });

  it("formate un numéro local 0XXXXXXXXX", () => {
    expect(formatPhone("0552123456")).toBe("(+213) 552 123 456");
  });

  it("retourne tel quel si format inconnu", () => {
    expect(formatPhone("12345")).toBe("12345");
  });
});

describe("formatDate", () => {
  it("formate une date ISO en français", () => {
    const result = formatDate("2024-03-15T14:30:00Z");
    expect(result).toContain("15");
    expect(result).toContain("2024");
  });

  it("accepte un objet Date", () => {
    const result = formatDate(new Date(2024, 0, 1, 10, 0));
    expect(result).toContain("2024");
  });
});

describe("getActionColor", () => {
  it("retourne rouge pour DELETE", () => {
    expect(getActionColor("DELETE_USER")).toBe("bg-red-500");
  });

  it("retourne vert pour CREATE", () => {
    expect(getActionColor("CREATE_SCHOOL")).toBe("bg-emerald-500");
  });

  it("retourne gris par défaut", () => {
    expect(getActionColor("UNKNOWN")).toBe("bg-gray-400");
  });
});

describe("getActionLabel", () => {
  it("traduit les actions connues", () => {
    expect(getActionLabel("CREATE_SCHOOL")).toBe("Création école");
    expect(getActionLabel("DELETE_USER")).toBe("Suppression utilisateur");
  });

  it("formate l'action brute si inconnue", () => {
    expect(getActionLabel("CUSTOM_ACTION")).toBe("CUSTOM ACTION");
  });
});

describe("getTargetIcon", () => {
  it("retourne l'icône correspondante", () => {
    expect(getTargetIcon("SCHOOL")).toBe("🏫");
    expect(getTargetIcon("USER")).toBe("👤");
  });

  it("retourne 🔧 par défaut", () => {
    expect(getTargetIcon(null)).toBe("🔧");
    expect(getTargetIcon("UNKNOWN")).toBe("🔧");
  });
});

describe("getFeedbackTypeColor", () => {
  it("retourne les classes Tailwind correctes", () => {
    expect(getFeedbackTypeColor("BUG")).toContain("red");
    expect(getFeedbackTypeColor("SUGGESTION")).toContain("amber");
  });
});

describe("getStatusColor / getStatusLabel", () => {
  it("couvre tous les statuts", () => {
    expect(getStatusColor("PENDING")).toContain("orange");
    expect(getStatusLabel("RESOLVED")).toBe("Résolu");
    expect(getStatusLabel("UNKNOWN")).toBe("UNKNOWN");
  });
});

describe("getPriorityColor / getPriorityLabel", () => {
  it("couvre toutes les priorités", () => {
    expect(getPriorityColor("CRITICAL")).toContain("red");
    expect(getPriorityLabel("LOW")).toBe("Basse");
    expect(getPriorityLabel("X")).toBe("X");
  });
});

describe("constants", () => {
  it("PLAN_PRICES contient les bons montants", () => {
    expect(PLAN_PRICES.FREE).toBe(0);
    expect(PLAN_PRICES.PRO).toBe(79);
  });

  it("COUNTRIES contient l'Algérie en premier", () => {
    expect(COUNTRIES[0].code).toBe("DZ");
  });

  it("EMPTY_FORM a les valeurs par défaut", () => {
    expect(EMPTY_FORM.country).toBe("DZ");
    expect(EMPTY_FORM.plan).toBe("FREE");
  });
});
