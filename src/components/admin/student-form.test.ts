import { describe, it, expect } from "vitest";
import { z } from "zod";

// Re-déclaration des schémas pour les tests (évite d'importer le composant React)
const baseSchema = z.object({
  email: z.string().email("Email invalide"),
  fullName: z.string().min(2, "Nom trop court"),
  fullNameAr: z.string().optional(),
  phone: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  role: z.literal("STUDENT"),
  groupId: z.string().optional(),
  teacherId: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  medicalNotes: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

const formSchema = baseSchema.extend({
  password: z.string().min(6, "Minimum 6 caractères").optional().or(z.literal("")),
});

describe("student-form schema", () => {
  it("accepte un élève valide complet", () => {
    const data = {
      email: "test@example.com",
      fullName: "Ahmed Ben Ali",
      role: "STUDENT" as const,
      gender: "MALE" as const,
      status: "ACTIVE" as const,
      groupId: "group-1",
    };
    expect(() => formSchema.parse(data)).not.toThrow();
  });

  it("rejette un email invalide", () => {
    const data = { email: "pas-un-email", fullName: "Test", role: "STUDENT" as const };
    const result = formSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Email invalide");
    }
  });

  it("rejette un nom trop court", () => {
    const data = { email: "test@example.com", fullName: "A", role: "STUDENT" as const };
    const result = formSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Nom trop court");
    }
  });

  it("accepte un mot de vide en édition", () => {
    const data = {
      email: "test@example.com",
      fullName: "Ahmed",
      role: "STUDENT" as const,
      password: "",
    };
    const result = formSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("accepte un mot de passe de 6 caractères minimum", () => {
    const data = {
      email: "test@example.com",
      fullName: "Ahmed",
      role: "STUDENT" as const,
      password: "123456",
    };
    const result = formSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("rejette un mot de passe trop court", () => {
    const data = {
      email: "test@example.com",
      fullName: "Ahmed",
      role: "STUDENT" as const,
      password: "12345",
    };
    const result = formSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("accepte des champs optionnels vides", () => {
    const data = {
      email: "test@example.com",
      fullName: "Ahmed Ben Ali",
      role: "STUDENT" as const,
    };
    expect(() => formSchema.parse(data)).not.toThrow();
  });
});
