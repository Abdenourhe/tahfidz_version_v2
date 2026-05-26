"use server"
// src/app/admin/super/actions.ts
// Server Action sécurisée pour démarrer l'impersonation

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { setImpersonation } from "@/lib/impersonation"
import { redirect } from "next/navigation"

export async function impersonateSchoolAdmin(formData: FormData) {
  const session = await auth()

  // Vérification superadmin
  if (!session?.user || session.user.role !== "SUPERADMIN") {
    throw new Error("Unauthorized: Superadmin only")
  }

  const schoolId = formData.get("schoolId") as string
  if (!schoolId) {
    throw new Error("schoolId required")
  }

  // Vérifier que l'admin existe et appartient à l'école
  const admin = await prisma.user.findFirst({
    where: {
      schoolId,
      role: "ADMIN",
      isActive: true,
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, fullName: true, schoolId: true },
  })

  if (!admin) {
    throw new Error("No active admin found for this school")
  }

  // Créer le contexte sécurisé
  await setImpersonation({
    targetAdminId: admin.id,
    targetSchoolId: schoolId,
    superadminId: session.user.id,
    createdAt: Date.now(),
  })

  // Audit log
  await prisma.auditLog.create({
    data: {
      schoolId: admin.schoolId,
      userId: session.user.id,
      action: "IMPERSONATE",
      actorId: session.user.id,
      actorRole: "SUPERADMIN",
      actorEmail: session.user.email,
      actorName: session.user.name,
      entityType: "SCHOOL",
      entityId: schoolId,
      targetType: "USER",
      targetId: admin.id,
      targetName: admin.fullName,
      newValues: {
        actor: session.user.email || session.user.name || "unknown",
        target: admin.fullName,
        details: { adminEmail: admin.email, originalAdmin: session.user.email },
      } as any,
    } as any,
  }).catch(() => {}) // Silencieux si échec

  redirect("/admin/dashboard")
}
