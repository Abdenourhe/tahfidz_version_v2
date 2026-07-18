// src/app/api/register-school/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const schema = z.object({
  schoolName:       z.string().min(2, "Nom de l'école requis"),
  address:          z.string().optional(),
  city:             z.string().optional(),
  country:          z.string().default("DZ"),
  adminName:        z.string().min(2, "Nom admin requis"),
  adminEmail:       z.string().email("Email invalide"),
  adminPhone:       z.string().optional(),
  adminPassword:    z.string().min(8, "Mot de passe trop court (min. 8 car.)"),
  classCount:       z.coerce.number().int().min(1),
  studentsPerClass: z.coerce.number().int().min(1),
  teachersCount:    z.coerce.number().int().min(1),
  plan:             z.enum(["FREE", "STARTER", "ECONOMIQUE", "PRO", "ENTERPRISE"]).default("FREE"),
  billingCycle:     z.enum(["MONTHLY", "YEARLY"]).default("MONTHLY"),
  halaqaSessionDuration: z.coerce.number().int().min(15).max(180).optional(),
  locale:           z.enum(["fr", "en", "ar"]).default("fr"),
  logo:             z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message ?? "Données invalides"
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    const d = parsed.data

    // Vérifier doublon email en attente
    const existing = await (prisma as any).schoolRequest.findFirst({
      where: { adminEmail: d.adminEmail, status: "PENDING" },
    }).catch(() => null)

    if (existing) {
      return NextResponse.json(
        { error: "Une demande avec cet email est déjà en cours de traitement" },
        { status: 409 }
      )
    }

    const hashed = await bcrypt.hash(d.adminPassword, 12)

    await (prisma as any).schoolRequest.create({
      data: {
        schoolName:       d.schoolName,
        address:          d.address ?? null,
        city:             d.city ?? null,
        country:          d.country,
        adminName:        d.adminName,
        adminEmail:       d.adminEmail,
        adminPhone:       d.adminPhone ?? null,
        adminPassword:    hashed,
        classCount:       d.classCount,
        studentsPerClass: d.studentsPerClass,
        teachersCount:    d.teachersCount,
        plan:             d.plan,
        billingCycle:     d.billingCycle,
        halaqaSessionDuration: d.halaqaSessionDuration ?? null,
        logo:             d.logo ?? null,
        locale:           d.locale,
        status:           "PENDING",
      },
    })

    return NextResponse.json(
      { success: true, message: "Demande enregistrée. Vous recevrez une confirmation par email." },
      { status: 201 }
    )
  } catch (e) {
    console.error("[register-school]", e)
    if (e instanceof Error && e.message.includes("schoolRequest")) {
      return NextResponse.json(
        { error: "Exécutez d'abord : npx prisma generate" },
        { status: 503 }
      )
    }
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 })
  }
}
