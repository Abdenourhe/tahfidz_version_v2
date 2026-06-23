// src/app/api/admin/schools/[id]/quota/route.ts
// Gestion des quotas Halaqa par école — SuperAdmin uniquement

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { applyPlanConfig, getHalaqaQuotaStatus } from "@/lib/halaqa-quota"
import { SchoolPlan } from "@prisma/client"
import { NextResponse } from "next/server"
import { z } from "zod"

const patchSchema = z.object({
  plan: z.enum(["FREE", "STARTER", "ECONOMIQUE", "PRO", "ENTERPRISE"]).optional(),
  billingCycle: z.enum(["MONTHLY", "YEARLY"]).optional(),
  subscriptionStart: z.string().datetime().optional(),
  halaqaMonthlyLimit: z.number().int().min(0).nullable().optional(),
  halaqaBonusCredits: z.number().int().min(0).optional(),
  halaqaBonusExpiry: z.string().datetime().nullable().optional(),
  halaqaPlannedCount: z.number().int().min(0).optional(),
  halaqaSessionsUsed: z.number().int().min(0).optional(),
  halaqaUsagePeriodStart: z.string().datetime().optional(),
  maxTeachers: z.number().int().min(1).optional(),
  maxStudents: z.number().int().min(1).optional(),
  halaqaMaxDuration: z.number().int().min(5).optional(),
  halaqaAllowRecording: z.boolean().optional(),
}).strict()

async function requireSuperAdmin() {
  const session = await auth()
  if (!session?.user || session.user.role !== "SUPERADMIN") return null
  return session
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSuperAdmin()
  if (!session) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 401 })
  }

  try {
    const { id } = await params
    const status = await getHalaqaQuotaStatus(id)
    if (!status) {
      return NextResponse.json({ error: "École non trouvée" }, { status: 404 })
    }

    return NextResponse.json({ status }, { status: 200 })
  } catch (error: any) {
    console.error("[ADMIN SCHOOL QUOTA GET ERROR]", error?.message || String(error))
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSuperAdmin()
  if (!session) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await req.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data

    // Si un plan est fourni, on applique sa configuration de base
    if (data.plan) {
      await applyPlanConfig(id, data.plan as SchoolPlan)
    }

    // Construction des données à mettre à jour (exclure le plan déjà appliqué)
    const updateData: any = { ...data }
    delete updateData.plan

    // Conversion des dates string en Date
    if (updateData.subscriptionStart) {
      updateData.subscriptionStart = new Date(updateData.subscriptionStart)
    }
    if (updateData.halaqaBonusExpiry !== undefined) {
      updateData.halaqaBonusExpiry = updateData.halaqaBonusExpiry
        ? new Date(updateData.halaqaBonusExpiry)
        : null
    }
    if (updateData.halaqaUsagePeriodStart) {
      updateData.halaqaUsagePeriodStart = new Date(updateData.halaqaUsagePeriodStart)
    }

    // Mise à jour si des champs restent
    const hasUpdates = Object.keys(updateData).length > 0
    if (hasUpdates) {
      await prisma.school.update({
        where: { id },
        data: updateData,
      })
    }

    const status = await getHalaqaQuotaStatus(id)
    return NextResponse.json({ status }, { status: 200 })
  } catch (error: any) {
    console.error("[ADMIN SCHOOL QUOTA PATCH ERROR]", error?.message || String(error))
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
