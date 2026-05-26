// src/app/api/impersonation/status/route.ts
// Retourne le statut d'impersonation (pour le banner client)

import { NextResponse } from "next/server"
import { getImpersonation } from "@/lib/impersonation"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const imp = await getImpersonation()
  if (!imp) return NextResponse.json(null)

  // Chercher les infos de l'école pour l'affichage
  const school = await prisma.school.findUnique({
    where: { id: imp.targetSchoolId },
    select: { name: true, slug: true },
  })

  const admin = await prisma.user.findUnique({
    where: { id: imp.targetAdminId },
    select: { fullName: true, email: true },
  })

  return NextResponse.json({
    targetAdminId: imp.targetAdminId,
    targetSchoolId: imp.targetSchoolId,
    superadminId: imp.superadminId,
    createdAt: imp.createdAt,
    schoolName: school?.name ?? "—",
    schoolSlug: school?.slug ?? "—",
    adminName: admin?.fullName ?? "—",
    adminEmail: admin?.email ?? "—",
  })
}
