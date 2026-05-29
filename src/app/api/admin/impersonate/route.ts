// src/app/api/admin/impersonate/route.ts
// POST — Créer une session d'impersonation sécurisée (HMAC)
// DELETE — Arrêter l'impersonation

export const runtime = 'nodejs'; 

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { buildImpersonationCookie, clearImpersonation, getImpersonation } from "@/lib/impersonation"

// POST — Démarrer l'impersonation
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized: Superadmin only" }, { status: 403 })
    }

    const { schoolId } = await request.json()
    if (!schoolId || typeof schoolId !== "string") {
      return NextResponse.json({ error: "schoolId required" }, { status: 400 })
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
      return NextResponse.json({ error: "No active admin found for this school" }, { status: 404 })
    }

    // Créer le contexte sécurisé via cookie sur la réponse (NextResponse)
    const { name, value, options } = buildImpersonationCookie({
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

    const response = NextResponse.json({
      success: true,
      redirectUrl: "/admin/dashboard",
      school: { id: schoolId },
    })
    response.cookies.set(name, value, options)
    return response

  } catch (error) {
    console.error("Impersonate POST error:", error)
    return NextResponse.json({ error: "Failed to start impersonation" }, { status: 500 })
  }
}

// DELETE — Arrêter l'impersonation
export async function DELETE() {
  try {
    const imp = await getImpersonation()
    await clearImpersonation()

    // Audit log de sortie
    if (imp) {
      await prisma.auditLog.create({
        data: {
          schoolId: imp.targetSchoolId,
          userId: imp.superadminId,
          action: "IMPERSONATE",
          actorId: imp.superadminId,
          actorRole: "SUPERADMIN",
          entityType: "SCHOOL",
          entityId: imp.targetSchoolId,
          newValues: {
            action: "END_IMPERSONATION",
            target: imp.targetAdminId,
          } as any,
        } as any,
      }).catch(() => {})
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Impersonate DELETE error:", error)
    return NextResponse.json({ error: "Failed to stop impersonation" }, { status: 500 })
  }
}
