// src/lib/validations/auth.ts
import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Mot de passe trop court"),
})

export const createUserSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Minimum 8 caractères").regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Doit contenir majuscule, minuscule et chiffre"
  ),
  fullName: z.string().min(2, "Nom trop court").max(100),
  fullNameAr: z.string().optional(),
  role: z.enum(["ADMIN", "TEACHER", "PARENT", "STUDENT"]),
  phone: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
})

export const updateUserSchema = createUserSchema.partial().omit({ password: true })

export const createStudentSchema = z.object({
  userId: z.string().uuid(),
  groupId: z.string().uuid().optional(),
  teacherId: z.string().uuid().optional(),
  dateOfBirth: z.string().datetime().optional(),
})

export const createGroupSchema = z.object({
  name: z.string().min(2).max(100),
  nameAr: z.string().optional(),
  teacherId: z.string().uuid(),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  maxCapacity: z.number().int().min(1).max(50).optional().default(15),
  schedule: z.record(z.string()).optional(),
})

export const progressUpdateSchema = z.object({
  studentId: z.string().uuid(),
  surahId: z.number().int().min(1).max(114),
  status: z.enum([
    "NOT_STARTED", "IN_PROGRESS", "UNDER_REVIEW",
    "READY_FOR_RECITATION", "PENDING_TEACHER_APPROVAL",
    "MEMORIZED", "NEEDS_REVISION"
  ]),
  currentVerse: z.number().int().min(1).optional(),
  note: z.string().optional(),
})

export const evaluationSchema = z.object({
  progressId: z.string().uuid(),
  studentId: z.string().uuid(),
  evaluationType: z.enum(["live", "recorded", "test"]),
  tajwid: z.number().int().min(0).max(100).default(0),
  makhraj: z.number().int().min(0).max(100).default(0),
  waqf: z.number().int().min(0).max(100).default(0),
  tarteel: z.number().int().min(0).max(100).default(0),
  memorizationScore: z.number().int().min(0).max(100),
  tajweedScore: z.number().int().min(0).max(100),
  fluencyScore: z.number().int().min(0).max(100),
  makharijScore: z.number().int().min(0).max(100).optional(),
  tafsirUnderstanding: z.number().int().min(0).max(100).optional(),
  teacherNotes: z.string().max(2000).optional(),
  strengths: z.array(z.string()).default([]),
  improvements: z.array(z.string()).default([]),
  revisionRequired: z.boolean().default(false),
  decision: z.enum(["APPROVED", "NEEDS_REVISION", "REJECTED"]),
})

export const attendanceSchema = z.object({
  studentIds: z.array(z.string().uuid()),
  groupId: z.string().uuid(),
  date: z.string().datetime(),
  records: z.array(z.object({
    studentId: z.string().uuid(),
    status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]),
    notes: z.string().optional(),
  })),
})

export const announcementSchema = z.object({
  title: z.string().min(3).max(200),
  titleAr: z.string().optional(),
  content: z.string().min(10).max(10000),
  contentAr: z.string().optional(),
  type: z.enum(["GENERAL", "EVENT", "ACHIEVEMENT", "URGENT"]).default("GENERAL"),
  targetRoles: z.array(z.enum(["ADMIN", "TEACHER", "PARENT", "STUDENT"])).default(["ADMIN", "TEACHER", "PARENT", "STUDENT"]),
  targetGroupIds: z.array(z.string().uuid()).default([]),
  isPinned: z.boolean().default(false),
  expiresAt: z.string().datetime().optional(),
  isPublished: z.boolean().default(true),
})

export type LoginInput = z.infer<typeof loginSchema>
export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type CreateGroupInput = z.infer<typeof createGroupSchema>
export type ProgressUpdateInput = z.infer<typeof progressUpdateSchema>
export type EvaluationInput = z.infer<typeof evaluationSchema>
export type AttendanceInput = z.infer<typeof attendanceSchema>
export type AnnouncementInput = z.infer<typeof announcementSchema>
